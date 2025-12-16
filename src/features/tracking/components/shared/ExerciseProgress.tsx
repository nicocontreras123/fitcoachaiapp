import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ExerciseProgressProps {
    currentSet?: number;
    totalSets?: number;
    currentExercise: number;
    totalExercises: number;
    exerciseName: string;
    reps?: number | string;
    weight?: string;
    progress?: number;
}

export const ExerciseProgress: React.FC<ExerciseProgressProps> = ({
    currentSet,
    totalSets,
    currentExercise,
    totalExercises,
    exerciseName,
    reps,
    weight,
    progress,
}) => {
    return (
        <View style={styles.container}>
            {/* Progress bar */}
            {progress !== undefined && (
                <View style={styles.progressContainer}>
                    <ProgressBar
                        progress={progress}
                        color="#13ec5b"
                        style={styles.progressBar}
                    />
                    <Text style={styles.progressText}>
                        Ejercicio {currentExercise} de {totalExercises}
                    </Text>
                </View>
            )}

            {/* Exercise name */}
            <Text style={styles.exerciseName}>{exerciseName}</Text>

            {/* Sets info (for gym) */}
            {currentSet !== undefined && totalSets !== undefined && (
                <View style={styles.setsContainer}>
                    <View style={styles.setCard}>
                        <Text style={styles.setNumber}>{currentSet}</Text>
                        <Text style={styles.setLabel}>Serie Actual</Text>
                    </View>

                    <Text style={styles.separator}>/</Text>

                    <View style={styles.setCard}>
                        <Text style={styles.totalSets}>{totalSets}</Text>
                        <Text style={styles.setLabel}>Total Series</Text>
                    </View>
                </View>
            )}

            {/* Reps and weight */}
            {(reps || weight) && (
                <View style={styles.detailsContainer}>
                    {reps && (
                        <View style={styles.detailItem}>
                            <MaterialCommunityIcons
                                name="repeat"
                                size={20}
                                color="#13ec5b"
                            />
                            <Text style={styles.detailText}>{reps} reps</Text>
                        </View>
                    )}
                    {weight && (
                        <View style={styles.detailItem}>
                            <MaterialCommunityIcons
                                name="weight-kilogram"
                                size={20}
                                color="#9ca3af"
                            />
                            <Text style={styles.detailText}>{weight}</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 16,
    },
    progressContainer: {
        gap: 8,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    progressText: {
        fontSize: 12,
        color: '#9ca3af',
        textAlign: 'center',
    },
    exerciseName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
    },
    setsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    setCard: {
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#193322',
        borderRadius: 12,
        minWidth: 100,
    },
    setNumber: {
        fontSize: 36,
        fontWeight: '700',
        color: '#13ec5b',
    },
    totalSets: {
        fontSize: 36,
        fontWeight: '700',
        color: '#d1d5db',
    },
    separator: {
        fontSize: 36,
        fontWeight: '700',
        color: '#6b7280',
    },
    setLabel: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 4,
    },
    detailsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#d1d5db',
    },
});
