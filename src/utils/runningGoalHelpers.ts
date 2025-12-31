/**
 * Helper functions for running goal tracking and workout contribution
 */

/**
 * Calculate what percentage of the weekly volume this workout represents
 */
export function calculateWeeklyProgress(workoutDistance: number, weeklyTotal: number): number {
    if (weeklyTotal === 0) return 0;
    return Math.round((workoutDistance / weeklyTotal) * 100);
}

/**
 * Generate contribution text explaining how this workout helps achieve the goal
 */
export function generateContributionText(workoutType: string, targetDistance: number): string {
    const contributions: Record<string, string> = {
        'tempo-run': `Este tempo run mejora tu velocidad y resistencia aeróbica, clave para completar los ${targetDistance}K a buen ritmo`,
        'intervals': `Los intervalos aumentan tu VO2 max y velocidad máxima, preparándote para el desafío de ${targetDistance}K`,
        'long-run': `La carrera larga construye la resistencia necesaria para completar los ${targetDistance}K sin problemas`,
        'easy-run': `Las carreras suaves permiten recuperación activa mientras mantienes el volumen semanal`,
        'recovery-run': `La recuperación es clave para evitar lesiones y llegar en óptimas condiciones a tu objetivo de ${targetDistance}K`,
    };

    return contributions[workoutType] || `Este entrenamiento te acerca progresivamente a tu objetivo de ${targetDistance}K`;
}

/**
 * Get today's workout from the weekly routine
 */
export function getTodayWorkout(routine: any) {
    const today = new Date();
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const todayName = dayNames[today.getDay()];

    return routine?.days?.[todayName];
}
