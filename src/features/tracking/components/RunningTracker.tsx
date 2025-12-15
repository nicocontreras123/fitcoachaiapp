import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useGpsTracker } from '../hooks/useGpsTracker';
import { TimerRunning } from './TimerRunning';
import { RunningInterval } from '../hooks/useRunningIntervalTimer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, Button, Surface, ProgressBar } from 'react-native-paper';

import { useWorkoutStore } from '@/features/workouts/store/useWorkoutStore';

interface RunningTrackerProps {
    targetDistance?: number; // km
    onTimeUpdate?: (elapsedTime: number) => void;
}

export const RunningTracker: React.FC<RunningTrackerProps> = ({ targetDistance: propTarget, onTimeUpdate }) => {
    const { currentWorkout } = useWorkoutStore();

    // Check if workout has intervals defined and is not empty
    const workoutIntervals = currentWorkout && 'intervals' in currentWorkout ? (currentWorkout as any).intervals : null;
    const hasIntervals = Array.isArray(workoutIntervals) && workoutIntervals.length > 0;

    // If workout has intervals, use interval timer instead of GPS tracker
    if (hasIntervals) {
        const intervals: RunningInterval[] = workoutIntervals.map((interval: any) => {
            // Duration in the type is in minutes, but our timer needs seconds
            const durationInSeconds = interval.duration * 60;

            return {
                type: interval.type || 'run',
                duration: durationInSeconds,
                pace: interval.pace || interval.targetPace || '5:30 min/km',
                description: interval.description || `Intervalo de ${interval.type}`
            };
        });

        return <TimerRunning intervals={intervals} onTimeUpdate={onTimeUpdate} />;
    }

    // Otherwise, use GPS-based distance tracker
    // Determine target from workout if active (assuming running workout has distance)
    // If not, fall back to prop or default 5km
    const workoutTarget = currentWorkout && 'distance' in currentWorkout ? (currentWorkout as any).distance : undefined;
    const targetDistance = workoutTarget || propTarget || 5;

    const { distance, isTracking, startTracking, stopTracking, errorMsg } = useGpsTracker();

    // Alert every km logic placeholder
    useEffect(() => {
        // ... logic
    }, [distance]);

    const progress = Math.min((distance / targetDistance), 1);

    return (
        <Surface style={styles.container} elevation={2}>
            {errorMsg && <Text style={{ color: '#ef4444', marginBottom: 8 }}>{errorMsg}</Text>}

            <View style={{ marginBottom: 16 }}>
                <ProgressBar progress={progress} color="#4ade80" style={{ height: 12, borderRadius: 6, backgroundColor: 'rgba(74, 222, 128, 0.2)' }} />
            </View>

            <View style={styles.statsRow}>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#4ade80' }}>
                    {distance.toFixed(2)}<Text style={{ fontSize: 18, color: 'rgba(74, 222, 128, 0.7)' }}>km</Text>
                    <Text style={{ color: '#6b7280', fontSize: 18 }}> / {targetDistance}km</Text>
                </Text>
            </View>

            <Text style={{ color: '#86efac', fontStyle: 'italic', marginBottom: 24, textAlign: 'center' }}>
                {distance > 0 ? "¡Gran ritmo! Sigue así." : "Listo para correr"}
            </Text>

            <View style={styles.actions}>
                {!isTracking ? (
                    <Button
                        mode="contained"
                        onPress={startTracking}
                        icon="run"
                        contentStyle={{ height: 56 }}
                        style={{ backgroundColor: '#16a34a', borderRadius: 28 }}
                        labelStyle={{ fontSize: 18, fontWeight: 'bold' }}
                    >
                        Iniciar Carrera
                    </Button>
                ) : (
                    <Button
                        mode="contained"
                        onPress={stopTracking}
                        icon="stop"
                        contentStyle={{ height: 56 }}
                        style={{ backgroundColor: '#dc2626', borderRadius: 28 }}
                        labelStyle={{ fontSize: 18, fontWeight: 'bold' }}
                    >
                        Detener
                    </Button>
                )}
            </View>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 24,
        borderRadius: 24,
        backgroundColor: '#111827', // dark gray
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    actions: {
        justifyContent: 'center',
        paddingHorizontal: 20,
    }
});
