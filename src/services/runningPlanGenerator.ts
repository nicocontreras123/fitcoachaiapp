import { RunningGoalData } from '@/features/profile/types';

export interface WeeklyRunningPlan {
    weekNumber: number;
    totalDistance: number; // km per week
    workouts: RunningWorkout[];
}

export interface RunningWorkout {
    day: string;
    type: 'easy-run' | 'tempo-run' | 'intervals' | 'long-run' | 'recovery-run' | 'rest';
    distance: number; // km
    duration?: number; // estimated minutes
    description: string;
    intensity: 'low' | 'medium' | 'high';
}

/**
 * Calculate a progressive running training plan based on user's goal and current fitness
 */
export class RunningPlanGenerator {

    /**
     * Generate a multi-week progressive training plan
     */
    static generateProgressivePlan(goalData: RunningGoalData, trainingDaysPerWeek: number = 4): WeeklyRunningPlan[] {
        const {
            targetDistance,
            currentMaxDistance,
            currentWeeklyKm,
            currentMaxTime,
            planWeeks,
        } = goalData;

        const weeks: WeeklyRunningPlan[] = [];
        const calculatedWeeks = planWeeks || this.calculatePlanDuration(currentMaxDistance, targetDistance);

        // Calculate weekly distance progression using 10% rule (max 10% increase per week)
        const weeklyDistances = this.calculateWeeklyDistances(
            currentWeeklyKm,
            targetDistance,
            calculatedWeeks,
            trainingDaysPerWeek
        );

        // Generate workouts for each week
        for (let week = 1; week <= calculatedWeeks; week++) {
            const weeklyDistance = weeklyDistances[week - 1];
            const workouts = this.generateWeekWorkouts(
                week,
                weeklyDistance,
                trainingDaysPerWeek,
                currentMaxTime / currentMaxDistance // avg pace in min/km
            );

            weeks.push({
                weekNumber: week,
                totalDistance: weeklyDistance,
                workouts,
            });
        }

        return weeks;
    }

    /**
     * Calculate plan duration based on distance gap
     */
    private static calculatePlanDuration(currentMax: number, target: number): number {
        const gap = target - currentMax;

        // Conservative approach: ~1-2km increase per week
        // Minimum 4 weeks, maximum 24 weeks
        const weeks = Math.max(4, Math.min(24, Math.ceil(gap / 1.5)));

        return weeks;
    }

    /**
     * Calculate weekly distance progression following 10% rule
     */
    private static calculateWeeklyDistances(
        startingWeeklyKm: number,
        targetDistance: number,
        weeks: number,
        daysPerWeek: number
    ): number[] {
        const distances: number[] = [];
        let currentWeekly = Math.max(startingWeeklyKm, 10); // minimum 10km/week

        // Target weekly volume should support the target distance
        // Rule of thumb: weekly volume should be 3-4x the target race distance
        const targetWeeklyVolume = Math.min(targetDistance * 3.5, currentWeekly * 2);

        for (let week = 0; week < weeks; week++) {
            distances.push(Math.round(currentWeekly * 10) / 10);

            // Increase by 10% every week, but include recovery weeks
            if ((week + 1) % 4 === 0) {
                // Every 4th week is a recovery week (reduce by 20%)
                currentWeekly *= 0.8;
            } else {
                // Increase by 10%
                currentWeekly = Math.min(currentWeekly * 1.1, targetWeeklyVolume);
            }
        }

        return distances;
    }

