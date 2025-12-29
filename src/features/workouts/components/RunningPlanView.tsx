import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { WeeklyRunningPlan } from '@/services/runningPlanGenerator';

interface RunningPlanViewProps {
    plan: WeeklyRunningPlan[];
    currentWeek: number;
    targetDistance: number;
    onWeekSelect?: (weekNumber: number) => void;
}

export function RunningPlanView({ plan, currentWeek, targetDistance, onWeekSelect }: RunningPlanViewProps) {
    const router = useRouter();
    const [expandedWeek, setExpandedWeek] = useState<number | null>(currentWeek);

    const getWorkoutIcon = (type: string) => {
        const icons: Record<string, string> = {
            'easy-run': 'run',
            'tempo-run': 'run-fast',
            'intervals': 'flash',
            'long-run': 'hiking',
            'recovery-run': 'walk',
            'rest': 'sleep',
        };
        return icons[type] || 'run';
    };

    const getWorkoutColor = (intensity: string) => {
        const colors: Record<string, string> = {
            'low': '#93c5fd',
            'medium': '#fbbf24',
            'high': '#ef4444',
        };
        return colors[intensity] || '#9ca3af';
    };

    const toggleWeek = (weekNumber: number) => {
        setExpandedWeek(expandedWeek === weekNumber ? null : weekNumber);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                </Pressable>
                <Text style={styles.headerTitle}>Plan de Entrenamiento</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Plan Summary */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                    <MaterialCommunityIcons name="target" size={32} color={COLORS.primary.DEFAULT} />
                    <View style={styles.summaryTextContainer}>
                        <Text style={styles.summaryTitle}>Objetivo: {targetDistance}K</Text>
                        <Text style={styles.summarySubtitle}>
                            Plan de {plan.length} semanas • Semana actual: {currentWeek}
                        </Text>
                    </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${(currentWeek / plan.length) * 100}%` }
                            ]}
                        />
                    </View>
                    <Text style={styles.progressText}>
                        {Math.round((currentWeek / plan.length) * 100)}% completado
                    </Text>
                </View>
            </View>

            {/* Weeks List */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                {plan.map((week) => {
                    const isExpanded = expandedWeek === week.weekNumber;
                    const isCurrent = week.weekNumber === currentWeek;
                    const isCompleted = week.weekNumber < currentWeek;
                    const isRecoveryWeek = week.weekNumber % 4 === 0;

                    return (
                        <View key={week.weekNumber} style={styles.weekCard}>
                            {/* Week Header */}
                            <Pressable
                                style={[
                                    styles.weekHeader,
                                    isCurrent && styles.weekHeaderCurrent,
                                    isCompleted && styles.weekHeaderCompleted,
                                ]}
                                onPress={() => toggleWeek(week.weekNumber)}
                            >
                                <View style={styles.weekHeaderLeft}>
                                    <View style={[
                                        styles.weekNumber,
                                        isCurrent && styles.weekNumberCurrent,
                                        isCompleted && styles.weekNumberCompleted,
                                    ]}>
                                        {isCompleted ? (
                                            <MaterialCommunityIcons name="check" size={20} color="#10b981" />
                                        ) : (
                                            <Text style={[
                                                styles.weekNumberText,
                                                isCurrent && styles.weekNumberTextCurrent,
                                            ]}>
                                                {week.weekNumber}
                                            </Text>
                                        )}
                                    </View>
                                    <View>
                                        <Text style={styles.weekTitle}>
                                            Semana {week.weekNumber}
                                            {isRecoveryWeek && ' 🔄'}
                                        </Text>
                                        <Text style={styles.weekSubtitle}>
                                            {week.totalDistance}km total
                                            {isRecoveryWeek && ' • Recuperación'}
                                        </Text>
                                    </View>
                                </View>
                                <MaterialCommunityIcons
                                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                    size={24}
                                    color="#9ca3af"
                                />
                            </Pressable>

                            {/* Week Details */}
                            {isExpanded && (
                                <View style={styles.weekDetails}>
                                    {week.workouts.map((workout, index) => (
                                        <View key={index} style={styles.workoutItem}>
                                            <View style={styles.workoutHeader}>
                                                <View style={styles.workoutLeft}>
                                                    <MaterialCommunityIcons
                                                        name={getWorkoutIcon(workout.type) as any}
                                                        size={20}
                                                        color={getWorkoutColor(workout.intensity)}
                                                    />
                                                    <Text style={styles.workoutDay}>{workout.day}</Text>
                                                </View>
                                                <View style={[
                                                    styles.intensityBadge,
                                                    { backgroundColor: `${getWorkoutColor(workout.intensity)}20` }
                                                ]}>
                                                    <Text style={[
                                                        styles.intensityText,
                                                        { color: getWorkoutColor(workout.intensity) }
                                                    ]}>
                                                        {workout.intensity === 'high' ? 'Alta' :
                                                            workout.intensity === 'medium' ? 'Media' : 'Baja'}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={styles.workoutDescription}>
                                                {workout.description}
                                            </Text>
                                            <View style={styles.workoutStats}>
                                                <View style={styles.statItem}>
                                                    <MaterialCommunityIcons name="map-marker-distance" size={16} color="#9ca3af" />
                                                    <Text style={styles.statText}>{workout.distance}km</Text>
                                                </View>
                                                {workout.duration && (
                                                    <>
                                                        <View style={styles.statDivider} />
                                                        <View style={styles.statItem}>
                                                            <MaterialCommunityIcons name="clock-outline" size={16} color="#9ca3af" />
                                                            <Text style={styles.statText}>{workout.duration}min</Text>
                                                        </View>
                                                    </>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    );
                })}

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background.dark,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Lexend_700Bold',
        color: '#fff',
    },
    summaryCard: {
        backgroundColor: '#182e21',
        margin: 16,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    summaryTextContainer: {
        flex: 1,
    },
    summaryTitle: {
        fontSize: 20,
        fontFamily: 'Lexend_700Bold',
        color: '#fff',
        marginBottom: 4,
    },
    summarySubtitle: {
        fontSize: 14,
        fontFamily: 'Lexend_400Regular',
        color: '#9ca3af',
    },
    progressContainer: {
        gap: 8,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#1a1a1a',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary.DEFAULT,
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        fontFamily: 'Lexend_500Medium',
        color: '#9ca3af',
        textAlign: 'right',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    weekCard: {
        backgroundColor: '#182e2180',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
    },
    weekHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    weekHeaderCurrent: {
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
    },
    weekHeaderCompleted: {
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
    },
    weekHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    weekNumber: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#333',
    },
    weekNumberCurrent: {
        backgroundColor: 'rgba(19, 236, 91, 0.2)',
        borderColor: COLORS.primary.DEFAULT,
    },
    weekNumberCompleted: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10b981',
    },
    weekNumberText: {
        fontSize: 16,
        fontFamily: 'Lexend_700Bold',
        color: '#9ca3af',
    },
    weekNumberTextCurrent: {
        color: COLORS.primary.DEFAULT,
    },
    weekTitle: {
        fontSize: 16,
        fontFamily: 'Lexend_600SemiBold',
        color: '#fff',
    },
    weekSubtitle: {
        fontSize: 14,
        fontFamily: 'Lexend_400Regular',
        color: '#9ca3af',
        marginTop: 2,
    },
    weekDetails: {
        padding: 16,
        paddingTop: 0,
        gap: 12,
    },
    workoutItem: {
        backgroundColor: '#1a1a1a',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    workoutHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    workoutLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    workoutDay: {
        fontSize: 14,
        fontFamily: 'Lexend_600SemiBold',
        color: '#fff',
        textTransform: 'capitalize',
    },
    intensityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    intensityText: {
        fontSize: 12,
        fontFamily: 'Lexend_600SemiBold',
    },
    workoutDescription: {
        fontSize: 13,
        fontFamily: 'Lexend_400Regular',
        color: '#d1d5db',
        lineHeight: 18,
        marginBottom: 8,
    },
    workoutStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        fontFamily: 'Lexend_500Medium',
        color: '#9ca3af',
    },
    statDivider: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#4b5563',
    },
});
