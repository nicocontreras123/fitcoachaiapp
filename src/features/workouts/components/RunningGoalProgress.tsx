import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { useRouter } from 'expo-router';

interface RunningGoalProgressProps {
    currentWeek: number;
    totalWeeks: number;
    targetDistance: number;
    currentMaxDistance?: number;
    weeklyDistance?: number;
    onPress?: () => void;
}

export function RunningGoalProgress({
    currentWeek,
    totalWeeks,
    targetDistance,
    currentMaxDistance = 0,
    weeklyDistance = 0,
    onPress,
}: RunningGoalProgressProps) {
    const router = useRouter();
    const progress = (currentWeek / totalWeeks) * 100;
    const weeksRemaining = totalWeeks - currentWeek + 1;

    return (
        <Pressable
            style={styles.container}
            onPress={onPress || (() => router.push('/running-plan' as any))}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <MaterialCommunityIcons name="target" size={24} color={COLORS.primary.DEFAULT} />
                    <View>
                        <Text style={styles.title}>Objetivo de Running</Text>
                        <Text style={styles.subtitle}>{targetDistance}K</Text>
                    </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>
                    Semana {currentWeek} de {totalWeeks} • {Math.round(progress)}% completado
                </Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                    <MaterialCommunityIcons name="calendar-week" size={20} color="#93c5fd" />
                    <Text style={styles.statValue}>{weeksRemaining}</Text>
                    <Text style={styles.statLabel}>Semanas restantes</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <MaterialCommunityIcons name="map-marker-distance" size={20} color="#fbbf24" />
                    <Text style={styles.statValue}>{weeklyDistance}km</Text>
                    <Text style={styles.statLabel}>Esta semana</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <MaterialCommunityIcons name="trending-up" size={20} color="#10b981" />
                    <Text style={styles.statValue}>{currentMaxDistance}km</Text>
                    <Text style={styles.statLabel}>Distancia actual</Text>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#182e21',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
        gap: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    title: {
        fontSize: 16,
        fontFamily: 'Lexend_600SemiBold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'Lexend_400Regular',
        color: COLORS.primary.DEFAULT,
        marginTop: 2,
    },
    progressSection: {
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
    },
    statsGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 18,
        fontFamily: 'Lexend_700Bold',
        color: '#fff',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 11,
        fontFamily: 'Lexend_400Regular',
        color: '#9ca3af',
        textAlign: 'center',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
});
