import { ENV, isApiConfigured } from '@/config/env';
import {
  GenerateWorkoutParams,
  Workout,
  WeeklyRoutine,
  GymWorkout,
  BoxingWorkout,
  RunningWorkout,
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

export class OpenAIService {
  private static async makeRequest(messages: OpenAIMessage[]): Promise<string> {
    if (!isApiConfigured()) {
      // Return mock data if no key - to be implemented or throw
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

    // Construct prompt
    const systemPrompt = `Eres un entrenador personal elite experto en ${sport === 'mixed' ? 'boxeo, running y gimnasio' : sport}.
    Genera un plan de entrenamiento semanal completo en formato JSON estricto.
    
    Estructura JSON requerida:
    {
      "weekStarting": "YYYY-MM-DD",
      "goal": "Resumen del objetivo semanal",
      "days": {
        "lunes": { "day": "Lunes", "restDay": boolean, "workout": WORKOUT_OBJECT | null, "notes": "string" },
        "martes": ... (hasta domingo)
      }
    }
    
    WORKOUT_OBJECT debe tener esta estructura según el tipo (elige el más adecuado para el día):
    
    1. Boxeo:
    {
       "type": "boxing",
       "title": "Nombre atractivo",
       "description": "Descripción motivadora",
       "totalDuration": número (min),
       "difficulty": "beginner" | "intermediate" | "advanced",
       "rounds": [ 
         { 
           "roundNumber": 1, 
           "workTime": 180, 
           "restTime": 60, 
           "exercises": [
             {
               "name": "[COMBINACIÓN TIPO 1]",
               "duration": 30,
               "description": "[Descripción técnica específica con números exactos]"
             },
             {
               "name": "[COMBINACIÓN TIPO 2]",
               "duration": 30,
               "description": "[Descripción técnica específica con números exactos]"
             },
             {
               "name": "[EJERCICIO VELOCIDAD/POTENCIA]",
               "duration": 20,
               "description": "[Descripción específica con duración]"
             },
             {
               "name": "[EJERCICIO FÍSICO]",
               "duration": 30,
               "description": "[Descripción con repeticiones exactas]"
             },
             {
               "name": "[COMBINACIÓN AVANZADA]",
               "duration": 40,
               "description": "[Descripción técnica con repeticiones]"
             },
             {
               "name": "[DEFENSA + CONTRAATAQUE]",
               "duration": 30,
               "description": "[Descripción de movimiento defensivo y ofensivo]"
             }
           ]
         },
         { 
           "roundNumber": 2, 
           "workTime": 180, 
           "restTime": 60, 
           "exercises": [
             {"name": "[COMBINACIÓN DIFERENTE 1]", "duration": 30, "description": "[Nueva descripción]"},
             {"name": "[COMBINACIÓN DIFERENTE 2]", "duration": 30, "description": "[Nueva descripción]"},
             {"name": "[EJERCICIO FOOTWORK/MOVIMIENTO]", "duration": 30, "description": "[Descripción específica]"},
             {"name": "[EJERCICIO FÍSICO DIFERENTE]", "duration": 30, "description": "[Descripción con tiempo/reps]"},
             {"name": "[COMBINACIÓN VARIADA]", "duration": 30, "description": "[Descripción técnica]"},
             {"name": "[DEFENSA VARIADA]", "duration": 30, "description": "[Descripción de técnica defensiva]"}
           ]
         }
         // ... CONTINÚA generando rounds hasta completar el totalDuration
         // Ejemplo: Si totalDuration=50min, warmup=6min, cooldown=3min
         // → Debes generar aproximadamente 10 rounds (no solo 2 o 3)
         // CALCULA: (50-6-3)*60 / (180+60) = 2460/240 = ~10 rounds
         // ⚠️ IMPORTANTE: Cada round debe tener ejercicios DIFERENTES y VARIADOS
         // No repitas las mismas combinaciones en todos los rounds
       ],
       "warmup": [
         {"name": "[Ejercicio cardio]", "duration": 180, "description": "[Descripción específica]"},
         {"name": "[Ejercicio técnico]", "duration": 120, "description": "[Descripción específica]"},
         {"name": "[Ejercicio movilidad]", "duration": 60, "description": "[Descripción específica]"}
       ], 
       "cooldown": [
         {"name": "[Estiramiento grupo 1]", "duration": 60, "description": "[Descripción específica]"},
         {"name": "[Estiramiento grupo 2]", "duration": 60, "description": "[Descripción específica]"},
         {"name": "[Recuperación]", "duration": 60, "description": "[Descripción específica]"}
       ]
    }

    ⚠️ OBLIGATORIO PARA TODOS LOS ENTRENAMIENTOS:
    - SIEMPRE incluir "warmup" con 2-3 ejercicios (total 5-10 minutos)
    - SIEMPRE incluir "cooldown" con 2-3 ejercicios (total 5-10 minutos)
    - El warmup debe preparar específicamente para el tipo de entrenamiento
    - El cooldown debe incluir estiramientos específicos para los músculos trabajados
    - ⚠️ VARÍA LOS EJERCICIOS: NO uses siempre los mismos ejercicios de warmup/cooldown
    - Ejemplos warmup boxeo: saltos de cuerda, sombra, skipping, jumping jacks, movilidad articular, rotaciones
    - Ejemplos cooldown boxeo: estiramientos brazos/hombros/piernas, respiración, foam roller, yoga poses
    - SÉ CREATIVO y varía según el objetivo del día

    ⚠️ CRÍTICO PARA BOXEO - PROCESO DE GENERACIÓN:
    
    PASO 1: Decide cuántos rounds generar
    - Usa la GUÍA DE ROUNDS según duración objetivo:
      * Para 20-25 min → genera 3-4 rounds
      * Para 30-35 min → genera 5-7 rounds  
      * Para 40-50 min → genera 8-12 rounds
      * Para 50-60 min → genera 12-15 rounds
    
    PASO 2: Genera los rounds
    - Cada round: workTime 180s (3 min), restTime 60s (1 min)
    - Cada round: 4-6 ejercicios específicos (suma ~180s)
    - IMPORTANTE: Genera TODOS los rounds (ej: si decidiste 10 rounds, genera los 10)
    
    PASO 3: Calcula totalDuration EXACTO
    - Warmup total (suma duraciones): ej. 180+120+60 = 360s = 6 min
    - Rounds: (número_rounds × 3 min trabajo) + ((número_rounds-1) × 1 min descanso)
      Ejemplo con 10 rounds: (10 × 3) + (9 × 1) = 30 + 9 = 39 min
    - Cooldown total (suma duraciones): ej. 60+60+60 = 180s = 3 min
    - totalDuration = warmup + rounds + cooldown
      Ejemplo: 6 + 39 + 3 = 48 min
    
    ⚠️ VERIFICACIÓN OBLIGATORIA:
    - Si el usuario pide ~45-50 min y solo generas 2-3 rounds → ESTÁ MAL
    - Debes generar 8-12 rounds para llegar a 45-50 min
    - El totalDuration DEBE coincidir con la suma real de componentes
    - Cada round debe tener workTime entre 120-180 segundos (2-3 minutos)
    - Cada round debe tener restTime entre 30-60 segundos
    - CADA ROUND debe tener 4-6 ejercicios específicos diferentes
    - La suma de duraciones de ejercicios debe aproximarse al workTime del round
    
    IMPORTANTE PARA BOXEO:
    - Cada ejercicio debe ser MUY ESPECÍFICO con números exactos (ej: "Repite 10 veces", "Haz 5 burpees", "Durante 20 segundos")
    - Usa nomenclatura de boxeo: 1=Jab, 2=Cross, 3=Hook, 4=Uppercut
    - Incluye combinaciones variadas: 1-1-2, 1-2-3, 2-3-2, 1-2-3-2, etc.
    - Mezcla ejercicios de golpeo con ejercicios físicos (burpees, sentadillas, flexiones)
    - Incluye ejercicios de defensa (slip, roll, duck) con contraataques
    - Varía la intensidad entre rounds: velocidad, potencia, técnica, resistencia
    - VARÍA los ejercicios entre rounds para mantener el entrenamiento dinámico

    2. Running:
    {
       "type": "running",
       "title": "Nombre atractivo",
       "description": "Descripción del run",
       "totalDuration": número (min),
       "totalDistance": número (km),
       "difficulty": "beginner" | "intermediate" | "advanced",
       "intervals": [
         {
           "type": "warm-up",
           "duration": 5,
           "pace": "6:00 min/km",
           "description": "Trote suave de calentamiento"
         },
         {
           "type": "run",
           "duration": 10,
           "pace": "5:30 min/km",
           "description": "Ritmo constante moderado"
         },
         {
           "type": "sprint",
           "duration": 2,
           "pace": "4:30 min/km",
           "description": "¡A máxima velocidad!"
         },
         {
           "type": "recovery",
           "duration": 3,
           "pace": "6:30 min/km",
           "description": "Recuperación activa"
         },
         {
           "type": "cool-down",
           "duration": 5,
           "pace": "6:00 min/km",
           "description": "Enfriamiento final"
         }
       ],
       "targetPace": "5:30 min/km"
    }

    ⚠️ CRÍTICO PARA RUNNING - FORMATO DE INTERVALOS:
    - NUNCA uses formato work/rest/reps
    - SIEMPRE usa el formato exacto del ejemplo: {"type": "...", "duration": número, "pace": "...", "description": "..."}
    - SIEMPRE incluir al menos 3-5 intervalos secuenciales
    - OBLIGATORIO comenzar con type "warm-up" y terminar con type "cool-down"
    - Tipos válidos: "warm-up", "run", "sprint", "recovery", "cool-down"
    - duration está en MINUTOS (números enteros, ej: 5, 10, 2)
    - pace en formato "M:SS min/km" (ej: "5:30 min/km", "4:45 min/km")
    - description es texto descriptivo motivador
    - La suma de duraciones debe aproximarse al totalDuration
    - Ejemplo correcto: [{"type": "warm-up", "duration": 5, "pace": "6:00 min/km", "description": "Calentamiento suave"}]
    - Ejemplo INCORRECTO (NO uses): [{"work": 60, "rest": 120, "reps": 5}]
    
    3. Gym/Funcional:
    {
       "type": "gym",
       "title": "Nombre de rutina",
       "description": "Foco muscular",
       "totalDuration": número (min),
       "difficulty": "beginner" | "intermediate" | "advanced",
       "exercises": [ 
         { "name": "[Ejercicio 1]", "sets": 3, "reps": 12, "weight": "Moderado", "description": "[Técnica específica]" },
         { "name": "[Ejercicio 2]", "sets": 4, "reps": 10, "weight": "Moderado-Alto", "description": "[Técnica específica]" }
       ],
       "warmup": [
         {"name": "[Ejercicio cardio]", "duration": 300, "description": "[Descripción específica]"},
         {"name": "[Movilidad dinámica]", "duration": 180, "description": "[Descripción específica]"}
       ], 
       "cooldown": [
         {"name": "[Estiramiento]", "duration": 180, "description": "[Descripción específica]"},
         {"name": "[Recuperación]", "duration": 120, "description": "[Descripción específica]"}
       ]
    }
    
    ⚠️ CREATIVIDAD Y VARIACIÓN - MUY IMPORTANTE:
    - NUNCA copies exactamente los ejemplos mostrados arriba
    - Los ejercicios de warmup/cooldown deben VARIAR en cada rutina
    - Adapta los ejercicios al nivel del usuario, objetivos y equipamiento disponible
    - Sé creativo con nombres de combinaciones y descripciones motivadoras
    - Cada rutina debe sentirse única y personalizada
    
    IMPORTANTE: "workout" NO puede ser null si "restDay" es false. Asegura que todos los campos requeridos (title, description, totalDuration, difficulty, warmup, cooldown) estén presentes.`;

    // Mapear equipamiento a nombres legibles
    const equipmentMap: { [key: string]: string } = {
      'jump-rope': 'Cuerda para saltar',
      'punching-bag': 'Saco de boxeo',
      'treadmill': 'Trotadora/Caminadora',
      'dumbbells': 'Pesas/Mancuernas',
      'resistance-bands': 'Bandas elásticas',
      'pull-up-bar': 'Barra de dominadas',
      'kettlebells': 'Pesas rusas',
      'yoga-mat': 'Colchoneta/Mat',
      'none': 'Sin equipamiento'
    };

    const equipmentList = userProfile?.equipment?.map(eq => equipmentMap[eq] || eq).join(', ') || 'Sin equipamiento específico';

    // Map fitness level to Spanish
    const levelMap: { [key: string]: string } = {
      'beginner': 'Principiante',
      'intermediate': 'Intermedio',
      'advanced': 'Avanzado'
    };
    const userLevel = userProfile?.level ? levelMap[userProfile.level] : 'Intermedio';

    const userPrompt = `Usuario: ${userProfile?.age} años, ${userProfile?.weight}kg.
    Nivel de fitness: ${userLevel} (${userProfile?.level || 'intermediate'}).
    Deportes: ${userProfile?.deportes?.join(', ') || sport}.
    Objetivos: ${goals}.
    Días de entrenamiento esta semana: ${availableDays?.join(', ') || 'Todos'}.
    Días por semana objetivo: ${userProfile?.trainingDaysPerWeek || availableDays?.length || 3}.
    Equipamiento disponible: ${equipmentList}.
    
    ⚠️ OBLIGATORIO - NIVEL DEL USUARIO:
    - El usuario es ${userLevel} (${userProfile?.level || 'intermediate'})
    - AJUSTA la dificultad de TODOS los entrenamientos a su nivel:
      * Principiante: Ejercicios básicos, menos repeticiones, más descanso, técnica sobre intensidad
      * Intermedio: Ejercicios variados, volumen moderado, buena intensidad
      * Avanzado: Ejercicios complejos, alto volumen, alta intensidad, menos descanso
    - El campo "difficulty" de cada workout DEBE ser: "${userProfile?.level || 'intermediate'}"
    - Para boxeo (principiante): 3-5 rounds, workTime 120-150s, combinaciones simples
    - Para boxeo (intermedio): 6-10 rounds, workTime 150-180s, combinaciones variadas
    - Para boxeo (avanzado): 10-15 rounds, workTime 180s, combinaciones complejas
    
    ⚠️ OBLIGATORIO - EQUIPAMIENTO:
    - USA SOLO el equipamiento disponible: ${equipmentList}
    - Si tiene trotadora, úsala para cardio y warmup
    - Si tiene saco de boxeo, úsalo en entrenamientos de boxeo
    - Si tiene pesas, inclúyelas en ejercicios de fuerza
    - Si NO tiene equipamiento, usa solo ejercicios de peso corporal
    - NUNCA sugieras equipamiento que el usuario NO tiene
    
    IMPORTANTE: 
    - Solo genera entrenamientos para estos días: ${availableDays?.join(', ')}
    - Los demás días márcalos como "restDay": true
    - Distribuye ${userProfile?.trainingDaysPerWeek || availableDays?.length} entrenamientos en los días disponibles
    - Si hay múltiples deportes, alterna entre ellos
    
    ⚠️ CRÍTICO - DURACIÓN TOTAL:
    - El campo "totalDuration" de cada workout DEBE ser la suma EXACTA de:
      warmup + rounds + cooldown (en minutos)
    - Para boxeo: totalDuration = warmup + (rounds × workTime) + ((rounds-1) × restTime) + cooldown
    - NO inventes un totalDuration arbitrario, CALCULA basándote en los componentes reales
    - Ejemplo: Si generas 3 rounds de 3min + 1min descanso, warmup 5min, cooldown 3min:
      → totalDuration = 5 + (3×3) + (2×1) + 3 = 5 + 9 + 2 + 3 = 19 min (NO 50 min)
    
    ⚠️ PARA BOXEO - CANTIDAD DE ROUNDS:
    - Si el usuario entrena 3-4 días/semana → genera workouts de 40-50 min → 8-12 rounds
    - Si el usuario entrena 5-6 días/semana → genera workouts de 25-35 min → 5-7 rounds
    - NUNCA generes solo 2-3 rounds para un workout de 40-50 min
    - Ejemplo: Para 45 min total, genera 10 rounds (warmup 6min + 10 rounds×3min + 9 descansos×1min + cooldown 3min = 48min)
    
    Genera una rutina equilibrada y variada ADAPTADA AL NIVEL ${userLevel.toUpperCase()} del usuario.`;

    try {
      if (!isApiConfigured()) {

        return this.getMockWeeklyRoutine();
      }



      const content = await this.makeRequest([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);



      const routine = JSON.parse(content) as WeeklyRoutine;



      // Log running workouts specifically
      Object.entries(routine.days).forEach(([day, dayData]) => {
        if (dayData.workout && (dayData.workout as any).type === 'running') {
          console.log(`🏃 Running workout found on ${day}:`, {
            title: dayData.workout.title,
            intervals: (dayData.workout as any).intervals,
            intervalsCount: (dayData.workout as any).intervals?.length || 0
          });
        }
      });

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
            description: "Enfoque en técnica y footwork",
            warmup: [],
            rounds: [],
            cooldown: []
          } as BoxingWorkout
        },
        // ... other days
      }
    };
  }
}
