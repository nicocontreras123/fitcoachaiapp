/**
 * Formatea segundos a formato mm:ss
 * @param seconds - Número de segundos
 * @returns String en formato mm:ss
 */
export const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Calcula el tiempo total de una rutina de boxeo
 * @param rounds - Array de rounds con workTime y restTime
 * @param warmup - Array de ejercicios de warmup con duration
 * @param cooldown - Array de ejercicios de cooldown con duration
 * @returns Tiempo total en segundos
 */
export const calculateTotalWorkoutTime = (
    rounds: { workTime: number; restTime: number }[],
    warmup: { duration: number }[] = [],
    cooldown: { duration: number }[] = []
): number => {
    // Tiempo de warmup
    const warmupTime = warmup.reduce((total, exercise) => total + exercise.duration, 0);

    // Tiempo de rounds (trabajo + descanso)
    const roundsTime = rounds.reduce((total, round) => total + round.workTime + round.restTime, 0);

    // Tiempo de cooldown
    const cooldownTime = cooldown.reduce((total, exercise) => total + exercise.duration, 0);

    return warmupTime + roundsTime + cooldownTime;
};

/**
 * Calcula el tiempo total de una rutina de gym
 * @param exercises - Array de ejercicios con sets
 * @param warmup - Array de ejercicios de warmup con duration
 * @param cooldown - Array de ejercicios de cooldown con duration
 * @param restTimePerSet - Tiempo de descanso entre series (default: 60s)
 * @returns Tiempo total en segundos
 */
export const calculateGymWorkoutTime = (
    exercises: { sets: number }[],
    warmup: { duration: number }[] = [],
    cooldown: { duration: number }[] = [],
    restTimePerSet: number = 60
): number => {
    // Tiempo de warmup
    const warmupTime = warmup.reduce((total, exercise) => total + exercise.duration, 0);

    // Tiempo estimado de ejercicios (30s por serie + descanso)
    const exerciseTime = exercises.reduce((total, exercise) => {
        const workTime = exercise.sets * 30; // 30s por serie estimado
        const restTime = (exercise.sets - 1) * restTimePerSet; // Descanso entre series
        return total + workTime + restTime;
    }, 0);

    // Tiempo de cooldown
    const cooldownTime = cooldown.reduce((total, exercise) => total + exercise.duration, 0);

    return warmupTime + exerciseTime + cooldownTime;
};
