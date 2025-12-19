import { ENV, isApiConfigured } from '@/config/env';
import {
  GenerateWorkoutParams,
  Workout,
  WeeklyRoutine,
  GymWorkout,
  BoxingWorkout,
  RunningWorkout,
  BoxingExercise,
} from '@/features/workouts/types';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// ============= EXERCISE POOLS =============
const EXERCISE_POOLS = {
  boxing: {
    warmup: [
      { name: 'Saltos de cuerda', duration: 180 },
      { name: 'Shadow boxing', duration: 120 },
      { name: 'Skipping alto rodillas', duration: 120 },
      { name: 'Jumping jacks', duration: 90 },
      { name: 'Movilidad articular hombros', duration: 90 },
      { name: 'Rotaciones de tronco', duration: 60 },
      { name: 'Footwork básico', duration: 120 },
      { name: 'Arm circles', duration: 60 },
      { name: 'Trote ligero en sitio', duration: 120 },
      { name: 'Burpees lentos', duration: 90 },
    ],
    cooldown: [
      { name: 'Estiramiento hombros y brazos', duration: 60 },
      { name: 'Estiramiento piernas', duration: 60 },
      { name: 'Respiración profunda', duration: 60 },
      { name: 'Foam roller espalda', duration: 90 },
      { name: 'Estiramiento cuádriceps', duration: 45 },
      { name: 'Estiramiento isquios', duration: 45 },
      { name: 'Child pose', duration: 60 },
      { name: 'Gato-vaca', duration: 60 },
      { name: 'Pigeon pose', duration: 90 },
      { name: 'Downward dog', duration: 60 },
    ],
    combinations: [
      '1-1-2',
      '1-2-3',
      '2-3-2',
      '1-2-3-2',
      '1-6-3-2',
      '3-2-3',
      '1-1-2-3-2',
      '4-3-2',
      '1-1-3 + Esquivar',
      '1-2 + Slip + 3-2',
      '1-2-3 + Roll + 6-3',
      '2-3-2 + Duck + 1-2',
    ],
    drills: [
      'Burpees con jab',
      'Sentadillas con cross',
      'Mountain climbers',
      'Plank to pike',
      'Saltos laterales',
      'High knees',
      'Flexiones explosivas',
      'Russian twists',
      'Bicycle crunches',
      'Jump squats',
    ],
    defense: [
      'Slip left + 2-3',
      'Roll bajo + 3-2',
      'Duck + 6-3',
      'Parry + 1-2',
      'Block + Counter cross',
      'Shoulder roll practice',
    ],
  },
  running: {
    paces: {
      beginner: ['6:30 min/km', '6:00 min/km', '5:45 min/km', '7:00 min/km'],
      intermediate: ['5:30 min/km', '5:00 min/km', '4:45 min/km', '5:15 min/km'],
      advanced: ['4:30 min/km', '4:00 min/km', '3:45 min/km', '4:15 min/km'],
    },
  },
  gym: {
    warmup: [
      'Trote ligero 5min',
      'Remo ligero 5min',
      'Bicicleta 5min',
      'Movilidad dinámica 5min',
      'Arm swings',
      'Leg swings',
      'Inchworms',
      'World\'s greatest stretch',
    ],
    cooldown: [
      'Estiramiento completo piernas',
      'Estiramiento espalda y core',
      'Foam rolling',
      'Respiración diafragmática',
      'Cat-cow stretches',
      'Cobra pose',
    ],
    exercises: {
      push: ['Press banca', 'Press militar', 'Fondos', 'Flexiones', 'Aperturas'],
      pull: ['Dominadas', 'Remo', 'Pull-down', 'Face pulls', 'Curl biceps'],
      legs: ['Sentadillas', 'Peso muerto', 'Zancadas', 'Extensiones', 'Curl femoral'],
      core: ['Planchas', 'Russian twists', 'Dead bugs', 'Pallof press', 'Hanging leg raises'],
    },
  },
};

// ============= SEED GENERATION =============
function getPromptVariationSeed(userProfile: any, date: Date = new Date()): string {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const profileHash = `${userProfile?.age || 30}${userProfile?.weight || 70}${userProfile?.level || 'intermediate'}`;
  return `${dayOfYear}-${profileHash}-${Math.floor(date.getTime() / (1000 * 60 * 60 * 24))}`;
}

