import React, { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Animated, ScrollView, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBoxeoTimer } from '../hooks/useBoxeoTimer';
import { Text, IconButton, Surface } from 'react-native-paper';
import { useWorkoutStore } from '@/features/workouts/store/useWorkoutStore';
import { useUserStore } from '@/features/profile/store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useRouter } from 'expo-router';
import { useAudioPlayer, AudioSource } from 'expo-audio';
import { formatTime, calculateTotalWorkoutTime } from '@/utils/timeUtils';
import { PhaseBadge, IntensityBar, ExerciseCard, BlurHeader } from '@/components/timer';

interface TimerBoxeoProps {
    sessionId?: string;
    onTimeUpdate?: (elapsedTime: number) => void;
    workout?: any;
    onComplete?: () => void;
}

export const TimerBoxeoNew: React.FC<TimerBoxeoProps> = ({
    sessionId = 'default',
    onTimeUpdate,
    workout: workoutProp,
    onComplete
}) => {
    const { currentWorkout: storeWorkout } = useWorkoutStore();
    const { userData } = useUserStore();

    // Usar el workout pasado como prop, o el del store como fallback
    const currentWorkout = workoutProp || storeWorkout;

    const [phase, setPhase] = useState<'warmup' | 'workout' | 'cooldown' | 'finished'>('warmup');

    const warmup = (currentWorkout as any)?.warmup || [];
    const cooldown = (currentWorkout as any)?.cooldown || [];

    const workoutRounds = currentWorkout && 'rounds' in currentWorkout ? (currentWorkout as any).rounds.map((r: any) => ({
        roundNumber: r.roundNumber,
        workTime: r.workTime,
        restTime: r.restTime,
        exercises: r.exercises
    })) : undefined;

    const prepMinutes = userData?.prepTimeMinutes || 0;
    const prepSeconds = userData?.prepTimeSeconds !== undefined ? userData.prepTimeSeconds : 10;
    const prepTimeInSeconds = (prepMinutes * 60) + prepSeconds;

    const router = useRouter();
    const [isSoundMuted, setIsSoundMuted] = useState(false);
    const [userHasStarted, setUserHasStarted] = useState(false);

    const timerConfig = useMemo(() => ({
        roundDuration: (currentWorkout as any)?.roundDuration || 180,
        restDuration: (currentWorkout as any)?.restDuration || 60,
        totalRounds: (currentWorkout as any)?.rounds?.length || 12,
        rounds: workoutRounds,
        prepTime: prepTimeInSeconds,
        timerSoundEnabled: userHasStarted && !isSoundMuted && (userData?.timerSoundEnabled !== false)
    }), [currentWorkout, workoutRounds, prepTimeInSeconds, isSoundMuted, userData?.timerSoundEnabled, userHasStarted]);

    const { state, toggleTimer, resetTimer, skipToNextRound } = useBoxeoTimer(sessionId, timerConfig);
    const { timeLeft, round, isRest, isActive, isPreparing } = state;

    // Force pause if timer tries to auto-start before user interaction
    // This effect ensures strict compliance with "Wait for Play" rule
    useEffect(() => {
        if (!userHasStarted && isActive) {
            toggleTimer();
        }
    }, [isActive, userHasStarted]);

    // Efecto para el temporizador de warmup/cooldown
    useLayoutEffect(() => {
        let interval: NodeJS.Timeout;

        console.log('⏱️ [TIMER] Effect running', {
            isPhaseActive,
            phaseTimeLeft,
            isPreparing,
            userHasStarted,
            phase,
            willStart: isPhaseActive && phaseTimeLeft > 0 && !isPreparing && userHasStarted
        });

        // Strict condition: Only run if active, time remains, NOT preparing, and user explicitly started
        if (isPhaseActive && phaseTimeLeft > 0 && !isPreparing && userHasStarted) {
            console.log('⏱️ [TIMER] Starting interval - timer is now counting down');
            interval = setInterval(() => {
                setPhaseTimeLeft((prev) => {
                    if (prev <= 1) {
                        // Handle phase transition when time reaches 0
                        if (phase === 'warmup' && warmupIndex < warmup.length - 1) {
                            setWarmupIndex(prev => prev + 1);
                            speakIfEnabled(warmup[warmupIndex + 1]?.name, { language: 'es-ES' });
                            return warmup[warmupIndex + 1]?.duration || 0;
                        } else if (phase === 'cooldown' && cooldownIndex < cooldown.length - 1) {
                            setCooldownIndex(prev => prev + 1);
                            speakIfEnabled(cooldown[cooldownIndex + 1]?.name, { language: 'es-ES' });
                            return cooldown[cooldownIndex + 1]?.duration || 0;
                        } else {
                            // Last exercise finished, transition to next phase
                            console.log('⏱️ [TIMER] Setting isPhaseActive to false - exercise finished');
                            setIsPhaseActive(false);
                            if (phase === 'warmup') {
                                handleStartWorkout();
                            } else if (phase === 'cooldown') {
                                handleFinishCooldown();
                            }
                            return 0;
                        }
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            console.log('⏱️ [TIMER] NOT starting interval - conditions not met');
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPhaseActive, phaseTimeLeft, isPreparing, userHasStarted, phase, warmupIndex, warmup, cooldownIndex, cooldown]);

    // Efecto para el sonido de tic-tac en fases locales (warmup/cooldown)
    useEffect(() => {
        const isInPhase = phase === 'warmup' || phase === 'cooldown';

        console.log('🔊 [SOUND] Effect running', {
            isPhaseActive,
            isInPhase,
            phaseTimeLeft,
            isPreparing,
            userHasStarted,
            isSoundMuted,
            timerSoundEnabled: userData?.timerSoundEnabled,
            willPlay: isPhaseActive && isInPhase && phaseTimeLeft > 0 && !isPreparing && userHasStarted && !isSoundMuted && (userData?.timerSoundEnabled !== false)
        });

        // Strict audio condition: Only play if phase is active, in warmup/cooldown, time remains, NOT preparing, and user started
        if (isPhaseActive && isInPhase && phaseTimeLeft > 0 && !isPreparing && userHasStarted && !isSoundMuted && (userData?.timerSoundEnabled !== false)) {
            console.log('🔊 [SOUND] Attempting to play tick-tack sound');
            try {
                if (phaseTickPlayer && !phaseTickPlayer.playing) {
                    phaseTickPlayer.loop = true;
                    phaseTickPlayer.play();
                    console.log('🔊 [SOUND] Tick-tack sound started');
                } else {
                    console.log('🔊 [SOUND] Tick-tack already playing');
                }
            } catch (error) {
                console.error('Error playing phase tick sound:', error);
            }
        } else {
            console.log('🔊 [SOUND] Pausing tick-tack sound (conditions not met)');
            try {
                if (phaseTickPlayer && phaseTickPlayer.playing) {
                    phaseTickPlayer.pause();
                    console.log('🔊 [SOUND] Tick-tack sound paused');
                }
            } catch (error) {
                console.error('Error pausing phase tick sound:', error);
            }
        }

        return () => {
            try {
                if (phaseTickPlayer && phaseTickPlayer.playing) {
                    phaseTickPlayer.pause();
                }
            } catch (error) {
                // Silently ignore cleanup errors
            }
        };
    }, [isPhaseActive, phase, phaseTimeLeft, isSoundMuted, userData?.timerSoundEnabled, isPreparing, userHasStarted]);

    const handlePlayPress = () => {
        if (!userHasStarted) {
            setUserHasStarted(true);
        }

        if (isPreparing) {
            toggleTimer();
        } else {
            handleTogglePhase();
        }
    };



    const currentRoundInfo = workoutRounds?.[round - 1];
    const exercises = currentRoundInfo?.exercises || [
        { name: 'JAB - CROSS - HOOK', description: 'Gira el pie delantero al lanzar el Hook.', duration: 60 },
    ];

    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const hasSpokenExerciseCountdownRef = useRef<Set<string>>(new Set());
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const prevIsPreparing = useRef(true);

    // Estados para warmup/cooldown
    const [warmupIndex, setWarmupIndex] = useState(0);
    const [cooldownIndex, setCooldownIndex] = useState(0);
    const [phaseTimeLeft, setPhaseTimeLeft] = useState(0);
    const [isPhaseActive, setIsPhaseActive] = useState(false);

    // Audio player para tick-tack en warmup/cooldown
    const phaseTickPlayer = useAudioPlayer(require('../../../../assets/tictac.mp3') as AudioSource);


    // Usar el tiempo total del workout generado por la IA (viene en minutos)
    const totalWorkoutTime = useMemo(() => {
        // Si el workout tiene totalDuration, usarlo (está en minutos, convertir a segundos)
        if (currentWorkout?.totalDuration) {
            return currentWorkout.totalDuration * 60;
        }

        // Fallback: calcular manualmente
        let total = 0;

        // Warmup
        warmup.forEach((w: any) => total += w.duration || 0);

        // Rounds (work + rest)
        if (workoutRounds) {
            workoutRounds.forEach((r: any) => {
                total += (r.workTime || 180) + (r.restTime || 60);
            });
        } else {
            const roundDuration = (currentWorkout as any)?.roundDuration || 180;
            const restDuration = (currentWorkout as any)?.restDuration || 60;
            const totalRounds = state.totalRounds || 12;
            total += (roundDuration + restDuration) * totalRounds;
        }

        // Cooldown
        cooldown.forEach((c: any) => total += c.duration || 0);

        return total;
    }, [currentWorkout, warmup, cooldown, workoutRounds, state.totalRounds]);

    ;
    ;
    ;

    // Calcular tiempo restante total - método simplificado
    const totalTimeRemaining = useMemo(() => {
        let timeElapsed = 0;

        // IMPORTANTE: Verificar primero si estamos en preparación, antes de verificar la fase
        // Si estamos en preparación (del hook de boxeo)
        if (isPreparing) {
            // El tiempo restante es todo el workout + el tiempo de preparación restante
            return totalWorkoutTime + timeLeft;
        }

        // Si estamos en WARMUP (fase del componente, no del hook)
        if (phase === 'warmup') {
            // Tiempo transcurrido del warmup
            for (let i = 0; i < warmupIndex; i++) {
                timeElapsed += warmup[i]?.duration || 0;
            }
            // Tiempo transcurrido del ejercicio actual de warmup
            const currentExerciseDuration = warmup[warmupIndex]?.duration || 0;
            timeElapsed += (currentExerciseDuration - phaseTimeLeft);

            // El resto del workout aún no ha empezado
            const remaining = totalWorkoutTime - timeElapsed;
            return Math.max(0, remaining);
        }

        // Si estamos en COOLDOWN
        if (phase === 'cooldown') {
            // Ya completamos warmup y workout, solo falta cooldown

            // Sumar todo el warmup
            warmup.forEach((w: any) => timeElapsed += w.duration || 0);

            // Sumar todos los rounds
            if (workoutRounds) {
                workoutRounds.forEach((r: any) => {
                    timeElapsed += (r.workTime || 180) + (r.restTime || 60);
                });
            } else {
                const roundDuration = (currentWorkout as any)?.roundDuration || 180;
                const restDuration = (currentWorkout as any)?.restDuration || 60;
                const totalRounds = state.totalRounds || 12;
                timeElapsed += (roundDuration + restDuration) * totalRounds;
            }

            // Sumar cooldown completado
            for (let i = 0; i < cooldownIndex; i++) {
                timeElapsed += cooldown[i]?.duration || 0;
            }
            // Tiempo transcurrido del ejercicio actual de cooldown
            const currentCooldownDuration = cooldown[cooldownIndex]?.duration || 0;
            timeElapsed += (currentCooldownDuration - phaseTimeLeft);

            const remaining = totalWorkoutTime - timeElapsed;
            return Math.max(0, remaining);
        }

        // Si estamos en WORKOUT (fase principal)
        // Necesitamos incluir el tiempo del warmup que ya pasó

        // Sumar todo el warmup que ya completamos
        warmup.forEach((w: any) => timeElapsed += w.duration || 0);

        // Calcular tiempo transcurrido de rounds completados
        if (workoutRounds) {
            // Rounds completados
            for (let i = 0; i < round - 1; i++) {
                const r = workoutRounds[i];
                timeElapsed += (r.workTime || 180) + (r.restTime || 60);
            }

            // Round actual
            if (round <= workoutRounds.length) {
                const currentRoundData = workoutRounds[round - 1];
                const roundWorkTime = currentRoundData?.workTime || 180;
                const roundRestTime = currentRoundData?.restTime || 60;

                if (isRest) {
                    // Ya completamos el trabajo, estamos en descanso
                    timeElapsed += roundWorkTime;
                    timeElapsed += (roundRestTime - timeLeft); // Tiempo transcurrido del descanso
                } else {
                    // Estamos en trabajo
                    timeElapsed += (roundWorkTime - timeLeft); // Tiempo transcurrido del trabajo
                }
            }
        } else {
            // Fallback para workouts sin estructura de rounds
            const roundDuration = (currentWorkout as any)?.roundDuration || 180;
            const restDuration = (currentWorkout as any)?.restDuration || 60;

            // Rounds completados
            timeElapsed += (round - 1) * (roundDuration + restDuration);

            // Round actual
            if (isRest) {
                timeElapsed += roundDuration;
                timeElapsed += (restDuration - timeLeft);
            } else {
                timeElapsed += (roundDuration - timeLeft);
            }
        }

        // Tiempo restante = tiempo total - tiempo transcurrido
        const remaining = totalWorkoutTime - timeElapsed;
        return Math.max(0, remaining); // No puede ser negativo
    }, [phase, warmupIndex, warmup, cooldownIndex, cooldown, phaseTimeLeft, totalWorkoutTime, timeLeft, isPreparing, isRest, round, workoutRounds, currentWorkout, state.totalRounds]);

    ;

    // Calcular ejercicio actual
    useEffect(() => {
        if (!isPreparing && !isRest && isActive && exercises.length > 0) {
            const roundDuration = currentRoundInfo?.workTime || 180;
            const timeElapsed = roundDuration - timeLeft;

            let accumulatedTime = 0;
            let newExerciseIndex = 0;

            for (let i = 0; i < exercises.length; i++) {
                const exerciseDuration = exercises[i].duration || 30;
                if (timeElapsed >= accumulatedTime && timeElapsed < accumulatedTime + exerciseDuration) {
                    newExerciseIndex = i;
                    break;
                }
                accumulatedTime += exerciseDuration;

                if (i === exercises.length - 1) {
                    newExerciseIndex = i;
                }
            }

            if (newExerciseIndex !== currentExerciseIndex) {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    setCurrentExerciseIndex(newExerciseIndex);
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }).start();
                });
            }
        }
    }, [timeLeft, isPreparing, isRest, isActive, exercises, currentRoundInfo]);

    // Efecto de pulso para el timer
    useEffect(() => {
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.05,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
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
            scaleAnim.setValue(1);
        }

        return () => pulseAnimation.stop();
    }, [isActive, isPreparing, scaleAnim]);

    // Reset exercise index cuando cambia el round
    // Intercept finish of "Preparation" to start "Warmup"
    useEffect(() => {
        if (prevIsPreparing.current && !isPreparing) {
            console.log('🎯 [PREP_FINISH] Preparation finished, transitioning to warmup', {
                phase,
                isActive,
                userHasStarted,
                warmupLength: warmup.length
            });

            // Hook just finished preparation phase.
            // If we have a warmup, we should PAUSE the timer (which is now in Round 1)
            // and start our local warmup phase.
            if (phase === 'warmup') {
                if (warmup.length > 0) {
                    console.log('🎯 [PREP_FINISH] Initializing warmup');

                    // Initialize warmup and auto-start it
                    const warmupDuration = warmup[0].duration;
                    console.log('🎯 [PREP_FINISH] Setting states - phaseTimeLeft:', warmupDuration, 'isPhaseActive: true');

                    // Set both states together
                    setPhaseTimeLeft(warmupDuration);
                    setIsPhaseActive(true);

                    // Pause the hook timer AFTER setting states
                    if (isActive) {
                        console.log('🎯 [PREP_FINISH] Pausing hook timer');
                        toggleTimer();
                    }

                    speakIfEnabled(warmup[0].name, { language: 'es-ES' });
                } else {
                    console.log('🎯 [PREP_FINISH] No warmup, transitioning to workout');
                    // No warmup, transition directly to workout
                    // The hook is already running Round 1, so we just update the phase
                    setPhase('workout');
                }
            }
        }
        prevIsPreparing.current = isPreparing;
    }, [isPreparing, isActive, phase, warmup, userHasStarted]);

    useEffect(() => {
        setCurrentExerciseIndex(0);
        fadeAnim.setValue(1);
        hasSpokenExerciseCountdownRef.current.clear();
    }, [round, isPreparing, isRest]);

    // Debug effect to track state changes
    useEffect(() => {
        console.log('📍 [STATE_CHANGE] isPhaseActive or phaseTimeLeft changed', {
            isPhaseActive,
            phaseTimeLeft,
            phase,
            isPreparing,
            userHasStarted
        });
    }, [isPhaseActive, phaseTimeLeft]);

    const speakIfEnabled = (text: string, options?: any) => {
        if (userData?.voiceEnabled !== false) {
            Speech.speak(text, options);
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
        console.log('🏋️ [WORKOUT_START] handleStartWorkout called - setting isPhaseActive to false');
        setPhase('workout');
        setIsPhaseActive(false);
        speakIfEnabled('Comienza el entrenamiento', { language: 'es-ES' });
        // Resume global timer (Round 1) if it was paused
        if (!isActive) {
            toggleTimer();
        }
    };

    const handleFinishWorkout = () => {
        setPhase('cooldown');
        if (cooldown.length > 0) {
            setCooldownIndex(0);
            setPhaseTimeLeft(cooldown[0].duration);
            // Don't auto-start cooldown - user must press play
            speakIfEnabled(`Comienza enfriamiento: ${cooldown[0].name}`, { language: 'es-ES' });
        }
    };

    const handleFinishCooldown = () => {
        setPhase('finished');
        setIsPhaseActive(false);
        speakIfEnabled('Entrenamiento finalizado, excelente trabajo', { language: 'es-ES' });
    };

    // Funciones para skip en WARMUP y COOLDOWN
    const handleSkipExercise = () => {
        console.log('⏭️ [SKIP] Called handleSkipExercise', {
            isPreparing,
            phase,
            userHasStarted,
            isPhaseActive,
            warmupIndex,
            phaseTimeLeft
        });

        // IMPORTANTE: Verificar primero si estamos en preparación antes de las fases locales
        if (isPreparing) {
            console.log('⏭️ [SKIP] In preparation, setting userHasStarted and calling skipToNextRound');
            // Marcar que el usuario ha iniciado (para que el timer y sonido funcionen)
            if (!userHasStarted) {
                setUserHasStarted(true);
                console.log('⏭️ [SKIP] Set userHasStarted to TRUE');
            }
            // Saltar la preparación usando la función del hook
            skipToNextRound();
            return;
        }

        if (phase === 'warmup') {
            if (warmupIndex < warmup.length - 1) {
                console.log('⏭️ [SKIP] Skipping to next warmup exercise', warmupIndex + 1);
                // Ir al siguiente ejercicio de warmup
                setWarmupIndex(warmupIndex + 1);
                setPhaseTimeLeft(warmup[warmupIndex + 1]?.duration || 0);
                ;
            } else {
                console.log('⏭️ [SKIP] Warmup finished, moving to workout');
                // Terminar warmup e ir a workout
                setPhase('workout');
                ;
            }
        } else if (phase === 'cooldown') {
            if (cooldownIndex < cooldown.length - 1) {
                console.log('⏭️ [SKIP] Skipping to next cooldown exercise', cooldownIndex + 1);
                // Ir al siguiente ejercicio de cooldown
                setCooldownIndex(cooldownIndex + 1);
                setPhaseTimeLeft(cooldown[cooldownIndex + 1]?.duration || 0);
                ;
            } else {
                console.log('⏭️ [SKIP] Cooldown finished, moving to finished');
                // Terminar cooldown
                setPhase('finished');
                setIsPhaseActive(false);
                ;
            }
        } else if (phase === 'workout') {
            console.log('⏭️ [SKIP] In workout, calling skipToNextRound');
            // Usar la función del hook de boxeo
            skipToNextRound();
        }
    };

    const handlePreviousExercise = () => {
        if (phase === 'warmup') {
            if (warmupIndex > 0) {
                // Ir al ejercicio anterior de warmup
                setWarmupIndex(warmupIndex - 1);
                setPhaseTimeLeft(warmup[warmupIndex - 1]?.duration || 0);
                ;
            }
        } else if (phase === 'cooldown') {
            if (cooldownIndex > 0) {
                // Ir al ejercicio anterior de cooldown
                setCooldownIndex(cooldownIndex - 1);
                setPhaseTimeLeft(cooldown[cooldownIndex - 1]?.duration || 0);
                ;
            } else {
                // Volver a workout
                setPhase('workout');
                ;
            }
        } else if (phase === 'workout') {
            // En workout, volver al warmup si estamos en el primer round
            if (round === 1 && !isRest) {
                setPhase('warmup');
                setWarmupIndex(warmup.length - 1);
                setPhaseTimeLeft(warmup[warmup.length - 1]?.duration || 0);
                ;
            }
            // Si no, no hacer nada (o podrías implementar lógica para volver al round anterior)
        }
    };


    const handleResetRoutine = () => {
        console.log('🔄 [RESET] Resetting routine');
        setPhase('warmup');
        setWarmupIndex(0);
        setCooldownIndex(0);
        setPhaseTimeLeft(0);
        setIsPhaseActive(false);
        setUserHasStarted(false); // Reset user interaction state
        setCurrentExerciseIndex(0); // Reset exercise index
        resetTimer(); // Reset hook state (isPreparing, round, etc.)
        console.log('🔄 [RESET] All states reset', {
            phase: 'warmup',
            warmupIndex: 0,
            isPhaseActive: false,
            userHasStarted: false
        });
    };

    const handleBack = () => {
        router.back();
    };

    const handleMuteToggle = () => {
        setIsSoundMuted(!isSoundMuted);
    };


    // Colores según la fase
    const phaseColors = isPreparing
        ? { primary: '#ff8c00', gradient: ['#ff8c00', '#f59e0b'] as [string, string], bg: '#221010' }
        : isRest
            ? { primary: '#2dd4bf', gradient: ['#2dd4bf', '#0891b2'] as [string, string], bg: '#0f172a' }
            : { primary: '#ec1313', gradient: ['#ec1313', '#dc2626'] as [string, string], bg: '#221010' };

    const currentExercise = exercises[currentExerciseIndex];

    // WARMUP PHASE - Mostrar isPreparing antes del warmup
    if (phase === 'warmup' && (isPreparing || warmup.length > 0)) {
        const currentWarmupExercise = warmup[warmupIndex];
        const displayTime = isPreparing ? timeLeft : phaseTimeLeft || warmup[0]?.duration || 300;
        const displayTitle = isPreparing ? "PREPÁRATE" : (currentWarmupExercise?.name || 'Calentamiento').toUpperCase();

        return (
            <SafeAreaView style={[styles.container, { backgroundColor: phaseColors.bg }]} edges={['top', 'left', 'right']}>
                <StatusBar hidden />
                <BlurHeader
                    subtitle={isPreparing ? "Preparación" : "Calentamiento"}
                    onBack={handleBack}
                    onMuteToggle={handleMuteToggle}
                    isMuted={isSoundMuted}
                    topBadge={
                        <View style={styles.topTimeBadge}>
                            <Text style={styles.topTimeText}>Restante: {formatTime(totalTimeRemaining)}</Text>
                        </View>
                    }
                />

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.phaseHeader}>
                        <Text style={styles.phaseTitle}>{displayTitle}</Text>
                        {!isPreparing && (
                            <View style={styles.phaseBadgeContainer}>
                                <View style={styles.phaseDot} />
                                <Text style={styles.phaseBadgeText}>Preparación Física</Text>
                            </View>
                        )}
                    </View>

                    {/* Timer grande */}
                    <View style={styles.timerSection}>

                        <Animated.Text style={[styles.timerLarge, { color: phaseColors.primary, transform: [{ scale: scaleAnim }] }]}>
                            {formatTime(displayTime)}
                        </Animated.Text>
                        <View style={styles.timerLabel}>
                            <MaterialCommunityIcons name="timer-outline" size={16} color="rgba(255, 255, 255, 0.6)" />
                            <Text style={styles.timerLabelText}>{isPreparing ? 'Comienza en' : 'Tiempo de calentamiento'}</Text>
                        </View>
                    </View>

                    {/* Content */}
                    {isPreparing ? (
                        <View style={styles.messageContainer}>
                            <Text style={styles.messageText}>El calentamiento comenzará pronto</Text>
                        </View>
                    ) : (
                        <>
                            <ExerciseCard
                                title={currentWarmupExercise?.name || 'Ejercicio de Calentamiento'}
                                description={currentWarmupExercise?.description || 'Prepara tu cuerpo para el entrenamiento'}
                                currentStep="Ejercicio Actual"
                                colors={['#ff8c00', '#f97316']}
                                animated={isPhaseActive}
                            />

                            <View style={styles.nextExercise}>
                                <Text style={styles.nextLabel}>Siguiente Ejercicio</Text>
                                <Text style={styles.nextText}>
                                    {warmup[warmupIndex + 1]?.name || 'Entrenamiento Principal'}
                                </Text>
                            </View>
                        </>
                    )}
                </ScrollView>

                {/* Controls */}
                <View style={styles.controlsContainer}>
                    <View style={styles.controlButtons}>
                        <Pressable style={styles.skipButton} onPress={handleResetRoutine}>
                            <MaterialCommunityIcons name="restart" size={28} color="#ffffff" />
                        </Pressable>
                        <Pressable style={styles.skipButton} onPress={handlePreviousExercise} disabled={isPreparing}>
                            <MaterialCommunityIcons name="skip-previous" size={28} color={isPreparing ? "rgba(255,255,255,0.2)" : "#ffffff"} />
                        </Pressable>
                        <Pressable
                            style={[styles.playButton, { backgroundColor: isPreparing ? phaseColors.primary : '#ec1313' }]}
                            onPress={handlePlayPress}
                        >
                            <MaterialCommunityIcons name={(isPreparing ? isActive : isPhaseActive) ? "pause" : "play"} size={42} color="#ffffff" />
                        </Pressable>
                        <Pressable style={styles.skipButton} onPress={handleSkipExercise} disabled={false}>
                            <MaterialCommunityIcons name="skip-next" size={28} color="#ffffff" />
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // COOLDOWN PHASE
    if (phase === 'cooldown' && cooldown.length > 0) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: '#0f172a' }]} edges={['top', 'left', 'right']}>
                <StatusBar hidden />
                <BlurHeader
                    subtitle="Fase Final"
                    onBack={handleBack}
                    onMuteToggle={handleMuteToggle}
                    isMuted={isSoundMuted}
                    topBadge={
                        <View style={styles.topTimeBadge}>
                            <Text style={styles.topTimeText}>Restante: {formatTime(totalTimeRemaining)}</Text>
                        </View>
                    }
                />

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.phaseHeader}>
                        <Text style={styles.phaseTitle}>COOL DOWN</Text>
                        <View style={styles.phaseBadgeContainer}>
                            <View style={[styles.phaseDot, { backgroundColor: '#2dd4bf' }]} />
                            <Text style={[styles.phaseBadgeText, { color: '#2dd4bf' }]}>Recuperación</Text>
                        </View>
                    </View>

                    <View style={styles.timerSection}>

                        <Animated.Text style={[styles.timerLarge, { transform: [{ scale: scaleAnim }] }]}>
                            {formatTime(phaseTimeLeft || cooldown[0]?.duration || 45)}
                        </Animated.Text>
                        <View style={styles.timerLabel}>
                            <MaterialCommunityIcons name="timer-outline" size={16} color="rgba(255, 255, 255, 0.6)" />
                            <Text style={styles.timerLabelText}>Tiempo Restante</Text>
                        </View>
                    </View>

                    <ExerciseCard
                        title="HOMBRO - DERECHO"
                        description="Cruza el brazo sobre el pecho y presiona suavemente hacia ti. Respira profundo."
                        currentStep="Estiramiento Actual"
                        colors={['#2dd4bf', '#0891b2']}
                        totalSteps={3}
                        currentStepIndex={1}
                        animated={isPhaseActive}
                    />

                    <View style={styles.nextExercise}>
                        <Text style={[styles.nextLabel, { color: '#2dd4bf' }]}>Siguiente</Text>
                        <Text style={styles.nextText}>Estiramiento de Hombro Izquierdo</Text>
                    </View>
                </ScrollView>

                <View style={styles.controlsContainer}>
                    <View style={styles.controlButtons}>
                        <Pressable style={styles.skipButton} onPress={handleResetRoutine}>
                            <MaterialCommunityIcons name="restart" size={28} color="#ffffff" />
                        </Pressable>
                        <Pressable style={styles.skipButton} onPress={handlePreviousExercise}>
                            <MaterialCommunityIcons name="skip-previous" size={28} color="#ffffff" />
                        </Pressable>
                        <Pressable style={[styles.playButton, { backgroundColor: '#2dd4bf' }]} onPress={handleTogglePhase}>
                            <MaterialCommunityIcons name={isPhaseActive ? "pause" : "play"} size={42} color="#ffffff" />
                        </Pressable>
                        <Pressable style={styles.skipButton} onPress={handleSkipExercise}>
                            <MaterialCommunityIcons name="skip-next" size={28} color="#ffffff" />
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // FINISHED PHASE
    if (phase === 'finished') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: '#221010', justifyContent: 'center', alignItems: 'center' }]} edges={['top', 'left', 'right']}>
                <StatusBar hidden />
                <Text style={styles.finishedIcon}>🏆</Text>
                <Text style={styles.finishedTitle}>¡Entrenamiento Completado!</Text>
                <Text style={styles.finishedSubtitle}>Excelente trabajo 💪</Text>
                <IconButton
                    icon="refresh"
                    iconColor="#ec1313"
                    size={32}
                    onPress={() => setPhase('warmup')}
                    style={styles.resetButton}
                />
            </SafeAreaView>
        );
    }

    // WORKOUT PHASE
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: phaseColors.bg }]} edges={['top', 'left', 'right']}>
            <StatusBar hidden />
            <BlurHeader
                subtitle="Entrenamiento"
                onBack={handleBack}
                onMuteToggle={handleMuteToggle}
                isMuted={isSoundMuted}
                topBadge={
                    <View style={styles.topTimeBadge}>
                        <Text style={styles.topTimeText}>Restante: {formatTime(totalTimeRemaining)}</Text>
                    </View>
                }
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Round badge */}
                {!isPreparing && !isRest && (
                    <View style={styles.roundBadgeContainer}>
                        <PhaseBadge
                            text={`ROUND ${round}/${state.totalRounds || 12}`}
                            colors={phaseColors.gradient}
                            animated={true}
                        />
                    </View>
                )}

                {/* Phase indicator */}
                <View style={styles.phaseHeader}>
                    <Text style={[styles.phaseTitle, { fontSize: 32 }]}>
                        {isPreparing ? 'PREPÁRATE' : isRest ? 'DESCANSO' : `ROUND ${round}`}
                        {!isPreparing && !isRest && <Text style={styles.phaseSubtitle}> / {state.totalRounds}</Text>}
                    </Text>
                    <View style={styles.phaseBadgeContainer}>
                        <View style={[styles.phaseDot, { backgroundColor: phaseColors.primary }]} />
                        <Text style={[styles.phaseBadgeText, { color: phaseColors.primary }]}>
                            {isPreparing ? 'Preparación' : isRest ? 'Recuperación' : 'Fase de Trabajo'}
                        </Text>
                    </View>
                </View>

                {/* Timer grande */}
                <View style={styles.timerSection}>

                    <Animated.Text
                        style={[
                            styles.timerLarge,
                            { color: phaseColors.primary, transform: [{ scale: scaleAnim }] }
                        ]}
                    >
                        {formatTime(timeLeft)}
                    </Animated.Text>
                    <View style={styles.timerLabel}>
                        <MaterialCommunityIcons name="timer-outline" size={16} color="rgba(255, 255, 255, 0.6)" />
                        <Text style={styles.timerLabelText}>Tiempo Restante</Text>
                    </View>
                </View>

                {/* Exercise card - solo mostrar durante trabajo */}
                {!isPreparing && !isRest && (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <ExerciseCard
                            title={currentExercise.name}
                            description={currentExercise.description}
                            currentStep="Combinación Actual"
                            totalSteps={exercises.length}
                            currentStepIndex={currentExerciseIndex}
                            colors={phaseColors.gradient}
                            animated={isActive}
                        />
                    </Animated.View>
                )}

                {(isPreparing || isRest) && (
                    <View style={styles.messageContainer}>
                        <Text style={styles.messageText}>
                            {isPreparing ? 'El entrenamiento comenzará pronto' : 'Respira profundo y recupérate'}
                        </Text>
                    </View>
                )}

                {!isPreparing && !isRest && (
                    <View style={styles.nextExercise}>
                        <Text style={[styles.nextLabel, { color: phaseColors.primary }]}>Siguiente</Text>
                        <Text style={styles.nextText}>
                            {exercises[currentExerciseIndex + 1]?.name || 'Fin del Round'}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Controls */}
            <View style={styles.controlsContainer}>
                <IntensityBar
                    intensity={isPreparing ? 0 : isRest ? 30 : 78}
                    label="Intensidad"
                    color={phaseColors.primary}
                />

                <View style={styles.controlButtons}>
                    <Pressable style={styles.skipButton} onPress={handleResetRoutine}>
                        <MaterialCommunityIcons name="restart" size={28} color="#ffffff" />
                    </Pressable>
                    <Pressable style={styles.skipButton} onPress={handlePreviousExercise}>
                        <MaterialCommunityIcons name="skip-previous" size={28} color="#ffffff" />
                    </Pressable>
                    <Pressable
                        style={[styles.playButton, { backgroundColor: phaseColors.primary }]}
                        onPress={toggleTimer}
                    >
                        <MaterialCommunityIcons name={isActive ? "pause" : "play"} size={42} color="#ffffff" />
                    </Pressable>
                    <Pressable style={styles.skipButton} onPress={handleSkipExercise}>
                        <MaterialCommunityIcons name="skip-next" size={28} color="#ffffff" />
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    topTimeBadge: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    topTimeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ffffff',
    },
    phaseHeader: {
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 8,
    },
    phaseTitle: {
        fontSize: 40,
        fontWeight: '900',
        color: '#ffffff',
        fontStyle: 'italic',
        letterSpacing: -1,
        textAlign: 'center'
    },
    phaseSubtitle: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 24,
        fontWeight: '700',
    },
    phaseBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    phaseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ec1313',
    },
    phaseBadgeText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ec1313',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    timerSection: {
        alignItems: 'center',
        paddingVertical: 32,
        position: 'relative',
    },
    timerGlow: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 9999,
        backgroundColor: '#ec131315',
    },
    timerLarge: {
        fontSize: 100,
        fontWeight: '900',
        color: '#ffffff',
        lineHeight: 85,
        letterSpacing: -4,
    },
    timerLabel: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 9999,
        marginTop: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    timerLabelText: {
        fontSize: 12,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.6)',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    roundBadgeContainer: {
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 8,
    },
    nextExercise: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        opacity: 0.6,
    },
    nextLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ec1313',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    nextText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'right',
    },
    messageContainer: {
        padding: 32,
        alignItems: 'center',
    },
    messageText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
    },
    controlsContainer: {
        backgroundColor: '#331919',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 8,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    controlButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
        marginTop: 8,
    },
    controlPrimary: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ec1313',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ec1313',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 8,
    },
    skipButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ec1313',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 8,
    },
    skipIcon: {
        fontSize: 28,
        color: '#ffffff',
    },
    playIcon: {
        fontSize: 42,
        color: '#ffffff',
    },
    lockButton: {
        marginTop: 24,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignSelf: 'center',
    },
    lockText: {
        fontSize: 12,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.3)',
    },
    finishedIcon: {
        fontSize: 80,
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
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: 12,
        textAlign: 'center',
    },
    resetButton: {
        marginTop: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    resetText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.6)',
    },
    preparingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    preparingTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 48,
        letterSpacing: 4,
    },
    preparingTimer: {
        fontSize: 120,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 24,
    },
    preparingSubtitle: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
    },
});
