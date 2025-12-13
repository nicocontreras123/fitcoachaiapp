import { supabase } from './supabase';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

console.log('🌐 API URL configurada:', API_URL);

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();

  console.log('🔑 Session status:', session ? 'Existe' : 'No existe');
  console.log('🔑 Access token:', session?.access_token ? `${session.access_token.substring(0, 20)}...` : 'No hay token');

  if (!session?.access_token) {
    throw new Error('No authentication token');
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export const api = {
  async getCurrentUser() {
    try {
      const headers = await getAuthHeaders();
      console.log('📡 Fetching user from:', `${API_URL}/users/me`);
      const response = await fetch(`${API_URL}/users/me`, { headers });
      if (response.status === 401) {
        console.error('❌ Unauthorized - clearing session');
        // Clear the session
        await supabase.auth.signOut();
        throw new Error('UNAUTHORIZED');
      }
      if (!response.ok) {
        console.error('❌ Failed to fetch user:', response.status, response.statusText);
        throw new Error('Failed to fetch user');
      }
      return response.json();
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      throw error;
    }
  },

  async updateUser(data: any) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  async createWorkout(data: any) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/workouts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create workout');
    return response.json();
  },

  async getWorkouts(type?: string) {
    const headers = await getAuthHeaders();
    const url = type ? `${API_URL}/workouts?type=${type}` : `${API_URL}/workouts`;
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Failed to fetch workouts');
    return response.json();
  },

  async getWorkout(id: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/workouts/${id}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch workout');
    return response.json();
  },

  async updateWorkout(id: string, data: any) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/workouts/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update workout');
    return response.json();
  },

  async deleteWorkout(id: string) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/workouts/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Failed to delete workout');
    return response.json();
  },

  async getCompletedWorkouts() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/workouts/completed`, { headers });
    if (!response.ok) throw new Error('Failed to fetch completed workouts');
    return response.json();
  },
};
