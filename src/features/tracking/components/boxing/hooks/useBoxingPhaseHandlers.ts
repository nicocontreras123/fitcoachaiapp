import { useState, useCallback } from 'react';

type Phase = 'warmup' | 'workout' | 'cooldown' | 'finished';

/**
 * Hook to manage phase transitions and handlers
 */
export const useBoxingPhaseHandlers = ({
    phaseTimer,
    warmup,
    cooldown,
    isActive,
    toggleTimer,
    transitionTo,
    audio,
}: {
    phaseTimer: any;
    warmup: any[];
    cooldown: any[];
    isActive: boolean;
    toggleTimer: () => void;
    transitionTo: (phase: Phase) => void;
    audio: any;
}) => {
    const [warmupIndex, setWarmupIndex] = useState(0);
    const [cooldownIndex, setCooldownIndex] = useState(0);
    const [isPostWarmupRest, setIsPostWarmupRest] = useState(false);

    const handlePhaseComplete = useCallback(() => {
        // Post-warmup rest complete
        if (isPostWarmupRest) {
            setIsPostWarmupRest(false);
            transitionTo('workout');
            phaseTimer.pause();
            if (!isActive) toggleTimer();
            return;
        }

        // Warmup phase completion
        if (warmupIndex < warmup.length - 1) {
            const nextIndex = warmupIndex + 1;
            const nextExercise = warmup[nextIndex];

            if (!nextExercise.duration || nextExercise.duration <= 0) {
                setWarmupIndex(nextIndex);
                handlePhaseComplete();
                return;
            }

            setWarmupIndex(nextIndex);
            phaseTimer.setTimeAndStart(nextExercise.duration);
            audio.announceExercise(nextExercise.name);
        } else if (warmupIndex === warmup.length - 1 && warmup.length > 0) {
            // Warmup complete, start post-warmup rest
            setIsPostWarmupRest(true);
            phaseTimer.setTimeAndStart(60);
            audio.speak('Calentamiento completo. Prepárate para el entrenamiento');
        }
        // Cooldown phase completion
        else if (cooldownIndex < cooldown.length - 1) {
            console.log('➡️ [COOLDOWN] Moving to next cooldown exercise', {
                currentIndex: cooldownIndex,
                nextIndex: cooldownIndex + 1,
            });
            setCooldownIndex(cooldownIndex + 1);
            phaseTimer.setTimeAndStart(cooldown[cooldownIndex + 1].duration);
            audio.announceExercise(cooldown[cooldownIndex + 1].name);
        } else if (cooldownIndex === cooldown.length - 1 && cooldown.length > 0) {
            // Cooldown complete

            transitionTo('finished');
            phaseTimer.pause();
        }
    }, [warmupIndex, cooldownIndex, isPostWarmupRest, warmup, cooldown, phaseTimer, audio, transitionTo, isActive, toggleTimer]);

    const resetIndices = useCallback(() => {
        setWarmupIndex(0);
        setCooldownIndex(0);
        setIsPostWarmupRest(false);
    }, []);

    return {
        warmupIndex,
        cooldownIndex,
        isPostWarmupRest,
        setWarmupIndex,
        setCooldownIndex,
        handlePhaseComplete,
        resetIndices,
    };
};
