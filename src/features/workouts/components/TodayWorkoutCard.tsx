import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { DailyRoutine } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { translateLevel } from '@/utils/translations';

interface TodayWorkoutCardProps {
    dayInfo: DailyRoutine;
    onPress: () => void;
    isCompleted?: boolean;
}

export const TodayWorkoutCard: React.FC<TodayWorkoutCardProps> = ({ dayInfo, onPress, isCompleted = false }) => {
    const { day, workout, restDay } = dayInfo;
    const theme = useTheme();

    if (restDay) {
        return (
            <Surface style={styles.card} elevation={4}>
                <TouchableRipple onPress={onPress} style={styles.touchable}>
                    <View style={[styles.restContent, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <View style={styles.restHeader}>
                            <View>
                                <Text variant="labelMedium" style={styles.todayLabel}>HOY • {day.toUpperCase()}</Text>
                                <Text variant="headlineMedium" style={[styles.restTitle, { color: theme.colors.onSurface }]}>
                                    Día de Descanso
                                </Text>
                            </View>
                            <MaterialCommunityIcons name="coffee" size={48} color={theme.colors.onSurfaceVariant} />
                        </View>
                        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
                            Tu cuerpo necesita recuperación. Usa este día para descansar activamente, hacer estiramientos suaves o simplemente relajarte.
                        </Text>
                    </View>
                </TouchableRipple>
            </Surface>
        );
    }

    const gradientColors = workout?.type === 'boxing'
        ? ['#ef4444', '#dc2626']
        : workout?.type === 'running'
            ? ['#10b981', '#059669']
            : ['#8b5cf6', '#7c3aed'];

    const iconName = workout?.type === 'boxing'
        ? 'boxing-glove'
        : workout?.type === 'running'
            ? 'run-fast'
            : 'dumbbell';

    return (
        <Surface style={styles.card} elevation={6}>
            <TouchableRipple onPress={onPress} style={styles.touchable}>
                <View style={styles.content}>
                    {/* Header with gradient */}
                    <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientHeader}
                    >
                        <View style={styles.headerContent}>
                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text variant="labelMedium" style={styles.todayLabel}>
                                        HOY • {day.toUpperCase()}
                                    </Text>
                                    {isCompleted && (
                                        <View style={styles.completedBadge}>
                                            <MaterialCommunityIcons name="check-circle" size={16} color="#10b981" />
                                            <Text style={styles.completedText}>COMPLETADO</Text>
                                        </View>
                                    )}
                                </View>
                                <Text variant="headlineMedium" style={styles.headerTitle}>
                                    {workout?.title || 'Entrenamiento'}
                                </Text>
                            </View>
                            <View style={styles.iconCircle}>
                                <MaterialCommunityIcons name={iconName} size={36} color="#ffffff" />
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Main Content */}
                    <View style={styles.mainContent}>
                        {/* Description */}
                        <View style={styles.descriptionSection}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionDot, { backgroundColor: gradientColors[0] }]} />
                                <Text variant="labelLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                                    DESCRIPCIÓN
                                </Text>
                            </View>
                            <Text variant="bodyLarge" style={[styles.description, { color: theme.colors.onSurface }]}>
                                {workout?.description}
                            </Text>
                        </View>

                        {/* Exercises Details */}
                        {workout && (() => {
                            let exercisesList: any[] = [];

                            // GymWorkout has exercises directly
                            if ('exercises' in workout && Array.isArray(workout.exercises)) {
                                exercisesList = workout.exercises;
                            }
                            // BoxingWorkout has rounds with exercises
                            else if ('rounds' in workout && Array.isArray(workout.rounds)) {
                                // Get exercises from first round as preview
                                if (workout.rounds.length > 0 && workout.rounds[0].exercises) {
                                    exercisesList = workout.rounds[0].exercises;
                                }
                            }
                            // RunningWorkout has intervals
                            else if ('intervals' in workout && Array.isArray(workout.intervals)) {
                                exercisesList = workout.intervals;
                            }

                            if (exercisesList.length === 0) return null;

                            return (
                                <View style={styles.exercisesSection}>
                                    <View style={styles.sectionHeader}>
                                        <View style={[styles.sectionDot, { backgroundColor: gradientColors[0] }]} />
                                        <Text variant="labelLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                                            QUÉ HARÁS HOY
                                        </Text>
                                    </View>
                                    {exercisesList.slice(0, 4).map((exercise: any, index: number) => (
                                        <View key={index} style={styles.exerciseItem}>
                                            <View style={[styles.exerciseBullet, { backgroundColor: gradientColors[0] + '20', borderColor: gradientColors[0] }]}>
                                                <Text variant="labelSmall" style={{ color: gradientColors[0], fontWeight: 'bold' }}>
                                                    {index + 1}
                                                </Text>
                                            </View>
                                            <View style={styles.exerciseDetails}>
                                                <Text variant="bodyMedium" style={[styles.exerciseName, { color: theme.colors.onSurface }]}>
                                                    {exercise.name || exercise.type || 'Ejercicio'}
                                                </Text>
                                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                                    {exercise.sets ? `${exercise.sets} series` : ''}
                                                    {exercise.reps ? ` • ${exercise.reps} reps` : ''}
                                                    {exercise.duration ? ` • ${typeof exercise.duration === 'number' ? `${exercise.duration} min` : exercise.duration}` : ''}
                                                    {exercise.pace ? ` • ${exercise.pace}` : ''}
                                                    {exercise.description && !exercise.name ? ` • ${exercise.description}` : ''}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                    {exercisesList.length > 4 && (
                                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                                            + {exercisesList.length - 4} ejercicios más
                                        </Text>
                                    )}
                                </View>
                            );
                        })()}

                        {/* Meta Information */}
                        <View style={styles.metaGrid}>
                            <View style={[styles.metaCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                                <MaterialCommunityIcons name="clock-outline" size={24} color={gradientColors[0]} />
                                <Text variant="headlineSmall" style={[styles.metaValue, { color: theme.colors.onSurface }]}>
                                    {workout?.totalDuration}
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>minutos</Text>
                            </View>

                            {workout && 'difficulty' in workout && workout.difficulty && (
                                <View style={[styles.metaCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                                    <MaterialCommunityIcons name="chart-line" size={24} color={gradientColors[0]} />
                                    <Text variant="titleLarge" style={[styles.metaValue, { color: theme.colors.onSurface, textTransform: 'capitalize' }]}>
                                        {translateLevel(workout.difficulty)}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>dificultad</Text>
                                </View>
                            )}

                            {workout && 'rounds' in workout && workout.rounds && Array.isArray(workout.rounds) && (
                                <View style={[styles.metaCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                                    <MaterialCommunityIcons name="repeat" size={24} color={gradientColors[0]} />
                                    <Text variant="titleLarge" style={[styles.metaValue, { color: theme.colors.onSurface }]}>
                                        {workout.rounds.length}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>rounds</Text>
                                </View>
                            )}
                        </View>

                        {/* CTA Button */}
                        <View style={[styles.ctaButton, { backgroundColor: isCompleted ? '#10b981' : gradientColors[0] }]}>
                            <Text variant="titleMedium" style={styles.ctaText}>
                                {isCompleted ? 'Empezar Nuevamente' : 'Comenzar Entrenamiento'}
                            </Text>
                            <MaterialCommunityIcons
                                name={isCompleted ? 'refresh' : 'arrow-right'}
                                size={24}
                                color="#ffffff"
                            />
                        </View>
                    </View>
                </View>
            </TouchableRipple>
        </Surface>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 32,
        borderRadius: 24,
        overflow: 'hidden',
    },
    touchable: {
        width: '100%',
    },
    content: {
        width: '100%',
    },
    gradientHeader: {
        padding: 24,
        paddingBottom: 28,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    todayLabel: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '900',
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    headerTitle: {
        color: '#ffffff',
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainContent: {
        padding: 24,
        paddingTop: 20,
    },
    descriptionSection: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    sectionTitle: {
        fontWeight: '900',
        letterSpacing: 1.2,
    },
    description: {
        lineHeight: 24,
        fontSize: 15,
    },
    exercisesSection: {
        marginBottom: 24,
    },
    exerciseItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    exerciseBullet: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 2,
    },
    exerciseDetails: {
        flex: 1,
        paddingTop: 2,
    },
    exerciseName: {
        fontWeight: '600',
        marginBottom: 2,
    },
    metaGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
        flexWrap: 'wrap',
    },
    metaCard: {
        flex: 1,
        minWidth: 100,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    metaValue: {
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 2,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
        gap: 8,
    },
    ctaText: {
        color: '#ffffff',
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    // Rest day styles
    restContent: {
        padding: 24,
        borderRadius: 24,
    },
    restHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    restTitle: {
        fontWeight: 'bold',
        marginTop: 8,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#10b981',
    },
    completedText: {
        color: '#10b981',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
});
