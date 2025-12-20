import React from 'react';
import { Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton } from 'react-native-paper';

interface FinishedPhaseProps {
    onReset: () => void;
}

export const FinishedPhase: React.FC<FinishedPhaseProps> = ({
    onReset,
}) => {
    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: '#221010', justifyContent: 'center', alignItems: 'center' }]}
            edges={['top', 'left', 'right']}
        >
            <StatusBar hidden />
            {/* Modal handles completion flow, no UI needed here */}
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
