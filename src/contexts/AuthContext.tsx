import React, { createContext, useContext, useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import { authApi } from '@/services/auth-api';

WebBrowser.maybeCompleteAuthSession();

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGoogleAuthAvailable: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isGoogleAuthAvailable: false,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Get client IDs from config
  const androidClientId = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const iosClientId = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const webClientId = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  // Check if Google Auth is available
  const isGoogleAuthAvailable = !!(androidClientId || iosClientId || webClientId);

  // Only initialize Google Auth if client IDs are configured
  const [request, response, promptAsync] = Google.useAuthRequest(
    androidClientId || iosClientId || webClientId
      ? {
          androidClientId,
          iosClientId,
          webClientId,
          redirectUri: makeRedirectUri({
            scheme: 'fitcoach',
          }),
        }
      : {
          clientId: 'dummy', // Dummy config to prevent crash
          redirectUri: makeRedirectUri({
            scheme: 'fitcoach',
          }),
        }
  );

  useEffect(() => {
    checkAuthStatus();

    // Warn if Google Auth is not configured
    if (!androidClientId && !iosClientId && !webClientId) {
      console.warn('⚠️ Google Auth not configured. Please set EXPO_PUBLIC_GOOGLE_*_CLIENT_ID in .env');
    }
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleToken(id_token);
    }
  }, [response]);

  const checkAuthStatus = async () => {
    try {
      const token = await authApi.getToken();
      console.log('🔐 [AUTH] Checking auth status, token exists:', !!token);

      if (token) {
        try {
          const { api } = await import('@/services/api');
          const userData = await api.getCurrentUser();
          console.log('✅ [AUTH] User data loaded from API:', userData?.email);
          setUser(userData);

          // Sincronizar userStore después de cargar el usuario
          const { useUserStore } = await import('@/features/profile/store/userStore');
          await useUserStore.getState().loadUserData();
        } catch (apiError: any) {
          console.error('⚠️ [AUTH] API call failed but token exists:', apiError.message);

          // Si la API falla pero tenemos token, intentar cargar datos locales
          // Esto mantiene al usuario logueado aunque la API no esté disponible
          try {
            const { useUserStore } = await import('@/features/profile/store/userStore');
            const { userData } = useUserStore.getState();

            if (userData && userData.hasCompletedOnboarding) {
              console.log('ℹ️ [AUTH] Using cached user data, keeping user logged in');
              // Crear un objeto user básico desde userData local
              setUser({
                id: 'cached',
                email: userData.name || 'Usuario',
                name: userData.name
              });
              await useUserStore.getState().loadUserData();
            } else {
              // Si no hay datos locales o no completó onboarding, cerrar sesión
              console.warn('⚠️ [AUTH] No cached data found, logging out');
              await authApi.removeToken();
              setUser(null);
            }
          } catch (localError) {
            console.error('❌ [AUTH] Failed to load local data:', localError);
            // Solo limpiar el token si es un error de autenticación (401, 403)
            if (apiError.message?.includes('401') || apiError.message?.includes('403') || apiError.message?.includes('Unauthorized')) {
              console.log('🚪 [AUTH] Token invalid, logging out');
              await authApi.removeToken();
              setUser(null);
            } else {
              // Otros errores (red, servidor caído, etc.) - mantener sesión
              console.log('⏳ [AUTH] Network/server error, keeping token for retry');
            }
          }
        }
      } else {
        console.log('ℹ️ [AUTH] No token found, user needs to login');
      }
    } catch (error) {
      console.error('❌ [AUTH] Critical error in checkAuthStatus:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleToken = async (idToken: string) => {
    try {
      const data = await authApi.googleAuth(idToken);
      setUser(data.user);

      // Sincronizar userStore después del login con Google
      const { useUserStore } = await import('@/features/profile/store/userStore');
      await useUserStore.getState().loadUserData();
    } catch (error: any) {
      console.error('Error signing in with Google:', error.message);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await promptAsync();
    } catch (error: any) {
      console.error('Error initiating Google sign in:', error.message);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      const data = await authApi.login(email, password);
      setUser(data.user);

      // Sincronizar userStore después del login
      const { useUserStore } = await import('@/features/profile/store/userStore');
      await useUserStore.getState().loadUserData();
    } catch (error: any) {
      console.error('Error signing in:', error.message);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      const data = await authApi.signup(email, password);
      setUser(data.user);

      // No llamamos a loadUserData después del signup porque el usuario recién se registró
      // y hasCpmompletedOnboarding será false. No es necesario hacer otra llamada al backend.
    } catch (error: any) {
      console.error('Error signing up:', error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authApi.logout();
      setUser(null);

      // Limpiar userStore al hacer logout
      const { useUserStore } = await import('@/features/profile/store/userStore');
      await useUserStore.getState().clearUserData();
    } catch (error: any) {
      console.error('Error signing out:', error.message);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isGoogleAuthAvailable,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
