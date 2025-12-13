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
  sport: Sport; // Mantener para compatibilidad
  deportes?: string[]; // Nuevo: array de deportes seleccionados
  level: FitnessLevel;
  goals: string;
  equipment?: Equipment[]; // Nuevo: equipamiento disponible
  availableDays?: string[]; // Nuevo: días disponibles para entrenar
  trainingDaysPerWeek?: number; // Nuevo: cantidad de días por semana
  hasCompletedOnboarding: boolean;
  // Timer settings
  prepTimeMinutes?: number; // Default: 0
  prepTimeSeconds?: number; // Default: 10
  // Audio settings
  voiceEnabled?: boolean; // Default: true
  timerSoundEnabled?: boolean; // Default: true
}

export interface OnboardingStepData {
  currentStep: number;
  totalSteps: number;
  data: Partial<UserData>;
}
