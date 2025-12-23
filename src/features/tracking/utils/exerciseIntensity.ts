/**
 * Calcula la intensidad de un ejercicio de boxeo basándose en su nombre y descripción
 * Retorna un valor entre 0-100
 */
export const calculateExerciseIntensity = (exerciseName: string, description?: string): number => {
    const name = exerciseName.toLowerCase();
    const desc = (description || '').toLowerCase();
    const combined = `${name} ${desc}`;

    // Palabras clave para diferentes niveles de intensidad

    // TÉCNICO / BAJA INTENSIDAD (30-45)
    const technicalKeywords = [
        'técnica', 'tecnica', 'forma', 'postura', 'posición', 'posicion',
        'defensa', 'esquiva', 'bloqueo', 'guardia', 'footwork',
        'desplazamiento', 'pivote', 'giro', 'rotación', 'rotacion',
        'sombra', 'shadow', 'visualiza', 'mental'
    ];

    // MODERADA INTENSIDAD (50-65)
    const moderateKeywords = [
        'jab', 'directo', 'cross', 'recto',
        'combinación', 'combinacion', 'combo',
        'ritmo constante', 'mantén', 'manten', 'sostenido'
    ];

    // ALTA INTENSIDAD (70-85)
    const highKeywords = [
        'hook', 'gancho', 'uppercut', 'upper',
        'power', 'potencia', 'fuerza', 'explosivo', 'explosiva',
        'rápido', 'rapido', 'velocidad', 'speed',
        'intenso', 'intensa', 'fuerte'
    ];

    // MUY ALTA INTENSIDAD (85-95)
    const veryHighKeywords = [
        'sprint', 'burst', 'máximo', 'maximo', 'all out',
        'explosión', 'explosion', 'máxima velocidad',
        'hiit', 'intervalo', 'tabata'
    ];

    // Contar coincidencias
    let technicalCount = 0;
    let moderateCount = 0;
    let highCount = 0;
    let veryHighCount = 0;

    technicalKeywords.forEach(keyword => {
        if (combined.includes(keyword)) technicalCount++;
    });

    moderateKeywords.forEach(keyword => {
        if (combined.includes(keyword)) moderateCount++;
    });

    highKeywords.forEach(keyword => {
        if (combined.includes(keyword)) highCount++;
    });

    veryHighKeywords.forEach(keyword => {
        if (combined.includes(keyword)) veryHighCount++;
    });

    // Determinar intensidad basándose en las coincidencias
    if (veryHighCount > 0) {
        return 90; // Muy alta intensidad
    } else if (highCount > 0) {
        return 75; // Alta intensidad
    } else if (technicalCount > moderateCount && technicalCount > 0) {
        return 40; // Técnico / baja intensidad
    } else if (moderateCount > 0) {
        return 60; // Moderada intensidad
    }

    // Por defecto, intensidad media-alta para ejercicios no clasificados
    return 70;
};

/**
 * Obtiene el label descriptivo de la intensidad
 */
export const getIntensityLabel = (intensity: number): string => {
    if (intensity >= 85) return 'Muy Alta';
    if (intensity >= 70) return 'Alta';
    if (intensity >= 55) return 'Moderada';
    if (intensity >= 40) return 'Técnica';
    return 'Baja';
};

/**
 * Obtiene el color sugerido para la intensidad
 */
export const getIntensityColor = (intensity: number): string => {
    if (intensity >= 85) return '#ef4444'; // Rojo
    if (intensity >= 70) return '#f97316'; // Naranja
    if (intensity >= 55) return '#f59e0b'; // Amarillo
    if (intensity >= 40) return '#3b82f6'; // Azul
    return '#6b7280'; // Gris
};
