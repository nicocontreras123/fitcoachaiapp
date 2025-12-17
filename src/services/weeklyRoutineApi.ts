import Constants from 'expo-constants';
import { getAuthHeaders } from './api';
import { WeeklyRoutine } from '@/features/workouts/types';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

export interface CreateWeeklyRoutineDto {
  weekStarting: string;
  goal: string;
  days: WeeklyRoutine['days'];
  isActive?: boolean;
  metadata?: {
    sports?: string[];
    level?: string;
    generatedBy?: string;
  };
}

export const weeklyRoutineApi = {
  /**
   * Crear una nueva rutina semanal
   */
  async create(routine: CreateWeeklyRoutineDto): Promise<WeeklyRoutine> {
    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        throw new Error('NOT_AUTHENTICATED');
      }





      const response = await fetch(`${API_URL}/workout-templates/weekly-routines`, {
        method: 'POST',
        headers,
        body: JSON.stringify(routine),
      });




      if (!response.ok) {
        const error = await response.text();
        console.error('❌ API - Error creating routine:', error);
        throw new Error(`Error creating routine: ${response.statusText}`);
      }

      const data = await response.json();

      return data;
    } catch (error: any) {
      console.error('❌ API - Exception creating routine:', error);
      console.error('❌ API - Error message:', error.message);
      console.error('❌ API - Error stack:', error.stack);
      throw error;
    }
  },

  /**
   * Obtener todas las rutinas semanales del usuario
   */
  async getAll(): Promise<WeeklyRoutine[]> {
    const headers = await getAuthHeaders();
    if (!headers) {
      throw new Error('NOT_AUTHENTICATED');
    }

    const response = await fetch(`${API_URL}/workout-templates/weekly-routines`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Error fetching routines: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Obtener la rutina activa del usuario
   */
  async getActive(): Promise<WeeklyRoutine | null> {
    const headers = await getAuthHeaders();
    if (!headers) {
      throw new Error('NOT_AUTHENTICATED');
    }



    const response = await fetch(`${API_URL}/workout-templates/weekly-routines/active`, {
      method: 'GET',
      headers,
    });

    if (response.status === 404 || response.status === 204) {

      return null;
    }

    if (!response.ok) {
      throw new Error(`Error fetching active routine: ${response.statusText}`);
    }

    const data = await response.json();

    return data;
  },

  /**
   * Obtener una rutina específica por ID
   */
  async getById(id: string): Promise<WeeklyRoutine> {
    const headers = await getAuthHeaders();
    if (!headers) {
      throw new Error('NOT_AUTHENTICATED');
    }

    const response = await fetch(`${API_URL}/workout-templates/weekly-routines/${id}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Error fetching routine: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Actualizar una rutina semanal
   */
  async update(id: string, updates: Partial<CreateWeeklyRoutineDto>): Promise<WeeklyRoutine> {
    const headers = await getAuthHeaders();
    if (!headers) {
      throw new Error('NOT_AUTHENTICATED');
    }

    const response = await fetch(`${API_URL}/workout-templates/weekly-routines/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Error updating routine: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Eliminar una rutina semanal
   */
  async delete(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    if (!headers) {
      throw new Error('NOT_AUTHENTICATED');
    }

    const response = await fetch(`${API_URL}/workout-templates/weekly-routines/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Error deleting routine: ${response.statusText}`);
    }
  },

  /**
   * Establecer una rutina como activa
   */
  async setActive(id: string): Promise<WeeklyRoutine> {
    const headers = await getAuthHeaders();
    if (!headers) {
      throw new Error('NOT_AUTHENTICATED');
    }

    const response = await fetch(`${API_URL}/workout-templates/weekly-routines/${id}/set-active`, {
      method: 'PATCH',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Error setting active routine: ${response.statusText}`);
    }

    return response.json();
  },
};
