/**
 * Warmup templates específicos por objetivo de entrenamiento
 * Organizado por: nivel → objetivo → ejercicios
 */

export interface WarmupExercise {
    name: string;
    duration: number;
    description: string;
}

export type WorkoutObjective = 'technique' | 'endurance' | 'power' | 'balanced';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export const WARMUP_TEMPLATES: Record<FitnessLevel, Record<WorkoutObjective, WarmupExercise[]>> = {
    beginner: {
        technique: [
            {
                name: 'Trote ligero en sitio',
                duration: 180,
                description: 'Activación cardiovascular suave. Mantén ritmo constante 60-70 BPM. Respiración nasal profunda. Relaja hombros.'
            },
            {
                name: 'Movilidad articular básica',
                duration: 120,
                description: 'Movilidad de hombros, codos y muñecas. Círculos amplios 10 repeticiones cada dirección. Movimientos lentos y controlados.'
            },
        ],
        endurance: [
            {
                name: 'Jumping jacks',
                duration: 180,
                description: 'Activación cardiovascular progresiva. Inicia lento, aumenta ritmo gradualmente. Respiración rítmica. Mantén core activado.'
            },
            {
                name: 'Skipping alto rodillas',
                duration: 120,
                description: 'Elevación de rodillas a 90 grados. Ritmo moderado 60-80 pasos/min. Brazos activos en movimiento de carrera. Respiración nasal.'
            },
        ],
        power: [
            {
                name: 'Saltos de cuerda',
                duration: 180,
                description: 'Activación cardiovascular. Ritmo 80-100 saltos/min. Saltos bajos, aterrizaje suave. Respiración nasal constante.'
            },
            {
                name: 'Arm circles y rotaciones',
                duration: 120,
                description: 'Movilidad de hombros. Círculos adelante/atrás 15 reps. Rotaciones de tronco amplias. Prepara articulaciones para golpes.'
            },
        ],
        balanced: [
            {
                name: 'Trote ligero',
                duration: 180,
                description: 'Activación cardiovascular. Ritmo suave y constante. Respiración nasal. Relaja brazos y hombros.'
            },
            {
                name: 'Movilidad dinámica',
                duration: 120,
                description: 'Movilidad completa. Rotaciones de hombros, caderas, tobillos. 10 repeticiones cada articulación. Movimientos controlados.'
            },
        ],
    },

    intermediate: {
        technique: [
            {
                name: 'Saltos de cuerda técnicos',
                duration: 300,
                description: 'Activación cardiovascular con técnica. 100-120 saltos/min. Alterna pies simples, dobles, cruzados. Respiración rítmica nasal. Mantén postura erguida.'
            },
            {
                name: 'Movilidad dinámica completa',
                duration: 150,
                description: 'Movilidad funcional. Arm circles 20 reps, leg swings 15/lado, rotaciones tronco 20 reps. Aumenta amplitud progresivamente. Respiración profunda.'
            },
            {
                name: 'Shadow boxing técnico',
                duration: 180,
                description: 'Técnica pura. Combinaciones 1-2, 1-2-3 a 40% velocidad. Enfoque en forma perfecta: rotación cadera, retorno guardia, footwork. Respiración controlada con cada golpe.'
            },
        ],
        endurance: [
            {
                name: 'Trote con rodillas altas',
                duration: 300,
                description: 'Cardio intenso. High knees 90 grados, 80-100 pasos/min. Alterna con trote normal cada 30s. Respiración potente bucal. Mantén ritmo constante.'
            },
            {
                name: 'Movilidad dinámica rápida',
                duration: 120,
                description: 'Movilidad activa. Inchworms 10 reps, world\'s greatest stretch 8/lado, jumping jacks 30 reps. Transiciones rápidas. Respiración continua.'
            },
            {
                name: 'Shadow boxing ritmo',
                duration: 180,
                description: 'Cardio técnico. Combinaciones continuas 1-2-3-2 a 60% velocidad. Sin parar 3 minutos. Footwork activo. Respiración rítmica cada 2 golpes.'
            },
        ],
        power: [
            {
                name: 'Burpees explosivos lentos',
                duration: 240,
                description: 'Activación explosiva controlada. 15-20 burpees totales. Descenso lento 3s, explosión rápida arriba. Salto vertical máximo. Respiración potente en explosión.'
            },
            {
                name: 'Movilidad con activación',
                duration: 120,
                description: 'Movilidad explosiva. Rotaciones tronco con velocidad, arm swings dinámicos, leg swings explosivos. 15 reps cada ejercicio. Prepara potencia.'
            },
            {
                name: 'Shadow boxing potencia',
                duration: 240,
                description: 'Golpes de potencia. Combinaciones 2-3-2, 1-6-3 a 70% velocidad. Enfoque en rotación cadera explosiva. Pausa 2s entre combos. Respiración explosiva.'
            },
        ],
        balanced: [
            {
                name: 'Saltos de cuerda variados',
                duration: 300,
                description: 'Cardio versátil. Alterna: 1min simples, 30s dobles, 30s cruzados, 1min simples. 100-120 saltos/min. Respiración nasal rítmica.'
            },
            {
                name: 'Movilidad funcional',
                duration: 120,
                description: 'Movilidad completa. Arm circles, leg swings, hip rotations, ankle mobility. 15 reps cada ejercicio. Amplitud máxima sin dolor.'
            },
            {
                name: 'Shadow boxing mixto',
                duration: 180,
                description: 'Técnica + ritmo. Alterna 30s técnica lenta + 30s ritmo moderado. Combinaciones 1-2-3, 2-3-2, 1-6-3-2. Respiración adaptada a intensidad.'
            },
        ],
    },

    advanced: {
        technique: [
            {
                name: 'Cuerda técnica avanzada',
                duration: 360,
                description: 'Cardio técnico complejo. 120-140 saltos/min. Secuencia: 2min simples, 1min dobles, 1min cruzados, 2min alternos. Postura perfecta, core activado. Respiración nasal profunda.'
            },
            {
                name: 'Movilidad dinámica avanzada',
                duration: 180,
                description: 'Movilidad funcional compleja. Inchworms con push-up 12 reps, world\'s greatest stretch 10/lado, scorpion stretch 8/lado, thoracic rotations 15 reps. Amplitud máxima.'
            },
            {
                name: 'Shadow boxing técnico avanzado',
                duration: 300,
                description: 'Técnica refinada. Combinaciones complejas 1-2-3-2, 1-6-3-2, 2-3-2-6 a 50% velocidad. Footwork lateral, pivotes, esquivas. Forma perfecta cada golpe. Respiración técnica.'
            },
            {
                name: 'Activación técnica específica',
                duration: 120,
                description: 'Preparación neuromuscular. Planchas con toque hombro 20 reps, rotaciones rusas 30 reps, dead bugs 20 reps. Control total. Respiración diafragmática.'
            },
        ],
        endurance: [
            {
                name: 'HIIT cardio preparatorio',
                duration: 360,
                description: 'Cardio intervalado. 30s high knees máximos + 30s trote recuperación. 6 rondas. Mantén intensidad alta en work. Respiración potente bucal en work, nasal en rest.'
            },
            {
                name: 'Movilidad activa continua',
                duration: 150,
                description: 'Movilidad sin pausa. Circuito: burpees sin salto 10, inchworms 8, mountain climbers 20, jumping jacks 30. 2 rondas completas. Respiración continua.'
            },
            {
                name: 'Shadow boxing resistencia',
                duration: 300,
                description: 'Cardio técnico sostenido. Combinaciones continuas 3 minutos sin parar. Alterna 1-2-3-2, 2-3-2-3, 1-6-3-2-6. Velocidad 70%. Footwork constante. Respiración rítmica forzada.'
            },
            {
                name: 'Core activación dinámica',
                duration: 120,
                description: 'Core explosivo. Planchas dinámicas 30s, russian twists 40 reps, bicycle crunches 40 reps, plank jacks 30s. Sin descanso. Respiración controlada.'
            },
        ],
        power: [
            {
                name: 'Pliométricos explosivos',
                duration: 300,
                description: 'Explosividad máxima. Burpees con salto vertical 15 reps, jump squats 20 reps, plyo push-ups 12 reps. Descanso 20s entre ejercicios. Explosión máxima, aterrizaje controlado.'
            },
            {
                name: 'Movilidad explosiva',
                duration: 180,
                description: 'Movilidad con potencia. Leg swings explosivos 20/lado, arm swings dinámicos 25 reps, rotaciones tronco veloces 30 reps. Velocidad máxima controlada. Respiración explosiva.'
            },
            {
                name: 'Shadow boxing potencia máxima',
                duration: 300,
                description: 'Golpes de máxima potencia. Combos 2-3-2, 1-6-3, 3-2-6 a 80% velocidad. 5 golpes + pausa 5s. Rotación cadera explosiva. Retorno guardia rápido. Respiración explosiva cada golpe.'
            },
            {
                name: 'Core potencia',
                duration: 120,
                description: 'Core explosivo. Medicine ball slams simulados 20 reps, plank to pike 15 reps, explosive sit-ups 20 reps. Velocidad máxima. Respiración explosiva.'
            },
        ],
        balanced: [
            {
                name: 'Cuerda mixta avanzada',
                duration: 360,
                description: 'Cardio completo. Secuencia: 2min ritmo constante 120/min, 1min dobles, 30s máxima velocidad, 30s recuperación, 2min cruzados. Técnica perfecta. Respiración adaptada.'
            },
            {
                name: 'Movilidad funcional completa',
                duration: 180,
                description: 'Movilidad integral. Inchworms 10, world\'s greatest 8/lado, scorpion 8/lado, hip circles 15/lado, shoulder dislocates 15. Amplitud máxima progresiva.'
            },
            {
                name: 'Shadow boxing completo',
                duration: 240,
                description: 'Técnica + potencia + ritmo. 1min técnica 50%, 1min potencia 80%, 1min ritmo 70%, 1min mixto. Combinaciones variadas. Footwork activo. Respiración adaptada.'
            },
            {
                name: 'Activación integral',
                duration: 120,
                description: 'Core + explosividad. Planchas 30s, burpees 10, russian twists 30, jump squats 15. 2 rondas. Transiciones rápidas. Respiración controlada.'
            },
        ],
    },
};

