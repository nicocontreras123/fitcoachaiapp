import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { BlurView } from 'expo-blur';

interface SkipConfirmationDialogProps {
    visible: boolean;
    message: string;
    skipsRemaining: number;
    onConfirm: () => void;
    onCancel: () => void;
}

export const SkipConfirmationDialog: React.FC<SkipConfirmationDialogProps> = ({
    visible,
    message,
    skipsRemaining,
    onConfirm,
    onCancel,
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <BlurView intensity={20} style={styles.overlay}>
                <View style={styles.dialog}>
                    <Text style={styles.icon}>⚠️</Text>

                    <Text style={styles.title}>Saltar Ejercicio</Text>

                    <Text style={styles.message}>{message}</Text>

                    {skipsRemaining <= 1 && (
                        <View style={styles.warningBox}>
                            <Text style={styles.warningText}>
                                ⚡ {skipsRemaining === 1 ? 'Último salto disponible' : 'No quedan saltos'}
                            </Text>
                        </View>
                    )}

                    <View style={styles.buttons}>
                        <Button
                            mode="outlined"
                            onPress={onCancel}
                            style={styles.cancelButton}
                            labelStyle={styles.cancelButtonText}
                        >
                            Cancelar
                        </Button>

                        <Button
                            mode="contained"
                            onPress={onConfirm}
                            style={styles.confirmButton}
                            labelStyle={styles.confirmButtonText}
                            buttonColor="#ec1313"
                        >
                            Saltar
                        </Button>
                    </View>
                </View>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    dialog: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 24,
        width: '85%',
        maxWidth: 400,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(236, 19, 19, 0.3)',
    },
    icon: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontFamily: 'Lexend_700Bold',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        fontFamily: 'Lexend_400Regular',
        color: '#b0b0b0',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
    },
    warningBox: {
        backgroundColor: 'rgba(236, 19, 19, 0.1)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(236, 19, 19, 0.3)',
    },
    warningText: {
        fontSize: 14,
        fontFamily: 'Lexend_600SemiBold',
        color: '#ec1313',
        textAlign: 'center',
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        borderColor: '#444',
    },
    cancelButtonText: {
        fontFamily: 'Lexend_600SemiBold',
        color: '#fff',
    },
    confirmButton: {
        flex: 1,
    },
    confirmButtonText: {
        fontFamily: 'Lexend_600SemiBold',
        color: '#fff',
    },
});
