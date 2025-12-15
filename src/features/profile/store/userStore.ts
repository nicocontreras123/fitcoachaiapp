import { create } from 'zustand';
import { UserData } from '../types';
import { StorageService, STORAGE_KEYS } from '@/services/storage';
import { api } from '@/services/api';

interface UserStore {
  userData: UserData | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  loadUserData: () => Promise<void>;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  setUserData: (data: UserData) => Promise<void>;
  completeOnboarding: (data: UserData) => Promise<void>;
  clearUserData: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  userData: null,
  isLoading: true,
  hasCompletedOnboarding: false,

  loadUserData: async () => {
    try {
      set({ isLoading: true });

      // Try to load from API first if user is authenticated
      try {
        const backendUser = await api.getCurrentUser();

        if (backendUser) {
          const userData: UserData = {
            name: backendUser.name,
            age: backendUser.age,
            weight: backendUser.weight,
            height: backendUser.height,
            level: backendUser.level,
            gender: backendUser.gender,
            sports: backendUser.sports || [],
            goals: backendUser.goals || [],
            trainingDays: backendUser.trainingDays || [],
            equipment: backendUser.equipment || [],
            voiceEnabled: backendUser.voiceEnabled ?? true,
            timerSoundEnabled: backendUser.timerSoundEnabled ?? true,
            prepTimeMinutes: backendUser.prepTimeMinutes ?? 0,
            prepTimeSeconds: backendUser.prepTimeSeconds ?? 10,
            hasCompletedOnboarding: backendUser.hasCompletedOnboarding ?? false,
          };

          // Cache locally
          await StorageService.setItem(STORAGE_KEYS.USER_DATA, userData);

          set({
            userData,
            hasCompletedOnboarding: backendUser.hasCompletedOnboarding ?? false,
            isLoading: false,
          });
          return;
        }
      } catch (apiError) {

      }

      // Fallback to local storage
      const userData = await StorageService.getItem<UserData>(STORAGE_KEYS.USER_DATA);

      if (userData) {
        set({
          userData,
          hasCompletedOnboarding: userData.hasCompletedOnboarding ?? false,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      set({ isLoading: false });
    }
  },

  updateUserData: async data => {
    try {
      const currentData = get().userData;
      if (!currentData) return;

      const updatedData = { ...currentData, ...data };

      // Try to update in backend
      try {
        await api.updateUser(updatedData);
      } catch (apiError) {

      }

      // Always update locally
      await StorageService.setItem(STORAGE_KEYS.USER_DATA, updatedData);
      set({ userData: updatedData });
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  },

  setUserData: async data => {
    try {
      await StorageService.setItem(STORAGE_KEYS.USER_DATA, data);
      set({ userData: data });
    } catch (error) {
      console.error('Error setting user data:', error);
      throw error;
    }
  },

  completeOnboarding: async data => {
    try {
      const completeData = { ...data, hasCompletedOnboarding: true };

      // Try to save in backend
      try {
        await api.updateUser(completeData);

      } catch (apiError: any) {
        console.error('❌ Error guardando en backend:', apiError.message || apiError);

      }

      // Always save locally
      await StorageService.setItem(STORAGE_KEYS.USER_DATA, completeData);
      set({
        userData: completeData,
        hasCompletedOnboarding: true,
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  },

  clearUserData: async () => {
    try {
      await StorageService.removeItem(STORAGE_KEYS.USER_DATA);
      set({
        userData: null,
        hasCompletedOnboarding: false,
      });
    } catch (error) {
      console.error('Error clearing user data:', error);
      throw error;
    }
  },
}));
