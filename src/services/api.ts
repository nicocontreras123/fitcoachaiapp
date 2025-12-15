import { authApi } from './auth-api';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';



export async function getAuthHeaders() {
  const token = await authApi.getToken();




  if (!token) {
    return null;
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export const api = {
  async getCurrentUser() {
    try {
      const headers = await getAuthHeaders();

      if (!headers) {

        throw new Error('NOT_AUTHENTICATED');
      }



      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), 5000); // 5 second timeout
      });

      const fetchPromise = fetch(`${API_URL}/users/me`, { headers });


      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;



      if (response.status === 401) {
        console.error('❌ Unauthorized - backend rejected token');
        throw new Error('UNAUTHORIZED');
      }
      if (!response.ok) {
        console.error('❌ Failed to fetch user:', response.status, response.statusText);
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();

      return data;
    } catch (error: any) {
      if (error.message === 'TIMEOUT') {

      }
      console.error('❌ Error fetching user:', error);
      throw error;
    }
  },

  async updateUser(data: any) {
    const headers = await getAuthHeaders();
    if (!headers) throw new Error('NOT_AUTHENTICATED');


    const response = await fetch(`${API_URL}/users/me`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Update failed:', response.status, errorText);
      throw new Error(`Failed to update user: ${response.status} - ${errorText}`);
    }

    return response.json();
  },

  async createWorkout(data: any) {
    const headers = await getAuthHeaders();
    if (!headers) throw new Error('NOT_AUTHENTICATED');

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
    if (!headers) throw new Error('NOT_AUTHENTICATED');

    const url = type ? `${API_URL}/workouts?type=${type}` : `${API_URL}/workouts`;
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Failed to fetch workouts');
    return response.json();
  },

  async getWorkout(id: string) {
    const headers = await getAuthHeaders();
    if (!headers) throw new Error('NOT_AUTHENTICATED');

    const response = await fetch(`${API_URL}/workouts/${id}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch workout');
    return response.json();
  },

  async updateWorkout(id: string, data: any) {
    const headers = await getAuthHeaders();
    if (!headers) throw new Error('NOT_AUTHENTICATED');

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
    if (!headers) throw new Error('NOT_AUTHENTICATED');

    const response = await fetch(`${API_URL}/workouts/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Failed to delete workout');
    return response.json();
  },

  async getCompletedWorkouts() {
    const headers = await getAuthHeaders();
    if (!headers) throw new Error('NOT_AUTHENTICATED');

    const response = await fetch(`${API_URL}/workouts/completed`, { headers });
    if (!response.ok) throw new Error('Failed to fetch completed workouts');
    return response.json();
  },

  async getWeeklyStats() {
    const headers = await getAuthHeaders();
    if (!headers) throw new Error('NOT_AUTHENTICATED');

    const response = await fetch(`${API_URL}/workouts/stats/weekly`, { headers });
    if (!response.ok) throw new Error('Failed to fetch weekly stats');
    return response.json();
  },
};
