import React, { useState } from 'react';
import { View, StyleSheet, Modal, TextInput, Pressable, Animated } from 'react-native';
import { Text, Surface, ActivityIndicator } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface WorkoutCompletedModalProps {
    visible: boolean;
    duration: number; // seconds
    calories: number;
    onSave: (notes: string) => Promise<void>;
    onSkip: () => void;
}

export const WorkoutCompletedModal: React.FC<WorkoutCompletedModalProps> = ({
    visible,
    duration,
    calories,
    onSave,
    onSkip,
}) => {
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(notes);
        setIsSaving(false);
        setNotes('');
    };

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Modal transparent visible={visible} animationType="fade">
            <BlurView intensity={20} style={styles.container}>
                <Pressable style={styles.backdrop} onPress={onSkip} />

                <Animated.View style={styles.modal}>
                    <Surface style={styles.surface} elevation={5}>
                        {/* Header */}
                        <View style={styles.header}>
                            <MaterialCommunityIcons name="check-circle" size={48} color="#13ec5b" />
                            <Text style={styles.title}>¡Entrenamiento Completado!</Text>
                        </View>

                        {/* Stats */}
                        <View style={styles.statsRow}>
                            <View style={styles.statCard}>
                                <MaterialCommunityIcons name="clock-outline" size={24} color="#3b82f6" />
                                <Text style={styles.statValue}>{formatDuration(duration)}</Text>
                                <Text style={styles.statLabel}>Duración</Text>
                            </View>

                            <View style={styles.statCard}>
                                <MaterialCommunityIcons name="fire" size={24} color="#f59e0b" />
                                <Text style={styles.statValue}>{calories}</Text>
                                <Text style={styles.statLabel}>Calorías</Text>
                            </View>
                        </View>

                        {/* Notes Input */}
                        <View style={styles.notesSection}>
                            <Text style={styles.notesLabel}>¿Cómo te sentiste?</Text>
                            <TextInput
                                style={styles.notesInput}
                                placeholder="Agrega notas sobre tu entrenamiento..."
                                placeholderTextColor="#9ca3af"
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={4}
                                maxLength={200}
                            />
                            <Text style={styles.charCount}>{notes.length}/200</Text>
                        </View>

                        {/* Actions */}
                        <View style={styles.actions}>
                            <Pressable
                                style={styles.skipButton}
                                onPress={onSkip}
                                disabled={isSaving}
                            >
                                <Text style={styles.skipButtonText}>Omitir</Text>
                            </Pressable>

                            <Pressable
                                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                                onPress={handleSave}
                                disabled={isSaving}
                            >
                                <LinearGradient
                                    colors={['#13ec5b', '#10c94d']}
                                    style={styles.saveButtonGradient}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator size="small" color="#102216" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Guardar</Text>
                                    )}
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </Surface>
                </Animated.View>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modal: {
        width: '100%',
        maxWidth: 400,
    },
    surface: {
        backgroundColor: '#193322',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
        marginTop: 12,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 4,
    },
    notesSection: {
        marginBottom: 24,
    },
    notesLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 8,
    },
    notesInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 12,
        color: '#ffffff',
        fontSize: 14,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 12,
        color: '#9ca3af',
        textAlign: 'right',
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    skipButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#9ca3af',
    },
    saveButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        overflow: 'hidden',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#102216',
    },
});