/**
 * Detecta el objetivo del workout basándose en título y descripción
 */
export function detectWorkoutObjective(title: string, description: string): WorkoutObjective {
    const text = `${title} ${description}`.toLowerCase();

    if (text.includes('técnica') || text.includes('tecnica') || text.includes('technical')) {
        return 'technique';
    }
    if (text.includes('resistencia') || text.includes('cardio') || text.includes('endurance')) {
        return 'endurance';
    }
    if (text.includes('potencia') || text.includes('power') || text.includes('fuerza') || text.includes('explosiv')) {
        return 'power';
    }

    return 'balanced';
}

/**
 * Obtiene los templates de warmup para un nivel y objetivo específico
 */
export function getWarmupTemplates(level: FitnessLevel, objective: WorkoutObjective): WarmupExercise[] {
    return WARMUP_TEMPLATES[level]?.[objective] || WARMUP_TEMPLATES.intermediate.balanced;
}

// ============= COOLDOWN TEMPLATES =============

export const COOLDOWN_TEMPLATES: Record<FitnessLevel, Record<WorkoutObjective, WarmupExercise[]>> = {
    beginner: {
        technique: [
            {
                name: 'Estiramiento brazos y hombros',
                duration: 120,
                description: 'Recuperación de tren superior. Estiramiento de tríceps 30s cada brazo, hombros cruzados 30s cada lado. Respiración profunda nasal. Mantén postura relajada.'
            },
            {
                name: 'Respiración profunda',
                duration: 90,
                description: 'Normalización cardiovascular. Inhala 4s nasal, retén 2s, exhala 6s bucal. 8-10 repeticiones completas. Siéntate o permanece de pie relajado.'
            },
        ],
        endurance: [
            {
                name: 'Caminata de recuperación',
                duration: 120,
                description: 'Descenso gradual de frecuencia cardíaca. Camina lento en sitio o en círculo. Respiración profunda y controlada. Relaja brazos y hombros progresivamente.'
            },
            {
                name: 'Estiramiento piernas',
                duration: 120,
                description: 'Recuperación de tren inferior. Cuádriceps 30s cada pierna, isquios 30s cada pierna, pantorrillas 30s cada lado. Respiración constante. Sin rebotes.'
            },
        ],
        power: [
            {
                name: 'Sacudidas y movilidad suave',
                duration: 90,
                description: 'Liberación de tensión muscular. Sacude brazos 20s, piernas 20s, todo el cuerpo 20s. Rotaciones suaves de articulaciones 30s. Respiración relajada.'
            },
            {
                name: 'Estiramiento completo',
                duration: 120,
                description: 'Estiramiento integral. Brazos overhead 30s, tronco lateral 20s cada lado, piernas 30s cada una, espalda baja 30s. Respiración profunda en cada estiramiento.'
            },
        ],
        balanced: [
            {
                name: 'Estiramiento general',
                duration: 120,
                description: 'Recuperación completa. Brazos 30s, piernas 40s, espalda 30s, cuello 20s. Movimientos lentos y controlados. Respiración profunda constante.'
            },
            {
                name: 'Respiración y relajación',
                duration: 90,
                description: 'Normalización final. Respiraciones profundas 4-6s inhala, 6-8s exhala. 6-8 repeticiones. Cierra ojos si es posible. Relaja todo el cuerpo.'
            },
        ],
    },

    intermediate: {
        technique: [
            {
                name: 'Estiramiento técnico de hombros',
                duration: 120,
                description: 'Recuperación específica de hombros. Rotador externo 30s cada lado, deltoides 30s cada lado, trapecios 30s. Respiración profunda. Mantén alineación postural.'
            },
            {
                name: 'Movilidad articular suave',
                duration: 90,
                description: 'Movilidad de recuperación. Círculos de muñecas 20s, codos 20s, hombros 30s, cuello 20s. Movimientos lentos y amplios. Respiración rítmica.'
            },
            {
                name: 'Respiración diafragmática',
                duration: 90,
                description: 'Recuperación respiratoria. Mano en abdomen, inhala expandiendo diafragma 5s, exhala contrayendo 7s. 8 repeticiones. Normaliza frecuencia cardíaca.'
            },
        ],
        endurance: [
            {
                name: 'Trote de recuperación',
                duration: 120,
                description: 'Descenso activo de pulsaciones. Trote muy ligero 60s, caminata 60s. Respiración profunda progresiva. Reduce intensidad gradualmente hasta parar.'
            },
            {
                name: 'Estiramiento dinámico-estático piernas',
                duration: 150,
                description: 'Recuperación de tren inferior. Cuádriceps 40s cada pierna, isquios 40s cada pierna, gemelos 40s cada lado, aductores 30s. Respiración profunda en cada estiramiento.'
            },
            {
                name: 'Foam rolling simulado',
                duration: 90,
                description: 'Auto-masaje de recuperación. Masajea cuádriceps 30s cada pierna, pantorrillas 30s cada una. Presión moderada. Respiración constante. Relaja músculo trabajado.'
            },
        ],
        power: [
            {
                name: 'Sacudidas activas completas',
                duration: 90,
                description: 'Liberación de tensión post-explosiva. Sacude brazos vigorosamente 30s, piernas 30s, saltos suaves en sitio 30s. Respiración activa. Suelta toda la tensión.'
            },
            {
                name: 'Estiramiento de cadena posterior',
                duration: 120,
                description: 'Recuperación de cadena posterior. Isquios 40s cada pierna, gemelos 40s cada lado, espalda baja (child pose) 40s. Respiración profunda. Relaja completamente.'
            },
            {
                name: 'Movilidad de cadera y core',
                duration: 90,
                description: 'Recuperación de zona media. Rotaciones de cadera 30s cada lado, gato-vaca 30s, torsiones suaves 30s. Movimientos lentos. Respiración sincronizada con movimiento.'
            },
        ],
        balanced: [
            {
                name: 'Estiramiento integral progresivo',
                duration: 120,
                description: 'Estiramiento completo. Brazos overhead 30s, tronco lateral 20s cada lado, piernas 30s cada una, espalda 40s. Progresión de intensidad suave. Respiración profunda.'
            },
            {
                name: 'Movilidad articular completa',
                duration: 90,
                description: 'Movilidad de todas las articulaciones. Tobillos 15s, rodillas 15s, caderas 20s, columna 20s, hombros 20s. Movimientos circulares amplios. Respiración rítmica.'
            },
            {
                name: 'Respiración y meditación activa',
                duration: 90,
                description: 'Recuperación mental y física. Respiración 4-7-8: inhala 4s, retén 7s, exhala 8s. 6 repeticiones completas. Visualiza relajación muscular progresiva.'
            },
        ],
    },

    advanced: {
        technique: [
            {
                name: 'Estiramiento específico de rotadores',
                duration: 150,
                description: 'Recuperación profunda de hombros. Rotador externo 40s cada lado, rotador interno 40s cada lado, manguito rotador 30s cada lado. Respiración diafragmática. Mantén alineación escapular.'
            },
            {
                name: 'Movilidad funcional de recuperación',
                duration: 120,
                description: 'Movilidad restaurativa. World\'s greatest stretch 30s cada lado, scorpion stretch 30s cada lado, thoracic rotations 30s cada lado. Amplitud máxima sin dolor. Respiración profunda.'
            },
            {
                name: 'Liberación miofascial cuello y trapecios',
                duration: 90,
                description: 'Auto-liberación de tensión. Masaje de trapecios 30s cada lado, esternocleidomastoideo 15s cada lado, suboccipitales 15s. Presión moderada-firme. Respiración relajada.'
            },
            {
                name: 'Respiración parasimpática',
                duration: 90,
                description: 'Activación de recuperación. Respiración 5-5-7: inhala 5s, retén 5s, exhala 7s. 8 repeticiones. Cierra ojos. Visualiza relajación de cada grupo muscular trabajado.'
            },
        ],
        endurance: [
            {
                name: 'Descenso activo progresivo',
                duration: 180,
                description: 'Recuperación cardiovascular gradual. Trote ligero 60s, caminata rápida 60s, caminata normal 60s. Respiración profunda progresiva. Monitorea descenso de pulsaciones.'
            },
            {
                name: 'Estiramiento profundo de piernas',
                duration: 180,
                description: 'Recuperación completa de tren inferior. Cuádriceps 45s cada pierna, isquios 45s cada pierna, gemelos 30s cada lado, aductores 30s, glúteos 30s. Respiración profunda en cada posición.'
            },
            {
                name: 'Foam rolling completo',
                duration: 120,
                description: 'Auto-masaje profundo. Cuádriceps 30s cada pierna, isquios 30s cada pierna, IT band 20s cada lado, gemelos 20s cada uno. Presión firme. Respiración constante en puntos de tensión.'
            },
            {
                name: 'Respiración de recuperación aeróbica',
                duration: 90,
                description: 'Normalización respiratoria post-cardio. Respiración 3-2-5: inhala 3s, retén 2s, exhala 5s. 10 repeticiones. Monitorea normalización de frecuencia respiratoria.'
            },
        ],
        power: [
            {
                name: 'Sacudidas y liberación explosiva',
                duration: 120,
                description: 'Liberación de tensión neuromuscular. Sacudidas vigorosas brazos 30s, piernas 30s, saltos muy suaves 30s, sacudidas completas 30s. Respiración activa. Suelta toda tensión acumulada.'
            },
            {
                name: 'Estiramiento de cadenas musculares',
                duration: 150,
                description: 'Recuperación de cadenas completas. Cadena posterior 50s, cadena anterior 50s, cadenas cruzadas 50s. Respiración profunda. Relaja completamente cada cadena antes de cambiar.'
            },
            {
                name: 'Movilidad de cadera profunda',
                duration: 120,
                description: 'Recuperación de zona media. 90-90 stretch 40s cada lado, pigeon pose 40s cada lado, hip circles 40s. Respiración profunda. Relaja flexores y extensores de cadera.'
            },
            {
                name: 'Liberación fascial y respiración',
                duration: 90,
                description: 'Recuperación miofascial. Auto-masaje de zonas de mayor tensión 60s. Respiración 4-7-8: inhala 4s, retén 7s, exhala 8s. 5 repeticiones. Visualiza liberación de tensión.'
            },
        ],
        balanced: [
            {
                name: 'Estiramiento integral avanzado',
                duration: 150,
                description: 'Estiramiento completo y profundo. Tren superior 50s, tren inferior 50s, core y espalda 50s. Respiración profunda en cada posición. Progresión gradual de intensidad.'
            },
            {
                name: 'Movilidad funcional completa',
                duration: 120,
                description: 'Movilidad de todo el cuerpo. Tobillos 20s, rodillas 20s, caderas 30s, columna 30s, hombros 20s. Movimientos amplios y controlados. Respiración sincronizada.'
            },
            {
                name: 'Foam rolling selectivo',
                duration: 90,
                description: 'Auto-masaje de zonas clave. Espalda alta 30s, glúteos 30s, cuádriceps 30s. Presión moderada-firme. Respiración profunda en puntos de tensión. Relaja músculo trabajado.'
            },
            {
                name: 'Meditación de recuperación',
                duration: 90,
                description: 'Recuperación psicofísica. Respiración 5-5-7: inhala 5s, retén 5s, exhala 7s. 8 repeticiones. Cierra ojos. Escaneo corporal mental. Visualiza recuperación muscular.'
            },
        ],
    },
};

/**
 * Obtiene los templates de cooldown para un nivel y objetivo específico
 */
export function getCooldownTemplates(level: FitnessLevel, objective: WorkoutObjective): WarmupExercise[] {
    return COOLDOWN_TEMPLATES[level]?.[objective] || COOLDOWN_TEMPLATES.intermediate.balanced;
}
