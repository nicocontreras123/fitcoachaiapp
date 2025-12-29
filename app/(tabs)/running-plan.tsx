import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { RunningPlanView } from '@/features/workouts/components/RunningPlanView';
import { useWorkoutStore } from '@/features/workouts/store/useWorkoutStore';
import { COLORS } from '@/constants/theme';

export default function RunningPlanScreen() {
    const { currentWeeklyRoutine } = useWorkoutStore();
    const params = useLocalSearchParams();

    // Get plan data from routine metadata
    const metadata = currentWeeklyRoutine?.metadata;
    const fullPlan = metadata?.fullPlan;
    const currentWeek = metadata?.currentWeek || 1;
    const targetDistance = metadata?.targetDistance || 10;

    if (!fullPlan || !Array.isArray(fullPlan)) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>No hay plan de entrenamiento disponible</Text>
                <Text style={styles.errorSubtext}>
                    Genera una rutina con objetivo de distancia para ver tu plan progresivo
                </Text>
            </View>
        );
    }

    return (
        <RunningPlanView
            plan={fullPlan}
            currentWeek={currentWeek}
            targetDistance={targetDistance}
        />
    );
}

const styles = StyleSheet.create({
    errorContainer: {
        flex: 1,
        backgroundColor: COLORS.background.dark,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorText: {
        fontSize: 18,
        fontFamily: 'Lexend_600SemiBold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    errorSubtext: {
        fontSize: 14,
        fontFamily: 'Lexend_400Regular',
        color: '#9ca3af',
        textAlign: 'center',
    },
});
