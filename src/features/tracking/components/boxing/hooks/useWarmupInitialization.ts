import { useEffect, useRef } from 'react';

/**
 * Hook to manage warmup initialization when preparation ends
 */
export const useWarmupInitialization = ({
    isPreparing,
    isWarmup,
    warmup,
    isActive,
    toggleTimer,
    setWarmupIndex,
    phaseTimer,
    audio,
    transitionTo,
}: {
    isPreparing: boolean;
    isWarmup: boolean;
    warmup: any[];
    isActive: boolean;
    toggleTimer: () => void;
    setWarmupIndex: (index: number) => void;
    phaseTimer: any;
    audio: any;
    transitionTo: (phase: 'workout') => void;
}) => {
    const prevIsPreparing = useRef(true);

    useEffect(() => {
        if (prevIsPreparing.current && !isPreparing && isWarmup) {
            console.log('🏃 [WARMUP_START] Transitioning from preparation to warmup', {
                warmupLength: warmup.length,
                firstExercise: warmup[0],
            });

            if (warmup.length > 0) {

                if (isActive) {
                    toggleTimer();
                }

                const warmupDuration = warmup[0].duration;
                console.log('⏱️ [WARMUP_START] Setting warmup timer', {
                    duration: warmupDuration,
                    exerciseName: warmup[0].name,
                });

                if (!warmupDuration || warmupDuration <= 0) {
                    console.error('❌ [WARMUP_START] Invalid warmup duration:', warmupDuration);
                    if (warmup.length > 1) {
                        setWarmupIndex(1);
                        phaseTimer.setTimeAndStart(warmup[1].duration);
                        audio.announceExercise(warmup[1].name);
                    } else {
                        transitionTo('workout');
                        if (!isActive) {
                            toggleTimer();
                        }
                    }
                    return;
                }

                phaseTimer.setTimeAndStart(warmupDuration);

                audio.announceExercise(warmup[0].name);
            } else {

                transitionTo('workout');
            }
        }
        prevIsPreparing.current = isPreparing;
    }, [isPreparing, isWarmup, warmup, isActive, toggleTimer, setWarmupIndex, phaseTimer, audio, transitionTo]);
};