// ============= DURATION VALIDATION =============
function calculateBoxingDuration(workout: BoxingWorkout): number {
  const warmupMin = workout.warmup.reduce((sum, ex) => sum + (ex.duration || 0), 0) / 60;
  const cooldownMin = workout.cooldown.reduce((sum, ex) => sum + (ex.duration || 0), 0) / 60;
  const roundsMin = workout.rounds.reduce((sum, round) => {
    return sum + (round.workTime || 180) / 60 + (round.restTime || 60) / 60;
  }, 0);
  const lastRoundRestAdjust = workout.rounds.length > 0 ? -(workout.rounds[workout.rounds.length - 1].restTime || 60) / 60 : 0;
  return Math.round(warmupMin + roundsMin + lastRoundRestAdjust + cooldownMin);
}

function calculateRunningDuration(workout: RunningWorkout): number {
  return workout.intervals.reduce((sum, interval) => sum + (interval.duration || 0), 0);
}

function calculateGymDuration(workout: GymWorkout): number {
  // GymWorkout warmup/cooldown son string[], no tienen duraciones explícitas
  // Retornamos el totalDuration tal cual
  return workout.totalDuration;
}

function validateAndFixWorkoutDuration(workout: Workout): Workout {
  const workoutType = (workout as any).type ||
    ('rounds' in workout ? 'boxing' : 'intervals' in workout ? 'running' : 'gym');

  if (workoutType === 'boxing') {
    const boxing = workout as BoxingWorkout;
    const calculatedDuration = calculateBoxingDuration(boxing);
    if (Math.abs(boxing.totalDuration - calculatedDuration) > 2) {
      console.warn(`⚠️ Boxing duration mismatch: stated ${boxing.totalDuration}min, calculated ${calculatedDuration}min`);
      boxing.totalDuration = calculatedDuration;
    }
  } else if (workoutType === 'running') {
    const running = workout as RunningWorkout;
    const calculatedDuration = calculateRunningDuration(running);
    if (Math.abs(running.totalDuration - calculatedDuration) > 2) {
      console.warn(`⚠️ Running duration mismatch: stated ${running.totalDuration}min, calculated ${calculatedDuration}min`);
      running.totalDuration = calculatedDuration;
    }
  }

  return workout;
}

