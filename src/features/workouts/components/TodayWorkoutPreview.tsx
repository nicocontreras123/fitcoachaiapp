import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

interface TodayWorkoutPreviewProps {
    workoutType: string;
    distance: number;
    duration?: number;
    description: string;
    intensity: 'low' | 'medium' | 'high';
    contribution: {
        weeklyProgress: number; // % of weekly volume
        goalContribution: string; // How it helps the goal
    };
}

export function TodayWorkoutPreview({
    workoutType,
    distance,
    duration,
    description,
    intensity,
    contribution,
}: TodayWorkoutPreviewProps) {
    const getWorkoutIcon = (type: string) => {
        const icons: Record<string, string> = {
            'easy-run': 'run',
            'tempo-run': 'run-fast',
            'intervals': 'flash',
            'long-run': 'hiking',
            'recovery-run': 'walk',
        };
        return icons[type] || 'run';
    };

    const getIntensityColor = (level: string) => {
        const colors: Record<string, string> = {
            'low': '#93c5fd',
            'medium': '#fbbf24',
            'high': '#ef4444',
        };
        return colors[level] || '#9ca3af';
    };

    const getIntensityLabel = (level: string) => {
        const labels: Record<string, string> = {
            'low': 'Baja',
            'medium': 'Media',
            'high': 'Alta',
        };
        return labels[level] || 'Media';
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                        name={getWorkoutIcon(workoutType) as any}
                        size={32}
                        color={COLORS.primary.DEFAULT}
                    />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.title}>Entrenamiento de Hoy</Text>
                    <View style={styles.intensityBadge}>
                        <View style={[
                            styles.intensityDot,
                            { backgroundColor: getIntensityColor(intensity) }
                        ]} />
                        <Text style={[
                            styles.intensityText,
                            { color: getIntensityColor(intensity) }
                        ]}>
                            Intensidad {getIntensityLabel(intensity)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Description */}
            <Text style={styles.description}>{description}</Text>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <MaterialCommunityIcons name="map-marker-distance" size={18} color="#9ca3af" />
                    <Text style={styles.statText}>{distance}km</Text>
                </View>
                {duration && (
                    <>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <MaterialCommunityIcons name="clock-outline" size={18} color="#9ca3af" />
                            <Text style={styles.statText}>{duration}min</Text>
                        </View>
                    </>
                )}
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                    <MaterialCommunityIcons name="chart-line" size={18} color="#9ca3af" />
                    <Text style={styles.statText}>{contribution.weeklyProgress}% semanal</Text>
                </View>
            </View>

            {/* Goal Contribution */}
            <View style={styles.contributionBox}>
                <MaterialCommunityIcons name="bullseye-arrow" size={20} color={COLORS.primary.DEFAULT} />
                <Text style={styles.contributionText}>
                    <Text style={styles.contributionLabel}>Contribución al objetivo: </Text>
                    {contribution.goalContribution}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#182e21',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
        gap: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        flex: 1,
        gap: 6,
    },
    title: {
        fontSize: 18,
        fontFamily: 'Lexend_700Bold',
        color: '#fff',
    },
    intensityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    intensityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    intensityText: {
        fontSize: 13,
        fontFamily: 'Lexend_600SemiBold',
    },
    description: {
        fontSize: 14,
        fontFamily: 'Lexend_400Regular',
        color: '#d1d5db',
        lineHeight: 20,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontSize: 13,
        fontFamily: 'Lexend_500Medium',
        color: '#9ca3af',
    },
    statDivider: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#4b5563',
    },
    contributionBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: 'rgba(19, 236, 91, 0.05)',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.1)',
    },
    contributionText: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'Lexend_400Regular',
        color: '#d1d5db',
        lineHeight: 18,
    },
    contributionLabel: {
        fontFamily: 'Lexend_600SemiBold',
        color: COLORS.primary.DEFAULT,
    },
});
