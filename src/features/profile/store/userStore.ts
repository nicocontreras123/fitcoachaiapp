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

      // ESTRATEGIA: Cargar datos locales primero para UX rápida,
      // luego intentar sincronizar con API en segundo plano
      const localUserData = await StorageService.getItem<UserData>(STORAGE_KEYS.USER_DATA);

      // Si hay datos locales, establecerlos inmediatamente
      if (localUserData) {
        console.log('📦 [USER_STORE] Loaded user data from local cache');
        set({
          userData: localUserData,
          hasCompletedOnboarding: localUserData.hasCompletedOnboarding ?? false,
          isLoading: false,
        });
      }

      // Intentar sincronizar con API (en background si ya tenemos datos locales)
      try {
        const backendUser = await api.getCurrentUser();

        if (backendUser) {
          console.log('🔄 [USER_STORE] Syncing user data from API');
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
            motivationalCoachingEnabled: backendUser.motivationalCoachingEnabled ?? false,
            preferredMusicApp: backendUser.preferredMusicApp ?? null,
            prepTimeMinutes: backendUser.prepTimeMinutes ?? 0,
            prepTimeSeconds: backendUser.prepTimeSeconds ?? 10,
            hasCompletedOnboarding: backendUser.hasCompletedOnboarding ?? false,
          };

          // Actualizar cache local
          await StorageService.setItem(STORAGE_KEYS.USER_DATA, userData);

          // Actualizar estado (solo si los datos cambiaron)
          set({
            userData,
            hasCompletedOnboarding: backendUser.hasCompletedOnboarding ?? false,
            isLoading: false,
          });
        }
      } catch (apiError: any) {
        console.warn('⚠️ [USER_STORE] API sync failed, using cached data:', apiError.message);

        // Si falló la API pero NO teníamos datos locales, establecer loading false
        if (!localUserData) {
          set({ isLoading: false });
        }
        // Si ya teníamos datos locales, ya establecimos isLoading: false arriba
      }
    } catch (error) {
      console.error('❌ [USER_STORE] Error loading user data:', error);
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
