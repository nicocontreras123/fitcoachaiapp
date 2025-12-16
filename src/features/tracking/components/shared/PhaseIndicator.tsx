import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { TimerPhase } from '../../types/timer.types';

interface PhaseIndicatorProps {
    phase: TimerPhase;
    customLabel?: string;
}

const PHASE_CONFIG: Record<
    TimerPhase,
    { label: string; color: string; icon: string }
> = {
    idle: { label: 'Listo', color: '#6b7280', icon: '⏸️' },
    preparing: { label: 'Preparación', color: '#ff8c00', icon: '⏱️' },
    warmup: { label: 'Calentamiento', color: '#fbbf24', icon: '🔥' },
    workout: { label: 'Entrenamiento', color: '#ec1313', icon: '💪' },
    cooldown: { label: 'Enfriamiento', color: '#2dd4bf', icon: '❄️' },
    finished: { label: 'Completado', color: '#10b981', icon: '✅' },
};

export const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({
    phase,
    customLabel,
}) => {
    const config = PHASE_CONFIG[phase];
    const label = customLabel || config.label;

    return (
        <View style={[styles.container, { backgroundColor: config.color + '20' }]}>
            <View style={[styles.dot, { backgroundColor: config.color }]} />
            <Text style={styles.label}>{config.icon} {label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
        alignSelf: 'flex-start',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
