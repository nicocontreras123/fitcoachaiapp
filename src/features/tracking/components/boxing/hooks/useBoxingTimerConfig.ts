import { useMemo } from 'react';

interface BoxingTimerConfig {
    currentWorkout: any;
    workoutRounds: any[];
    prepTimeInSeconds: number;
    isSoundMuted: boolean;
    userData: any;
    onWorkoutComplete: () => void;
}

/**
 * Hook to manage boxing timer configuration
 */
export const useBoxingTimerConfig = ({
    currentWorkout,
    workoutRounds,
    prepTimeInSeconds,
    isSoundMuted,
    userData,
    onWorkoutComplete,
}: BoxingTimerConfig) => {
    return useMemo(
        () => ({
            roundDuration: (currentWorkout as any)?.roundDuration || 180,
            restDuration: (currentWorkout as any)?.restDuration || 60,
            totalRounds: (currentWorkout as any)?.rounds?.length || 12,
            rounds: workoutRounds,
            prepTime: prepTimeInSeconds,
            timerSoundEnabled: !isSoundMuted && userData?.timerSoundEnabled !== false,
            voiceEnabled: userData?.voiceEnabled !== false,
            onWorkoutComplete,
        }),
        [currentWorkout, workoutRounds, prepTimeInSeconds, isSoundMuted, userData, onWorkoutComplete]
    );
};