    /**
     * Generate workouts for a specific week
     */
    private static generateWeekWorkouts(
        weekNumber: number,
        totalWeeklyDistance: number,
        daysPerWeek: number,
        avgPaceMinPerKm: number
    ): RunningWorkout[] {
        const workouts: RunningWorkout[] = [];
        const isRecoveryWeek = weekNumber % 4 === 0;

        // Distribute distance across training days
        // Pattern: Easy runs, 1 tempo/interval, 1 long run
        const longRunPercentage = 0.35; // 35% of weekly volume
        const tempoPercentage = 0.25; // 25% of weekly volume
        const easyRunPercentage = (1 - longRunPercentage - tempoPercentage) / (daysPerWeek - 2);

        const longRunDistance = totalWeeklyDistance * longRunPercentage;
        const tempoDistance = totalWeeklyDistance * tempoPercentage;
        const easyRunDistance = totalWeeklyDistance * easyRunPercentage;

        // Days of week for workouts
        const workoutDays = this.selectWorkoutDays(daysPerWeek);

        workoutDays.forEach((day, index) => {
            if (index === 0) {
                // First workout: Easy run
                workouts.push({
                    day,
                    type: 'easy-run',
                    distance: Math.round(easyRunDistance * 10) / 10,
                    duration: Math.round(easyRunDistance * avgPaceMinPerKm * 1.1), // 10% slower
                    description: 'Carrera suave para calentar la semana',
                    intensity: 'low',
                });
            } else if (index === Math.floor(daysPerWeek / 2)) {
                // Middle workout: Tempo or Intervals
                if (isRecoveryWeek) {
                    workouts.push({
                        day,
                        type: 'recovery-run',
                        distance: Math.round(tempoDistance * 10) / 10,
                        duration: Math.round(tempoDistance * avgPaceMinPerKm * 1.15),
                        description: 'Carrera de recuperación a ritmo muy cómodo',
                        intensity: 'low',
                    });
                } else if (weekNumber % 2 === 0) {
                    workouts.push({
                        day,
                        type: 'intervals',
                        distance: Math.round(tempoDistance * 10) / 10,
                        duration: Math.round(tempoDistance * avgPaceMinPerKm * 0.95),
                        description: `Intervalos: ${Math.floor(tempoDistance / 2)}x 1km a ritmo fuerte con 2min recuperación`,
                        intensity: 'high',
                    });
                } else {
                    workouts.push({
                        day,
                        type: 'tempo-run',
                        distance: Math.round(tempoDistance * 10) / 10,
                        duration: Math.round(tempoDistance * avgPaceMinPerKm * 0.95),
                        description: 'Carrera a ritmo de umbral (80-85% esfuerzo)',
                        intensity: 'high',
                    });
                }
            } else if (index === daysPerWeek - 1) {
                // Last workout: Long run
                workouts.push({
                    day,
                    type: 'long-run',
                    distance: Math.round(longRunDistance * 10) / 10,
                    duration: Math.round(longRunDistance * avgPaceMinPerKm * 1.05),
                    description: 'Carrera larga a ritmo cómodo para construir resistencia',
                    intensity: 'medium',
                });
            } else {
                // Other workouts: Easy runs
                workouts.push({
                    day,
                    type: 'easy-run',
                    distance: Math.round(easyRunDistance * 10) / 10,
                    duration: Math.round(easyRunDistance * avgPaceMinPerKm * 1.1),
                    description: 'Carrera suave de mantenimiento',
                    intensity: 'low',
                });
            }
        });

        return workouts;
    }

    /**
     * Select which days of the week to schedule workouts
     */
    private static selectWorkoutDays(daysPerWeek: number): string[] {
        const allDays = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

        // Recommended patterns based on frequency
        const patterns: Record<number, string[]> = {
            3: ['martes', 'jueves', 'domingo'],
            4: ['lunes', 'miercoles', 'viernes', 'domingo'],
            5: ['lunes', 'martes', 'jueves', 'sabado', 'domingo'],
            6: ['lunes', 'martes', 'miercoles', 'viernes', 'sabado', 'domingo'],
        };

        return patterns[daysPerWeek] || patterns[4];
    }

    /**
     * Get a summary of the training plan
     */
    static getPlanSummary(plan: WeeklyRunningPlan[]): string {
        const totalWeeks = plan.length;
        const startingDistance = plan[0].totalDistance;
        const peakDistance = Math.max(...plan.map(w => w.totalDistance));
        const finalWeekDistance = plan[plan.length - 1].totalDistance;

        return `Plan de ${totalWeeks} semanas: ${startingDistance}km/semana → ${peakDistance}km/semana (pico) → ${finalWeekDistance}km/semana (final)`;
    }
}
