import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Surface, ProgressBar } from 'react-native-paper';
import { useWorkoutStore } from '@/features/workouts/store/useWorkoutStore';
import { useUserStore } from '@/features/profile/store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurHeader } from '@/components/timer';

// New hooks
import { useTimerStateMachine } from '../hooks/useTimerStateMachine';
import { usePhaseTimer } from '../hooks/usePhaseTimer';
import { useAudioManager } from '../hooks/useAudioManager';
import { useGymTimer } from '../hooks/useGymTimer';

// Shared components
import {
    TimerDisplay,
    TimerControls,
    PhaseIndicator,
    ExerciseProgress,
} from './shared';

interface GymTimerProps {
    sessionId?: string;
    onTimeUpdate?: (elapsedTime: number) => void;
    workout?: any;
    onComplete?: () => void;
}

export const TimerGymNew: React.FC<GymTimerProps> = ({
    sessionId = 'default',
    onTimeUpdate,
    workout: workoutProp,
    onComplete,
}) => {
    const { currentWorkout: storeWorkout } = useWorkoutStore();
    const { userData } = useUserStore();

    // Use workout from props or store
    const currentWorkout = workoutProp || storeWorkout;

    const exercises = (currentWorkout as any)?.exercises || [];
    const warmup = (currentWorkout as any)?.warmup || [];
    const cooldown = (currentWorkout as any)?.cooldown || [];
    const workoutTitle = currentWorkout?.title || 'Full Body Power';

    // State machine for phase management
    const {
        transitionTo,
        reset: resetPhase,
        isWarmup,
        isWorkout,
        isCooldown,
        isFinished,
    } = useTimerStateMachine('warmup');

    // Gym-specific timer logic
    const gymTimer = useGymTimer({
        exercises,
        warmup,
        cooldown,
        defaultRestTime: 60,
    });

    // Audio manager
    const audio = useAudioManager({
        voiceEnabled: userData?.voiceEnabled !== false,
        timerSoundEnabled: userData?.timerSoundEnabled !== false,
    });

    // Phase timer for warmup/cooldown
    const phaseTimer = usePhaseTimer({
        initialTime: warmup[gymTimer.warmupIndex]?.duration || 0,
        autoStart: false,
        onTick: (timeLeft) => {
            // Countdown announcements
            if (timeLeft <= 3 && timeLeft > 0) {
                audio.speakCountdown(timeLeft);
            }
        },
        onComplete: () => {
            handlePhaseComplete();
        },
    });

    // Rest timer
    const restTimer = usePhaseTimer({
        initialTime: 60,
        autoStart: false,
        onTick: (timeLeft) => {
            if (timeLeft <= 3 && timeLeft > 0) {
                audio.speakCountdown(timeLeft);
            }
        },
        onComplete: () => {
            audio.announceRestEnd();
            gymTimer.skipRest();
        },
    });

    // Handle phase completion
    const handlePhaseComplete = () => {
        if (isWarmup) {
            if (gymTimer.hasMoreWarmup) {
                // Next warmup exercise
                gymTimer.nextWarmup();
                const nextWarmup = warmup[gymTimer.warmupIndex + 1];
                phaseTimer.setTime(nextWarmup?.duration || 0);
                audio.announceExercise(nextWarmup?.name);
            } else {
                // Warmup complete, transition to workout
                transitionTo('workout');
                audio.announcePhaseTransition('warmup', 'workout');
            }
        } else if (isCooldown) {
            if (gymTimer.hasMoreCooldown) {
                // Next cooldown exercise
                gymTimer.nextCooldown();
                const nextCooldown = cooldown[gymTimer.cooldownIndex + 1];
                phaseTimer.setTime(nextCooldown?.duration || 0);
                audio.announceExercise(nextCooldown?.name);
            } else {
                // Cooldown complete, finish workout
                transitionTo('finished');
                audio.announcePhaseTransition('cooldown', 'finished');
                onComplete?.();
            }
        }
    };

    // Sync rest timer with gym timer state
    useEffect(() => {
        if (gymTimer.isResting && !restTimer.isActive) {
            restTimer.setTime(gymTimer.restTimeLeft);
            restTimer.start();
        } else if (!gymTimer.isResting && restTimer.isActive) {
            restTimer.pause();
        }
    }, [gymTimer.isResting]);

    // Auto-start warmup/cooldown timer
    useEffect(() => {
        if (isWarmup && warmup.length > 0) {
            const firstWarmup = warmup[0];
            const duration = typeof firstWarmup === 'object' ? firstWarmup.duration : 300;
            phaseTimer.setTime(duration || 300);
            phaseTimer.start();
            if (firstWarmup?.name || typeof firstWarmup === 'string') {
                audio.announceExercise(firstWarmup.name || firstWarmup);
            }
        } else if (isCooldown && cooldown.length > 0) {
            const firstCooldown = cooldown[0];
            const duration = typeof firstCooldown === 'object' ? firstCooldown.duration : 180;
            phaseTimer.setTime(duration || 180);
            phaseTimer.start();
            if (firstCooldown?.name || typeof firstCooldown === 'string') {
                audio.announceExercise(firstCooldown.name || firstCooldown);
            }
        }
    }, [isWarmup, isCooldown]);

    // Announce current exercise when it changes
    useEffect(() => {
        if (isWorkout && gymTimer.currentExercise && !gymTimer.isResting) {
            const announcement = `${gymTimer.currentExercise.name}, serie ${gymTimer.currentSet} de ${gymTimer.currentExercise.sets}, ${gymTimer.currentExercise.reps} repeticiones`;
            audio.announceExercise(announcement);
        }
    }, [gymTimer.currentExerciseIndex, gymTimer.currentSet, isWorkout]);

    // Handlers
    const handleStartWorkout = () => {
        transitionTo('workout');
        audio.announcePhaseTransition('warmup', 'workout');
    };

    const handleCompleteSet = () => {
        const { currentExercise, isLastSet, isLastExercise } = gymTimer;

        if (!currentExercise) return;

        gymTimer.completeSet();

        if (isLastSet) {
            if (isLastExercise) {
                // All exercises complete, go to cooldown
                transitionTo('cooldown');
                audio.announcePhaseTransition('workout', 'cooldown');

                if (cooldown.length > 0) {
                    phaseTimer.setTime(cooldown[0].duration);
                    audio.announceExercise(cooldown[0].name);
                }
            } else {
                // Next exercise
                gymTimer.nextExercise();
                audio.speak('Ejercicio completado, siguiente ejercicio');
            }
        } else {
            // Start rest
            audio.announceSetComplete(true);
            restTimer.setTime(60);
            restTimer.start();
        }
    };

    const handleSkipRest = () => {
        gymTimer.skipRest();
        restTimer.pause();
        restTimer.reset();
    };

    const handleReset = () => {
        resetPhase();
        gymTimer.reset();
        phaseTimer.reset();
        restTimer.reset();
        transitionTo('warmup');
    };

    const handlePlayPausePhase = () => {
        if (phaseTimer.isActive) {

            phaseTimer.pause();
            audio.stopTickSound();
        } else {
            phaseTimer.resume();
            audio.startTickSound();
        }
    };

    const handleSkipPhase = () => {
        if (isWarmup) {
            if (gymTimer.hasMoreWarmup) {
                gymTimer.nextWarmup();
                const nextWarmup = warmup[gymTimer.warmupIndex + 1];
                phaseTimer.setTime(nextWarmup?.duration || 0);
                audio.announceExercise(nextWarmup?.name);
            } else {
                handleStartWorkout();
            }
        } else if (isCooldown) {
            if (gymTimer.hasMoreCooldown) {
                gymTimer.nextCooldown();
                const nextCooldown = cooldown[gymTimer.cooldownIndex + 1];
                phaseTimer.setTime(nextCooldown?.duration || 0);
                audio.announceExercise(nextCooldown?.name);
            } else {
                transitionTo('finished');
                audio.announcePhaseTransition('cooldown', 'finished');
                onComplete?.();
            }
        }
    };

    // WARMUP PHASE
    if (isWarmup && warmup.length === 0) {
        // No warmup, go directly to workout
        React.useEffect(() => {
            transitionTo('workout');
        }, []);
        return null;
    }

    if (isWarmup) {
        const currentWarmupExercise = warmup[gymTimer.warmupIndex];

        return (
            <View style={styles.container}>
                <BlurHeader
                    title="Calentamiento"
                    subtitle={`Ejercicio ${gymTimer.warmupIndex + 1} de ${warmup.length}`}
                    onBack={() => { }}
                    onSettings={() => { }}
                />

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Warmup Timer */}
                    <View style={styles.phaseSection}>
                        <PhaseIndicator phase="warmup" />

                        <TimerDisplay
                            timeLeft={phaseTimer.timeLeft}
                            label="Tiempo restante"
                            color="#fbbf24"
                            size="large"
                        />

                        {currentWarmupExercise && (
                            <Surface style={styles.warmupCard} elevation={1}>
                                <View style={styles.warmupHeader}>
                                    <Text style={styles.warmupName}>
                                        {currentWarmupExercise.name || currentWarmupExercise}
                                    </Text>
                                    <View
                                        style={[
                                            styles.durationBadge,
                                            { backgroundColor: '#fbbf24' },
                                        ]}
                                    >
                                        <Text style={styles.durationText}>
                                            {Math.floor((currentWarmupExercise.duration || 0) / 60)}min
                                        </Text>
                                    </View>
                                </View>
                                {typeof currentWarmupExercise === 'object' && currentWarmupExercise.description && (
                                    <Text style={styles.warmupDescription}>
                                        {currentWarmupExercise.description}
                                    </Text>
                                )}
                            </Surface>
                        )}
                    </View>

                    {/* Hero image */}
                    <View style={styles.heroContainer}>
                        <View style={styles.heroImageWrapper}>
                            <Image
                                source={{
                                    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo8SV9K2nSNmRnltpZfSOP-FY36vOZDMd8NVJLfcHJNfC91AnJymmr42dt8NtUloEXziNBKrUArFq5a5SQJ559WJ1ysDt6OV4VNDpFq6MhYHpW8gLIjYCuh9uknVxhiR5AJNWz6ZaDoHGDbaqR0tVrPHWJdgV4VMbBFhP-1pg7Q8UAw3DqIwrFnKlS8fkDABBzHkEQ6X391eihEO1IRaRrN5iMp55IBmmNXgeD_qWgi64OhM-hGbPNEYHt4JKMFaImBjjoiOI_mww',
                                }}
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
                                        <MaterialCommunityIcons
                                            name="clock-outline"
                                            size={16}
                                            color="#13ec5b"
                                        />
                                        <Text style={styles.heroStatText}>55 Min</Text>
                                    </View>
                                    <View style={styles.heroStat}>
                                        <MaterialCommunityIcons
                                            name="fire"
                                            size={16}
                                            color="#13ec5b"
                                        />
                                        <Text style={styles.heroStatText}>450 Kcal</Text>
                                    </View>
                                    <View style={styles.heroStat}>
                                        <MaterialCommunityIcons
                                            name="format-list-bulleted"
                                            size={16}
                                            color="#13ec5b"
                                        />
                                        <Text style={styles.heroStatText}>
                                            {exercises.length} Ejercicios
                                        </Text>
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
                                    <MaterialCommunityIcons
                                        name="run"
                                        size={20}
                                        color="#fbbf24"
                                    />
                                </View>
                                <View style={styles.exerciseInfo}>
                                    <Text style={styles.exerciseName}>
                                        Calentamiento: {currentWarmupExercise?.name || 'Trote'}
                                    </Text>
                                    <Text style={styles.exerciseDetail}>Cardio ligero</Text>
                                </View>
                                <View style={styles.exerciseBadge}>
                                    <Text style={styles.exerciseBadgeText}>
                                        {currentWarmupExercise?.duration || 5} min
                                    </Text>
                                </View>
                            </Surface>
                        )}

                        {/* Main exercises */}
                        {exercises.map((ex: any, index: number) => {
                            const isCompleted =
                                (gymTimer.completedSets[index] || 0) >= ex.sets;
                            const isCurrent =
                                index === gymTimer.currentExerciseIndex && isWorkout;

                            return (
                                <Pressable
                                    key={index}
                                    style={[
                                        styles.exerciseItem,
                                        isCurrent && styles.exerciseItemActive,
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.exerciseNumber,
                                            isCurrent && styles.exerciseNumberActive,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.exerciseNumberText,
                                                isCurrent && styles.exerciseNumberTextActive,
                                            ]}
                                        >
                                            {index + 1}
                                        </Text>
                                    </View>
                                    <View style={styles.exerciseInfo}>
                                        <Text
                                            style={[
                                                styles.exerciseName,
                                                isCurrent && styles.exerciseNameActive,
                                            ]}
                                        >
                                            {ex.name}
                                        </Text>
                                        <Text style={styles.exerciseDetail}>
                                            {ex.description}
                                        </Text>
                                    </View>
                                    <View style={styles.exerciseMeta}>
                                        <View style={styles.exerciseMetaBadge}>
                                            <Text style={styles.exerciseMetaText}>
                                                {ex.sets} x {ex.reps}
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.exerciseMetaBadge,
                                                styles.exerciseMetaBadgePrimary,
                                            ]}
                                        >
                                            <Text style={styles.exerciseMetaTextPrimary}>
                                                {ex.weight}
                                            </Text>
                                        </View>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                </ScrollView>

                {/* Bottom controls */}
                <View style={styles.bottomControls}>
                    <TimerControls
                        isPlaying={phaseTimer.isActive}
                        onPlayPause={handlePlayPausePhase}
                        onSkip={handleSkipPhase}
                        onReset={handleReset}
                        playButtonColor="#fbbf24"
                    />
                </View>
            </View>
        );
    }

    // COOLDOWN PHASE
    if (isCooldown) {
        const currentCooldownExercise = cooldown[gymTimer.cooldownIndex];

        return (
            <View style={styles.container}>
                <BlurHeader
                    title="Enfriamiento"
                    subtitle={`Ejercicio ${gymTimer.cooldownIndex + 1} de ${cooldown.length}`}
                    onBack={() => { }}
                />

                <ScrollView style={styles.content}>
                    <View style={styles.phaseSection}>
                        <PhaseIndicator phase="cooldown" />

                        <TimerDisplay
                            timeLeft={phaseTimer.timeLeft}
                            label="Tiempo restante"
                            color="#2dd4bf"
                            size="large"
                        />

                        {currentCooldownExercise && (
                            <Surface style={styles.warmupCard} elevation={1}>
                                <View style={styles.warmupHeader}>
                                    <Text style={styles.warmupName}>
                                        {currentCooldownExercise.name || currentCooldownExercise}
                                    </Text>
                                    <View
                                        style={[
                                            styles.durationBadge,
                                            { backgroundColor: '#10b981' },
                                        ]}
                                    >
                                        <Text style={styles.durationText}>
                                            {Math.floor((currentCooldownExercise.duration || 0) / 60)}min
                                        </Text>
                                    </View>
                                </View>
                                {typeof currentCooldownExercise === 'object' && currentCooldownExercise.description && (
                                    <Text style={styles.warmupDescription}>
                                        {currentCooldownExercise.description}
                                    </Text>
                                )}
                            </Surface>
                        )}
                    </View>
                </ScrollView>

                <View style={styles.bottomControls}>
                    <TimerControls
                        isPlaying={phaseTimer.isActive}
                        onPlayPause={handlePlayPausePhase}
                        onSkip={handleSkipPhase}
                        onReset={handleReset}
                        playButtonColor="#2dd4bf"
                    />
                </View>
            </View>
        );
    }

    // FINISHED PHASE
    if (isFinished) {
        return (
            <SafeAreaView
                style={[
                    styles.container,
                    { justifyContent: 'center', alignItems: 'center' },
                ]}
                edges={['top', 'left', 'right']}
            >
                <StatusBar hidden />
                <MaterialCommunityIcons name="trophy" size={80} color="#fbbf24" />
                <Text style={styles.finishedTitle}>¡Entrenamiento Completado!</Text>
                <Text style={styles.finishedSubtitle}>Excelente trabajo 💪</Text>
            </SafeAreaView>
        );
    }

    // WORKOUT PHASE
    if (!gymTimer.currentExercise) {
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
                subtitle={`Ejercicio ${gymTimer.currentExerciseIndex + 1} de ${gymTimer.totalExercises}`}
                onBack={() => { }}
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Progress bar */}
                <View style={styles.progressContainer}>
                    <ProgressBar
                        progress={gymTimer.exerciseProgress}
                        color="#13ec5b"
                        style={styles.progressBar}
                    />
                </View>

                {/* Current exercise */}
                <ExerciseProgress
                    currentSet={gymTimer.currentSet}
                    totalSets={gymTimer.currentExercise.sets}
                    currentExercise={gymTimer.currentExerciseIndex + 1}
                    totalExercises={gymTimer.totalExercises}
                    exerciseName={gymTimer.currentExercise.name}
                    reps={gymTimer.currentExercise.reps}
                    weight={gymTimer.currentExercise.weight}
                    progress={gymTimer.exerciseProgress}
                />

                {gymTimer.currentExercise?.description && (
                    <Surface style={styles.descriptionCard} elevation={1}>
                        <Text style={styles.description}>
                            💡 {gymTimer.currentExercise.description}
                        </Text>
                    </Surface>
                )}

                {/* Rest or Complete */}
                {gymTimer.isResting && (
                    <View style={styles.restContainer}>
                        <Text style={styles.restTitle}>DESCANSO</Text>
                        <TimerDisplay
                            timeLeft={restTimer.timeLeft}
                            label="segundos"
                            color="#13ec5b"
                            size="large"
                        />
                        <Pressable style={styles.skipRestButton} onPress={handleSkipRest}>
                            <MaterialCommunityIcons
                                name="skip-next"
                                size={24}
                                color="#ffffff"
                            />
                            <Text style={styles.skipRestText}>Saltar descanso</Text>
                        </Pressable>
                    </View>
                )}

                {/* Exercise list preview */}
                <View style={styles.exerciseListPreview}>
                    {exercises.map((ex: any, index: number) => {
                        const isCompleted =
                            (gymTimer.completedSets[index] || 0) >= ex.sets;
                        const isCurrent = index === gymTimer.currentExerciseIndex;

                        return (
                            <View key={index} style={styles.previewItem}>
                                {isCompleted ? (
                                    <MaterialCommunityIcons
                                        name="check-circle"
                                        size={20}
                                        color="#10b981"
                                    />
                                ) : isCurrent ? (
                                    <MaterialCommunityIcons
                                        name="play-circle"
                                        size={20}
                                        color="#13ec5b"
                                    />
                                ) : (
                                    <MaterialCommunityIcons
                                        name="circle-outline"
                                        size={20}
                                        color="#9ca3af"
                                    />
                                )}
                                <Text style={styles.previewText}>{ex.name}</Text>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Bottom controls */}
            {!gymTimer.isResting && (
                <View style={styles.bottomControls}>
                    <Pressable style={styles.primaryButton} onPress={handleCompleteSet}>
                        <LinearGradient
                            colors={['#10b981', '#059669']}
                            style={styles.buttonGradient}
                        >
                            <MaterialCommunityIcons
                                name="check-circle"
                                size={24}
                                color="#ffffff"
                            />
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
    phaseSection: {
        padding: 24,
        gap: 24,
        alignItems: 'center',
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
    descriptionCard: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#193322',
        marginHorizontal: 16,
        marginTop: 16,
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
        marginTop: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    restTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#13ec5b',
        marginBottom: 16,
    },
    skipRestButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#13ec5b',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 9999,
        marginTop: 16,
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
        width: '90%',
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
