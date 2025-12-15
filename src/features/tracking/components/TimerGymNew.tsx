import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton, Surface, ProgressBar } from 'react-native-paper';
import { useWorkoutStore } from '@/features/workouts/store/useWorkoutStore';
import { useUserStore } from '@/features/profile/store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurHeader } from '@/components/timer';

interface GymTimerProps {
    sessionId?: string;
    onTimeUpdate?: (elapsedTime: number) => void;
    workout?: any;
    onComplete?: () => void;
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

export const TimerGymNew: React.FC<GymTimerProps> = ({
    sessionId = 'default',
    onTimeUpdate,
    workout: workoutProp,
    onComplete
}) => {
    const { currentWorkout: storeWorkout } = useWorkoutStore();
    const { userData } = useUserStore();

    // Usar el workout pasado como prop, o el del store como fallback
    const currentWorkout = workoutProp || storeWorkout;

    const exercises = (currentWorkout as any)?.exercises || [];
    const warmup = (currentWorkout as any)?.warmup || [];
    const cooldown = (currentWorkout as any)?.cooldown || [];
    const workoutTitle = currentWorkout?.title || 'Full Body Power';

    const speakIfEnabled = (text: string, options?: any) => {
        if (userData?.voiceEnabled !== false) {
            Speech.speak(text, options);
        }
    };

    const [phase, setPhase] = useState<'warmup' | 'workout' | 'cooldown' | 'finished'>('warmup');
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const [isResting, setIsResting] = useState(false);
    const [restTimeLeft, setRestTimeLeft] = useState(60);
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
            setCurrentSet(prev => prev + 1);
            setIsResting(true);
            setRestTimeLeft(60);
            speakIfEnabled('Serie completada, descansa', { language: 'es-ES' });
        } else {
            if (currentExerciseIndex < exercises.length - 1) {
                setCurrentExerciseIndex(prev => prev + 1);
                setCurrentSet(1);
                speakIfEnabled('Ejercicio completado, siguiente ejercicio', { language: 'es-ES' });
            } else {
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

    // WARMUP PHASE
    if (phase === 'warmup') {
        return (
            <View style={styles.container}>
                <BlurHeader
                    title="Detalle de Rutina"
                    subtitle="Fuerza Funcional"
                    onBack={() => { }}
                    onSettings={() => { }}
                />

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Hero image */}
                    <View style={styles.heroContainer}>
                        <View style={styles.heroImageWrapper}>
                            <Image
                                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo8SV9K2nSNmRnltpZfSOP-FY36vOZDMd8NVJLfcHJNfC91AnJymmr42dt8NtUloEXziNBKrUArFq5a5SQJ559WJ1ysDt6OV4VNDpFq6MhYHpW8gLIjYCuh9uknVxhiR5AJNWz6ZaDoHGDbaqR0tVrPHWJdgV4VMbBFhP-1pg7Q8UAw3DqIwrFnKlS8fkDABBzHkEQ6X391eihEO1IRaRrN5iMp55IBmmNXgeD_qWgi64OhM-hGbPNEYHt4JKMFaImBjjoiOI_mww' }}
                                style={styles.heroImage}
                            />
                            <LinearGradient
                                colors={['transparent', '#102216']}
                                style={styles.heroGradient}
                            />
                            <View style={styles.heroContent}>
                                <View style={styles.levelBadge}>
                                    <Text style={styles.levelText}>Intermedio</Text>
                                </View>
                                <Text style={styles.heroTitle}>{workoutTitle}</Text>
                                <View style={styles.heroStats}>
                                    <View style={styles.heroStat}>
                                        <MaterialCommunityIcons name="clock-outline" size={16} color="#13ec5b" />
                                        <Text style={styles.heroStatText}>55 Min</Text>
                                    </View>
                                    <View style={styles.heroStat}>
                                        <MaterialCommunityIcons name="fire" size={16} color="#13ec5b" />
                                        <Text style={styles.heroStatText}>450 Kcal</Text>
                                    </View>
                                    <View style={styles.heroStat}>
                                        <MaterialCommunityIcons name="format-list-bulleted" size={16} color="#13ec5b" />
                                        <Text style={styles.heroStatText}>{exercises.length} Ejercicios</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Exercises list */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Lista de Ejercicios</Text>
                            <Pressable style={styles.editButton}>
                                <Text style={styles.editButtonText}>Editar</Text>
                            </Pressable>
                        </View>

                        {/* Warmup */}
                        {warmup.length > 0 && (
                            <Surface style={styles.exerciseItem} elevation={0}>
                                <View style={styles.exerciseIcon}>
                                    <MaterialCommunityIcons name="run" size={20} color="#fbbf24" />
                                </View>
                                <View style={styles.exerciseInfo}>
                                    <Text style={styles.exerciseName}>Calentamiento: Trote</Text>
                                    <Text style={styles.exerciseDetail}>Cardio ligero</Text>
                                </View>
                                <View style={styles.exerciseBadge}>
                                    <Text style={styles.exerciseBadgeText}>5 min</Text>
                                </View>
                            </Surface>
                        )}

                        {/* Main exercises */}
                        {exercises.map((ex: Exercise, index: number) => {
                            const isCompleted = (completedSets[index] || 0) >= ex.sets;
                            const isCurrent = index === currentExerciseIndex && phase === 'workout';

                            return (
                                <Pressable
                                    key={index}
                                    style={[
                                        styles.exerciseItem,
                                        isCurrent && styles.exerciseItemActive
                                    ]}
                                >
                                    <View style={[
                                        styles.exerciseNumber,
                                        isCurrent && styles.exerciseNumberActive
                                    ]}>
                                        <Text style={[
                                            styles.exerciseNumberText,
                                            isCurrent && styles.exerciseNumberTextActive
                                        ]}>{index + 1}</Text>
                                    </View>
                                    <View style={styles.exerciseInfo}>
                                        <Text style={[
                                            styles.exerciseName,
                                            isCurrent && styles.exerciseNameActive
                                        ]}>{ex.name}</Text>
                                        <Text style={styles.exerciseDetail}>{ex.description}</Text>
                                    </View>
                                    <View style={styles.exerciseMeta}>
                                        <View style={styles.exerciseMetaBadge}>
                                            <Text style={styles.exerciseMetaText}>{ex.sets} x {ex.reps}</Text>
                                        </View>
                                        <View style={[styles.exerciseMetaBadge, styles.exerciseMetaBadgePrimary]}>
                                            <Text style={styles.exerciseMetaTextPrimary}>{ex.weight}</Text>
                                        </View>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                </ScrollView>

                {/* Bottom controls */}
                <View style={styles.bottomControls}>
                    <Pressable style={styles.primaryButton} onPress={handleStartWorkout}>
                        <LinearGradient
                            colors={['#13ec5b', '#0fb946']}
                            style={styles.buttonGradient}
                        >
                            <MaterialCommunityIcons name="play" size={24} color="#102216" />
                            <Text style={styles.primaryButtonText}>Comenzar</Text>
                        </LinearGradient>
                    </Pressable>

                    <View style={styles.secondaryButtons}>
                        <Pressable style={styles.secondaryButton}>
                            <MaterialCommunityIcons name="refresh" size={18} color="#9ca3af" />
                            <Text style={styles.secondaryButtonText}>Reiniciar</Text>
                        </Pressable>
                        <Pressable style={styles.secondaryButton}>
                            <MaterialCommunityIcons name="check-circle" size={18} color="#13ec5b" />
                            <Text style={styles.secondaryButtonText}>Completar</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    }

    // COOLDOWN PHASE
    if (phase === 'cooldown') {
        return (
            <View style={styles.container}>
                <BlurHeader
                    title="Enfriamiento"
                    subtitle="Fase Final"
                    onBack={() => { }}
                />

                <ScrollView style={styles.content}>
                    {cooldown.map((item: WarmupCooldown, index: number) => (
                        <Surface key={index} style={styles.warmupCard} elevation={1}>
                            <View style={styles.warmupHeader}>
                                <Text style={styles.warmupName}>{item.name}</Text>
                                <View style={[styles.durationBadge, { backgroundColor: '#10b981' }]}>
                                    <Text style={styles.durationText}>{item.duration}s</Text>
                                </View>
                            </View>
                            <Text style={styles.warmupDescription}>{item.description}</Text>
                        </Surface>
                    ))}
                </ScrollView>

                <View style={styles.bottomControls}>
                    <Pressable style={styles.primaryButton} onPress={handleFinish}>
                        <LinearGradient
                            colors={['#10b981', '#059669']}
                            style={styles.buttonGradient}
                        >
                            <MaterialCommunityIcons name="check" size={24} color="#ffffff" />
                            <Text style={styles.primaryButtonText}>Finalizar</Text>
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>
        );
    }

    // FINISHED PHASE
    if (phase === 'finished') {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top', 'left', 'right']}>
                <StatusBar hidden />
                <MaterialCommunityIcons name="trophy" size={80} color="#fbbf24" />
                <Text style={styles.finishedTitle}>¡Entrenamiento Completado!</Text>
                <Text style={styles.finishedSubtitle}>Excelente trabajo 💪</Text>
            </SafeAreaView>
        );
    }

    // WORKOUT PHASE
    if (!currentExercise) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No hay ejercicios disponibles</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar hidden />
            <BlurHeader
                title={workoutTitle}
                subtitle={`Ejercicio ${currentExerciseIndex + 1} de ${exercises.length}`}
                onBack={() => { }}
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Progress bar */}
                <View style={styles.progressContainer}>
                    <ProgressBar
                        progress={(currentExerciseIndex + 1) / exercises.length}
                        color="#13ec5b"
                        style={styles.progressBar}
                    />
                </View>

                {/* Current exercise */}
                <View style={styles.currentExerciseContainer}>
                    <Text style={styles.currentExerciseName}>{currentExercise.name}</Text>

                    <View style={styles.setsInfo}>
                        <View style={styles.setCard}>
                            <Text style={styles.setNumber}>{currentSet}</Text>
                            <Text style={styles.setLabel}>Serie Actual</Text>
                        </View>

                        <Text style={styles.separator}>/</Text>

                        <View style={styles.setCard}>
                            <Text style={styles.totalSets}>{currentExercise.sets}</Text>
                            <Text style={styles.setLabel}>Total Series</Text>
                        </View>
                    </View>

                    <View style={styles.repsContainer}>
                        <MaterialCommunityIcons name="repeat" size={32} color="#13ec5b" />
                        <Text style={styles.repsText}>{currentExercise.reps} repeticiones</Text>
                    </View>

                    <View style={styles.weightContainer}>
                        <MaterialCommunityIcons name="weight-kilogram" size={24} color="#9ca3af" />
                        <Text style={styles.weightText}>Peso: {currentExercise.weight}</Text>
                    </View>

                    <Surface style={styles.descriptionCard} elevation={1}>
                        <Text style={styles.description}>💡 {currentExercise.description}</Text>
                    </Surface>
                </View>

                {/* Rest or Complete */}
                {isResting ? (
                    <View style={styles.restContainer}>
                        <Text style={styles.restTitle}>DESCANSO</Text>
                        <Text style={styles.restTimer}>{restTimeLeft}</Text>
                        <Text style={styles.restSubtitle}>segundos</Text>
                        <Pressable style={styles.skipRestButton} onPress={handleSkipRest}>
                            <MaterialCommunityIcons name="skip-next" size={24} color="#ffffff" />
                            <Text style={styles.skipRestText}>Saltar descanso</Text>
                        </Pressable>
                    </View>
                ) : null}

                {/* Exercise list preview */}
                <View style={styles.exerciseListPreview}>
                    {exercises.slice(0, 3).map((ex: Exercise, index: number) => {
                        const isCompleted = (completedSets[index] || 0) >= ex.sets;
                        const isCurrent = index === currentExerciseIndex;

                        return (
                            <View key={index} style={styles.previewItem}>
                                {isCompleted ? (
                                    <MaterialCommunityIcons name="check-circle" size={20} color="#10b981" />
                                ) : isCurrent ? (
                                    <MaterialCommunityIcons name="play-circle" size={20} color="#13ec5b" />
                                ) : (
                                    <MaterialCommunityIcons name="circle-outline" size={20} color="#9ca3af" />
                                )}
                                <Text style={styles.previewText}>{ex.name}</Text>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Bottom controls */}
            {!isResting && (
                <View style={styles.bottomControls}>
                    <Pressable style={styles.primaryButton} onPress={handleCompleteSet}>
                        <LinearGradient
                            colors={['#10b981', '#059669']}
                            style={styles.buttonGradient}
                        >
                            <MaterialCommunityIcons name="check-circle" size={24} color="#ffffff" />
                            <Text style={styles.primaryButtonText}>Completar Serie</Text>
                        </LinearGradient>
                    </Pressable>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#102216',
    },
    content: {
        flex: 1,
    },
    heroContainer: {
        padding: 4,
    },
    heroImageWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
        height: 200,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
        opacity: 0.7,
    },
    heroGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '70%',
    },
    heroContent: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
    },
    levelBadge: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    levelText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#ffffff',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    heroStats: {
        flexDirection: 'row',
        gap: 16,
    },
    heroStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    heroStatText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#d1d5db',
    },
    section: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: -0.5,
    },
    editButton: {
        backgroundColor: '#193322',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    editButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#13ec5b',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    exerciseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#193322',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: 12,
    },
    exerciseItemActive: {
        backgroundColor: '#23482f',
        borderColor: 'rgba(19, 236, 91, 0.3)',
    },
    exerciseIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    exerciseNumber: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    exerciseNumberActive: {
        backgroundColor: '#13ec5b',
    },
    exerciseNumberText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
    },
    exerciseNumberTextActive: {
        color: '#102216',
    },
    exerciseInfo: {
        flex: 1,
        marginRight: 8,
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 2,
    },
    exerciseNameActive: {
        color: '#13ec5b',
    },
    exerciseDetail: {
        fontSize: 12,
        color: '#9ca3af',
    },
    exerciseMeta: {
        flexDirection: 'column',
        gap: 4,
        alignItems: 'flex-end',
    },
    exerciseMetaBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    exerciseMetaBadgePrimary: {
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
    },
    exerciseMetaText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ffffff',
    },
    exerciseMetaTextPrimary: {
        fontSize: 12,
        fontWeight: '700',
        color: '#13ec5b',
    },
    exerciseBadge: {
        backgroundColor: '#102216',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    exerciseBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ffffff',
    },
    bottomControls: {
        padding: 16,
        paddingBottom: 32,
        backgroundColor: 'rgba(16, 34, 22, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    primaryButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#13ec5b',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 8,
    },
    buttonGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    primaryButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#102216',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    secondaryButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#193322',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    secondaryButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    progressContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    currentExerciseContainer: {
        padding: 24,
        alignItems: 'center',
    },
    currentExerciseName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
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
        backgroundColor: '#193322',
        borderRadius: 12,
        minWidth: 100,
    },
    setNumber: {
        fontSize: 36,
        fontWeight: '700',
        color: '#13ec5b',
    },
    totalSets: {
        fontSize: 36,
        fontWeight: '700',
        color: '#d1d5db',
    },
    separator: {
        fontSize: 36,
        fontWeight: '700',
        color: '#6b7280',
        marginHorizontal: 16,
    },
    setLabel: {
        fontSize: 12,
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
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
    },
    weightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    weightText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#d1d5db',
    },
    descriptionCard: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#193322',
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    description: {
        fontSize: 14,
        color: '#d1d5db',
        textAlign: 'center',
        lineHeight: 20,
    },
    restContainer: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#193322',
        marginHorizontal: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    restTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#13ec5b',
        marginBottom: 16,
    },
    restTimer: {
        fontSize: 72,
        fontWeight: '900',
        color: '#ffffff',
    },
    restSubtitle: {
        fontSize: 14,
        color: '#9ca3af',
        marginBottom: 24,
    },
    skipRestButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#13ec5b',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 9999,
    },
    skipRestText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#102216',
    },
    exerciseListPreview: {
        padding: 16,
        gap: 12,
    },
    previewItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        backgroundColor: '#193322',
        borderRadius: 8,
    },
    previewText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
        flex: 1,
    },
    warmupCard: {
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        backgroundColor: '#193322',
    },
    warmupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    warmupName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
        flex: 1,
    },
    durationBadge: {
        backgroundColor: '#13ec5b',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    durationText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ffffff',
    },
    warmupDescription: {
        fontSize: 14,
        color: '#d1d5db',
    },
    finishedTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
        marginTop: 24,
        textAlign: 'center',
    },
    finishedSubtitle: {
        fontSize: 18,
        color: '#9ca3af',
        marginTop: 12,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
        textAlign: 'center',
        padding: 40,
    },
});
