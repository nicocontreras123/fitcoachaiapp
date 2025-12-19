import React from 'react';
import { Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton } from 'react-native-paper';
import { WorkoutCompletedModal } from '@/features/history/WorkoutCompletedModal';
import { SuccessAlert } from '@/components/common';

interface FinishedPhaseProps {
    showCompletedModal: boolean;
    showSuccessAlert: boolean;
    totalElapsedTime: number;
    onSaveWorkout: (notes: string) => Promise<void>;
    onSkipSave: () => void;
    onCloseSuccess: () => void;
    onContinue: () => void;
    onReset: () => void;
}

export const FinishedPhase: React.FC<FinishedPhaseProps> = ({
    showCompletedModal,
    showSuccessAlert,
    totalElapsedTime,
    onSaveWorkout,
    onSkipSave,
    onCloseSuccess,
    onContinue,
    onReset,
}) => {
    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: '#221010', justifyContent: 'center', alignItems: 'center' }]}
            edges={['top', 'left', 'right']}
        >
            <StatusBar hidden />
            <Text style={styles.finishedIcon}>🏆</Text>
            <Text style={styles.finishedTitle}>¡Entrenamiento Completado!</Text>
            <Text style={styles.finishedSubtitle}>Excelente trabajo 💪</Text>
            <IconButton
                icon="refresh"
                iconColor="#ec1313"
                size={32}
                onPress={onReset}
                style={styles.resetButton}
            />

            <WorkoutCompletedModal
                visible={showCompletedModal}
                duration={totalElapsedTime}
                calories={Math.round((totalElapsedTime / 60) * 12)}
                onSave={onSaveWorkout}
                onSkip={onSkipSave}
            />

            <SuccessAlert
                visible={showSuccessAlert}
                title="¡Excelente!"
                message="Has completado tu rutina de boxeo.\n¡Sigue así!"
                onClose={onCloseSuccess}
                onContinue={onContinue}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    finishedIcon: {
        fontSize: 80,
    },
    finishedTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
        marginTop: 24,
        textAlign: 'center',
    },
    finishedSubtitle: {
        fontSize: 18,
        color: '#9ca3af',
        marginTop: 12,
        textAlign: 'center',
    },
    resetButton: {
        marginTop: 24,
    },
});
