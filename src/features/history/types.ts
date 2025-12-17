export type WorkoutType = 'boxing' | 'running' | 'gym';

export interface WorkoutCompleted {
    _id?: string;
    userId: string;
    workoutType: WorkoutType;
    completedAt: string; // ISO string
    duration: number; // seconds
    caloriesBurned: number;
    notes?: string;

    // Workout data from IA
    workoutData: {
        title: string;
        difficulty: 'beginner' | 'intermediate' | 'advanced';

        // Boxing specific
        rounds?: number;
        roundDuration?: number;
        restDuration?: number;

        // Running specific
        distance?: number;
        intervals?: Array<{
            type: string;
            duration: number;
            pace?: string;
        }>;

        // Gym specific
        exercises?: Array<{
            name: string;
            sets: number;
            reps: number;
            weight?: string;
        }>;

        totalDuration?: number;
    };
}

export interface WorkoutStats {
    totalWorkouts: number;
    totalDuration: number; // seconds
    totalCalories: number;
    currentStreak: number;
    byType: {
        boxing: number;
        running: number;
        gym: number;
    };
    weeklyData: Array<{
        week: string;
        count: number;
        duration: number;
    }>;
}
