export interface BoxingExercise {
  name: string;
  duration: number; // segundos
  description: string;
  technique?: string;
}

export interface BoxingRound {
  roundNumber: number;
  workTime: number; // segundos
  restTime: number; // segundos
  exercises: BoxingExercise[];
}

export interface BoxingWorkout {
  title: string;
  description: string;
  totalDuration: number; // minutos
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  warmup: BoxingExercise[];
  rounds: BoxingRound[];
  cooldown: BoxingExercise[];
  equipment?: string[];
  tips?: string[];
}

export interface RunningInterval {
  type: 'warm-up' | 'run' | 'sprint' | 'recovery' | 'cool-down';
  duration: number; // minutos
  pace: string; // ej: "5:30 min/km"
  description: string;
}

export interface RunningWorkout {
  title: string;
  description: string;
  totalDistance: number; // km
  totalDuration: number; // minutos
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  intervals: RunningInterval[];
  targetPace: string;
  tips?: string[];
}


export interface GymExercise {
  name: string;
  sets: number;
  reps: number; // or range "8-12"
  weight?: string; // e.g. "Bodyweight" or "70% 1RM"
  restSeconds?: number;
  notes?: string;
}

export interface GymWorkout {
  title: string;
  description: string;
  totalDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  warmup: string[];
  exercises: GymExercise[];
  cooldown: string[];
}

export type Workout = BoxingWorkout | RunningWorkout | GymWorkout;

export interface DailyRoutine {
  day: string; // "Lunes", "Martes", etc.
  workout?: Workout; // Puede ser null si es descanso
  restDay: boolean;
  notes?: string;
}

export interface WeeklyRoutine {
  weekStarting: string; // ISO Date
  days: Record<string, DailyRoutine>; // lunes, martes...
  goal: string;
}

export interface WorkoutHistory {
  id: string;
  workout: Workout;
  completedAt: Date;
  duration: number; // minutos actuales
  notes?: string;
}

export interface GenerateWorkoutParams {
  sport: 'boxing' | 'running' | 'gym' | 'mixed';
  level: 'beginner' | 'intermediate' | 'advanced';
  duration?: number; // minutos deseados
  goals?: string;
  availableDays?: string[]; // Para rutinas semanales
  userProfile?: {
    name: string;
    age: number;
    weight: number;
    height: number;
    deportes?: string[];
  };
}

