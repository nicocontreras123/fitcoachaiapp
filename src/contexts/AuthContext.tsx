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

      if (token) {
        const { api } = await import('@/services/api');
        const userData = await api.getCurrentUser();
        setUser(userData);

        // Sincronizar userStore después de cargar el usuario
        const { useUserStore } = await import('@/features/profile/store/userStore');
        await useUserStore.getState().loadUserData();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      await authApi.removeToken();
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
