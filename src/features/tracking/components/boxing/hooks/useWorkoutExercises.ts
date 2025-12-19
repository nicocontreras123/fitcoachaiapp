import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { calculateCurrentExerciseIndex } from '../utils';

/**
 * Hook to manage exercise transitions and announcements during workout
 */
export const useWorkoutExercises = ({
    isPreparing,
    isRest,
    isActive,
    isWorkout,
    timeLeft,
    round,
    exercises,
    currentRoundInfo,
    audio,
}: {
    isPreparing: boolean;
    isRest: boolean;
    isActive: boolean;
    isWorkout: boolean;
    timeLeft: number;
    round: number;
    exercises: any[];
    currentRoundInfo: any;
    audio: any;
}) => {
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const hasSpokenExerciseCountdownRef = useRef<Set<string>>(new Set());
    const lastAnnouncedExerciseRef = useRef<string>('');

    // Calculate current exercise based on time
    useEffect(() => {
        if (!isPreparing && !isRest && isActive && exercises.length > 0) {
            const roundDuration = currentRoundInfo?.workTime || 180;
            const timeElapsed = roundDuration - timeLeft;
            const newExerciseIndex = calculateCurrentExerciseIndex(timeElapsed, exercises);

            console.log('🏋️ [EXERCISE_CALC]', {
                timeLeft,
                timeElapsed,
                currentIndex: currentExerciseIndex,
                newIndex: newExerciseIndex,
                exercisesCount: exercises.length,
            });

            if (newExerciseIndex !== currentExerciseIndex) {

                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    setCurrentExerciseIndex(newExerciseIndex);
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }).start();
                });
            }
        }
    }, [timeLeft, isPreparing, isRest, isActive, exercises, currentRoundInfo, currentExerciseIndex, fadeAnim]);

    // Announce exercise name when it changes
    useEffect(() => {
        if (isWorkout && !isPreparing && !isRest && isActive && exercises[currentExerciseIndex]) {
            const currentExercise = exercises[currentExerciseIndex];
            const exerciseKey = `${round}-${currentExerciseIndex}`;

            if (lastAnnouncedExerciseRef.current !== exerciseKey) {
                lastAnnouncedExerciseRef.current = exerciseKey;
                audio.announceExercise(currentExercise.name);
            }
        }
    }, [currentExerciseIndex, isPreparing, isRest, isActive, isWorkout, round, exercises, audio]);

    // Countdown 3-2-1 before changing to next exercise
    useEffect(() => {
        if (isWorkout && !isPreparing && !isRest && isActive && exercises.length > 1) {
            const roundDuration = currentRoundInfo?.workTime || 180;
            const timeElapsed = roundDuration - timeLeft;

            let accumulatedTime = 0;
            for (let i = 0; i <= currentExerciseIndex; i++) {
                accumulatedTime += exercises[i].duration || 30;
            }

            const timeUntilNextExercise = accumulatedTime - timeElapsed;

            if (timeUntilNextExercise <= 3 && timeUntilNextExercise > 0 && currentExerciseIndex < exercises.length - 1) {
                const countdownKey = `${round}-${currentExerciseIndex}-${Math.floor(timeUntilNextExercise)}`;

                if (!hasSpokenExerciseCountdownRef.current.has(countdownKey)) {
                    hasSpokenExerciseCountdownRef.current.add(countdownKey);
                    audio.speakCountdown(Math.floor(timeUntilNextExercise));
                }
            }

            if (timeUntilNextExercise > 3) {
                hasSpokenExerciseCountdownRef.current.clear();
            }
        }
    }, [timeLeft, isPreparing, isRest, isActive, isWorkout, currentExerciseIndex, exercises, round, currentRoundInfo, audio]);

    // Reset exercise index on round change
    useEffect(() => {
        setCurrentExerciseIndex(0);
        fadeAnim.setValue(1);
        hasSpokenExerciseCountdownRef.current.clear();
    }, [round, isPreparing, isRest]);

    return {
        currentExerciseIndex,
        fadeAnim,
        resetExerciseIndex: () => setCurrentExerciseIndex(0),
    };
};
