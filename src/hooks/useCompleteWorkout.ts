import { useState } from 'react';
import { workoutsApi } from '@/services/api/workoutsApi';
import { WorkoutCompleted, WorkoutType } from '@/features/history/types';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CALORIES_PER_MINUTE = {
    boxing: 12,
    running: 10,
    gym: 8,
};

export const useCompleteWorkout = () => {
    const [isSaving, setIsSaving] = useState(false);
    const { user } = useAuth();

    const calculateCalories = (type: WorkoutType, durationSeconds: number): number => {
        const minutes = durationSeconds / 60;
        return Math.round(minutes * CALORIES_PER_MINUTE[type]);
    };

    const completeWorkout = async (
        workoutType: WorkoutType,
        durationSeconds: number,
        workoutData: WorkoutCompleted['workoutData'],
        notes?: string
    ): Promise<WorkoutCompleted | null> => {
        if (!user) {
            console.error('No user authenticated');
            return null;
        }

        try {
            setIsSaving(true);

            const caloriesBurned = calculateCalories(workoutType, durationSeconds);

            const workout: Omit<WorkoutCompleted, '_id'> = {
                userId: user.uid,
                workoutType,
                completedAt: new Date().toISOString(),
                duration: durationSeconds,
                caloriesBurned,
                notes,
                workoutData,
            };

            const saved = await workoutsApi.saveCompleted(workout);

            // Set flag to refresh dashboard stats when user returns
            if (saved) {
                await AsyncStorage.setItem('workout_just_completed', 'true');

            }

            return saved;
        } catch (error) {
            console.error('Error completing workout:', error);
            return null;
        } finally {
            setIsSaving(false);
        }
    };

    return {
        completeWorkout,
        isSaving,
    };
};
