import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useBoxeoTimer } from '../hooks/useBoxeoTimer';
import { Text, IconButton, Surface } from 'react-native-paper';
import { useWorkoutStore } from '@/features/workouts/store/useWorkoutStore';
import { useUserStore } from '@/features/profile/store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import Svg, { Circle } from 'react-native-svg';
import { formatTime, calculateTotalWorkoutTime } from '@/utils/timeUtils';

interface TimerBoxeoProps {
    sessionId?: string; // For realtime sync
    onTimeUpdate?: (elapsedTime: number) => void; // Callback para actualizar tiempo transcurrido
}

export const TimerBoxeo: React.FC<TimerBoxeoProps> = ({ sessionId = 'default', onTimeUpdate }) => {
    const { currentWorkout } = useWorkoutStore();
    const { userData } = useUserStore();

    // Estado de fase del entrenamiento
    const [phase, setPhase] = useState<'warmup' | 'workout' | 'cooldown' | 'finished'>('warmup');

    // 🔍 LOG: Ver qué workout está llegando





    // 🔍 ALERT para ver en pantalla (temporal para debugging)
    if (currentWorkout) {
        const debugInfo = `
Tipo: ${(currentWorkout as any).type || 'sin tipo'}
Título: ${currentWorkout.title || 'sin título'}
Tiene rounds: ${'rounds' in currentWorkout ? 'SÍ' : 'NO'}
Cantidad rounds: ${(currentWorkout as any).rounds?.length || 0}
        `.trim();

        // Descomentar para ver alert en pantalla:
        // Alert.alert('DEBUG Timer', debugInfo);

    }

    // Extraer warmup y cooldown del workout
    const warmup = (currentWorkout as any)?.warmup || [];
    const cooldown = (currentWorkout as any)?.cooldown || [];

    // Determine configuration from current workout
    // Map BoxingWorkout rounds to TimerConfig structure
    const workoutRounds = currentWorkout && 'rounds' in currentWorkout ? (currentWorkout as any).rounds.map((r: any) => ({
        roundNumber: r.roundNumber,
        workTime: r.workTime,
        restTime: r.restTime,
        exercises: r.exercises
    })) : undefined;

    // 🔍 LOG: Ver rounds procesados





    // Calculate prep time from user settings
    const prepMinutes = userData?.prepTimeMinutes || 0;
    const prepSeconds = userData?.prepTimeSeconds !== undefined ? userData.prepTimeSeconds : 10;
    const prepTimeInSeconds = (prepMinutes * 60) + prepSeconds;

    const { state, toggleTimer, resetTimer, skipToNextRound } = useBoxeoTimer(sessionId, {
        roundDuration: (currentWorkout as any)?.roundDuration || 180, // Default 3 mins if no rounds
        restDuration: (currentWorkout as any)?.restDuration || 60,    // Default 1 min
        totalRounds: (currentWorkout as any)?.rounds?.length || (currentWorkout as any)?.rounds || 12, // If array use length, if number use value, else 12
        rounds: workoutRounds,
        prepTime: prepTimeInSeconds,
        timerSoundEnabled: userData?.timerSoundEnabled
    });
    const { timeLeft, round, isRest, isActive, isPreparing } = state;

    // Get current round exercises
    const currentRoundInfo = workoutRounds?.[round - 1];
    const exercises = currentRoundInfo?.exercises || [
        { name: 'JAB + CROSS', description: 'Golpe rápido seguido de potencia', duration: 60 },
        { name: 'HOOK + UPPERCUT', description: 'Combinación lateral y ascendente', duration: 60 },
        { name: 'JAB + JAB + CROSS', description: 'Velocidad y potencia', duration: 60 }
    ];

    // Estado para el ejercicio actual que se muestra
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const hasSpokenExerciseCountdownRef = useRef<Set<string>>(new Set());
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const badgePulseAnim = useRef(new Animated.Value(1)).current;

    // Calcular qué ejercicio mostrar según el tiempo transcurrido del round
    useEffect(() => {
        if (!isPreparing && !isRest && isActive && exercises.length > 0) {
            const roundDuration = currentRoundInfo?.workTime || 180;
            const timeElapsed = roundDuration - timeLeft;

            // Calcular el ejercicio actual basado en el tiempo transcurrido
            let accumulatedTime = 0;
            let newExerciseIndex = 0;

            for (let i = 0; i < exercises.length; i++) {
                const exerciseDuration = exercises[i].duration || 30;
                if (timeElapsed >= accumulatedTime && timeElapsed < accumulatedTime + exerciseDuration) {
                    newExerciseIndex = i;
                    break;
                }
                accumulatedTime += exerciseDuration;

                // Si ya pasamos todos los ejercicios, quedarnos en el último
                if (i === exercises.length - 1) {
                    newExerciseIndex = i;
                }
            }

            // Solo cambiar si es diferente para evitar re-renders innecesarios
            if (newExerciseIndex !== currentExerciseIndex) {
                // Fade out
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    setCurrentExerciseIndex(newExerciseIndex);
                    // Fade in
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }).start();
                });
            }
        }
    }, [timeLeft, isPreparing, isRest, isActive, exercises, currentRoundInfo]);

    // Cuenta regresiva 3-2-1 antes de cambiar de ejercicio
    useEffect(() => {
        if (!isPreparing && !isRest && isActive && exercises.length > 1) {
            const roundDuration = currentRoundInfo?.workTime || 180;
            const timeElapsed = roundDuration - timeLeft;

            // Calcular tiempo hasta el siguiente ejercicio
            let accumulatedTime = 0;
            for (let i = 0; i <= currentExerciseIndex; i++) {
                accumulatedTime += exercises[i].duration || 30;
            }

            const timeUntilNextExercise = accumulatedTime - timeElapsed;

            // Si faltan 3, 2 o 1 segundos para el siguiente ejercicio (y no es el último)
            if (timeUntilNextExercise <= 3 && timeUntilNextExercise > 0 && currentExerciseIndex < exercises.length - 1) {
                const countdownKey = `${round}-${currentExerciseIndex}-${Math.floor(timeUntilNextExercise)}`;

                if (!hasSpokenExerciseCountdownRef.current.has(countdownKey)) {
                    hasSpokenExerciseCountdownRef.current.add(countdownKey);
                    Speech.speak(Math.floor(timeUntilNextExercise).toString(), {
                        language: 'es-ES',
                        pitch: 1.2,
                        rate: 1.0,
                    });

                }
            }

            // Limpiar el set cuando cambia de ejercicio
            if (timeUntilNextExercise > 3) {
                hasSpokenExerciseCountdownRef.current.clear();
            }
        }
    }, [timeLeft, isPreparing, isRest, isActive, currentExerciseIndex, exercises, round, currentRoundInfo]);

    // Reset exercise index when round changes
    useEffect(() => {
        setCurrentExerciseIndex(0);
        fadeAnim.setValue(1);
        hasSpokenExerciseCountdownRef.current.clear();
    }, [round, isPreparing, isRest]);

    // Hablar la instrucción cuando cambia el ejercicio
    useEffect(() => {
        if (!isPreparing && !isRest && isActive && exercises[currentExerciseIndex]) {
            const currentExercise = exercises[currentExerciseIndex];
            // Hablar la descripción del ejercicio
            const textToSpeak = currentExercise.description || currentExercise.name;

            Speech.speak(textToSpeak, {
                language: 'es-ES',
                pitch: 1.0,
                rate: 0.9,
            });


        }
    }, [currentExerciseIndex, isPreparing, isRest, isActive]);

    // Efecto de pulso para el timer
    useEffect(() => {
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );

        if (isActive && !isPreparing) {
            pulseAnimation.start();
        } else {
            pulseAnimation.stop();
            pulseAnim.setValue(1);
        }

        return () => pulseAnimation.stop();
    }, [isActive, isPreparing, pulseAnim]);

    // Efecto de glow para la tarjeta de instrucciones
    useEffect(() => {
        const glowAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: false,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: false,
                }),
            ])
        );

        if (!isPreparing && !isRest) {
            glowAnimation.start();
        } else {
            glowAnimation.stop();
            glowAnim.setValue(0);
        }

        return () => glowAnimation.stop();
    }, [isPreparing, isRest, glowAnim]);

    // Efecto de escala para el badge del round
    useEffect(() => {
        const badgeAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(badgePulseAnim, {
                    toValue: 1.08,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(badgePulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );

        if (isActive && !isPreparing && !isRest) {
            badgeAnimation.start();
        } else {
            badgeAnimation.stop();
            badgePulseAnim.setValue(1);
        }

        return () => badgeAnimation.stop();
    }, [isActive, isPreparing, isRest, badgePulseAnim]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Colors based on phase
    const timerColor = isPreparing ? '#fbbf24' : isRest ? '#60a5fa' : '#ef4444';
    const borderColor = isPreparing ? 'rgba(251, 191, 36, 0.5)' : isRest ? 'rgba(96, 165, 250, 0.5)' : 'rgba(239, 68, 68, 0.5)';
    const bgColor = isPreparing ? 'rgba(251, 191, 36, 0.1)' : isRest ? 'rgba(96, 165, 250, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    const gradientColors = isPreparing
        ? ['#fbbf24', '#f59e0b'] as const
        : isRest
            ? ['#60a5fa', '#3b82f6'] as const
            : ['#ef4444', '#dc2626'] as const;

    const glowColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.4)'],
    });

    const currentExercise = exercises[currentExerciseIndex];

    // Helper para hablar solo si está habilitado
    const speakIfEnabled = (text: string, options?: any) => {
        if (userData?.voiceEnabled !== false) {
            Speech.speak(text, options);
        }
    };

    // Estados para warmup/cooldown timer (deben estar antes de useMemo)
    const [warmupIndex, setWarmupIndex] = useState(0);
    const [cooldownIndex, setCooldownIndex] = useState(0);
    const [phaseTimeLeft, setPhaseTimeLeft] = useState(0);
    const [isPhaseActive, setIsPhaseActive] = useState(false);

    // Calcular tiempo total de la rutina
    const totalWorkoutTime = useMemo(() => {
        if (!workoutRounds || workoutRounds.length === 0) return 0;
        return calculateTotalWorkoutTime(workoutRounds, warmup, cooldown);
    }, [workoutRounds, warmup, cooldown]);

    // Calcular tiempo transcurrido basado en la fase actual
    const elapsedTime = useMemo(() => {
        let elapsed = 0;

        if (phase === 'warmup') {
            // Tiempo de ejercicios de warmup completados
            for (let i = 0; i < warmupIndex; i++) {
                elapsed += warmup[i]?.duration || 0;
            }
            // Tiempo del ejercicio actual
            const currentExerciseDuration = warmup[warmupIndex]?.duration || 0;
            elapsed += currentExerciseDuration - phaseTimeLeft;
        } else if (phase === 'workout') {
            // Todo el warmup
            elapsed = warmup.reduce((sum, ex) => sum + ex.duration, 0);
            // Rounds completados
            for (let i = 0; i < round - 1; i++) {
                elapsed += (workoutRounds[i]?.workTime || 0) + (workoutRounds[i]?.restTime || 0);
            }
            // Tiempo del round actual
            if (isRest) {
                elapsed += (workoutRounds[round - 1]?.workTime || 0);
                elapsed += (workoutRounds[round - 1]?.restTime || 0) - timeLeft;
            } else {
                elapsed += (workoutRounds[round - 1]?.workTime || 0) - timeLeft;
            }
        } else if (phase === 'cooldown') {
            // Todo el warmup
            elapsed = warmup.reduce((sum, ex) => sum + ex.duration, 0);
            // Todos los rounds
            elapsed += workoutRounds.reduce((sum, r) => sum + r.workTime + r.restTime, 0);
            // Ejercicios de cooldown completados
            for (let i = 0; i < cooldownIndex; i++) {
                elapsed += cooldown[i]?.duration || 0;
            }
            // Tiempo del ejercicio actual
            const currentExerciseDuration = cooldown[cooldownIndex]?.duration || 0;
            elapsed += currentExerciseDuration - phaseTimeLeft;
        } else if (phase === 'finished') {
            elapsed = totalWorkoutTime;
        }

        return elapsed;
    }, [phase, warmupIndex, cooldownIndex, phaseTimeLeft, round, timeLeft, isRest, warmup, cooldown, workoutRounds, totalWorkoutTime]);

    const remainingTime = totalWorkoutTime - elapsedTime;

    // Actualizar tiempo transcurrido en el componente padre
    useEffect(() => {
        if (onTimeUpdate) {
            onTimeUpdate(elapsedTime);
        }
    }, [elapsedTime, onTimeUpdate]);

    // Timer para warmup/cooldown
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isPhaseActive && phaseTimeLeft > 0) {
            interval = setInterval(() => {
                setPhaseTimeLeft(prev => {
                    if (prev <= 1) {
                        // Ejercicio terminado
                        if (phase === 'warmup' && warmupIndex < warmup.length - 1) {
                            // Siguiente ejercicio de warmup
                            setWarmupIndex(prev => prev + 1);
                            return warmup[warmupIndex + 1]?.duration || 0;
                        } else if (phase === 'cooldown' && cooldownIndex < cooldown.length - 1) {
                            // Siguiente ejercicio de cooldown
                            setCooldownIndex(prev => prev + 1);
                            return cooldown[cooldownIndex + 1]?.duration || 0;
                        } else {
                            // Fase terminada
                            setIsPhaseActive(false);
                            speakIfEnabled('Fase completada', { language: 'es-ES' });
                            return 0;
                        }
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPhaseActive, phaseTimeLeft, phase, warmupIndex, cooldownIndex, warmup, cooldown]);

    // Handlers para cambiar de fase
    const handleStartWarmup = () => {
        if (warmup.length > 0) {
            setWarmupIndex(0);
            setPhaseTimeLeft(warmup[0].duration);
            setIsPhaseActive(true);
            speakIfEnabled(`Comienza calentamiento: ${warmup[0].name}`, { language: 'es-ES' });
        }
    };

    const handleTogglePhase = () => {
        setIsPhaseActive(!isPhaseActive);
    };

    const handleSkipPhaseExercise = () => {
        if (phase === 'warmup' && warmupIndex < warmup.length - 1) {
            setWarmupIndex(prev => prev + 1);
            setPhaseTimeLeft(warmup[warmupIndex + 1]?.duration || 0);
            speakIfEnabled(warmup[warmupIndex + 1]?.name, { language: 'es-ES' });
        } else if (phase === 'cooldown' && cooldownIndex < cooldown.length - 1) {
            setCooldownIndex(prev => prev + 1);
            setPhaseTimeLeft(cooldown[cooldownIndex + 1]?.duration || 0);
            speakIfEnabled(cooldown[cooldownIndex + 1]?.name, { language: 'es-ES' });
        }
    };

    const handleStartWorkout = () => {
        setPhase('workout');
        setIsPhaseActive(false);
        speakIfEnabled('Comienza el entrenamiento', { language: 'es-ES' });
    };

    const handleFinishWorkout = () => {
        setPhase('cooldown');
        if (cooldown.length > 0) {
            setCooldownIndex(0);
            setPhaseTimeLeft(cooldown[0].duration);
            setIsPhaseActive(true);
            speakIfEnabled(`Comienza enfriamiento: ${cooldown[0].name}`, { language: 'es-ES' });
        }
    };

    const handleFinishCooldown = () => {
        setPhase('finished');
        setIsPhaseActive(false);
        speakIfEnabled('Entrenamiento finalizado, excelente trabajo', { language: 'es-ES' });
    };

    const handleResetRoutine = () => {
        setPhase('warmup');
        setWarmupIndex(0);
        setCooldownIndex(0);
        setPhaseTimeLeft(0);
        setIsPhaseActive(false);
        resetTimer();
        speakIfEnabled('Rutina reiniciada', { language: 'es-ES' });
    };

    // Renderizar fase de calentamiento
    if (phase === 'warmup' && warmup.length > 0) {
        const currentWarmupExercise = warmup[warmupIndex];

        return (
            <Surface style={styles.container} elevation={3}>

                <LinearGradient
                    colors={['#ef4444', '#dc2626']}
                    style={styles.phaseHeader}
                >
                    <Text style={styles.phaseIcon}>🔥</Text>
                    <Text variant="headlineSmall" style={styles.phaseTitle}>
                        CALENTAMIENTO
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#ffffff', marginTop: 4 }}>
                        Ejercicio {warmupIndex + 1} de {warmup.length}
                    </Text>
                </LinearGradient>

                {/* Timer del ejercicio actual */}
                {isPhaseActive && (
                    <View style={styles.phaseTimerContainer}>
                        <Text style={styles.phaseTimerText}>{formatTime(phaseTimeLeft)}</Text>
                        <Text style={styles.phaseTimerLabel}>tiempo restante</Text>
                        <Text variant="titleLarge" style={styles.currentPhaseName}>
                            {currentWarmupExercise?.name}
                        </Text>
                        <Text variant="bodyMedium" style={styles.currentPhaseDescription}>
                            {currentWarmupExercise?.description}
                        </Text>
                    </View>
                )}

                {/* Lista de ejercicios */}
                <View style={styles.phaseContent}>
                    {warmup.map((item: any, index: number) => (
                        <Surface
                            key={index}
                            style={[
                                styles.warmupCard,
                                index === warmupIndex && isPhaseActive && styles.warmupCardActive
                            ]}
                            elevation={index === warmupIndex && isPhaseActive ? 3 : 1}
                        >
                            <View style={styles.warmupHeader}>
                                <Text variant="titleMedium" style={styles.warmupName}>
                                    {index === warmupIndex && isPhaseActive ? '▶️ ' : ''}{item.name}
                                </Text>
                                <View style={styles.durationBadge}>
                                    <Text style={styles.durationText}>{item.duration}s</Text>
                                </View>
                            </View>
                            <Text variant="bodyMedium" style={styles.warmupDescription}>
                                {item.description}
                            </Text>
                        </Surface>
                    ))}
                </View>

                {/* Controles */}
                <View style={styles.phaseControls}>
                    {!isPhaseActive && phaseTimeLeft === 0 ? (
                        <>
                            <IconButton
                                icon="play"
                                iconColor="#ffffff"
                                size={48}
                                onPress={handleStartWarmup}
                                style={[styles.phaseButton, { backgroundColor: '#ef4444' }]}
                            />
                            <Text style={styles.phaseButtonLabel}>Iniciar Calentamiento</Text>
                        </>
                    ) : (
                        <>
                            <View style={styles.phaseControlsRow}>
                                <IconButton
                                    icon={isPhaseActive ? "pause" : "play"}
                                    iconColor="#ffffff"
                                    size={40}
                                    onPress={handleTogglePhase}
                                    style={[styles.phaseButton, { backgroundColor: '#ef4444' }]}
                                />
                                <IconButton
                                    icon="skip-next"
                                    iconColor="#ffffff"
                                    size={40}
                                    onPress={handleSkipPhaseExercise}
                                    style={[styles.phaseButton, { backgroundColor: '#f59e0b' }]}
                                />
                                <IconButton
                                    icon="check"
                                    iconColor="#ffffff"
                                    size={40}
                                    onPress={handleStartWorkout}
                                    style={[styles.phaseButton, { backgroundColor: '#10b981' }]}
                                />
                            </View>
                            <View style={styles.controlLabels}>
                                <Text style={styles.controlLabel}>
                                    {isPhaseActive ? 'Pausar' : 'Reanudar'}
                                </Text>
                                <Text style={styles.controlLabel}>Siguiente</Text>
                                <Text style={styles.controlLabel}>Comenzar Rutina</Text>
                            </View>
                        </>
                    )}
                </View>
            </Surface>
        );
    }

    // Renderizar fase de enfriamiento
    if (phase === 'cooldown' && cooldown.length > 0) {
        return (
            <Surface style={styles.container} elevation={3}>
                <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.phaseHeader}
                >
                    <Text style={styles.phaseIcon}>🧘</Text>
                    <Text variant="headlineSmall" style={styles.phaseTitle}>
                        ENFRIAMIENTO
                    </Text>
                </LinearGradient>

                <View style={styles.phaseContent}>
                    {cooldown.map((item: any, index: number) => (
                        <Surface key={index} style={styles.warmupCard} elevation={1}>
                            <View style={styles.warmupHeader}>
                                <Text variant="titleMedium" style={styles.warmupName}>
                                    {item.name}
                                </Text>
                                <View style={[styles.durationBadge, { backgroundColor: '#10b981' }]}>
                                    <Text style={styles.durationText}>{item.duration}s</Text>
                                </View>
                            </View>
                            <Text variant="bodyMedium" style={styles.warmupDescription}>
                                {item.description}
                            </Text>
                        </Surface>
                    ))}
                </View>

                <View style={styles.phaseControls}>
                    {!isPhaseActive && phaseTimeLeft === 0 ? (
                        <>
                            <IconButton
                                icon="check"
                                iconColor="#ffffff"
                                size={48}
                                onPress={handleFinishCooldown}
                                style={[styles.phaseButton, { backgroundColor: '#10b981' }]}
                            />
                            <Text style={styles.phaseButtonLabel}>Finalizar</Text>
                        </>
                    ) : (
                        <>
                            <View style={styles.phaseControlsRow}>
                                <IconButton
                                    icon={isPhaseActive ? "pause" : "play"}
                                    iconColor="#ffffff"
                                    size={40}
                                    onPress={handleTogglePhase}
                                    style={[styles.phaseButton, { backgroundColor: '#10b981' }]}
                                />
                                <IconButton
                                    icon="skip-next"
                                    iconColor="#ffffff"
                                    size={40}
                                    onPress={handleSkipPhaseExercise}
                                    style={[styles.phaseButton, { backgroundColor: '#f59e0b' }]}
                                />
                                <IconButton
                                    icon="check"
                                    iconColor="#ffffff"
                                    size={40}
                                    onPress={handleFinishCooldown}
                                    style={[styles.phaseButton, { backgroundColor: '#10b981' }]}
                                />
                            </View>
                            <View style={styles.controlLabels}>
                                <Text style={styles.controlLabel}>
                                    {isPhaseActive ? 'Pausar' : 'Reanudar'}
                                </Text>
                                <Text style={styles.controlLabel}>Siguiente</Text>
                                <Text style={styles.controlLabel}>Finalizar</Text>
                            </View>
                        </>
                    )}
                </View>
            </Surface>
        );
    }

    // Renderizar fase finalizada
    if (phase === 'finished') {
        return (
            <Surface style={styles.container} elevation={3}>
                <View style={styles.finishedContainer}>
                    <Text style={styles.finishedIcon}>🏆</Text>
                    <Text variant="headlineMedium" style={styles.finishedTitle}>
                        ¡Entrenamiento Completado!
                    </Text>
                    <Text variant="bodyLarge" style={styles.finishedSubtitle}>
                        Excelente trabajo 💪
                    </Text>
                    <IconButton
                        icon="refresh"
                        iconColor="#ef4444"
                        size={32}
                        onPress={() => setPhase('warmup')}
                        style={styles.resetButton}
                    />
                </View>
            </Surface>
        );
    }

    // Renderizar fase de workout (código original)
    return (
        <Surface
            style={[
                styles.container,
                {
                    borderColor: borderColor,
                    backgroundColor: bgColor,
                }
            ]}
            elevation={2}
        >
            {/* Badge del Round con efecto de pulso */}
            {!isPreparing && !isRest && (
                <Animated.View style={[styles.roundBadge, { transform: [{ scale: badgePulseAnim }] }]}>
                    <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.badgeGradient}
                    >
                        <Text style={styles.badgeText}>ROUND {round}/{state.totalRounds || 12}</Text>
                    </LinearGradient>
                </Animated.View>
            )}

            {/* Timer principal con efecto de pulso */}
            <Animated.Text
                style={[
                    styles.timerText,
                    {
                        color: timerColor,
                        transform: [{ scale: pulseAnim }]
                    }
                ]}
            >
                {formatTime(timeLeft)}
            </Animated.Text>

            {/* Fase actual */}
            <Text variant="titleMedium" style={styles.phaseText}>
                {isPreparing ? '⚡ PREPÁRATE' : isRest ? '💨 DESCANSO' : '🥊 TRABAJO INTENSO'}
            </Text>

            {/* Instrucciones dinámicas con fade */}
            {!isPreparing && !isRest && (
                <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
                    <Animated.View style={[styles.instructionCardWrapper, { backgroundColor: glowColor }]}>
                        <Surface style={styles.instructionCard} elevation={4}>
                            <LinearGradient
                                colors={['rgba(30, 30, 30, 0.95)', 'rgba(20, 20, 20, 0.95)'] as const}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.instructionGradient}
                            >
                                <Text style={styles.instructionLabel}>
                                    EJERCICIO {currentExerciseIndex + 1}/{exercises.length}
                                </Text>
                                <Text style={styles.instructionText}>
                                    {currentExercise.name}
                                </Text>
                                {currentExercise.description && (
                                    <Text style={styles.instructionDescription}>
                                        {currentExercise.description}
                                    </Text>
                                )}

                                {/* Mini timer circular por ejercicio */}
                                <View style={styles.exerciseTimerContainer}>
                                    {(() => {
                                        const roundDuration = currentRoundInfo?.workTime || 180;
                                        const timeElapsed = roundDuration - timeLeft;
                                        let accumulatedTime = 0;
                                        for (let i = 0; i < currentExerciseIndex; i++) {
                                            accumulatedTime += exercises[i].duration || 30;
                                        }
                                        const exerciseTimeElapsed = timeElapsed - accumulatedTime;
                                        const exerciseDuration = currentExercise.duration || 30;
                                        const exerciseTimeLeft = Math.max(0, exerciseDuration - exerciseTimeElapsed);
                                        const progress = Math.min(1, exerciseTimeElapsed / exerciseDuration);

                                        const size = 80;
                                        const strokeWidth = 6;
                                        const radius = (size - strokeWidth) / 2;
                                        const circumference = radius * 2 * Math.PI;
                                        const strokeDashoffset = circumference - (progress * circumference);

                                        return (
                                            <View style={styles.circularTimer}>
                                                <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                                                    {/* Círculo de fondo */}
                                                    <Circle
                                                        cx={size / 2}
                                                        cy={size / 2}
                                                        r={radius}
                                                        stroke="#4b5563"
                                                        strokeWidth={strokeWidth}
                                                        fill="none"
                                                    />
                                                    {/* Círculo de progreso */}
                                                    <Circle
                                                        cx={size / 2}
                                                        cy={size / 2}
                                                        r={radius}
                                                        stroke="#ef4444"
                                                        strokeWidth={strokeWidth}
                                                        fill="none"
                                                        strokeDasharray={circumference}
                                                        strokeDashoffset={strokeDashoffset}
                                                        strokeLinecap="round"
                                                    />
                                                </Svg>
                                                <View style={styles.circularTimerText}>
                                                    <Text style={styles.exerciseTimeText}>
                                                        {Math.ceil(exerciseTimeLeft)}
                                                    </Text>
                                                    <Text style={styles.exerciseTimeLabel}>seg</Text>
                                                </View>
                                            </View>
                                        );
                                    })()}
                                </View>

                                {/* Indicador de progreso */}
                                <View style={styles.progressDots}>
                                    {exercises.map((_: any, index: number) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.dot,
                                                index === currentExerciseIndex && styles.activeDot,
                                                {
                                                    backgroundColor: index === currentExerciseIndex
                                                        ? '#ef4444'
                                                        : '#4b5563'
                                                }
                                            ]}
                                        />
                                    ))}
                                </View>
                            </LinearGradient>
                        </Surface>
                    </Animated.View>
                </Animated.View>
            )}

            {/* Mensaje para preparación y descanso */}
            {(isPreparing || isRest) && (
                <View style={styles.messageContainer}>
                    <Text style={styles.messageText}>
                        {isPreparing ? 'El entrenamiento comenzará pronto' : 'Respira profundo y recupérate'}
                    </Text>
                </View>
            )}

            {/* Controles */}
            <View style={styles.controls}>
                <IconButton
                    icon={isActive ? "pause" : "play"}
                    iconColor="white"
                    size={48}
                    onPress={toggleTimer}
                    style={[styles.controlBtn, isActive && styles.controlBtnActive]}
                />

                <IconButton
                    icon="skip-next"
                    iconColor="white"
                    size={48}
                    onPress={skipToNextRound}
                    style={styles.controlBtn}
                />

                <IconButton
                    icon="refresh"
                    iconColor="white"
                    size={40}
                    onPress={resetTimer}
                    style={[styles.controlBtn, styles.resetRoundBtn]}
                />

                <IconButton
                    icon="restart"
                    iconColor="white"
                    size={40}
                    onPress={handleResetRoutine}
                    style={[styles.controlBtn, styles.resetRoutineBtn]}
                />
            </View>

            {/* Labels de botones */}
            <View style={styles.controlLabels}>
                <Text style={styles.controlLabel}>Play/Pause</Text>
                <Text style={styles.controlLabel}>Siguiente</Text>
                <Text style={styles.controlLabel}>Reset Round</Text>
                <Text style={styles.controlLabel}>Reset Todo</Text>
            </View>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 32,
        borderRadius: 24,
        borderWidth: 2,
        width: '100%',
        alignItems: 'center',
    },
    roundBadge: {
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
    },
    badgeGradient: {
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    badgeText: {
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    timerText: {
        fontSize: 80,
        fontWeight: 'bold',
        marginBottom: 8,
        fontVariant: ['tabular-nums'],
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 12,
    },
    phaseText: {
        color: '#ffffff',
        marginBottom: 24,
        textTransform: 'uppercase',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1.5,
    },
    instructionCardWrapper: {
        borderRadius: 16,
        padding: 3,
        marginBottom: 24,
    },
    instructionCard: {
        backgroundColor: 'transparent',
        borderRadius: 16,
        overflow: 'hidden',
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444',
    },
    instructionGradient: {
        padding: 20,
        alignItems: 'center',
    },
    instructionLabel: {
        color: '#9ca3af',
        fontSize: 11,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        fontWeight: '700',
    },
    instructionText: {
        color: '#ef4444',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 1,
        textAlign: 'center',
        textShadowColor: 'rgba(239, 68, 68, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    instructionDescription: {
        color: '#d1d5db',
        fontSize: 13,
        marginTop: 8,
        textAlign: 'center',
        fontWeight: '500',
    },
    progressDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    activeDot: {
        width: 24,
        height: 8,
        borderRadius: 4,
    },
    messageContainer: {
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    messageText: {
        color: '#d1d5db',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '600',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 8,
        marginBottom: 8,
    },
    controlBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        margin: 0,
    },
    controlBtnActive: {
        backgroundColor: 'rgba(239, 68, 68, 0.3)',
    },
    syncIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    syncDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4ade80',
        marginRight: 6,
    },
    syncText: {
        color: '#9ca3af',
        fontSize: 12,
        fontWeight: '600',
    },
    exerciseTimerContainer: {
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 8,
    },
    circularTimer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    circularTimerText: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    exerciseTimeText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#ef4444',
    },
    exerciseTimeLabel: {
        fontSize: 10,
        color: '#9ca3af',
        marginTop: -4,
    },
    // Estilos para fases (warmup, cooldown, finished)
    phaseHeader: {
        padding: 24,
        alignItems: 'center',
    },
    phaseIcon: {
        fontSize: 48,
        marginBottom: 8,
    },
    phaseTitle: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    phaseContent: {
        padding: 16,
    },
    warmupCard: {
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        backgroundColor: '#1f2937',
    },
    warmupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    warmupName: {
        color: '#ffffff',
        fontWeight: 'bold',
        flex: 1,
    },
    durationBadge: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    durationText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    warmupDescription: {
        color: '#d1d5db',
    },
    phaseControls: {
        alignItems: 'center',
        padding: 24,
    },
    phaseButton: {
        backgroundColor: '#ef4444',
    },
    phaseButtonLabel: {
        color: '#9ca3af',
        marginTop: 12,
        fontSize: 14,
    },
    finishedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    finishedIcon: {
        fontSize: 80,
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
    resetButton: {
        marginTop: 24,
    },
    // Estilos para timer de warmup/cooldown
    phaseTimerContainer: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#1f2937',
        marginHorizontal: 16,
        marginVertical: 16,
        borderRadius: 16,
    },
    phaseTimerText: {
        fontSize: 72,
        fontWeight: 'bold',
        color: '#ef4444',
    },
    phaseTimerLabel: {
        fontSize: 16,
        color: '#9ca3af',
        marginBottom: 16,
    },
    currentPhaseName: {
        color: '#ffffff',
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 16,
    },
    currentPhaseDescription: {
        color: '#d1d5db',
        textAlign: 'center',
        marginTop: 8,
    },
    warmupCardActive: {
        backgroundColor: '#4c1d95',
        borderWidth: 2,
        borderColor: '#ef4444',
    },
    phaseControlsRow: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
    },
    resetRoundBtn: {
        backgroundColor: '#f59e0b',
    },
    resetRoutineBtn: {
        backgroundColor: '#dc2626',
    },
    controlLabels: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        width: '100%',
        marginTop: 4,
        marginBottom: 8,
        paddingHorizontal: 8,
    },
    controlLabel: {
        fontSize: 9,
        color: '#9ca3af',
        textAlign: 'center',
        width: 70,
    },
    totalTimeIndicator: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1f2937',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
    },
    totalTimeLabel: {
        fontSize: 12,
        color: '#9ca3af',
        fontWeight: '600',
    },
    totalTimeValue: {
        fontSize: 16,
        color: '#10b981',
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
});
