import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { DailyRoutine } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RutinaCardProps {
    dayInfo: DailyRoutine;
    onPress: () => void;
}

export const RutinaCard: React.FC<RutinaCardProps> = ({ dayInfo, onPress }) => {
    const { day, workout, restDay } = dayInfo;
    const theme = useTheme();

    return (
        <Surface style={[styles.card, { backgroundColor: restDay ? theme.colors.surfaceVariant : theme.colors.surface, borderColor: restDay ? 'transparent' : theme.colors.primaryContainer }]} elevation={1}>
            <TouchableRipple onPress={onPress} style={styles.touchable}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text variant="titleMedium" style={[styles.day, { color: theme.colors.onSurface }]}>{day}</Text>
                        {restDay ? (
                            <MaterialCommunityIcons name="coffee" size={24} color={theme.colors.onSurfaceVariant} />
                        ) : (
                            <MaterialCommunityIcons name="dumbbell" size={24} color={theme.colors.primary} />
                        )}
                    </View>

                    {restDay ? (
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Día de descanso activo o recuperación.</Text>
                    ) : (
                        <>
                            <Text variant="titleLarge" style={[styles.title, { color: theme.colors.primary }]}>{workout?.title || 'Entrenamiento'}</Text>
                            <Text variant="bodyMedium" numberOfLines={2} style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
                                {workout?.description}
                            </Text>
                            <View style={styles.metaRow}>
                                <View style={styles.metaItem}>
                                    <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
                                    <Text variant="bodySmall" style={{ marginLeft: 4, color: theme.colors.onSurfaceVariant }}>{workout?.totalDuration} min</Text>
                                </View>
                                {workout && 'difficulty' in workout && (
                                    <View style={[styles.badge, { backgroundColor: theme.colors.primaryContainer }]}>
                                        <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
                                            {workout.difficulty}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </>
                    )}
                </View>
            </TouchableRipple>
        </Surface>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
    },
    touchable: {
        width: '100%',
    },
    content: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    day: {
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    description: {
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
});
