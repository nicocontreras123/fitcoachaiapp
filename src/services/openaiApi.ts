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
               "name": "COMBINACIÓN RÁPIDA 1-1-2",
               "duration": 30,
               "description": "Golpea jab izquierdo, jab izquierdo, cross derecho. Repite 10 veces rápido"
             },
             {
               "name": "POTENCIA 2-3-2",
               "duration": 30,
               "description": "Cross derecho, hook izquierdo, cross derecho. Máxima potencia, 8 repeticiones"
             },
             {
               "name": "VELOCIDAD PURA",
               "duration": 20,
               "description": "Jabs continuos lo más rápido posible durante 20 segundos"
             },
             {
               "name": "BURPEES EXPLOSIVOS",
               "duration": 30,
               "description": "Haz 5 burpees con máxima explosividad"
             },
             {
               "name": "COMBINACIÓN AVANZADA 1-2-3-2",
               "duration": 40,
               "description": "Jab, cross, hook, cross. Repite 12 veces con buena técnica"
             },
             {
               "name": "DEFENSA Y CONTRAATAQUE",
               "duration": 30,
               "description": "Slip derecha + cross, slip izquierda + hook. Alterna 10 veces"
             }
           ]
         }
       ] (mínimo 3 rounds con 4-6 ejercicios específicos por round),
       "warmup": [
         {"name": "Saltos de cuerda", "duration": 180, "description": "3 minutos continuos a ritmo moderado"},
         {"name": "Sombra ligera", "duration": 120, "description": "Movimiento y técnica básica sin golpear fuerte"},
         {"name": "Movilidad articular", "duration": 60, "description": "Círculos de brazos y rotaciones de cadera"}
       ], 
       "cooldown": [
         {"name": "Estiramiento de brazos", "duration": 60, "description": "Estira hombros, tríceps y bíceps"},
         {"name": "Estiramiento de piernas", "duration": 60, "description": "Cuádriceps, isquiotibiales y gemelos"},
         {"name": "Respiración profunda", "duration": 60, "description": "Recupera el ritmo cardíaco con respiraciones lentas"}
       ]
    }

    ⚠️ OBLIGATORIO PARA TODOS LOS ENTRENAMIENTOS:
    - SIEMPRE incluir "warmup" con 2-3 ejercicios (total 5-10 minutos)
    - SIEMPRE incluir "cooldown" con 2-3 ejercicios (total 5-10 minutos)
    - El warmup debe preparar específicamente para el tipo de entrenamiento
    - El cooldown debe incluir estiramientos específicos para los músculos trabajados

    IMPORTANTE PARA BOXEO:
    - Cada ejercicio debe ser MUY ESPECÍFICO con números exactos (ej: "Repite 10 veces", "Haz 5 burpees", "Durante 20 segundos")
    - Usa nomenclatura de boxeo: 1=Jab, 2=Cross, 3=Hook, 4=Uppercut
    - Incluye combinaciones variadas: 1-1-2, 1-2-3, 2-3-2, 1-2-3-2, etc.
    - Mezcla ejercicios de golpeo con ejercicios físicos (burpees, sentadillas, flexiones)
    - Cada round debe tener 4-6 ejercicios específicos
    - La duración de cada ejercicio debe sumar aproximadamente el workTime del round
    - Incluye ejercicios de defensa (slip, roll, duck) con contraataques
    - Varía la intensidad: velocidad, potencia, técnica, resistencia

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
         { "name": "Sentadillas", "sets": 3, "reps": 12, "weight": "Moderado", "description": "Baja hasta 90 grados, sube explosivo" },
         { "name": "Press de banca", "sets": 4, "reps": 10, "weight": "Moderado-Alto", "description": "Controla la bajada, empuje explosivo" }
       ],
       "warmup": [
         {"name": "Cardio ligero", "duration": 300, "description": "5 minutos de trote o bicicleta estática"},
         {"name": "Movilidad dinámica", "duration": 180, "description": "Círculos de brazos, rotaciones de cadera, estocadas caminando"}
       ], 
       "cooldown": [
         {"name": "Estiramiento completo", "duration": 180, "description": "Estira todos los grupos musculares trabajados"},
         {"name": "Foam roller", "duration": 120, "description": "Libera tensión muscular con rodillo"}
       ]
    }
    
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

    const userPrompt = `Usuario: ${userProfile?.age} años, ${userProfile?.weight}kg.\n    Deportes: ${userProfile?.deportes?.join(', ') || sport}.\n    Objetivos: ${goals}.\n    Días de entrenamiento esta semana: ${availableDays?.join(', ') || 'Todos'}.\n    Días por semana objetivo: ${userProfile?.trainingDaysPerWeek || availableDays?.length || 3}.\n    Equipamiento disponible: ${equipmentList}.\n    \n    ⚠️ OBLIGATORIO - EQUIPAMIENTO:\n    - USA SOLO el equipamiento disponible: ${equipmentList}\n    - Si tiene trotadora, úsala para cardio y warmup\n    - Si tiene saco de boxeo, úsalo en entrenamientos de boxeo\n    - Si tiene pesas, inclúyelas en ejercicios de fuerza\n    - Si NO tiene equipamiento, usa solo ejercicios de peso corporal\n    - NUNCA sugieras equipamiento que el usuario NO tiene\n    \n    IMPORTANTE: \n    - Solo genera entrenamientos para estos días: ${availableDays?.join(', ')}\n    - Los demás días márcalos como \"restDay\": true\n    - Distribuye ${userProfile?.trainingDaysPerWeek || availableDays?.length} entrenamientos en los días disponibles\n    - Si hay múltiples deportes, alterna entre ellos\n    \n    Genera una rutina equilibrada y variada.`;

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
