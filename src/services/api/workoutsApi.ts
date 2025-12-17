import Constants from 'expo-constants';
import { getAuthHeaders } from '../api';
import { WorkoutCompleted, WorkoutStats } from '@/features/history/types';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

export const workoutsApi = {
    async saveCompleted(workout: Omit<WorkoutCompleted, '_id'>): Promise<WorkoutCompleted> {
        const headers = await getAuthHeaders();
        if (!headers) {
            throw new Error('NOT_AUTHENTICATED');
        }

        const response = await fetch(`${API_URL}/workouts/completed`, {
            method: 'POST',
            headers,
            body: JSON.stringify(workout),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Error saving workout:', error);
            throw new Error(`Error saving workout: ${response.statusText}`);
        }

        return response.json();
    },

    async getHistory(page: number = 1, limit: number = 20): Promise<{
        workouts: WorkoutCompleted[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        const headers = await getAuthHeaders();
        if (!headers) {
            throw new Error('NOT_AUTHENTICATED');
        }

        const response = await fetch(`${API_URL}/workouts/history?page=${page}&limit=${limit}`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            throw new Error(`Error fetching history: ${response.statusText}`);
        }

        return response.json();
    },

    async getStats(): Promise<WorkoutStats> {
        const headers = await getAuthHeaders();
        if (!headers) {
            throw new Error('NOT_AUTHENTICATED');
        }

        const response = await fetch(`${API_URL}/workouts/stats`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            throw new Error(`Error fetching stats: ${response.statusText}`);
        }

        return response.json();
    },
};
