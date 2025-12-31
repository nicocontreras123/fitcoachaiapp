import { create } from 'zustand';
import { Workout, WorkoutHistory, GenerateWorkoutParams, WeeklyRoutine } from '../types';
import { OpenAIService } from '@/services/openaiApi';
import { StorageService, STORAGE_KEYS } from '@/services/storage';
import { isApiConfigured } from '@/config/env';
import { weeklyRoutineApi } from '@/services/weeklyRoutineApi';
import { NotificationService } from '@/services/notificationService';

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
            set({ isGenerating: false });
        } catch (error: any) {
            set({ error: error.message, isGenerating: false });
        }
    },

    generateWeeklyRoutine: async (params: GenerateWorkoutParams) => {
        set({ isGenerating: true, error: null });
        try {
            const routine = await OpenAIService.generateWeeklyRoutine(params);

            await StorageService.setItem(STORAGE_KEYS.WEEKLY_ROUTINE, routine);

            try {
                // Translate goal to Spanish for MongoDB
                const goalTranslations: Record<string, string> = {
                    'Improve endurance': 'Mejorar Resistencia',
                    'Build muscle': 'Ganar Músculo',
                    'Lose weight': 'Perder Peso',
                    'Increase strength': 'Aumentar Fuerza',
                    'Keep fit': 'Mantenimiento',
                    'improve-endurance': 'Mejorar Resistencia',
                    'build-muscle': 'Ganar Músculo',
                    'lose-weight': 'Perder Peso',
                    'increase-strength': 'Aumentar Fuerza',
                    'keep-fit': 'Mantenimiento',
                };

                const translatedGoal = goalTranslations[routine.goal] || routine.goal;

                // Use current date instead of the one from OpenAI
                const currentDate = new Date().toISOString();

                const savedRoutine = await weeklyRoutineApi.create({
                    weekStarting: currentDate,
                    goal: translatedGoal,
                    days: routine.days,
                    isActive: true,
                    metadata: {
                        sports: params.sport ? [params.sport] : undefined,
                        level: params.level,
                        generatedBy: 'ai',
                    },
                });
            } catch (apiError: any) {
                console.warn('⚠️ Failed to save routine to MongoDB:', apiError.message);
            }

            set({ currentWeeklyRoutine: routine, isGenerating: false });

            // Schedule notifications for the new routine
            try {
                await NotificationService.scheduleWeekEndReminder();
                await NotificationService.scheduleDailyWorkoutReminders(routine);
                console.log('✅ Notifications scheduled successfully');
            } catch (notificationError: any) {
                console.warn('⚠️ Failed to schedule notifications:', notificationError.message);
            }

        } catch (error: any) {
            console.error('❌ Error generating routine:', error);
            set({ error: error.message, isGenerating: false });
        }
    },

    loadWeeklyRoutine: async () => {
        try {
            const localRoutine = await StorageService.getItem<WeeklyRoutine>(STORAGE_KEYS.WEEKLY_ROUTINE);
            if (localRoutine) {
                set({ currentWeeklyRoutine: localRoutine });

                weeklyRoutineApi.getActive()
                    .then(mongoRoutine => {
                        if (mongoRoutine) {
                            StorageService.setItem(STORAGE_KEYS.WEEKLY_ROUTINE, mongoRoutine).catch(() => { });
                            set({ currentWeeklyRoutine: mongoRoutine });
                        }
                    })
                    .catch(() => { });

                return;
            }

            try {
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('MongoDB timeout')), 3000)
                );
                const routinePromise = weeklyRoutineApi.getActive();

                const routine = await Promise.race([routinePromise, timeoutPromise]) as WeeklyRoutine | null;

                if (routine) {
                    await StorageService.setItem(STORAGE_KEYS.WEEKLY_ROUTINE, routine).catch(() => { });
                    set({ currentWeeklyRoutine: routine });
                    return;
                }
            } catch (apiError: any) {
                console.warn('⚠️ Failed to load from MongoDB:', apiError.message);
            }

        } catch (error) {
            console.error('❌ Error loading weekly routine:', error);
        }
    },

    clearCurrentWorkout: () => {
        set({ currentWorkout: null, error: null });
    },

    setCurrentWorkout: (workout: Workout) => {
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
