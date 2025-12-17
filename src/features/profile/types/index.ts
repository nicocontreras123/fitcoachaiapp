export type Sport = 'boxing' | 'running' | 'mixed' | 'functional';

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export type Equipment =
  | 'jump-rope'
  | 'punching-bag'
  | 'treadmill'
  | 'dumbbells'
  | 'resistance-bands'
  | 'pull-up-bar'
  | 'kettlebells'
  | 'yoga-mat'
  | 'none';

export interface UserData {
  name: string;
  age: number;
  weight: number;
  height: number;
  sport?: Sport; // Mantener para compatibilidad
  sports?: string[]; // Backend usa "sports" (array de deportes)
  deportes?: string[]; // Frontend usa "deportes" (se mapea a sports)
  level?: FitnessLevel;
  fitness_level?: string; // Frontend puede enviar fitness_level (se mapea a level)
  goals?: string | string[];
  equipment?: Equipment[]; // Equipamiento disponible
  availableDays?: string[]; // Días disponibles (frontend)
  trainingDays?: string[]; // Días de entrenamiento (backend usa este)
  trainingDaysPerWeek?: number; // Cantidad de días por semana
  weekly_frequency?: number; // Frontend puede enviar weekly_frequency
  hasCompletedOnboarding?: boolean;
  gender?: string;
  // Timer settings
  prepTimeMinutes?: number; // Default: 0
  prepTimeSeconds?: number; // Default: 10
  // Audio settings
  voiceEnabled?: boolean; // Default: true
  timerSoundEnabled?: boolean; // Default: true
  photoUrl?: string;
}

export interface OnboardingStepData {
  currentStep: number;
  totalSteps: number;
  data: Partial<UserData>;
}
