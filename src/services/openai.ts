import { ENV, isApiConfigured } from '@/config/env';
import {
  BoxingWorkout,
  RunningWorkout,
  GenerateWorkoutParams,
  Workout,
} from '@/features/workouts/types';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIService {
  private static async makeRequest(messages: OpenAIMessage[]): Promise<string> {
    if (!isApiConfigured()) {
      throw new Error(
        'OpenAI API key no configurada. Por favor configura OPENAI_API_KEY en app.json o .env.local'
      );
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
        const errorData = (await response.json()) as { error?: { message?: string } };
        throw new Error(
          `OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
        );
      }

      const data = (await response.json()) as OpenAIResponse;

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No se recibió respuesta de OpenAI');
      }

      return data.choices[0].message.content;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error al llamar a OpenAI API: ${error.message}`);
      }
      throw new Error('Error desconocido al llamar a OpenAI API');
    }
  }

  private static getBoxingPrompt(params: GenerateWorkoutParams): OpenAIMessage[] {
    const { level, duration = 30, goals, userProfile } = params;

    const systemPrompt = `Eres un entrenador profesional de boxeo con años de experiencia. Tu tarea es generar rutinas de boxeo personalizadas en formato JSON.

IMPORTANTE: Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto adicional antes o después.

El JSON debe seguir EXACTAMENTE esta estructura:
{
  "title": "string",
  "description": "string",
  "totalDuration": number (en minutos),
  "difficulty": "beginner" | "intermediate" | "advanced",
  "warmup": [
    {
      "name": "string",
      "duration": number (en segundos),
      "description": "string",
      "technique": "string (opcional)"
    }
  ],
  "rounds": [
    {
      "roundNumber": number,
      "workTime": number (en segundos),
      "restTime": number (en segundos),
      "exercises": [
        {
          "name": "string",
          "duration": number (en segundos),
          "description": "string",
          "technique": "string (opcional)"
        }
      ]
    }
  ],
  "cooldown": [
    {
      "name": "string",
      "duration": number (en segundos),
      "description": "string"
    }
  ],
  "equipment": ["string"],
  "tips": ["string"]
}`;

    const userPrompt = `Genera una rutina de boxeo personalizada con las siguientes características:

**Nivel:** ${level === 'beginner' ? 'Principiante' : level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
**Duración deseada:** ${duration} minutos
${goals ? `**Objetivos:** ${goals}` : ''}
${
  userProfile
    ? `**Perfil del usuario:**
- Nombre: ${userProfile.name}
- Edad: ${userProfile.age} años
- Peso: ${userProfile.weight} kg
- Altura: ${userProfile.height} cm`
    : ''
}

**Requisitos:**
1. Incluye un calentamiento apropiado (5-7 minutos)
2. Crea entre 3-6 rounds dependiendo del nivel
3. Cada round debe tener trabajo activo y descanso
4. Incluye combinaciones de golpes, footwork, defensa y técnica
5. Añade un cooldown para estiramientos (5 minutos)
6. Los ejercicios deben ser específicos y detallados
7. Ajusta la intensidad según el nivel

Responde SOLO con el JSON, sin markdown ni texto adicional.`;

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];
  }

  private static getRunningPrompt(params: GenerateWorkoutParams): OpenAIMessage[] {
    const { level, duration = 30, goals, userProfile } = params;

    const systemPrompt = `Eres un entrenador profesional de running con certificación internacional. Tu tarea es generar rutinas de running personalizadas en formato JSON.

IMPORTANTE: Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto adicional antes o después.

El JSON debe seguir EXACTAMENTE esta estructura:
{
  "title": "string",
  "description": "string",
  "totalDistance": number (en km),
  "totalDuration": number (en minutos),
  "difficulty": "beginner" | "intermediate" | "advanced",
  "intervals": [
    {
      "type": "warm-up" | "run" | "sprint" | "recovery" | "cool-down",
      "duration": number (en minutos),
      "pace": "string (ej: 5:30 min/km)",
      "description": "string"
    }
  ],
  "targetPace": "string (pace promedio objetivo)",
  "tips": ["string"]
}`;

    const userPrompt = `Genera una rutina de running personalizada con las siguientes características:

**Nivel:** ${level === 'beginner' ? 'Principiante' : level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
**Duración deseada:** ${duration} minutos
${goals ? `**Objetivos:** ${goals}` : ''}
${
  userProfile
    ? `**Perfil del usuario:**
- Nombre: ${userProfile.name}
- Edad: ${userProfile.age} años
- Peso: ${userProfile.weight} kg
- Altura: ${userProfile.height} cm`
    : ''
}

**Requisitos:**
1. Incluye warm-up (5-10 minutos de trote suave)
2. Crea intervalos variados según el nivel
3. Para principiantes: enfócate en resistencia, ritmo constante
4. Para intermedios: incluye cambios de ritmo
5. Para avanzados: incluye intervalos de velocidad/sprints
6. Incluye cool-down (5-10 minutos de trote suave)
7. Especifica paces realistas según el nivel
8. Calcula la distancia total aproximada

Responde SOLO con el JSON, sin markdown ni texto adicional.`;

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];
  }

  static async generateWorkout(params: GenerateWorkoutParams): Promise<Workout> {
    try {
      const messages =
        params.sport === 'boxing' ? this.getBoxingPrompt(params) : this.getRunningPrompt(params);

      const responseText = await this.makeRequest(messages);

      // Limpiar la respuesta de posibles markdown o texto extra
      let cleanedResponse = responseText.trim();

      // Remover markdown code blocks si existen
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\s*/g, '').replace(/```\s*$/g, '');
      }

      const workout = JSON.parse(cleanedResponse);

      // Validar que el workout tenga la estructura esperada
      if (params.sport === 'boxing') {
        if (!workout.warmup || !workout.rounds || !workout.cooldown) {
          throw new Error('Respuesta de OpenAI con formato inválido para rutina de boxeo');
        }
        return workout as BoxingWorkout;
      } else {
        if (!workout.intervals || !workout.targetPace) {
          throw new Error('Respuesta de OpenAI con formato inválido para rutina de running');
        }
        return workout as RunningWorkout;
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error generando rutina: ${error.message}`);
      }
      throw new Error('Error desconocido generando rutina');
    }
  }

  static getMockWorkout(params: GenerateWorkoutParams): Workout {
    if (params.sport === 'boxing') {
      return {
        title: 'Rutina de Boxeo - Demo',
        description: 'Rutina de ejemplo para testing sin API key',
        totalDuration: 30,
        difficulty: params.level,
        warmup: [
          {
            name: 'Saltar la cuerda',
            duration: 180,
            description: 'Calentamiento cardiovascular',
          },
          {
            name: 'Sombra de boxeo',
            duration: 120,
            description: 'Movimientos básicos sin saco',
          },
        ],
        rounds: [
          {
            roundNumber: 1,
            workTime: 180,
            restTime: 60,
            exercises: [
              {
                name: 'Jab-Cross',
                duration: 60,
                description: 'Combinación básica 1-2',
                technique: 'Mantén la guardia alta',
              },
              {
                name: 'Footwork lateral',
                duration: 120,
                description: 'Movimiento lateral con pivote',
              },
            ],
          },
        ],
        cooldown: [
          {
            name: 'Estiramientos',
            duration: 300,
            description: 'Estiramientos completos del cuerpo',
          },
        ],
        equipment: ['Guantes', 'Saco'],
        tips: ['Mantén la guardia alta', 'Respira correctamente'],
      } as BoxingWorkout;
    } else {
      return {
        title: 'Rutina de Running - Demo',
        description: 'Rutina de ejemplo para testing sin API key',
        totalDistance: 5,
        totalDuration: 30,
        difficulty: params.level,
        intervals: [
          {
            type: 'warm-up',
            duration: 5,
            pace: '7:00 min/km',
            description: 'Trote suave de calentamiento',
          },
          {
            type: 'run',
            duration: 20,
            pace: '6:00 min/km',
            description: 'Ritmo constante moderado',
          },
          {
            type: 'cool-down',
            duration: 5,
            pace: '7:30 min/km',
            description: 'Trote suave para enfriar',
          },
        ],
        targetPace: '6:00 min/km',
        tips: ['Mantén una respiración constante', 'Hidrata antes y después'],
      } as RunningWorkout;
    }
  }
}
