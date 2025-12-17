import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StatCardProps {
    label: string;
    value: string | number;
    unit?: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    iconColor?: string;
    backgroundColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    unit,
    icon,
    iconColor = '#13ec5b',
    backgroundColor = 'rgba(26, 46, 34, 0.8)',
}) => {
    return (
        <Surface style={[styles.container, { backgroundColor }]} elevation={0}>
            <View style={styles.header}>
                <Text style={styles.label}>{label}</Text>
                <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
            </View>
            <View style={styles.valueContainer}>
                <Text style={styles.value}>{value}</Text>
                {unit && <Text style={styles.unit}>{unit}</Text>}
            </View>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    label: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.5)',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    value: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
    },
    unit: {
        fontSize: 12,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.5)',
        marginLeft: 4,
    },
});
