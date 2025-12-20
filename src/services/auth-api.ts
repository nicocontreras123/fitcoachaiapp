import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

console.log('🔐 Auth API Configuration:', {
  API_URL,
  fromConfig: Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL,
});

const TOKEN_KEY = 'fitcoach_access_token';
const TOKEN_TIMESTAMP_KEY = 'fitcoach_token_timestamp';

export const authApi = {
  async saveToken(token: string) {
    const timestamp = Date.now().toString();
    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [TOKEN_TIMESTAMP_KEY, timestamp]
    ]);
    console.log('💾 [AUTH_API] Token saved with timestamp:', new Date(parseInt(timestamp)).toISOString());
  },

  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        console.log('ℹ️ [AUTH_API] No token found in storage');
        return null;
      }

      // Verificar timestamp del token
      const timestamp = await AsyncStorage.getItem(TOKEN_TIMESTAMP_KEY);
      if (timestamp) {
        const tokenAge = Date.now() - parseInt(timestamp);
        const tokenAgeDays = tokenAge / (1000 * 60 * 60 * 24);
        console.log('🕐 [AUTH_API] Token age:', tokenAgeDays.toFixed(2), 'days');

        // Si el token tiene más de 30 días, es probable que haya expirado
        if (tokenAgeDays > 30) {
          console.warn('⚠️ [AUTH_API] Token is older than 30 days, may be expired');
          // No lo borramos automáticamente, dejamos que el servidor lo valide
        }
      }

      return token;
    } catch (error) {
      console.error('❌ [AUTH_API] Error getting token:', error);
      return null;
    }
  },

  async removeToken() {
    await AsyncStorage.multiRemove([TOKEN_KEY, TOKEN_TIMESTAMP_KEY]);
    console.log('🗑️ [AUTH_API] Token and timestamp removed');
  },

  async signup(email: string, password: string): Promise<{ access_token: string; user: any }> {

    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });



    if (!response.ok) {
      const error = await response.json() as { message?: string };
      console.error('❌ Error del servidor:', error);
      throw new Error(error.message || 'Error al registrarse');
    }

    const data = await response.json() as { access_token: string; user: any };

    await this.saveToken(data.access_token);

    return data;
  },

  async login(email: string, password: string): Promise<{ access_token: string; user: any }> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json() as { message?: string };
      throw new Error(error.message || 'Error al iniciar sesión');
    }

    const data = await response.json() as { access_token: string; user: any };
    await this.saveToken(data.access_token);
    return data;
  },

  async googleAuth(idToken: string): Promise<{ access_token: string; user: any }> {
    const response = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const error = await response.json() as { message?: string };
      throw new Error(error.message || 'Error al autenticar con Google');
    }

    const data = await response.json() as { access_token: string; user: any };
    await this.saveToken(data.access_token);
    return data;
  },

  async logout() {
    await this.removeToken();
  },
};
