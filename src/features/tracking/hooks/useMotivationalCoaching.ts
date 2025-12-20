import { useCallback } from 'react';
import { useUserStore } from '@/features/profile/store/userStore';

/**
 * Hook for motivational coaching phrases
 * Provides motivational phrases at key moments during workout
 */

const MOTIVATIONAL_PHRASES = {
    betweenRounds: [
        '¡Excelente trabajo! Prepárate para el siguiente round',
        '¡Vas increíble! Mantén ese ritmo',
        '¡Sigue así! Tu esfuerzo vale la pena',
        '¡Bien hecho! Recupera el aliento y continúa',
        '¡Imparable! El siguiente round es tuyo',
    ],
    midWorkout: [
        '¡Ya llevas la mitad! No te detengas ahora',
        '¡Mitad del camino! Estás haciendo un gran trabajo',
        '¡50% completado! Sigue con esa energía',
        '¡Vas por buen camino! La meta está cerca',
        '¡Increíble progreso! Mantén el enfoque',
    ],
    lastRound: [
        '¡Último round! Dalo todo',
        '¡Es tu momento! Último esfuerzo',
        '¡Final! Demuestra de qué estás hecho',
        '¡Última ronda! Termina fuerte',
        '¡El final está cerca! No te rindas ahora',
    ],
};

export const useMotivationalCoaching = () => {
    const { userData } = useUserStore();
    const isEnabled = userData?.motivationalCoachingEnabled === true;

    /**
     * Get a random phrase from a category
     */
    const getRandomPhrase = useCallback((category: keyof typeof MOTIVATIONAL_PHRASES): string => {
        const phrases = MOTIVATIONAL_PHRASES[category];
        const randomIndex = Math.floor(Math.random() * phrases.length);
        return phrases[randomIndex];
    }, []);

    /**
     * Get phrase for between rounds
     */
    const getBetweenRoundsPhrase = useCallback((): string | null => {
        if (!isEnabled) return null;
        return getRandomPhrase('betweenRounds');
    }, [isEnabled, getRandomPhrase]);

    /**
     * Get phrase for mid workout (50%)
     */
    const getMidWorkoutPhrase = useCallback((): string | null => {
        if (!isEnabled) return null;
        return getRandomPhrase('midWorkout');
    }, [isEnabled, getRandomPhrase]);

    /**
     * Get phrase for last round
     */
    const getLastRoundPhrase = useCallback((): string | null => {
        if (!isEnabled) return null;
        return getRandomPhrase('lastRound');
    }, [isEnabled, getRandomPhrase]);

    return {
        isEnabled,
        getBetweenRoundsPhrase,
        getMidWorkoutPhrase,
        getLastRoundPhrase,
    };
};
