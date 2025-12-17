import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Animated, TextInput, Modal } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CircularProgress, StatCard } from '@/components/timer';
import { RunningWorkout } from '@/features/workouts/types';
import { useRunningTimer } from '@/features/tracking/hooks/useRunningTimer';

interface RunningTrackerProps {
    workout: RunningWorkout;
    onComplete?: (data: any) => void;
    onExit?: () => void;
}

export function RunningTrackerNew({ workout, onComplete, onExit }: RunningTrackerProps) {
    const timer = useRunningTimer({
        workout,
        prepTime: 10,
        autoSave: true,
    });

    const { state, currentInterval, gps, currentPace, estimatedCalories, progress } = timer;

    const [showNoteModal, setShowNoteModal] = useState(false);
    const [noteInput, setNoteInput] = useState('');
    const [showAutoPauseInfo, setShowAutoPauseInfo] = useState(false);

    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Pulse animation for the ring
    useEffect(() => {
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.95,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        );

        if (state.phase === 'active' && !state.isPaused) {
            pulseAnimation.start();
        } else {
            pulseAnimation.stop();
            pulseAnim.setValue(1);
        }

        return () => pulseAnimation.stop();
    }, [state.phase, state.isPaused, pulseAnim]);

    // Show auto-pause info when GPS detects user stopped
    useEffect(() => {
        if (gps.isTracking && !gps.isMoving && state.phase === 'active') {
            setShowAutoPauseInfo(true);
        } else {
            setShowAutoPauseInfo(false);
        }
    }, [gps.isMoving, state.phase]);

    // Handle workout completion
    useEffect(() => {
        if (state.phase === 'finished') {
            onComplete?.({
                distance: gps.distance,
                duration: state.totalElapsedTime,
                calories: estimatedCalories,
                notes: state.notes,
                completedIntervals: state.completedIntervals,
                failedIntervals: state.failedIntervals,
            });
        }
    }, [state.phase]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getIntervalColor = (type: string) => {
        switch (type) {
            case 'warm-up':
                return '#3b82f6';
            case 'run':
                return '#13ec5b';
            case 'sprint':
                return '#f59e0b';
            case 'recovery':
                return '#8b5cf6';
            case 'cool-down':
                return '#6b7280';
            default:
                return '#13ec5b';
        }
    };

    const getIntervalIcon = (type: string) => {
        switch (type) {
            case 'warm-up':
                return 'walk';
            case 'run':
                return 'run';
            case 'sprint':
                return 'run-fast';
            case 'recovery':
                return 'heart';
            case 'cool-down':
                return 'check-circle';
            default:
                return 'run';
        }
    };

    const handleTogglePlayPause = () => {
        if (state.phase === 'idle') {
            timer.start();
        } else if (state.phase === 'active') {
            if (state.isPaused) {
                timer.resume();
            } else {
                timer.pause();
            }
        }
    };

    const handleAddNote = () => {
        if (noteInput.trim()) {
            const timestamp = formatTime(state.totalElapsedTime);
            timer.addNote(`[${timestamp}] ${noteInput.trim()}`);
            setNoteInput('');
            setShowNoteModal(false);
        }
    };

    const getGpsQuality = (): { text: string; color: string } => {
        if (!gps.isTracking) {
            return { text: 'BUSCANDO', color: '#f59e0b' };
        }
        // GPS quality based on speed accuracy (simplified)
        if (gps.currentSpeed > 0 || gps.location) {
            return { text: 'GPS ALTO', color: '#13ec5b' };
        }
        return { text: 'GPS BAJO', color: '#ef4444' };
    };

    const gpsQuality = getGpsQuality();

    const totalDuration = workout.intervals.reduce((sum, interval) => sum + interval.duration, 0) * 60;

    return (
        <View style={styles.container}>
            {/* Top bar */}
            <View style={styles.topBar}>
                <Pressable style={styles.iconButton} onPress={onExit}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
                </Pressable>
                <View style={styles.topCenter}>
                    <Text style={styles.topSubtitle}>{workout.title}</Text>
                    <View style={styles.gpsIndicator}>
                        <MaterialCommunityIcons name="satellite-variant" size={14} color={gpsQuality.color} />
                        <Text style={[styles.gpsText, { color: gpsQuality.color }]}>{gpsQuality.text}</Text>
                    </View>
                </View>
                <Pressable style={styles.iconButton} onPress={() => setShowNoteModal(true)}>
                    <MaterialCommunityIcons name="note-text" size={24} color="#ffffff" />
                </Pressable>
            </View>

            {/* Auto-pause indicator */}
            {showAutoPauseInfo && (
                <View style={styles.autoPauseBar}>
                    <MaterialCommunityIcons name="pause-circle" size={18} color="#f59e0b" />
                    <Text style={styles.autoPauseText}>Auto-pausado: no se detecta movimiento</Text>
                </View>
            )}

            {/* Interval chips */}
            <ScrollView
                horizontal
                style={styles.intervalChips}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.intervalChipsContent}
            >
                {workout.intervals.map((interval, index) => {
                    const isCompleted = state.completedIntervals.includes(index);
                    const isFailed = state.failedIntervals.includes(index);
                    const isCurrent = index === state.currentIntervalIndex;
                    const isUpcoming = index > state.currentIntervalIndex;

                    return (
                        <View
                            key={index}
                            style={[
                                styles.chip,
                                isCompleted && styles.chipCompleted,
                                isFailed && styles.chipFailed,
                                isCurrent && [styles.chipActive, { backgroundColor: getIntervalColor(interval.type) }],
                                isUpcoming && styles.chipUpcoming,
                            ]}
                        >
                            <MaterialCommunityIcons
                                name={
                                    isFailed
                                        ? 'close-circle'
                                        : (getIntervalIcon(interval.type) as any)
                                }
                                size={isCurrent ? 18 : 16}
                                color={
                                    isFailed
                                        ? '#ef4444'
                                        : isCompleted
                                        ? 'rgba(255,255,255,0.7)'
                                        : isCurrent
                                        ? '#102216'
                                        : 'rgba(255,255,255,0.4)'
                                }
                            />
                            <Text
                                style={[
                                    styles.chipText,
                                    isCompleted && styles.chipTextCompleted,
                                    isFailed && styles.chipTextFailed,
                                    isCurrent && styles.chipTextActive,
                                    isUpcoming && styles.chipTextUpcoming,
                                ]}
                            >
                                {interval.type.replace('-', ' ').toUpperCase()}
                            </Text>
                        </View>
                    );
                })}
            </ScrollView>

            {/* Main content */}
            <View style={styles.mainContent}>
                {/* Background pattern */}
                <View style={styles.backgroundPattern} />

                {/* Circular progress */}
                <Animated.View style={[styles.progressContainer, { transform: [{ scale: pulseAnim }] }]}>
                    <CircularProgress
                        progress={currentInterval ? 1 - state.timeLeft / (currentInterval.duration * 60) : 0}
                        size={260}
                        strokeWidth={12}
                        color={currentInterval ? getIntervalColor(currentInterval.type) : '#13ec5b'}
                        backgroundColor="#1f3a29"
                    >
                        <View style={styles.progressContent}>
                            {state.phase === 'idle' && (
                                <>
                                    <Text style={styles.intervalLabel}>LISTO PARA COMENZAR</Text>
                                    <MaterialCommunityIcons name="run" size={60} color="#13ec5b" />
                                </>
                            )}
                            {state.phase === 'preparing' && (
                                <>
                                    <Text style={styles.intervalLabel}>PREPARÁNDOTE</Text>
                                    <Text style={styles.timerLarge}>{formatTime(state.timeLeft)}</Text>
                                </>
                            )}
                            {(state.phase === 'active' || state.phase === 'paused') && currentInterval && (
                                <>
                                    <Text
                                        style={[
                                            styles.intervalLabel,
                                            { color: getIntervalColor(currentInterval.type) },
                                        ]}
                                    >
                                        {currentInterval.type.replace('-', ' ').toUpperCase()}{' '}
                                        {state.currentIntervalIndex + 1}/{workout.intervals.length}
                                    </Text>
                                    <Text style={styles.timerLarge}>{formatTime(state.timeLeft)}</Text>
                                    <Text style={styles.timerSubtext}>
                                        {state.isPaused ? 'PAUSADO' : 'TIEMPO RESTANTE'}
                                    </Text>
                                </>
                            )}
                            {state.phase === 'finished' && (
                                <>
                                    <Text style={styles.intervalLabel}>¡COMPLETADO!</Text>
                                    <MaterialCommunityIcons name="check-circle" size={60} color="#13ec5b" />
                                    <Text style={styles.timerSubtext}>Excelente trabajo</Text>
                                </>
                            )}
                        </View>
                    </CircularProgress>
                </Animated.View>

                {/* Stats grid */}
                <View style={styles.statsGrid}>
                    <StatCard
                        label="Distancia"
                        value={gps.distance.toFixed(2)}
                        unit="km"
                        icon="map-marker-distance"
                        iconColor="#13ec5b"
                    />
                    <StatCard
                        label="Ritmo"
                        value={currentPace || '--:--'}
                        unit="/km"
                        icon="speedometer"
                        iconColor="#13ec5b"
                    />
                    <StatCard
                        label="Calorías"
                        value={estimatedCalories}
                        unit="kcal"
                        icon="fire"
                        iconColor="#f97316"
                    />
                    <StatCard
                        label="Velocidad"
                        value={gps.currentSpeed.toFixed(1)}
                        unit="km/h"
                        icon="run-fast"
                        iconColor="#8b5cf6"
                    />
                </View>
            </View>

            {/* Bottom controls */}
            <View style={styles.bottomControls}>
                {/* Progress bar */}
                <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarLabels}>
                        <Text style={styles.progressBarLabel}>Progreso Total</Text>
                        <Text style={styles.progressBarValue}>
                            {formatTime(state.totalElapsedTime)} / {formatTime(totalDuration)}
                        </Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                        <View
                            style={[
                                styles.progressBarFill,
                                { width: `${Math.min(progress * 100, 100)}%` },
                            ]}
                        />
                    </View>
                </View>

                {/* Control buttons */}
                <View style={styles.controlButtons}>
                    {/* Skip button */}
                    <Pressable
                        style={[
                            styles.controlSecondary,
                            state.phase !== 'active' && styles.controlDisabled,
                        ]}
                        onPress={timer.skip}
                        disabled={state.phase !== 'active'}
                    >
                        <MaterialCommunityIcons name="skip-next" size={28} color="#ffffff" />
                    </Pressable>

                    {/* Play/Pause button */}
                    <Pressable
                        style={[
                            styles.controlPrimary,
                            (state.phase === 'active' && !state.isPaused) && styles.controlPrimaryPulse,
                        ]}
                        onPress={handleTogglePlayPause}
                    >
                        <MaterialCommunityIcons
                            name={
                                state.phase === 'idle' || state.phase === 'finished'
                                    ? 'play'
                                    : state.isPaused
                                    ? 'play'
                                    : 'pause'
                            }
                            size={48}
                            color="#102216"
                        />
                    </Pressable>

                    {/* Mark as failed / Reset button */}
                    <Pressable
                        style={[
                            styles.controlSecondary,
                            state.phase === 'idle' && styles.controlDisabled,
                        ]}
                        onPress={state.phase === 'active' ? timer.markAsFailed : timer.reset}
                        disabled={state.phase === 'idle'}
                    >
                        <MaterialCommunityIcons
                            name={state.phase === 'active' ? 'close-circle' : 'refresh'}
                            size={24}
                            color={state.phase === 'active' ? '#ef4444' : '#ffffff'}
                        />
                    </Pressable>
                </View>
            </View>

            {/* Note Modal */}
            <Modal
                visible={showNoteModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowNoteModal(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setShowNoteModal(false)}>
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Agregar Nota</Text>
                            <Pressable onPress={() => setShowNoteModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
                            </Pressable>
                        </View>

                        <TextInput
                            style={styles.noteInput}
                            placeholder="Escribe una nota sobre tu entrenamiento..."
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={noteInput}
                            onChangeText={setNoteInput}
                            multiline
                            numberOfLines={4}
                            autoFocus
                        />

                        <Pressable style={styles.modalButton} onPress={handleAddNote}>
                            <Text style={styles.modalButtonText}>Guardar Nota</Text>
                        </Pressable>

                        {state.notes && (
                            <View style={styles.existingNotes}>
                                <Text style={styles.existingNotesTitle}>Notas existentes:</Text>
                                <Text style={styles.existingNotesText}>{state.notes}</Text>
                            </View>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#102216',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    topCenter: {
        flex: 1,
        alignItems: 'center',
    },
    topSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.6)',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    gpsIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    gpsText: {
        fontSize: 12,
        fontWeight: '700',
    },
    autoPauseBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 8,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(245, 158, 11, 0.2)',
    },
    autoPauseText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#f59e0b',
    },
    intervalChips: {
        height: 64,
        flexGrow: 0,
    },
    intervalChipsContent: {
        paddingHorizontal: 16,
        gap: 12,
        alignItems: 'center',
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 9999,
        backgroundColor: '#193322',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    chipCompleted: {
        backgroundColor: 'rgba(19, 236, 91, 0.2)',
        opacity: 0.7,
    },
    chipFailed: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: '#ef4444',
    },
    chipActive: {
        backgroundColor: '#13ec5b',
        borderColor: '#13ec5b',
        shadowColor: '#13ec5b',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 8,
        height: 36,
    },
    chipUpcoming: {
        backgroundColor: '#193322',
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    chipText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: 1,
    },
    chipTextCompleted: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    chipTextFailed: {
        color: '#ef4444',
    },
    chipTextActive: {
        color: '#102216',
        fontSize: 11,
        fontWeight: '900',
    },
    chipTextUpcoming: {
        color: 'rgba(255, 255, 255, 0.4)',
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        position: 'relative',
    },
    backgroundPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        backgroundColor: '#0a1a0f',
    },
    progressContainer: {
        marginVertical: 24,
    },
    progressContent: {
        alignItems: 'center',
    },
    intervalLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#13ec5b',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 8,
    },
    timerLarge: {
        fontSize: 80,
        fontWeight: '900',
        color: '#ffffff',
        lineHeight: 85,
        letterSpacing: -4,
    },
    timerSubtext: {
        fontSize: 12,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.4)',
        marginTop: 8,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        width: '100%',
        marginTop: 8,
    },
    bottomControls: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 32,
        backgroundColor: 'rgba(16, 34, 22, 0.95)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    progressBarContainer: {
        marginBottom: 16,
    },
    progressBarLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressBarLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.6)',
    },
    progressBarValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ffffff',
    },
    progressBarTrack: {
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 9999,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#13ec5b',
        borderRadius: 9999,
        shadowColor: '#13ec5b',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    controlButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 32,
        marginTop: 8,
    },
    controlSecondary: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    controlDisabled: {
        opacity: 0.3,
    },
    controlPrimary: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#13ec5b',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#13ec5b',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 25,
        elevation: 12,
    },
    controlPrimaryPulse: {
        shadowOpacity: 0.5,
        shadowRadius: 30,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#193322',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
    },
    noteInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 12,
        color: '#ffffff',
        fontSize: 14,
        minHeight: 100,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 16,
    },
    modalButton: {
        backgroundColor: '#13ec5b',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#102216',
    },
    existingNotes: {
        marginTop: 16,
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    existingNotesTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: 8,
    },
    existingNotesText: {
        fontSize: 12,
        color: '#ffffff',
        lineHeight: 18,
    },
});
