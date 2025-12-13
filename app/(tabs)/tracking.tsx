import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TimerBoxeo } from '@/features/tracking/components/TimerBoxeo';
import { TimerGym } from '@/features/tracking/components/TimerGym';
import { RunningTracker } from '@/features/tracking/components/RunningTracker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { formatTime } from '@/utils/timeUtils';

import { useWorkoutStore } from '@/features/workouts/store/useWorkoutStore';

export default function TrackingPage() {
  const { currentWorkout } = useWorkoutStore();

  // 🔍 LOG: Ver tipo de workout
  console.log('📍 TRACKING SCREEN - Workout type:', (currentWorkout as any)?.type);
  console.log('📍 TRACKING SCREEN - Workout title:', currentWorkout?.title);

  // Determinar el tipo de workout actual
  const workoutTypeRaw = currentWorkout && 'type' in currentWorkout ? (currentWorkout as any).type : 'boxing';

  // Mapear tipos: boxing, gym/functional → usar timer de boxeo; running → usar running tracker
  const isBoxing = workoutTypeRaw === 'boxing';
  const isGym = workoutTypeRaw === 'gym' || workoutTypeRaw === 'functional';
  const isRunning = workoutTypeRaw === 'running';

  const accentColor = isBoxing ? '#ef4444' : isGym ? '#8b5cf6' : '#10b981';

  // Obtener el título del workout actual
  const workoutTitle = currentWorkout?.title ||
    (isBoxing ? 'Entrenamiento de Boxeo' :
      isGym ? 'Entrenamiento Funcional' :
        'Entrenamiento de Running');

  // Obtener instrucciones dinámicas
  let dynamicInstructions: string[] = [];

  if (isBoxing) {
    // Para boxeo: mostrar ejercicios del primer round
    const firstRound = currentWorkout && 'rounds' in currentWorkout ? (currentWorkout as any).rounds?.[0] : null;
    dynamicInstructions = firstRound?.exercises?.slice(0, 3).map((ex: any) => ex.name) || [
      'Sigue las instrucciones de voz',
      'Nomenclatura: 1=Jab, 2=Cross, 3=Hook, 4=Uppercut',
      'Cada ejercicio tiene su tiempo específico'
    ];
  } else if (isGym) {
    // Para gym: mostrar primeros 3 ejercicios
    const exercises = (currentWorkout as any)?.exercises || [];
    dynamicInstructions = exercises.slice(0, 3).map((ex: any) =>
      `${ex.name} - ${ex.sets} series x ${ex.reps} reps`
    );
    if (dynamicInstructions.length === 0) {
      dynamicInstructions = ['Sigue la rutina de ejercicios', 'Controla la técnica', 'Descansa entre series'];
    }
  }

  // Usar el tiempo total que ya viene del workout (en minutos), convertir a segundos
  const totalWorkoutTime = useMemo(() => {
    if (!currentWorkout) return 0;

    // El totalDuration viene en minutos desde la API
    const totalDurationMinutes = (currentWorkout as any)?.totalDuration || 0;

    // Convertir a segundos
    return totalDurationMinutes * 60;
  }, [currentWorkout]);

  // Estado para tiempo transcurrido (se actualizará desde los timers)
  const [elapsedTime, setElapsedTime] = useState(0);
  const remainingTime = Math.max(0, totalWorkoutTime - elapsedTime);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
      {/* Header Combinado */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.titleAccentCompact, { backgroundColor: accentColor }]} />
          <Text variant="headlineSmall" style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {workoutTitle}
          </Text>
        </View>
        <View style={styles.headerDivider} />
      </View>

      {/* Indicador de tiempo total - COMPACTO Y CENTRADO */}
      {totalWorkoutTime > 0 && (
        <View style={styles.totalTimeContainer}>
          <View style={styles.totalTimeCard}>
            <Text style={styles.totalTimeValue}>{formatTime(remainingTime)}</Text>
            <Text style={styles.totalTimeLabel}>Tiempo restante</Text>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {/* Título eliminado porque ya está en el header */}

        {/* Mostrar timer según tipo de workout */}
        {isRunning ? (
          <RunningTracker targetDistance={5} />
        ) : isBoxing ? (
          <View>
            <TimerBoxeo onTimeUpdate={setElapsedTime} />
            <View style={styles.instructions}>
              <View style={styles.instructionsHeader}>
                <MaterialCommunityIcons name="information" size={20} color="#ef4444" />
                <Text style={styles.instructionsTitle}>EJERCICIOS DEL ROUND 1</Text>
              </View>
              <View style={styles.instructionsList}>
                {dynamicInstructions.map((instruction: string, index: number) => (
                  <Text key={index} style={styles.instructionItem}>
                    → {instruction}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        ) : isGym ? (
          <TimerGym onTimeUpdate={setElapsedTime} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 14,
  },
  headerDivider: {
    height: 3,
    backgroundColor: '#27272a',
    marginTop: 8,
    borderRadius: 2,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  workoutTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  titleAccentCompact: {
    width: 3,
    height: 18,
    borderRadius: 2,
  },
  instructions: {
    marginTop: 40,
    backgroundColor: '#18181b',
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionsTitle: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1.5,
    marginLeft: 8,
  },
  instructionsList: {
    gap: 10,
  },
  instructionItem: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  totalTimeContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  totalTimeCard: {
    // Eliminado fondo, bordes y sombras para ser minimalista
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  totalTimeValue: {
    fontSize: 16, // Mucho más pequeño
    color: '#ffffff',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  totalTimeLabel: {
    fontSize: 8, // Muy pequeño
    color: '#71717a', // Zinc-500 (más sutil)
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 1,
    letterSpacing: 0.5,
  },
});
