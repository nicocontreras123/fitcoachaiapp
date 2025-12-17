import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Surface, ProgressBar } from 'react-native-paper';
import { useWorkoutStore } from '@/features/workouts/store/useWorkoutStore';
import { useUserStore } from '@/features/profile/store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurHeader } from '@/components/timer';
import { useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { WorkoutCompletedModal } from '@/features/history/WorkoutCompletedModal';
import { useCompleteWorkout } from '@/hooks/useCompleteWorkout';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    SpotifyButton,
} from './shared';

// Helper function to get warmup suggestions for generic exercises
const getWarmupSuggestion = (exerciseName: string): string | null => {
    const name = exerciseName.toLowerCase();

    if (name.includes('cardio') || name === 'cardio') {
        return 'Trotar, saltar la cuerda, bicicleta estática, etc.';
    }
    if (name.includes('movilidad') || name.includes('mobility')) {
        return 'Círculos de brazos, rotaciones de cadera, estiramientos dinámicos';
    }
    if (name.includes('estiramiento') || name.includes('stretch')) {
        return 'Estiramientos dinámicos de piernas, brazos y torso';
    }

    return null;
};

// Helper function to format time in MM:SS format
const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

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
    const router = useRouter();
    const [showCompletedModal, setShowCompletedModal] = React.useState(false);
    const [totalElapsedTime, setTotalElapsedTime] = React.useState(0);
    const [isPaused, setIsPaused] = React.useState(false);
    const [isSoundMuted, setIsSoundMuted] = React.useState(false);
    const { completeWorkout } = useCompleteWorkout();

    // Use workout from props or store
    const currentWorkout = workoutProp || storeWorkout;

    const exercises = (currentWorkout as any)?.exercises || [];
    const warmup = (currentWorkout as any)?.warmup || [];
    const cooldown = (currentWorkout as any)?.cooldown || [];
    const workoutTitle = currentWorkout?.title || 'Full Body Power';

    // Get preparation time from user settings
    const prepMinutes = userData?.prepTimeMinutes || 0;
    const prepSeconds = userData?.prepTimeSeconds !== undefined ? userData.prepTimeSeconds : 10;
    const prepTimeInSeconds = prepMinutes * 60 + prepSeconds;

    // State machine for phase management
    const {
        transitionTo,
        reset: resetPhase,
        isPreparing,
        isWarmup,
        isWorkout,
        isCooldown,
        isFinished,
    } = useTimerStateMachine('preparing');

    // Gym-specific timer logic
    const gymTimer = useGymTimer({
        exercises,
        warmup,
        cooldown,
        defaultRestTime: 60,
    });

    // Mute toggle handler
    const handleMuteToggle = () => {
        setIsSoundMuted(!isSoundMuted);
    };

    // Audio manager
    const audio = useAudioManager({
        voiceEnabled: !isSoundMuted && userData?.voiceEnabled !== false,
        timerSoundEnabled: !isSoundMuted && userData?.timerSoundEnabled !== false,
    });

    // Preparation timer
    const preparationTimer = usePhaseTimer({
        initialTime: prepTimeInSeconds,
        autoStart: false,
        onTick: (timeLeft) => {
            if (timeLeft <= 3 && timeLeft > 0) {
                audio.speakCountdown(timeLeft);
            }
        },
        onComplete: () => {
            // Preparation complete, move to warmup or workout
            if (warmup.length > 0) {
                transitionTo('warmup');
            } else {
                // No warmup, go directly to workout
                transitionTo('workout');
            }
        },
    });

    // Phase timer for warmup/cooldown
    const phaseTimer = usePhaseTimer({
        initialTime: 0,
        autoStart: false,
        onTick: (timeLeft) => {
            // Countdown announcements - NO en cooldown
            if (!isCooldown && timeLeft <= 3 && timeLeft > 0) {
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

    // Calculate total time remaining
    const totalTimeRemaining = React.useMemo(() => {
        const totalWorkoutTime = (currentWorkout?.totalDuration || 45) * 60;

        if (isPreparing) {
            // En preparación: mostrar tiempo total del workout + tiempo de preparación restante
            return totalWorkoutTime + preparationTimer.timeLeft;
        }

        // Para todas las demás fases, usar el tiempo elapsed real
        return Math.max(0, totalWorkoutTime - totalElapsedTime);
    }, [
        isPreparing,
        preparationTimer.timeLeft,
        currentWorkout,
        totalElapsedTime,
    ]);

    // Handle phase completion
    const handlePhaseComplete = () => {
        if (isWarmup) {
            if (gymTimer.hasMoreWarmup) {
                // Next warmup exercise - calculate index BEFORE incrementing
                const nextIndex = gymTimer.warmupIndex + 1;
                const nextWarmupRaw = warmup[nextIndex];

                // Handle both string and object warmups
                const nextWarmup = typeof nextWarmupRaw === 'object'
                    ? nextWarmupRaw
                    : { name: nextWarmupRaw, duration: 300 };

                gymTimer.nextWarmup();
                phaseTimer.setTimeAndStart(nextWarmup?.duration || 300);
                audio.announceExercise(nextWarmup?.name || nextWarmupRaw);
            } else {
                // Warmup complete, transition to workout
                transitionTo('workout');
                audio.announcePhaseTransition('warmup', 'workout');
            }
        } else if (isCooldown) {
            if (gymTimer.hasMoreCooldown) {
                // Next cooldown exercise - calculate index BEFORE incrementing
                const nextIndex = gymTimer.cooldownIndex + 1;
                const nextCooldown = cooldown[nextIndex];

                gymTimer.nextCooldown();
                phaseTimer.setTimeAndStart(nextCooldown?.duration || 0);
                audio.announceExercise(nextCooldown?.name);
            } else {
                // Cooldown complete, finish workout
                transitionTo('finished');
                audio.announcePhaseTransition('cooldown', 'finished');
            }
        }
    };

    // Rastrear tiempo total durante todo el entrenamiento (warmup + workout + cooldown)
    React.useEffect(() => {
        let intervalId: number;

        // Determinar si algún timer está activo
        const isAnyTimerActive = isWarmup ? phaseTimer.isActive
            : isWorkout ? (gymTimer.isResting ? restTimer.isActive : !isPaused)
                : isCooldown ? phaseTimer.isActive
                    : false;

        // Contar tiempo solo cuando:
        // 1. Estamos en una fase activa (warmup, workout, cooldown)
        // 2. No estamos en finished
        // 3. El timer correspondiente está activo (no pausado)
        const shouldCount = (isWarmup || isWorkout || isCooldown) && !isFinished && isAnyTimerActive;

        if (shouldCount) {
            intervalId = setInterval(() => {
                setTotalElapsedTime(prev => prev + 1);
            }, 1000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isWarmup, isWorkout, isCooldown, isFinished, gymTimer.isResting, phaseTimer.isActive, restTimer.isActive, isPaused]);

    // Mostrar modal cuando finaliza el entrenamiento
    React.useEffect(() => {
        if (isFinished && !showCompletedModal) {
            setShowCompletedModal(true);
        }
    }, [isFinished]);

    // Mantener la pantalla activa durante entrenamientos
    useKeepAwake();

    // Cleanup: Stop all timers and audio when component unmounts
    useEffect(() => {
        return () => {
            console.log('🧹 Cleaning up TimerGymNew - stopping all timers and audio');

            // Pause all timers
            preparationTimer.pause();
            phaseTimer.pause();
            restTimer.pause();

            // Stop audio
            audio.stopTickSound();

            // Stop any ongoing speech
            try {
                Speech.stop();
            } catch (error) {
                console.error('Error stopping speech:', error);
            }
        };
    }, []);

    // Sync rest timer with gym timer state
    useEffect(() => {
        if (gymTimer.isResting && !restTimer.isActive) {
            restTimer.setTime(gymTimer.restTimeLeft);
            restTimer.start();
        } else if (!gymTimer.isResting && restTimer.isActive) {
            restTimer.pause();
        }
    }, [gymTimer.isResting]);

    // Auto-start warmup timer when entering warmup phase
    const warmupInitializedRef = React.useRef(false);
    useEffect(() => {
        console.log('🔍 [WARMUP_EFFECT] Checking warmup initialization', {
            isWarmup,
            warmupLength: warmup.length,
            alreadyInitialized: warmupInitializedRef.current,
            warmupIndex: gymTimer.warmupIndex,
        });

        if (isWarmup && warmup.length > 0 && !warmupInitializedRef.current) {
            warmupInitializedRef.current = true;
            const firstWarmup = warmup[0];
            const duration = typeof firstWarmup === 'object' ? firstWarmup.duration : 300;

            console.log('🔥 [WARMUP_EFFECT] Initializing warmup timer', {
                duration,
                warmupName: firstWarmup?.name || firstWarmup,
                warmupIndex: gymTimer.warmupIndex,
            });

            // Use setTimeAndStart to atomically set time and start the timer
            phaseTimer.setTimeAndStart(duration || 300);

            if (firstWarmup?.name || typeof firstWarmup === 'string') {
                audio.announceExercise(firstWarmup.name || firstWarmup);
            }
        }

        // Reset the ref when leaving warmup
        if (!isWarmup) {
            console.log('🚪 [WARMUP_EFFECT] Leaving warmup, resetting ref');
            warmupInitializedRef.current = false;
        }
    }, [isWarmup, warmup]);

    // Auto-start cooldown timer when entering cooldown phase
    useEffect(() => {
        if (isCooldown && cooldown.length > 0) {
            const firstCooldown = cooldown[0];
            const duration = typeof firstCooldown === 'object'
                ? (firstCooldown.duration || 180)
                : 180;

            console.log('❄️ [COOLDOWN_INIT]', {
                firstCooldown,
                duration,
                type: typeof firstCooldown
            });

            // Usar setTimeAndStart para evitar problemas de sincronización
            phaseTimer.setTimeAndStart(duration);

            if (firstCooldown?.name || typeof firstCooldown === 'string') {
                audio.announceExercise(firstCooldown.name || firstCooldown);
            }
        }
    }, [isCooldown]);

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

        // No need to adjust totalElapsedTime here since the timer was running
        // and counting the time naturally
        gymTimer.completeSet();

        if (isLastSet) {
            if (isLastExercise) {
                // All exercises complete, go to cooldown
                transitionTo('cooldown');
                audio.announcePhaseTransition('workout', 'cooldown');
                // El useEffect de cooldown se encargará de inicializar el timer
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
        // Ajustar el tiempo elapsed para reflejar el skip del descanso
        const timeLeftInRest = restTimer.timeLeft;
        setTotalElapsedTime(prev => prev + timeLeftInRest);

        gymTimer.skipRest();
        restTimer.pause();
        restTimer.reset();
    };

    const handleReset = () => {
        resetPhase();
        gymTimer.reset();
        phaseTimer.reset();
        restTimer.reset();
        preparationTimer.reset();
        transitionTo('preparing');
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

    const handlePauseWorkout = () => {
        setIsPaused(!isPaused);
        if (!isPaused) {
            // Pausar
            restTimer.pause();
            audio.stopTickSound();
            // Detener cualquier voz del coach que esté sonando
            Speech.stop();
        } else {
            // Reanudar
            if (gymTimer.isResting) {
                restTimer.resume();
            }
        }
    };

    const handleResetWorkout = () => {
        // Reiniciar toda la rutina
        handleReset();
        setIsPaused(false);
    };

    const handleSkipPhase = () => {
        console.log('⏭️ [SKIP] handleSkipPhase called', {
            isWarmup,
            isCooldown,
            warmupIndex: gymTimer.warmupIndex,
            hasMoreWarmup: gymTimer.hasMoreWarmup,
            warmupLength: warmup.length,
        });

        if (isWarmup) {
            console.log('🔥 [SKIP] In warmup phase', {
                currentIndex: gymTimer.warmupIndex,
                hasMore: gymTimer.hasMoreWarmup,
                totalWarmups: warmup.length,
            });

            // Ajustar el tiempo elapsed para reflejar el skip
            const timeLeftInCurrentWarmup = phaseTimer.timeLeft;
            setTotalElapsedTime(prev => prev + timeLeftInCurrentWarmup);

            if (gymTimer.hasMoreWarmup) {
                console.log('➡️ [SKIP] Moving to next warmup');

                // Calculate next index BEFORE calling nextWarmup
                const nextIndex = gymTimer.warmupIndex + 1;
                const nextWarmupRaw = warmup[nextIndex];

                // Handle both string and object warmups
                const nextWarmup = typeof nextWarmupRaw === 'object'
                    ? nextWarmupRaw
                    : { name: nextWarmupRaw, duration: 300 };

                console.log('📍 [SKIP] Calculated next warmup', {
                    currentIndex: gymTimer.warmupIndex,
                    nextIndex,
                    nextWarmupRaw,
                    nextWarmup,
                });

                // Now increment the index
                gymTimer.nextWarmup();

                console.log('⏱️ [SKIP] Setting timer', {
                    duration: nextWarmup?.duration,
                    name: nextWarmup?.name,
                });

                phaseTimer.setTimeAndStart(nextWarmup?.duration || 300);
                audio.announceExercise(nextWarmup?.name || nextWarmupRaw);
            } else {
                console.log('✅ [SKIP] No more warmups, starting workout');
                handleStartWorkout();
            }
        } else if (isCooldown) {
            console.log('❄️ [SKIP] In cooldown phase', {
                currentIndex: gymTimer.cooldownIndex,
                hasMore: gymTimer.hasMoreCooldown,
                totalCooldowns: cooldown.length,
            });

            // Ajustar el tiempo elapsed para reflejar el skip
            const timeLeftInCurrentCooldown = phaseTimer.timeLeft;
            setTotalElapsedTime(prev => prev + timeLeftInCurrentCooldown);

            // Verificar ANTES de incrementar
            if (gymTimer.hasMoreCooldown) {
                console.log('➡️ [SKIP] Moving to next cooldown');

                // Calculate next index BEFORE calling nextCooldown
                const nextIndex = gymTimer.cooldownIndex + 1;
                const nextCooldownRaw = cooldown[nextIndex];

                // Handle both string and object cooldowns
                const nextCooldown = typeof nextCooldownRaw === 'object'
                    ? nextCooldownRaw
                    : { name: nextCooldownRaw, duration: 180 };

                console.log('📍 [SKIP] Calculated next cooldown', {
                    currentIndex: gymTimer.cooldownIndex,
                    nextIndex,
                    nextCooldownRaw,
                    nextCooldown,
                });

                // Now increment the index
                gymTimer.nextCooldown();

                console.log('⏱️ [SKIP] Setting timer', {
                    duration: nextCooldown?.duration,
                    name: nextCooldown?.name,
                });

                phaseTimer.setTimeAndStart(nextCooldown?.duration || 180);
                audio.announceExercise(nextCooldown?.name || nextCooldownRaw);
            } else {
                console.log('✅ [SKIP] No more cooldowns, finishing workout');
                transitionTo('finished');
                audio.announcePhaseTransition('cooldown', 'finished');
            }
        }
    };

    // WARMUP PHASE CHECK (Moved from below)
    if (isWarmup && warmup.length === 0) {
        // No warmup, go directly to workout
        React.useEffect(() => {
            transitionTo('workout');
        }, []);
        return null;
    }

    const renderPhase = () => {
        // PREPARATION PHASE
        if (isPreparing) {
            return (
                <SafeAreaView style={styles.container} edges={['top']}>
                    <StatusBar hidden />
                    <BlurHeader
                        title="Preparación"
                        subtitle="Prepárate para comenzar"
                        onBack={() => router.push('/(tabs)/rutinas')}
                        onMuteToggle={handleMuteToggle}
                        isMuted={isSoundMuted}
                        topBadge={
                            <View style={styles.topTimeBadge}>
                                <Text style={styles.topTimeText}>Restante: {formatTime(totalTimeRemaining)}</Text>
                            </View>
                        }
                    />

                    {/* Content with flex to fill space */}
                    <View style={styles.preparationContent}>
                        {/* Timer section */}
                        <View style={styles.preparationTimerSection}>
                            <TimerDisplay
                                timeLeft={preparationTimer.timeLeft}
                                label="Comienza en"
                                color="#ff8c00"
                                size="large"
                            />

                            <View style={styles.messageContainer}>
                                <Text style={styles.messageText}>
                                    {warmup.length > 0 ? 'El calentamiento comenzará pronto' : 'El entrenamiento comenzará pronto'}
                                </Text>
                            </View>
                        </View>

                        {/* Hero image - fills remaining space */}
                        <View style={styles.preparationHeroContainer}>
                            <Image
                                source={{
                                    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo8SV9K2nSNmRnltpZfSOP-FY36vOZDMd8NVJLfcHJNfC91AnJymmr42dt8NtUloEXziNBKrUArFq5a5SQJ559WJ1ysDt6OV4VNDpFq6MhYHpW8gLIjYCuh9uknVxhiR5AJNWz6ZaDoHGDbaqR0tVrPHWJdgV4VMbBFhP-1pg7Q8UAw3DqIwrFnKlS8fkDABBzHkEQ6X391eihEO1IRaRrN5iMp55IBmmNXgeD_qWgi64OhM-hGbPNEYHt4JKMFaImBjjoiOI_mww',
                                }}
                                style={styles.preparationHeroImage}
                                resizeMode="cover"
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(16, 34, 22, 0.9)', '#102216']}
                                style={styles.preparationHeroGradient}
                            />
                            <View style={styles.preparationHeroContent}>
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
                                        <Text style={styles.heroStatText}>{currentWorkout?.totalDuration || 45} Min</Text>
                                    </View>
                                    <View style={styles.heroStat}>
                                        <MaterialCommunityIcons
                                            name="fire"
                                            size={16}
                                            color="#13ec5b"
                                        />
                                        <Text style={styles.heroStatText}>{Math.round(((currentWorkout?.totalDuration || 45) * 8))} Kcal</Text>
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

                    {/* Bottom controls */}
                    <View style={styles.bottomControls}>
                        <TimerControls
                            isPlaying={preparationTimer.isActive}
                            onPlayPause={() => preparationTimer.toggle()}
                            onSkip={() => {
                                preparationTimer.pause();
                                if (warmup.length > 0) {
                                    transitionTo('warmup');
                                } else {
                                    transitionTo('workout');
                                }
                            }}
                            onReset={handleReset}
                            playButtonColor="#ff8c00"
                            disableReset={!preparationTimer.isActive && preparationTimer.timeLeft === (userData?.prepTimeInSeconds || 10)}
                        />
                    </View>
                </SafeAreaView>
            );
        }

        // WARMUP PHASE
        // WARMUP PHASE
        if (isWarmup) {
            const currentWarmupExercise = warmup[gymTimer.warmupIndex];

            return (
                <View style={styles.container}>
                    <StatusBar hidden />
                    {/* SpotifyButton removed */}
                    <BlurHeader
                        title="Calentamiento"
                        subtitle={`Ejercicio ${gymTimer.warmupIndex + 1} de ${warmup.length}`}
                        onBack={() => router.push('/(tabs)/rutinas')}
                        onMuteToggle={handleMuteToggle}
                        isMuted={isSoundMuted}
                        topBadge={
                            <View style={styles.topTimeBadge}>
                                <Text style={styles.topTimeText}>Restante: {formatTime(totalTimeRemaining)}</Text>
                            </View>
                        }
                    />

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Warmup Timer */}
                        <View style={styles.phaseSection}>
                            {/* Workout title above timer */}
                            <Text style={styles.warmupWorkoutTitle}>{workoutTitle}</Text>

                            <TimerDisplay
                                timeLeft={phaseTimer.timeLeft}
                                label="Tiempo restante"
                                color="#fbbf24"
                                size="large"
                            />

                            {currentWarmupExercise && (
                                <View style={styles.warmupExerciseContainer}>
                                    <Text style={styles.warmupExerciseName}>
                                        {currentWarmupExercise.name || currentWarmupExercise}
                                    </Text>
                                    {(() => {
                                        const exerciseName = currentWarmupExercise.name || currentWarmupExercise;
                                        const description = typeof currentWarmupExercise === 'object'
                                            ? currentWarmupExercise.description
                                            : null;
                                        const suggestion = getWarmupSuggestion(exerciseName);

                                        if (description) {
                                            return (
                                                <Text style={styles.warmupExerciseDescription}>
                                                    {description}
                                                </Text>
                                            );
                                        } else if (suggestion) {
                                            return (
                                                <Text style={styles.warmupExerciseDescription}>
                                                    {suggestion}
                                                </Text>
                                            );
                                        }
                                        return null;
                                    })()}
                                </View>
                            )}
                        </View>

                        {/* Exercises list */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Ejercicios de Calentamiento</Text>
                                <Pressable style={styles.editButton}>
                                    <Text style={styles.editButtonText}>Editar</Text>
                                </Pressable>
                            </View>

                            {/* Warmup exercises */}
                            {warmup.map((warmupEx: any, index: number) => {
                                const isCurrent = index === gymTimer.warmupIndex;
                                const warmupName = typeof warmupEx === 'object' ? warmupEx.name : warmupEx;
                                const warmupDuration = typeof warmupEx === 'object' ? warmupEx.duration : 300;

                                return (
                                    <Surface
                                        key={index}
                                        style={[
                                            styles.exerciseItem,
                                            isCurrent && styles.exerciseItemActive
                                        ]}
                                        elevation={0}
                                    >
                                        <View style={styles.exerciseIcon}>
                                            <MaterialCommunityIcons
                                                name="run"
                                                size={20}
                                                color={isCurrent ? "#13ec5b" : "#fbbf24"}
                                            />
                                        </View>
                                        <View style={styles.exerciseInfo}>
                                            <Text style={[
                                                styles.exerciseName,
                                                isCurrent && styles.exerciseNameActive
                                            ]}>
                                                {warmupName}
                                            </Text>
                                        </View>
                                        <View style={styles.exerciseBadge}>
                                            <Text style={styles.exerciseBadgeText}>
                                                {Math.floor(warmupDuration / 60)} min
                                            </Text>
                                        </View>
                                    </Surface>
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
                    <StatusBar hidden />
                    {/* SpotifyButton removed */}
                    <BlurHeader
                        title="Enfriamiento"
                        subtitle={`Ejercicio ${gymTimer.cooldownIndex + 1} de ${cooldown.length}`}
                        onBack={() => router.push('/(tabs)/rutinas')}
                        onMuteToggle={handleMuteToggle}
                        isMuted={isSoundMuted}
                        topBadge={
                            <View style={styles.topTimeBadge}>
                                <Text style={styles.topTimeText}>Restante: {formatTime(totalTimeRemaining)}</Text>
                            </View>
                        }
                    />

                    <ScrollView style={styles.content}>
                        <View style={styles.phaseSection}>
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
                                    </View>
                                    {typeof currentCooldownExercise === 'object' && currentCooldownExercise.description && (
                                        <Text style={styles.warmupDescription}>
                                            {currentCooldownExercise.description}
                                        </Text>
                                    )}
                                </Surface>
                            )}

                            {/* Google Search Button for Cooldown */}
                            {currentCooldownExercise && (
                                <Pressable
                                    style={styles.searchButton}
                                    onPress={() => {
                                        const exerciseName = typeof currentCooldownExercise === 'object'
                                            ? currentCooldownExercise.name
                                            : currentCooldownExercise;
                                        const searchQuery = encodeURIComponent(`${exerciseName} estiramiento como hacer`);
                                        Linking.openURL(`https://www.google.com/search?q=${searchQuery}`);
                                    }}
                                >
                                    <MaterialCommunityIcons name="google" size={20} color="#ffffff" />
                                    <Text style={styles.searchButtonText}>
                                        ¿Cómo hacer {typeof currentCooldownExercise === 'object' ? currentCooldownExercise.name : currentCooldownExercise}?
                                    </Text>
                                    <MaterialCommunityIcons name="open-in-new" size={16} color="#9ca3af" />
                                </Pressable>
                            )}
                        </View>
                    </ScrollView>

                    <View style={styles.bottomControls}>
                        <TimerControls
                            isPlaying={phaseTimer.isActive}
                            onPlayPause={handlePlayPausePhase}
                            onSkip={gymTimer.hasMoreCooldown ? handleSkipPhase : undefined}
                            onComplete={!gymTimer.hasMoreCooldown ? handleSkipPhase : undefined}
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
                    <StatusBar hidden />
                    {/* Pantalla limpia, solo modal */}

                    <WorkoutCompletedModal
                        visible={showCompletedModal}
                        duration={totalElapsedTime}
                        calories={Math.round((totalElapsedTime / 60) * 8)}
                        onSave={async (notes: string) => {
                            await completeWorkout(
                                'gym',
                                totalElapsedTime,
                                {
                                    title: (currentWorkout as any)?.title || 'Entrenamiento de Gym',
                                    difficulty: (currentWorkout as any)?.difficulty || 'intermediate',
                                    exercises: exercises.map((ex: any) => ({
                                        name: ex.name,
                                        sets: ex.sets,
                                        reps: ex.reps,
                                        weight: ex.weight,
                                    })),
                                    totalDuration: exercises.reduce((sum: number, ex: any) => sum + (ex.sets * 60), 0),
                                },
                                notes
                            );

                            // Invalidar caché del dashboard para forzar refresh
                            await AsyncStorage.removeItem('@dashboard_stats');

                            // Limpieza final antes de salir
                            phaseTimer.pause();
                            restTimer.pause();
                            audio.stopTickSound();
                            Speech.stop();
                            setShowCompletedModal(false);
                            onComplete?.();
                            router.replace('/(tabs)/rutinas');
                        }}
                        onSkip={() => {
                            // Limpieza final antes de salir
                            phaseTimer.pause();
                            restTimer.pause();
                            audio.stopTickSound();
                            Speech.stop();
                            setShowCompletedModal(false);
                            onComplete?.();
                            router.replace('/(tabs)/rutinas');
                        }}
                    />

                    {/* SuccessAlert eliminado - solo usamos WorkoutCompletedModal */}
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
                {/* SpotifyButton removed */}
                <BlurHeader
                    title={workoutTitle}
                    subtitle={`Ejercicio ${gymTimer.currentExerciseIndex + 1} de ${gymTimer.totalExercises}`}
                    onBack={() => router.push('/(tabs)/rutinas')}
                    onMuteToggle={handleMuteToggle}
                    isMuted={isSoundMuted}
                    topBadge={
                        <View style={styles.topTimeBadge}>
                            <Text style={styles.topTimeText}>Restante: {formatTime(totalTimeRemaining)}</Text>
                        </View>
                    }
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

                    {/* Google Search Button */}
                    <Pressable
                        style={styles.searchButton}
                        onPress={() => {
                            const searchQuery = encodeURIComponent(`${gymTimer.currentExercise.name} ejercicio como hacer`);
                            Linking.openURL(`https://www.google.com/search?q=${searchQuery}`);
                        }}
                    >
                        <MaterialCommunityIcons name="google" size={20} color="#ffffff" />
                        <Text style={styles.searchButtonText}>
                            ¿Cómo hacer {gymTimer.currentExercise.name}?
                        </Text>
                        <MaterialCommunityIcons name="open-in-new" size={16} color="#9ca3af" />
                    </Pressable>

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

                        {/* Secondary buttons */}
                        <View style={styles.secondaryButtons}>
                            <Pressable
                                style={styles.secondaryButton}
                                onPress={handlePauseWorkout}
                            >
                                <MaterialCommunityIcons
                                    name={isPaused ? "play" : "pause"}
                                    size={20}
                                    color="#9ca3af"
                                />
                                <Text style={styles.secondaryButtonText}>
                                    {isPaused ? 'Reanudar' : 'Pausar'}
                                </Text>
                            </Pressable>
                            <Pressable
                                style={styles.secondaryButton}
                                onPress={handleResetWorkout}
                            >
                                <MaterialCommunityIcons
                                    name="restart"
                                    size={20}
                                    color="#9ca3af"
                                />
                                <Text style={styles.secondaryButtonText}>Reiniciar</Text>
                            </Pressable>
                        </View>
                    </View>
                )}
            </SafeAreaView>
        );
    };

    return (
        <View style={styles.container}>
            {renderPhase()}
            {!isFinished && <SpotifyButton position="top-right" />}
        </View>
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
    preparationContent: {
        flex: 1,
        flexDirection: 'column',
    },
    preparationTimerSection: {
        padding: 24,
        gap: 24,
        alignItems: 'center',
    },
    preparationHeroContainer: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    preparationHeroImage: {
        width: '100%',
        height: '100%',
        opacity: 0.7,
    },
    preparationHeroGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '70%',
    },
    preparationHeroContent: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: 24,
        gap: 12,
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
    warmupWorkoutTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 16,
        opacity: 0.8,
    },
    warmupExerciseContainer: {
        marginTop: 24,
        padding: 20,
        backgroundColor: '#193322',
        borderRadius: 16,
        width: '90%',
        alignItems: 'center',
    },
    warmupExerciseName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 8,
    },
    warmupExerciseDescription: {
        fontSize: 14,
        color: '#d1d5db',
        textAlign: 'center',
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
    messageContainer: {
        padding: 24,
        marginHorizontal: 16,
        backgroundColor: 'rgba(255, 140, 0, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 140, 0, 0.2)',
        marginTop: 16,
    },
    messageText: {
        fontSize: 16,
        color: '#d1d5db',
        textAlign: 'center',
        lineHeight: 24,
    },
    topTimeBadge: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    topTimeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ffffff',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    searchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#1a3a2e',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
    },
    searchButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
        flex: 1,
    },
});
