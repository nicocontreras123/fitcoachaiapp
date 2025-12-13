/**
 * Utilidades para manejo de fechas y rutinas semanales
 */

/**
 * Obtiene el lunes de la semana actual
 */
export function getMonday(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar cuando es domingo
    return new Date(d.setDate(diff));
}

/**
 * Obtiene el domingo de la semana actual
 */
export function getSunday(date: Date = new Date()): Date {
    const monday = getMonday(date);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return sunday;
}

/**
 * Formatea fecha a YYYY-MM-DD
 */
export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Obtiene el nombre del día en español
 */
export function getDayName(date: Date): string {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return days[date.getDay()];
}

/**
 * Verifica si una fecha está en el pasado
 */
export function isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
}

/**
 * Verifica si la semana actual ha terminado
 * (si hoy es domingo o ya pasó el domingo)
 */
export function isWeekEnded(): boolean {
    const today = new Date();
    const sunday = getSunday(today);
    return isPastDate(sunday) || today.getDay() === 0;
}

/**
 * Obtiene los días de entrenamiento para la semana actual
 * Solo incluye días desde hoy hasta el domingo
 */
export function getRemainingDaysThisWeek(availableDays: string[]): string[] {
    const today = new Date();
    const todayName = getDayName(today);

    const weekDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    const todayIndex = weekDays.indexOf(todayName);

    // Días desde hoy hasta el domingo
    const remainingDays = weekDays.slice(todayIndex);

    // Filtrar solo los días disponibles del usuario
    return remainingDays.filter(day => availableDays.includes(day));
}

/**
 * Obtiene todos los días de entrenamiento para una semana completa
 */
export function getFullWeekDays(availableDays: string[]): string[] {
    const weekDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    return weekDays.filter(day => availableDays.includes(day));
}

/**
 * Calcula qué días generar según si es primera vez o renovación
 */
export function getDaysToGenerate(
    availableDays: string[],
    isFirstGeneration: boolean = false
): { days: string[]; weekStarting: string } {
    const today = new Date();

    if (isFirstGeneration) {
        // Primera generación: solo días restantes de esta semana
        const days = getRemainingDaysThisWeek(availableDays);
        const monday = getMonday(today);
        return {
            days,
            weekStarting: formatDate(monday)
        };
    } else {
        // Renovación: semana completa siguiente
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + (8 - today.getDay())); // Próximo lunes
        return {
            days: getFullWeekDays(availableDays),
            weekStarting: formatDate(nextMonday)
        };
    }
}

/**
 * Verifica si necesita generar nueva rutina
 */
export function needsNewRoutine(currentRoutine: any): boolean {
    if (!currentRoutine) return true;

    const weekStarting = new Date(currentRoutine.weekStarting);
    const sunday = getSunday(weekStarting);

    // Necesita nueva rutina si ya pasó el domingo de esa semana
    return isPastDate(sunday);
}
