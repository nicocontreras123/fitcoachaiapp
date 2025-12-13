import { create } from 'zustand';
import { UserData } from '@/features/profile/types';

interface OnboardingStore {
  currentStep: number;
  formData: Partial<UserData>;
  setFormData: (data: Partial<UserData>) => void;
  nextStep: () => void;
  previousStep: () => void;
  resetOnboarding: () => void;
}

const TOTAL_STEPS = 5;

export const useOnboardingStore = create<OnboardingStore>(set => ({
  currentStep: 0,
  formData: {},

  setFormData: data => {
    set(state => ({
      formData: { ...state.formData, ...data },
    }));
  },

  nextStep: () => {
    set(state => ({
      currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS - 1),
    }));
  },

  previousStep: () => {
    set(state => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    }));
  },

  resetOnboarding: () => {
    set({
      currentStep: 0,
      formData: {},
    });
  },
}));

export { TOTAL_STEPS };
