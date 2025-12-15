import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TimerBoxeoNew } from '@/features/tracking/components/TimerBoxeoNew';
import { TimerGymNew } from '@/features/tracking/components/TimerGymNew';
import { RunningTrackerNew } from '@/features/workouts/components/RunningTrackerNew';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useWorkoutStore } from '@/features/workouts/store/useWorkoutStore';

export default function TrackingPage() {
  const { currentWorkout } = useWorkoutStore();
  const router = useRouter();
  const [elapsedTime, setElapsedTime] = useState(0);

  // Determinar el tipo de workout actual
  const workoutTypeRaw = currentWorkout && 'type' in currentWorkout ? (currentWorkout as any).type : 'boxing';
  const isBoxing = workoutTypeRaw === 'boxing';
  const isGym = workoutTypeRaw === 'gym' || workoutTypeRaw === 'functional';
  const isRunning = workoutTypeRaw === 'running';

  // Si es boxeo, mostrar solo el timer en pantalla completa
  if (isBoxing && currentWorkout) {
    return (
      <TimerBoxeoNew
        workout={currentWorkout as any}
        onTimeUpdate={setElapsedTime}
        onComplete={() => router.back()}
      />
    );
  }

  // Si es gym, mostrar solo el timer en pantalla completa
  if (isGym && currentWorkout) {
    return (
      <TimerGymNew
        workout={currentWorkout as any}
        onTimeUpdate={setElapsedTime}
        onComplete={() => router.back()}
      />
    );
  }

  // Si es running, mostrar solo el tracker en pantalla completa
  if (isRunning) {
    return (
      <RunningTrackerNew
        targetDistance={5}
        onTimeUpdate={setElapsedTime}
      />
    );
  }

  // Fallback: mostrar mensaje de no workout
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.noWorkout}>
        <MaterialCommunityIcons name="dumbbell" size={64} color="#6b7280" />
        <Text style={styles.noWorkoutText}>No hay entrenamiento seleccionado</Text>
        <Button mode="contained" onPress={() => router.back()}>
          Volver
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102216',
  },
  noWorkout: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  noWorkoutText: {
    fontSize: 18,
    fontFamily: 'Lexend_600SemiBold',
    color: '#fff',
    textAlign: 'center',
  },
});
