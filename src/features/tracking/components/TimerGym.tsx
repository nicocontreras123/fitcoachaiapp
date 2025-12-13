import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, IconButton, Surface, ProgressBar, Chip } from 'react-native-paper';
import { useWorkoutStore } from '@/features/workouts/store/useWorkoutStore';
import { useUserStore } from '@/features/profile/store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { MaterialCommunityIcons } from '@expo/vector-icons';


interface GymTimerProps {
    sessionId?: string;
    onTimeUpdate?: (elapsedTime: number) => void; // Callback para actualizar tiempo transcurrido
}

interface Exercise {
    name: string;
    sets: number;
    reps: number;
    weight: string;
    description: string;
}

interface WarmupCooldown {
    name: string;
    duration: number;
    description: string;
}

export const TimerGym: React.FC<GymTimerProps> = ({ sessionId = 'default', onTimeUpdate }) => {
    const { currentWorkout } = useWorkoutStore();
    const { userData } = useUserStore();

    // Extraer datos del workout
    const exercises = (currentWorkout as any)?.exercises || [];
    const warmup = (currentWorkout as any)?.warmup || [];
    const cooldown = (currentWorkout as any)?.cooldown || [];
    const workoutTitle = currentWorkout?.title || 'Entrenamiento Funcional';

    // Helper para hablar solo si está habilitado
    const speakIfEnabled = (text: string, options?: any) => {
        if (userData?.voiceEnabled !== false) {
            Speech.speak(text, options);
        }
    };

    // Estados
    const [phase, setPhase] = useState<'warmup' | 'workout' | 'cooldown' | 'finished'>('warmup');
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const [isResting, setIsResting] = useState(false);
    const [restTimeLeft, setRestTimeLeft] = useState(60); // 60 segundos de descanso por defecto
    const [completedSets, setCompletedSets] = useState<{ [key: number]: number }>({});

    const currentExercise: Exercise | null = phase === 'workout' && exercises[currentExerciseIndex]
        ? exercises[currentExerciseIndex]
        : null;

    // Timer de descanso
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isResting && restTimeLeft > 0) {
            interval = setInterval(() => {
                setRestTimeLeft(prev => {
                    if (prev <= 1) {
                        setIsResting(false);
                        speakIfEnabled('Descanso terminado, siguiente serie', { language: 'es-ES' });
                        return 60;
                    }

                    // Cuenta regresiva en los últimos 3 segundos
                    if (prev <= 3) {
                        speakIfEnabled(prev.toString(), {
                            language: 'es-ES',
                            pitch: 1.2,
                            rate: 0.8
                        });
                    }

                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isResting, restTimeLeft]);

    // Anunciar ejercicio actual
    useEffect(() => {
        if (phase === 'workout' && currentExercise && !isResting) {
            const announcement = `${currentExercise.name}, serie ${currentSet} de ${currentExercise.sets}, ${currentExercise.reps} repeticiones`;
            speakIfEnabled(announcement, { language: 'es-ES' });
        }
    }, [currentExerciseIndex, currentSet, phase]);

    const handleCompleteSet = () => {
        if (!currentExercise) return;

        const exerciseKey = currentExerciseIndex;
        const newCompletedSets = { ...completedSets };
        newCompletedSets[exerciseKey] = (newCompletedSets[exerciseKey] || 0) + 1;
        setCompletedSets(newCompletedSets);

        if (currentSet < currentExercise.sets) {
            // Más series por hacer
            setCurrentSet(prev => prev + 1);
            setIsResting(true);
            setRestTimeLeft(60);
            speakIfEnabled('Serie completada, descansa', { language: 'es-ES' });
        } else {
            // Ejercicio completado, pasar al siguiente
            if (currentExerciseIndex < exercises.length - 1) {
                setCurrentExerciseIndex(prev => prev + 1);
                setCurrentSet(1);
                speakIfEnabled('Ejercicio completado, siguiente ejercicio', { language: 'es-ES' });
            } else {
                // Todos los ejercicios completados
                setPhase('cooldown');
                speakIfEnabled('Entrenamiento completado, comienza el enfriamiento', { language: 'es-ES' });
            }
        }
    };

    const handleSkipRest = () => {
        setIsResting(false);
        setRestTimeLeft(60);
    };

    const handleStartWorkout = () => {
        setPhase('workout');
        speakIfEnabled('Comienza el entrenamiento', { language: 'es-ES' });
    };

    const handleFinish = () => {
        setPhase('finished');
        speakIfEnabled('Entrenamiento finalizado, excelente trabajo', { language: 'es-ES' });
    };

    // Renderizar fase de calentamiento
    if (phase === 'warmup') {
        return (
            <Surface style={styles.container} elevation={3}>
                <LinearGradient
                    colors={['#8b5cf6', '#6d28d9']}
                    style={styles.headerGradient}
                >
                    <MaterialCommunityIcons name="fire" size={32} color="#ffffff" />
                    <Text variant="headlineSmall" style={styles.phaseTitle}>
                        CALENTAMIENTO
                    </Text>
                </LinearGradient>

                <ScrollView style={styles.content}>
                    {warmup.map((item: WarmupCooldown, index: number) => (
                        <Surface key={index} style={styles.exerciseCard} elevation={1}>
                            <View style={styles.exerciseHeader}>
                                <Text variant="titleMedium" style={styles.exerciseName}>
                                    {item.name}
                                </Text>
                                <Chip icon="clock-outline" style={styles.durationChip}>
                                    {item.duration} min
                                </Chip>
                            </View>
                            <Text variant="bodyMedium" style={styles.exerciseDescription}>
                                {item.description}
                            </Text>
                        </Surface>
                    ))}
                </ScrollView>

                <View style={styles.controls}>
                    <IconButton
                        icon="play"
                        iconColor="#ffffff"
                        size={48}
                        onPress={handleStartWorkout}
                        style={[styles.controlBtn, { backgroundColor: '#8b5cf6' }]}
                    />
                </View>
            </Surface>
        );
    }

    // Renderizar fase de enfriamiento
    if (phase === 'cooldown') {
        return (
            <Surface style={styles.container} elevation={3}>
                <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.headerGradient}
                >
                    <MaterialCommunityIcons name="yoga" size={32} color="#ffffff" />
                    <Text variant="headlineSmall" style={styles.phaseTitle}>
                        ENFRIAMIENTO
                    </Text>
                </LinearGradient>

                <ScrollView style={styles.content}>
                    {cooldown.map((item: WarmupCooldown, index: number) => (
                        <Surface key={index} style={styles.exerciseCard} elevation={1}>
                            <View style={styles.exerciseHeader}>
                                <Text variant="titleMedium" style={styles.exerciseName}>
                                    {item.name}
                                </Text>
                                <Chip icon="clock-outline" style={styles.durationChip}>
                                    {item.duration} min
                                </Chip>
                            </View>
                            <Text variant="bodyMedium" style={styles.exerciseDescription}>
                                {item.description}
                            </Text>
                        </Surface>
                    ))}
                </ScrollView>

                <View style={styles.controls}>
                    <IconButton
                        icon="check"
                        iconColor="#ffffff"
                        size={48}
                        onPress={handleFinish}
                        style={[styles.controlBtn, { backgroundColor: '#10b981' }]}
                    />
                </View>
            </Surface>
        );
    }

    // Renderizar fase finalizada
    if (phase === 'finished') {
        return (
            <Surface style={styles.container} elevation={3}>
                <View style={styles.finishedContainer}>
                    <MaterialCommunityIcons name="trophy" size={80} color="#fbbf24" />
                    <Text variant="headlineMedium" style={styles.finishedTitle}>
                        ¡Entrenamiento Completado!
                    </Text>
                    <Text variant="bodyLarge" style={styles.finishedSubtitle}>
                        Excelente trabajo 💪
                    </Text>
                </View>
            </Surface>
        );
    }

    // Renderizar fase de entrenamiento
    if (!currentExercise) {
        return (
            <Surface style={styles.container} elevation={3}>
                <Text style={styles.errorText}>No hay ejercicios disponibles</Text>
            </Surface>
        );
    }

    return (
        <Surface style={styles.container} elevation={3}>
            {/* Header con progreso */}
            <LinearGradient
                colors={['#8b5cf6', '#6d28d9']}
                style={styles.headerGradient}
            >
                <Text variant="titleMedium" style={styles.workoutTitle}>
                    {workoutTitle}
                </Text>
                <Text variant="bodySmall" style={styles.progressText}>
                    Ejercicio {currentExerciseIndex + 1} de {exercises.length}
                </Text>
                <ProgressBar
                    progress={(currentExerciseIndex + 1) / exercises.length}
                    color="#ffffff"
                    style={styles.progressBar}
                />
            </LinearGradient>

            {/* Ejercicio actual */}
            <View style={styles.currentExerciseContainer}>
                <Text variant="headlineMedium" style={styles.currentExerciseName}>
                    {currentExercise.name}
                </Text>

                <View style={styles.setsInfo}>
                    <View style={styles.setCard}>
                        <Text variant="displaySmall" style={styles.setNumber}>
                            {currentSet}
                        </Text>
                        <Text variant="bodySmall" style={styles.setLabel}>
                            Serie Actual
                        </Text>
                    </View>

                    <Text variant="displaySmall" style={styles.separator}>/</Text>

                    <View style={styles.setCard}>
                        <Text variant="displaySmall" style={styles.totalSets}>
                            {currentExercise.sets}
                        </Text>
                        <Text variant="bodySmall" style={styles.setLabel}>
                            Total Series
                        </Text>
                    </View>
                </View>

                <View style={styles.repsContainer}>
                    <MaterialCommunityIcons name="repeat" size={32} color="#8b5cf6" />
                    <Text variant="headlineSmall" style={styles.repsText}>
                        {currentExercise.reps} repeticiones
                    </Text>
                </View>

                <View style={styles.weightContainer}>
                    <MaterialCommunityIcons name="weight-kilogram" size={24} color="#6b7280" />
                    <Text variant="titleMedium" style={styles.weightText}>
                        Peso: {currentExercise.weight}
                    </Text>
                </View>

                <Surface style={styles.descriptionCard} elevation={1}>
                    <Text variant="bodyMedium" style={styles.description}>
                        💡 {currentExercise.description}
                    </Text>
                </Surface>
            </View>

            {/* Descanso o Controles */}
            {isResting ? (
                <View style={styles.restContainer}>
                    <Text variant="headlineSmall" style={styles.restTitle}>
                        DESCANSO
                    </Text>
                    <Text variant="displayLarge" style={styles.restTimer}>
                        {restTimeLeft}
                    </Text>
                    <Text variant="bodyMedium" style={styles.restSubtitle}>
                        segundos
                    </Text>
                    <IconButton
                        icon="skip-next"
                        iconColor="#ffffff"
                        size={32}
                        onPress={handleSkipRest}
                        style={[styles.controlBtn, { backgroundColor: '#8b5cf6' }]}
                    />
                </View>
            ) : (
                <View style={styles.controls}>
                    <IconButton
                        icon="check-circle"
                        iconColor="#ffffff"
                        size={56}
                        onPress={handleCompleteSet}
                        style={[styles.controlBtn, styles.completeBtn]}
                    />
                    <Text variant="bodySmall" style={styles.completeText}>
                        Completar Serie
                    </Text>
                </View>
            )}

            {/* Lista de ejercicios restantes */}
            <ScrollView style={styles.exercisesList}>
                {exercises.map((ex: Exercise, index: number) => {
                    const isCompleted = (completedSets[index] || 0) >= ex.sets;
                    const isCurrent = index === currentExerciseIndex;

                    return (
                        <Surface
                            key={index}
                            style={[
                                styles.exerciseListItem,
                                isCurrent && styles.exerciseListItemActive,
                                isCompleted && styles.exerciseListItemCompleted
                            ]}
                            elevation={isCurrent ? 2 : 0}
                        >
                            <View style={styles.exerciseListHeader}>
                                {isCompleted ? (
                                    <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
                                ) : isCurrent ? (
                                    <MaterialCommunityIcons name="play-circle" size={24} color="#8b5cf6" />
                                ) : (
                                    <MaterialCommunityIcons name="circle-outline" size={24} color="#9ca3af" />
                                )}
                                <Text
                                    variant="titleSmall"
                                    style={[
                                        styles.exerciseListName,
                                        isCompleted && styles.exerciseListNameCompleted
                                    ]}
                                >
                                    {ex.name}
                                </Text>
                            </View>
                            <Text variant="bodySmall" style={styles.exerciseListDetails}>
                                {completedSets[index] || 0}/{ex.sets} series • {ex.reps} reps
                            </Text>
                        </Surface>
                    );
                })}
            </ScrollView>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1f2937',
        borderRadius: 16,
        overflow: 'hidden',
    },
    headerGradient: {
        padding: 20,
        alignItems: 'center',
    },
    phaseTitle: {
        color: '#ffffff',
        fontWeight: 'bold',
        marginTop: 8,
    },
    workoutTitle: {
        color: '#ffffff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    progressText: {
        color: '#e5e7eb',
        marginTop: 4,
    },
    progressBar: {
        marginTop: 12,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    content: {
        padding: 16,
    },
    exerciseCard: {
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        backgroundColor: '#374151',
    },
    exerciseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    exerciseName: {
        color: '#ffffff',
        fontWeight: 'bold',
        flex: 1,
    },
    durationChip: {
        backgroundColor: '#8b5cf6',
    },
    exerciseDescription: {
        color: '#d1d5db',
    },
    currentExerciseContainer: {
        padding: 24,
        alignItems: 'center',
    },
    currentExerciseName: {
        color: '#ffffff',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
    },
    setsInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    setCard: {
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#374151',
        borderRadius: 12,
        minWidth: 100,
    },
    setNumber: {
        color: '#8b5cf6',
        fontWeight: 'bold',
    },
    totalSets: {
        color: '#d1d5db',
        fontWeight: 'bold',
    },
    separator: {
        color: '#6b7280',
        marginHorizontal: 16,
    },
    setLabel: {
        color: '#9ca3af',
        marginTop: 4,
    },
    repsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    repsText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    weightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    weightText: {
        color: '#d1d5db',
    },
    descriptionCard: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#374151',
        width: '100%',
    },
    description: {
        color: '#d1d5db',
        textAlign: 'center',
    },
    restContainer: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#374151',
        marginHorizontal: 16,
        borderRadius: 16,
    },
    restTitle: {
        color: '#8b5cf6',
        fontWeight: 'bold',
        marginBottom: 16,
    },
    restTimer: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 72,
    },
    restSubtitle: {
        color: '#9ca3af',
        marginBottom: 24,
    },
    controls: {
        alignItems: 'center',
        padding: 24,
    },
    controlBtn: {
        backgroundColor: '#8b5cf6',
    },
    completeBtn: {
        backgroundColor: '#10b981',
        transform: [{ scale: 1.2 }],
    },
    completeText: {
        color: '#9ca3af',
        marginTop: 12,
    },
    exercisesList: {
        padding: 16,
        maxHeight: 200,
    },
    exerciseListItem: {
        padding: 12,
        marginBottom: 8,
        borderRadius: 8,
        backgroundColor: '#374151',
    },
    exerciseListItemActive: {
        backgroundColor: '#4c1d95',
        borderWidth: 2,
        borderColor: '#8b5cf6',
    },
    exerciseListItemCompleted: {
        backgroundColor: '#065f46',
        opacity: 0.7,
    },
    exerciseListHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 4,
    },
    exerciseListName: {
        color: '#ffffff',
        fontWeight: '600',
        flex: 1,
    },
    exerciseListNameCompleted: {
        textDecorationLine: 'line-through',
        color: '#9ca3af',
    },
    exerciseListDetails: {
        color: '#9ca3af',
        marginLeft: 36,
    },
    finishedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    finishedTitle: {
        color: '#ffffff',
        fontWeight: 'bold',
        marginTop: 24,
        textAlign: 'center',
    },
    finishedSubtitle: {
        color: '#9ca3af',
        marginTop: 12,
        textAlign: 'center',
    },
    errorText: {
        color: '#ef4444',
        textAlign: 'center',
        padding: 40,
    },
});
