import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

const TOKEN_KEY = 'fitcoach_access_token';

export const authApi = {
  async saveToken(token: string) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  },

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },

  async removeToken() {
    await AsyncStorage.removeItem(TOKEN_KEY);
  },

  async signup(email: string, password: string): Promise<{ access_token: string; user: any }> {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json() as { message?: string };
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
