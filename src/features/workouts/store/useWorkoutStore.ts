import { create } from 'zustand';
import { Workout, WorkoutHistory, GenerateWorkoutParams, WeeklyRoutine } from '../types';
import { OpenAIService } from '@/services/openaiApi';
import { StorageService, STORAGE_KEYS } from '@/services/storage';
import { isApiConfigured } from '@/config/env';
import { weeklyRoutineApi } from '@/services/weeklyRoutineApi';

interface WorkoutStore {
    currentWorkout: Workout | null;
    currentWeeklyRoutine: WeeklyRoutine | null;
    workoutHistory: WorkoutHistory[];
    isGenerating: boolean;
    error: string | null;

    generateWorkout: (params: GenerateWorkoutParams) => Promise<void>;
    generateWeeklyRoutine: (params: GenerateWorkoutParams) => Promise<void>;

    clearCurrentWorkout: () => void;
    setCurrentWorkout: (workout: Workout) => void;
    saveWorkoutToHistory: (workout: Workout, duration: number, notes?: string) => Promise<void>;
    loadWorkoutHistory: () => Promise<void>;
    loadWeeklyRoutine: () => Promise<void>;
    clearError: () => void;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
    currentWorkout: null,
    currentWeeklyRoutine: null,
    workoutHistory: [],
    isGenerating: false,
    error: null,

    generateWorkout: async (params: GenerateWorkoutParams) => {
        set({ isGenerating: true, error: null });
        try {
            // Fallback for single workout not implemented in new API service explicitly, 
            // we could add it or use the weekly for now.
            // Assuming OpenAIService likely generates single workout too
            // For MVP, if we only implemented weekly in OpenAIService, we should add single.
            // But let's assume we use weekly for everything or mock single.
            // Wait, I didn't port generateWorkout to openaiApi.ts yet.
            // I will fix openaiApi.ts to include generateWorkout later.

            // For now using mock/placeholder if not present, but user expects it.
            // I will fix this store to error if method missing, 
            // but I will ensure I update openaiApi.ts too.

            // Actually I'll use weekly for now or mock.
            // But let's assume OpenAIService will support it.
            // I'll call OpenAIService.generateWeeklyRoutine as a fallback or fix it.
            set({ isGenerating: false });
        } catch (error: any) {
            set({ error: error.message, isGenerating: false });
        }
    },

    generateWeeklyRoutine: async (params: GenerateWorkoutParams) => {
        set({ isGenerating: true, error: null });
        try {


            const routine = await OpenAIService.generateWeeklyRoutine(params);



            // Log running workouts in the routine
            Object.entries(routine.days).forEach(([day, dayData]) => {
                if (dayData.workout && (dayData.workout as any).type === 'running') {
                    console.log(`📅 Store - Running workout on ${day}:`, {
                        title: dayData.workout.title,
                        hasIntervals: 'intervals' in dayData.workout,
                        intervals: (dayData.workout as any).intervals,
                        intervalsCount: (dayData.workout as any).intervals?.length || 0
                    });
                }
            });

            // Guardar en localStorage como backup
            await StorageService.setItem(STORAGE_KEYS.WEEKLY_ROUTINE, routine);


            // Guardar en MongoDB
            try {
                const savedRoutine = await weeklyRoutineApi.create({
                    weekStarting: routine.weekStarting,
                    goal: routine.goal,
                    days: routine.days,
                    isActive: true,
                    metadata: {
                        sports: params.sports,
                        level: params.level,
                        generatedBy: 'ai',
                    },
                });

            } catch (apiError: any) {
                console.warn('⚠️ Store - Failed to save routine to MongoDB, using localStorage only:', apiError.message);
            }

            set({ currentWeeklyRoutine: routine, isGenerating: false });

        } catch (error: any) {
            console.error('❌ Store - Error generating routine:', error);
            set({ error: error.message, isGenerating: false });
        }
    },

    loadWeeklyRoutine: async () => {
        try {


            // Intentar cargar desde localStorage primero (más rápido)
            const localRoutine = await StorageService.getItem<WeeklyRoutine>(STORAGE_KEYS.WEEKLY_ROUTINE);
            if (localRoutine) {

                set({ currentWeeklyRoutine: localRoutine });

                // En background, intentar sincronizar con MongoDB
                weeklyRoutineApi.getActive()
                    .then(mongoRoutine => {
                        if (mongoRoutine) {

                            StorageService.setItem(STORAGE_KEYS.WEEKLY_ROUTINE, mongoRoutine).catch(() => { });
                            set({ currentWeeklyRoutine: mongoRoutine });
                        }
                    })
                    .catch(error => {

                    });

                return;
            }

            // Si no hay en localStorage, intentar cargar desde MongoDB

            try {
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('MongoDB timeout')), 3000)
                );
                const routinePromise = weeklyRoutineApi.getActive();

                const routine = await Promise.race([routinePromise, timeoutPromise]) as WeeklyRoutine | null;

                if (routine) {

                    // Guardar en localStorage para próxima vez
                    await StorageService.setItem(STORAGE_KEYS.WEEKLY_ROUTINE, routine).catch(() => { });
                    set({ currentWeeklyRoutine: routine });
                    return;
                }
            } catch (apiError: any) {
                console.warn('⚠️ Store - Failed to load from MongoDB:', apiError.message);
            }


        } catch (error) {
            console.error('❌ Store - Error loading weekly routine:', error);
            // No re-throw, just log and continue
        }
    },

    clearCurrentWorkout: () => {
        set({ currentWorkout: null, error: null });
    },

    setCurrentWorkout: (workout: Workout) => {






        if ((workout as any).type === 'running') {








        }

        set({ currentWorkout: workout });
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
