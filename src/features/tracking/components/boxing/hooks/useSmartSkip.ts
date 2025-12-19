import { useState, useCallback } from 'react';

type Phase = 'warmup' | 'workout' | 'cooldown' | 'finished';

interface SkipConfig {
    preparation: boolean;
    warmup: boolean;
    workout: boolean;
    cooldown: boolean;
    rest: boolean;
}

interface UseSmartSkipProps {
    currentPhase: Phase;
    isPreparing: boolean;
    isRest: boolean;
    onSkip: () => void;
    isDebugMode?: boolean;
}

/**
 * Hook to manage smart skip functionality with confirmations
 */
export const useSmartSkip = ({
    currentPhase,
    isPreparing,
    isRest,
    onSkip,
    isDebugMode = false,
}: UseSmartSkipProps) => {
    const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
    const [skipsUsed, setSkipsUsed] = useState(0);

    // Configuration: which phases allow skipping
    const skipConfig: SkipConfig = {
        preparation: true,   // Always allow - user may want to start immediately
        warmup: true,        // Allow - user may have their own warmup
        workout: isDebugMode, // Allow only in debug mode
        cooldown: true,      // Allow - user may be in a hurry
        rest: true,          // Always allow - user may want less rest
    };

    // Maximum skips allowed per workout (for warmup/cooldown)
    // Increased to allow skipping all warmup exercises if needed
    const MAX_SKIPS = 100;

    /**
     * Check if skip is allowed in current state
     */
    const canSkip = useCallback((): { allowed: boolean; reason?: string } => {
        // Debug mode always allows skipping
        if (isDebugMode) {
            return { allowed: true };
        }

        // Preparation - always allowed, no confirmation needed
        if (isPreparing) {
            return { allowed: true };
        }

        // Rest periods - always allowed, no confirmation needed
        if (isRest) {
            return { allowed: true };
        }

        // Check phase-specific rules
        // 'finished' phase doesn't allow skipping
        if (currentPhase === 'finished') {
            return {
                allowed: false,
                reason: 'El entrenamiento ya ha finalizado'
            };
        }

        if (!skipConfig[currentPhase as keyof SkipConfig]) {
            return {
                allowed: false,
                reason: 'No puedes saltar ejercicios durante el entrenamiento principal'
            };
        }

        // Check skip limit for warmup/cooldown
        if ((currentPhase === 'warmup' || currentPhase === 'cooldown') && skipsUsed >= MAX_SKIPS) {
            return {
                allowed: false,
                reason: `Has alcanzado el límite de saltos`
            };
        }

        return { allowed: true };
    }, [currentPhase, isPreparing, isRest, skipsUsed, isDebugMode]);

    /**
     * Check if confirmation is needed
     */
    const needsConfirmation = useCallback((): boolean => {
        // No confirmation needed for preparation or rest
        if (isPreparing || isRest) {
            return false;
        }

        // Confirmation needed for warmup and cooldown
        return currentPhase === 'warmup' || currentPhase === 'cooldown';
    }, [currentPhase, isPreparing, isRest]);

    /**
     * Handle skip button press
     */
    const handleSkipPress = useCallback(() => {
        const skipCheck = canSkip();

        if (!skipCheck.allowed) {

            // Could show a toast/alert here
            return;
        }

        if (needsConfirmation()) {

            setShowSkipConfirmation(true);
        } else {

            executeSkip();
        }
    }, [canSkip, needsConfirmation]);

    /**
     * Execute the skip action
     */
    const executeSkip = useCallback(() => {


        // Increment skip counter for warmup/cooldown
        if (currentPhase === 'warmup' || currentPhase === 'cooldown') {
            setSkipsUsed(prev => prev + 1);
        }

        onSkip();
        setShowSkipConfirmation(false);
    }, [currentPhase, skipsUsed, onSkip]);

    /**
     * Cancel skip confirmation
     */
    const cancelSkip = useCallback(() => {

        setShowSkipConfirmation(false);
    }, []);

    /**
     * Reset skip counter (call when workout resets)
     */
    const resetSkipCounter = useCallback(() => {
        setSkipsUsed(0);
    }, []);

    /**
     * Get confirmation message based on phase
     */
    const getConfirmationMessage = useCallback((): string => {
        if (currentPhase === 'warmup') {
            return '¿Saltar este ejercicio de calentamiento?';
        }

        if (currentPhase === 'cooldown') {
            return '¿Saltar este ejercicio de enfriamiento?';
        }

        return '¿Estás seguro de que quieres saltar este ejercicio?';
    }, [currentPhase]);

    return {
        // State
        showSkipConfirmation,
        skipsUsed,
        skipsRemaining: MAX_SKIPS - skipsUsed,

        // Computed
        canSkip: canSkip().allowed,
        skipDisabledReason: canSkip().reason,
        confirmationMessage: getConfirmationMessage(),

        // Actions
        handleSkipPress,
        executeSkip,
        cancelSkip,
        resetSkipCounter,
    };
};
