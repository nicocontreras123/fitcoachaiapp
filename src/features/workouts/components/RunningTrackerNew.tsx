import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CircularProgress, StatCard } from '@/components/timer';
import { LinearGradient } from 'expo-linear-gradient';

interface Interval {
    name: string;
    type: 'warmup' | 'work' | 'rest' | 'cooldown';
    duration: number;
    pace?: string;
}

interface RunningTrackerProps {
    targetDistance?: number; // km
    onTimeUpdate?: (elapsedTime: number) => void;
}

export function RunningTrackerNew({ targetDistance = 5, onTimeUpdate }: RunningTrackerProps = {}) {
    const [isRunning, setIsRunning] = useState(false);
    const [currentIntervalIndex, setCurrentIntervalIndex] = useState(1);
    const [timeLeft, setTimeLeft] = useState(45);
    const [totalTime, setTotalTime] = useState(0);
    const [distance, setDistance] = useState(3.5);
    const [pace, setPace] = useState('5:30');
    const [calories, setCalories] = useState(320);
    const [heartRate, setHeartRate] = useState(154);

    const pulseAnim = useRef(new Animated.Value(1)).current;

    const intervals: Interval[] = [
        { name: 'Calentar', type: 'warmup', duration: 600, pace: '6:30' },
        { name: 'Sprint', type: 'work', duration: 90, pace: '4:00' },
        { name: 'Recuperar', type: 'rest', duration: 60, pace: '7:00' },
        { name: 'Ritmo', type: 'work', duration: 900, pace: '5:15' },
    ];

    const currentInterval = intervals[currentIntervalIndex];
    const progress = 1 - (timeLeft / (currentInterval?.duration || 1));

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

        if (isRunning) {
            pulseAnimation.start();
        } else {
            pulseAnimation.stop();
            pulseAnim.setValue(1);
        }

        return () => pulseAnimation.stop();
    }, [isRunning, pulseAnim]);

    // Timer countdown
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        // Move to next interval
                        if (currentIntervalIndex < intervals.length - 1) {
                            setCurrentIntervalIndex(prev => prev + 1);
                            return intervals[currentIntervalIndex + 1].duration;
                        } else {
                            setIsRunning(false);
                            return 0;
                        }
                    }
                    return prev - 1;
                });
                setTotalTime(prev => {
                    const newTime = prev + 1;
                    onTimeUpdate?.(newTime);
                    return newTime;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, timeLeft, currentIntervalIndex, onTimeUpdate]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getIntervalColor = (type: string) => {
        switch (type) {
            case 'warmup': return '#3b82f6';
            case 'work': return '#13ec5b';
            case 'rest': return '#f59e0b';
            case 'cooldown': return '#6b7280';
            default: return '#13ec5b';
        }
    };

    const getIntervalIcon = (type: string) => {
        switch (type) {
            case 'warmup': return 'walk';
            case 'work': return 'run-fast';
            case 'rest': return 'heart';
            case 'cooldown': return 'check-circle';
            default: return 'run';
        }
    };

    return (
        <View style={styles.container}>
            {/* Top bar */}
            <View style={styles.topBar}>
                <Pressable style={styles.iconButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
                </Pressable>
                <View style={styles.topCenter}>
                    <Text style={styles.topSubtitle}>Entrenamiento</Text>
                    <View style={styles.gpsIndicator}>
                        <MaterialCommunityIcons name="satellite-variant" size={14} color="#13ec5b" />
                        <Text style={styles.gpsText}>GPS ALTO</Text>
                    </View>
                </View>
                <Pressable style={styles.iconButton}>
                    <MaterialCommunityIcons name="cog" size={24} color="#ffffff" />
                </Pressable>
            </View>

            {/* Interval chips */}
            <ScrollView
                horizontal
                style={styles.intervalChips}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.intervalChipsContent}
            >
                {intervals.map((interval, index) => {
                    const isCompleted = index < currentIntervalIndex;
                    const isCurrent = index === currentIntervalIndex;
                    const isUpcoming = index > currentIntervalIndex;

                    return (
                        <View
                            key={index}
                            style={[
                                styles.chip,
                                isCompleted && styles.chipCompleted,
                                isCurrent && [styles.chipActive, { backgroundColor: getIntervalColor(interval.type) }],
                                isUpcoming && styles.chipUpcoming,
                            ]}
                        >
                            <MaterialCommunityIcons
                                name={getIntervalIcon(interval.type) as any}
                                size={isCurrent ? 18 : 16}
                                color={isCompleted ? 'rgba(255,255,255,0.7)' : isCurrent ? '#102216' : 'rgba(255,255,255,0.4)'}
                            />
                            <Text
                                style={[
                                    styles.chipText,
                                    isCompleted && styles.chipTextCompleted,
                                    isCurrent && styles.chipTextActive,
                                    isUpcoming && styles.chipTextUpcoming,
                                ]}
                            >
                                {interval.name}
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
                        progress={progress}
                        size={260}
                        strokeWidth={12}
                        color={getIntervalColor(currentInterval?.type)}
                        backgroundColor="#1f3a29"
                    >
                        <View style={styles.progressContent}>
                            <Text style={[styles.intervalLabel, { color: getIntervalColor(currentInterval?.type) }]}>
                                {currentInterval?.name} {currentIntervalIndex + 1}/{intervals.length}
                            </Text>
                            <Text style={styles.timerLarge}>{formatTime(timeLeft)}</Text>
                            <Text style={styles.timerSubtext}>TIEMPO RESTANTE</Text>
                        </View>
                    </CircularProgress>
                </Animated.View>

                {/* Stats grid */}
                <View style={styles.statsGrid}>
                    <StatCard
                        label="Distancia"
                        value={distance.toFixed(1)}
                        unit="km"
                        icon="map-marker-distance"
                        iconColor="#13ec5b"
                    />
                    <StatCard
                        label="Ritmo"
                        value={pace}
                        unit="/km"
                        icon="speedometer"
                        iconColor="#13ec5b"
                    />
                    <StatCard
                        label="Calorías"
                        value={calories}
                        unit="kcal"
                        icon="fire"
                        iconColor="#f97316"
                    />
                    <StatCard
                        label="Ritmo C."
                        value={heartRate}
                        unit="bpm"
                        icon="heart-pulse"
                        iconColor="#ef4444"
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
                            {formatTime(totalTime)} / {formatTime(1500)}
                        </Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                        <View
                            style={[
                                styles.progressBarFill,
                                { width: `${(totalTime / 1500) * 100}%` }
                            ]}
                        />
                    </View>
                </View>

                {/* Control buttons */}
                <View style={styles.controlButtons}>
                    <Pressable style={styles.controlSecondary}>
                        <MaterialCommunityIcons name="skip-next" size={28} color="#ffffff" />
                    </Pressable>

                    <Pressable
                        style={[styles.controlPrimary, isRunning && styles.controlPrimaryPulse]}
                        onPress={() => setIsRunning(!isRunning)}
                    >
                        <MaterialCommunityIcons
                            name={isRunning ? 'pause' : 'play'}
                            size={48}
                            color="#102216"
                        />
                    </Pressable>

                    <Pressable style={styles.controlSecondary}>
                        <MaterialCommunityIcons name="lock-open-variant" size={24} color="#ffffff" />
                    </Pressable>
                </View>
            </View>
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
        color: '#13ec5b',
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
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        opacity: 0.5,
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
        fontSize: 12,
        fontWeight: '700',
        color: '#ffffff',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    chipTextCompleted: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    chipTextActive: {
        color: '#102216',
        fontSize: 12,
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
});
