import { create } from 'zustand';
import { Workout, WorkoutHistory, GenerateWorkoutParams } from '../types';
import { OpenAIService } from '@/services/openai';
import { StorageService, STORAGE_KEYS } from '@/services/storage';
import { isApiConfigured } from '@/config/env';

interface WorkoutStore {
  currentWorkout: Workout | null;
  workoutHistory: WorkoutHistory[];
  isGenerating: boolean;
  error: string | null;
  generateWorkout: (params: GenerateWorkoutParams) => Promise<void>;
  clearCurrentWorkout: () => void;
  saveWorkoutToHistory: (workout: Workout, duration: number, notes?: string) => Promise<void>;
  loadWorkoutHistory: () => Promise<void>;
  clearError: () => void;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  currentWorkout: null,
  workoutHistory: [],
  isGenerating: false,
  error: null,

  generateWorkout: async (params: GenerateWorkoutParams) => {
    set({ isGenerating: true, error: null });

    try {
      let workout: Workout;

      // Si no hay API key configurada, usar mock data
      if (!isApiConfigured()) {
        console.warn('API key no configurada, usando datos de ejemplo');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
        workout = OpenAIService.getMockWorkout(params);
      } else {
        workout = await OpenAIService.generateWorkout(params);
      }

      set({ currentWorkout: workout, isGenerating: false });
    } catch (error) {
      console.error('Error generating workout:', error);
      set({
        error: error instanceof Error ? error.message : 'Error al generar rutina',
        isGenerating: false,
      });
    }
  },

  clearCurrentWorkout: () => {
    set({ currentWorkout: null, error: null });
  },

  saveWorkoutToHistory: async (workout: Workout, duration: number, notes?: string) => {
    try {
      const newHistoryItem: WorkoutHistory = {
        id: Date.now().toString(),
        workout,
        completedAt: new Date(),
        duration,
        notes,
      };

      const currentHistory = get().workoutHistory;
      const updatedHistory = [newHistoryItem, ...currentHistory];

      await StorageService.setItem(STORAGE_KEYS.WORKOUT_HISTORY, updatedHistory);
      set({ workoutHistory: updatedHistory });
    } catch (error) {
      console.error('Error saving workout to history:', error);
      throw error;
    }
  },

  loadWorkoutHistory: async () => {
    try {
      const history = await StorageService.getItem<WorkoutHistory[]>(STORAGE_KEYS.WORKOUT_HISTORY);

      if (history) {
        // Convertir las fechas de string a Date objects
        const parsedHistory = history.map(item => ({
          ...item,
          completedAt: new Date(item.completedAt),
        }));
        set({ workoutHistory: parsedHistory });
      }
    } catch (error) {
      console.error('Error loading workout history:', error);
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