// ============= SIMILARITY DETECTION =============
function calculateWorkoutSimilarity(w1: Workout, w2: Workout): number {
  const extractExerciseNames = (w: Workout): Set<string> => {
    const names = new Set<string>();
    if ('rounds' in w) {
      (w as BoxingWorkout).rounds.forEach(r => r.exercises.forEach(e => names.add(e.name.toLowerCase())));
    } else if ('intervals' in w) {
      (w as RunningWorkout).intervals.forEach(i => names.add(i.type));
    } else if ('exercises' in w) {
      (w as GymWorkout).exercises.forEach(e => names.add(e.name.toLowerCase()));
    }
    return names;
  };

  const set1 = extractExerciseNames(w1);
  const set2 = extractExerciseNames(w2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

// ============= VARIED PROMPT BUILDER =============
function generateVariedSystemPrompt(seed: string, sport: string, level: string): string {
  const seedNum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const warmupIdx = seedNum % EXERCISE_POOLS.boxing.warmup.length;
  const cooldownIdx = seedNum % EXERCISE_POOLS.boxing.cooldown.length;
  const comboIdx = seedNum % EXERCISE_POOLS.boxing.combinations.length;

  const warmupExample = EXERCISE_POOLS.boxing.warmup.slice(warmupIdx, warmupIdx + 3);
  const cooldownExample = EXERCISE_POOLS.boxing.cooldown.slice(cooldownIdx, cooldownIdx + 3);
  const comboExample = EXERCISE_POOLS.boxing.combinations.slice(comboIdx, comboIdx + 2);

  return `Eres un entrenador personal elite. Genera rutinas ÚNICAS y VARIADAS en JSON.

CRÍTICO - VARIABILIDAD:
* Cada rutina debe ser diferente: varía ejercicios, combinaciones, estructura
* NO repitas siempre los mismos ejercicios de warmup/cooldown
* Usa creatividad en nombres y descripciones
* Adapta al nivel del usuario: ${level}

DURACIONES MÍNIMAS OBLIGATORIAS:

BOXEO:
* Beginner: 30-35 min total
  - Warmup: 5-7 min (300-420 segundos totales)
  - Rounds: 4-6 rounds × (120s trabajo + 60s descanso)
  - Cooldown: 3-5 min (180-300 segundos totales)

* Intermediate: 40-50 min total
  - Warmup: 6-8 min (360-480 segundos totales)
  - Rounds: 8-12 rounds × (180s trabajo + 60s descanso)
  - Cooldown: 4-6 min (240-360 segundos totales)

* Advanced: 50-60 min total
  - Warmup: 7-10 min (420-600 segundos totales)
  - Rounds: 12-18 rounds × (180s trabajo + 60s descanso)
  - Cooldown: 5-8 min (300-480 segundos totales)

⚠️ OBLIGATORIO PARA BOXEO:
- SIEMPRE genera el MÍNIMO de rounds según nivel
- Cada round: 4-6 ejercicios diferentes
- workTime: 120-180 segundos (según nivel)
- restTime: 60 segundos
- NO generes solo 2-3 rounds

RUNNING:
* Beginner: 25-30 min total (mínimo 5 intervalos)
* Intermediate: 35-45 min total (mínimo 6-7 intervalos)
* Advanced: 45-60 min total (mínimo 8-10 intervalos)

GYM:
* Beginner: 35-40 min total (6-8 ejercicios × 3 sets)
* Intermediate: 45-55 min total (8-10 ejercicios × 3-4 sets)
* Advanced: 55-70 min total (10-12 ejercicios × 4-5 sets)

EJEMPLO CÁLCULO CORRECTO (Intermediate Boxing 45min):
1. Warmup: 3 ejercicios = 180s + 120s + 60s = 360s = 6min
2. Rounds: 10 rounds × 180s = 1800s = 30min trabajo
3. Descansos: 9 × 60s = 540s = 9min
4. Cooldown: 3 ejercicios = 60s + 60s + 60s = 180s = 3min
5. Total = 6 + 30 + 9 + 3 = 48min ✅

EJEMPLO INCORRECTO (NO hacer):
1. Warmup: 2 ejercicios = 90s + 60s = 150s = 2.5min
2. Rounds: 3 rounds × 180s = 540s = 9min trabajo
3. Descansos: 2 × 60s = 120s = 2min
4. Cooldown: 2 ejercicios = 60s + 60s = 120s = 2min
5. Total = 2.5 + 9 + 2 + 2 = 15.5min ❌ DEMASIADO CORTO

CRÍTICO - CÁLCULO DE DURACIÓN (paso a paso):
1. Suma warmup en segundos → divide /60 = warmupMin
2. Cuenta rounds: cada round = workTime/60 + restTime/60
3. Resta último restTime (no hay descanso final)
4. Suma cooldown en segundos → divide /60 = cooldownMin
5. totalDuration = warmupMin + roundsTotal - lastRest + cooldownMin
6. REDONDEA al minuto más cercano

NOMENCLATURA DE GOLPES DE BOXEO (OBLIGATORIO):
Usa SOLO números para las combinaciones, NUNCA nombres de golpes:
1 = Jab (directo delantero)
2 = Cross (directo trasero)
3 = Hook delantero
4 = Hook trasero
5 = Uppercut delantero
6 = Uppercut trasero

Ejemplos CORRECTOS: "1-2-3", "1-1-2", "2-3-2", "1-6-3-2"
Ejemplos INCORRECTOS: "Jab-Cross-Hook", "JAB - CROSS - HOOK"

BOXING formato:
{
  "type": "boxing",
  "title": "Nombre único",
  "description": "Descripción específica",
  "totalDuration": NÚMERO_CALCULADO,
  "difficulty": "${level}",
  "warmup": [
    {
      "name": "[VARÍA EL EJERCICIO]",
      "duration": SEGUNDOS,
      "description": "[PROPÓSITO]. [INSTRUCCIONES TÉCNICAS DETALLADAS: postura, ritmo, respiración, repeticiones]. [CONSEJOS O PRECAUCIONES]. Progresión: [VARIACIÓN OPCIONAL]."
    }
  ],
  "rounds": [
    {
      "roundNumber": 1,
      "workTime": 180,
      "restTime": 60,
      "exercises": [
        {"name": "1-2-3", "duration": 30, "description": "Técnica y velocidad en combinación básica"},
        {"name": "2-3-2", "duration": 30, "description": "Potencia con giro de cadera"},
        {"name": "Burpees", "duration": 40, "description": "Explosividad y resistencia"},
        {"name": "1-1-2-3-2", "duration": 30, "description": "Combo avanzado con doble jab"},
        {"name": "High knees", "duration": 30, "description": "Activación cardiovascular"}
      ]
    }
  ],
  "cooldown": [
    {
      "name": "[VARÍA EL EJERCICIO]",
      "duration": SEGUNDOS,
      "description": "[PROPÓSITO]. [INSTRUCCIONES TÉCNICAS DETALLADAS]. [CONSEJOS DE SEGURIDAD O TÉCNICA]."
    }
  ]
}

CRÍTICO - COMBINACIONES DE BOXEO:
* USA SOLO NÚMEROS para las combinaciones de golpes (ej: "1-2-3", NO "Jab-Cross-Hook")
* Mezcla combinaciones de golpes (1-2-3, etc.) con ejercicios físicos (Burpees, High knees, etc.)
* Cada round debe tener 4-6 ejercicios diferentes
* Varía las combinaciones entre rounds

CRÍTICO - DESCRIPCIONES DE WARMUP/COOLDOWN:
* GENERA EJERCICIOS ÚNICOS Y VARIADOS (NO copies ejemplos)
* CADA descripción DEBE incluir en este orden:
  1. PROPÓSITO: Qué sistema activa/recupera (ej: "Activación cardiovascular", "Movilidad de hombros", "Recuperación de tren inferior")
  2. INSTRUCCIONES TÉCNICAS: Detalles específicos de ejecución
     - Postura corporal exacta
     - Ritmo, tempo o BPM si aplica
     - Respiración (nasal/bucal, timing)
     - Repeticiones o series específicas
  3. CONSEJOS/PRECAUCIONES: Qué evitar o cómo optimizar
  4. PROGRESIÓN (opcional): Cómo aumentar dificultad

EJEMPLOS DE ESTRUCTURA (USA DIFERENTES EJERCICIOS):

Warmup ejemplo:
"Activación cardiovascular. [Instrucciones técnicas específicas del ejercicio elegido: posición, ritmo X-Y BPM, alternancia]. [Consejo técnico]. Progresión: [variación final]."

Cooldown ejemplo:
"Recuperación de [grupo muscular]. [Instrucciones: posición inicial, timing por lado, respiración]. [Precaución de seguridad]."

* Longitud MÍNIMA: 2-3 frases completas (100-150 caracteres)
* NUNCA descripciones de 1-2 palabras
* Usa lenguaje profesional de entrenador
* VARÍA los ejercicios entre workouts

RUNNING formato:
{
  "type": "running",
  "title": "Nombre único del entrenamiento",
  "description": "Descripción del enfoque de la sesión",
  "intervals": [
    {"type": "warm-up", "duration": 5, "pace": "6:00 min/km", "description": "..."},
    {"type": "run", "duration": 10, "pace": "5:30 min/km", "description": "..."},
    {"type": "cool-down", "duration": 5, "pace": "6:00 min/km", "description": "..."}
  ],
  "totalDuration": SUMA_DURACIONES,
  "difficulty": "${level}"
}

GYM formato:
{
  "type": "gym",
  "title": "Nombre único del entrenamiento",
  "description": "Descripción específica del enfoque",
  "exercises": [{"name": "...", "sets": 3, "reps": 12, "weight": "Moderado"}],
  "warmup": ["Cardio 5min", "Movilidad dinámica"],
  "cooldown": ["Estiramiento completo", "Foam rolling"],
  "totalDuration": CALCULADO,
  "difficulty": "${level}"
}

WEEKLY estructura:
{
  "weekStarting": "YYYY-MM-DD",
  "goal": "Objetivo semanal",
  "days": {
    "lunes": {"day": "Lunes", "restDay": false, "workout": WORKOUT_OBJECT, "notes": ""},
    "martes": ...,
    "miércoles": ...,
    "jueves": ...,
    "viernes": ...,
    "sábado": ...,
    "domingo": ...
  }
}`;
}

// ============= WORKOUT FINGERPRINTING =============
function generateWorkoutFingerprint(workout: Workout): string {
  const exercises: string[] = [];
  if ('rounds' in workout) {
    (workout as BoxingWorkout).rounds.forEach(r =>
      r.exercises.forEach(e => exercises.push(e.name))
    );
  } else if ('intervals' in workout) {
    (workout as RunningWorkout).intervals.forEach(i => exercises.push(i.type));
  } else if ('exercises' in workout) {
    (workout as GymWorkout).exercises.forEach(e => exercises.push(e.name));
  }
  return exercises.slice(0, 5).join('|');
}

// ============= LOGGING =============
const logger = {
  logGeneration: (routine: WeeklyRoutine, params: GenerateWorkoutParams, seed: string) => {
    const workouts = Object.values(routine.days)
      .filter(d => !d.restDay && d.workout)
      .map(d => d.workout!);

    console.log('📊 Generation Stats:', {
      timestamp: new Date().toISOString(),
      seed,
      sport: params.sport,
      level: params.level,
      workoutCount: workouts.length,
      fingerprints: workouts.map(w => generateWorkoutFingerprint(w)),
      durations: workouts.map(w => w.totalDuration),
    });
  },
};

// ============= MINIMUM DURATION ENFORCEMENT =============
function ensureMinimumDuration(workout: Workout, level: string): Workout {
  const minDurations: Record<string, number> = {
    beginner: 30,
    intermediate: 40,
    advanced: 50,
  };

  const minDuration = minDurations[level] || 40;

  if (workout.totalDuration < minDuration) {
    console.warn(`⚠️ Workout too short: ${workout.totalDuration}min < ${minDuration}min (${level})`);

    if ('rounds' in workout) {
      const boxing = workout as BoxingWorkout;
      const targetRounds = level === 'beginner' ? 5 : level === 'intermediate' ? 10 : 15;

      while (boxing.rounds.length < targetRounds && boxing.totalDuration < minDuration) {
        const lastRound = boxing.rounds[boxing.rounds.length - 1];
        boxing.rounds.push({
          roundNumber: boxing.rounds.length + 1,
          workTime: lastRound.workTime,
          restTime: lastRound.restTime,
          exercises: lastRound.exercises.map((ex, idx) => ({
            ...ex,
            name: ex.name.replace(/\d+/, String((boxing.rounds.length % 5) + 1)),
          })),
        });
        boxing.totalDuration = calculateBoxingDuration(boxing);
      }
    } else if ('intervals' in workout) {
      const running = workout as RunningWorkout;
      const targetIntervals = level === 'beginner' ? 5 : level === 'intermediate' ? 7 : 10;

      while (running.intervals.length < targetIntervals && running.totalDuration < minDuration) {
        const lastInterval = running.intervals[running.intervals.length - 2];
        running.intervals.splice(running.intervals.length - 1, 0, {
          ...lastInterval,
          duration: 5,
        });
        running.totalDuration = calculateRunningDuration(running);
      }
    }
  }

  return workout;
}

// ============= POST-PROCESSOR =============
class WorkoutPostProcessor {
  static process(routine: WeeklyRoutine, level: string): WeeklyRoutine {
    Object.keys(routine.days).forEach(dayKey => {
      const day = routine.days[dayKey];
      if (!day.restDay && day.workout) {
        day.workout = validateAndFixWorkoutDuration(day.workout);
        day.workout = ensureMinimumDuration(day.workout, level);
      }
    });
    return routine;
  }
}

// ============= MAIN SERVICE =============
export class OpenAIService {
  private static async makeRequest(messages: OpenAIMessage[], seed: string): Promise<string> {
    if (!isApiConfigured()) {
      throw new Error('OpenAI API key missing');
    }

    try {
      const response = await fetch(`${ENV.OPENAI_API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ENV.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: ENV.OPENAI_MODEL,
          messages,
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = (await response.json()) as OpenAIResponse;
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI Request Error:', error);
      throw error;
    }
  }

  static async generateWeeklyRoutine(params: GenerateWorkoutParams): Promise<WeeklyRoutine> {
    const { userProfile, goals, availableDays, sport } = params;

    // Usar nivel del userProfile con fallback a params.level
    const level = userProfile?.level || params.level || 'intermediate';


    const seed = getPromptVariationSeed(userProfile);
    const systemPrompt = generateVariedSystemPrompt(seed, sport, level);

    const equipmentMap: { [key: string]: string } = {
      'jump-rope': 'Cuerda',
      'punching-bag': 'Saco',
      'treadmill': 'Trotadora',
      'dumbbells': 'Pesas',
      'resistance-bands': 'Bandas',
      'pull-up-bar': 'Barra',
      'kettlebells': 'Pesas rusas',
      'yoga-mat': 'Mat',
      'none': 'Sin equipo',
    };

    const equipmentList = userProfile?.equipment?.map(eq => equipmentMap[eq] || eq).join(', ') || 'Sin equipo';

    const minDuration = level === 'beginner' ? '30-35' : level === 'intermediate' ? '40-50' : '50-60';
    const minRounds = level === 'beginner' ? '4-6' : level === 'intermediate' ? '8-12' : '12-18';
    const minDurationNum = level === 'beginner' ? 30 : level === 'intermediate' ? 40 : 50;

    const userPrompt = `Usuario: ${userProfile?.age}a, ${userProfile?.weight}kg, nivel ${level}.
Deportes: ${userProfile?.deportes?.join(', ') || sport}.
Objetivos: ${goals}.
Días: ${availableDays?.join(', ')}.
Equipamiento: ${equipmentList}.

VARIABILIDAD OBLIGATORIA:
* Genera ejercicios ÚNICOS (no copies ejemplos exactos del sistema)
* Varía warmup/cooldown en cada workout
* Usa diferentes combinaciones y estructuras
* Adapta intensidad a nivel ${level}

DURACIÓN OBLIGATORIA:
* Nivel ${level} requiere entrenamientos de MÍNIMO: ${minDuration} min
* Para boxeo ${level}: genera MÍNIMO ${minRounds} rounds
* NO generes entrenamientos de menos de 25 minutos (son demasiado cortos)
* El warmup debe ser 5-8 minutos SIEMPRE
* El cooldown debe ser 3-6 minutos SIEMPRE
* CALCULA antes de responder: warmup + rounds + descansos + cooldown debe dar ${minDurationNum}+ min

VERIFICACIÓN ANTES DE RESPONDER:
1. Cuenta tus rounds generados
2. Suma duraciones: (warmup/60) + (rounds×workTime/60) + (descansos×restTime/60) + (cooldown/60)
3. Si el total es < ${minDurationNum} min → AGREGA MÁS ROUNDS
4. Repite hasta cumplir duración mínima

DÍAS Y EQUIPAMIENTO:
* Solo genera entrenamientos para: ${availableDays?.join(', ')}
* Resto de días: restDay=true, workout=null
* USA SOLO: ${equipmentList}
* NO sugieras equipo no disponible`;

    try {
      if (!isApiConfigured()) {
        return this.getMockWeeklyRoutine();
      }

      const content = await this.makeRequest(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        seed
      );

      let routine = JSON.parse(content) as WeeklyRoutine;
      routine = WorkoutPostProcessor.process(routine, level);
      logger.logGeneration(routine, params, seed);

      return routine;
    } catch (e) {
      console.error("❌ Error generating weekly routine", e);
      return this.getMockWeeklyRoutine();
    }
  }

  static getMockWeeklyRoutine(): WeeklyRoutine {
    return {
      weekStarting: new Date().toISOString(),
      goal: "Mantener estado físico (Mock)",
      days: {
        lunes: {
          day: "Lunes",
          restDay: false,
          workout: {
            title: "Boxeo Técnico",
            difficulty: "intermediate",
            totalDuration: 45,
            description: "Enfoque en técnica",
            warmup: [],
            rounds: [],
            cooldown: []
          } as BoxingWorkout,
          notes: ""
        },
        martes: { day: "Martes", restDay: true, notes: "" },
        miércoles: { day: "Miércoles", restDay: true, notes: "" },
        jueves: { day: "Jueves", restDay: true, notes: "" },
        viernes: { day: "Viernes", restDay: true, notes: "" },
        sábado: { day: "Sábado", restDay: true, notes: "" },
        domingo: { day: "Domingo", restDay: true, notes: "" },
      }
    };
  }
}
