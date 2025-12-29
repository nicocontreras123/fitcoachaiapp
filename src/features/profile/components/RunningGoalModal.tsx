import React, { useState } from 'react';
import { Modal, View, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RunningGoalData } from '@/features/profile/types';

interface RunningGoalModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (data: RunningGoalData) => void;
    initialData?: RunningGoalData;
}

const COMMON_DISTANCES = [
    { label: '5K', value: 5 },
    { label: '10K', value: 10 },
    { label: 'Media Maratón (21K)', value: 21.1 },
    { label: 'Maratón (42K)', value: 42.2 },
];

export function RunningGoalModal({
    visible,
    onClose,
    onSave,
    initialData,
}: RunningGoalModalProps) {
    const [targetDistance, setTargetDistance] = useState(initialData?.targetDistance?.toString() || '');
    const [currentMaxDistance, setCurrentMaxDistance] = useState(initialData?.currentMaxDistance?.toString() || '');
    const [currentMaxTime, setCurrentMaxTime] = useState(initialData?.currentMaxTime?.toString() || '');
    const [currentWeeklyKm, setCurrentWeeklyKm] = useState(initialData?.currentWeeklyKm?.toString() || '');

    const handleSave = () => {
        const data: RunningGoalData = {
            targetDistance: parseFloat(targetDistance) || 0,
            currentMaxDistance: parseFloat(currentMaxDistance) || 0,
            currentMaxTime: parseFloat(currentMaxTime) || 0,
            currentWeeklyKm: parseFloat(currentWeeklyKm) || 0,
        };

        // Calculate recommended plan duration based on gap
        const distanceGap = data.targetDistance - data.currentMaxDistance;
        const weeksNeeded = Math.max(4, Math.ceil(distanceGap / 2)); // ~2km increase per week, minimum 4 weeks
        data.planWeeks = weeksNeeded;

        onSave(data);
        onClose();
    };

    const selectCommonDistance = (distance: number) => {
        setTargetDistance(distance.toString());
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>🏃 Objetivo de Running</Text>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <MaterialCommunityIcons name="close" size={24} color="#9ca3af" />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Target Distance */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Distancia Objetivo</Text>
                            <Text style={styles.subtitle}>¿Qué distancia quieres lograr?</Text>

                            <View style={styles.distanceButtons}>
                                {COMMON_DISTANCES.map((dist) => (
                                    <Pressable
                                        key={dist.value}
                                        style={[
                                            styles.distanceButton,
                                            targetDistance === dist.value.toString() && styles.distanceButtonActive,
                                        ]}
                                        onPress={() => selectCommonDistance(dist.value)}
                                    >
                                        <Text
                                            style={[
                                                styles.distanceButtonText,
                                                targetDistance === dist.value.toString() && styles.distanceButtonTextActive,
                                            ]}
                                        >
                                            {dist.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            <Text style={styles.orText}>o ingresa una distancia personalizada</Text>

                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={targetDistance}
                                    onChangeText={setTargetDistance}
                                    placeholder="Ej: 15"
                                    placeholderTextColor="#6b7280"
                                    keyboardType="decimal-pad"
                                />
                                <Text style={styles.inputUnit}>km</Text>
                            </View>
                        </View>

                        {/* Current Max Distance */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Distancia Máxima Actual</Text>
                            <Text style={styles.subtitle}>¿Cuál es la mayor distancia que has corrido recientemente?</Text>

                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={currentMaxDistance}
                                    onChangeText={setCurrentMaxDistance}
                                    placeholder="Ej: 5"
                                    placeholderTextColor="#6b7280"
                                    keyboardType="decimal-pad"
                                />
                                <Text style={styles.inputUnit}>km</Text>
                            </View>
                        </View>

                        {/* Current Max Time */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Tiempo de tu Distancia Máxima</Text>
                            <Text style={styles.subtitle}>¿En cuánto tiempo completaste esa distancia?</Text>

                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={currentMaxTime}
                                    onChangeText={setCurrentMaxTime}
                                    placeholder="Ej: 30"
                                    placeholderTextColor="#6b7280"
                                    keyboardType="decimal-pad"
                                />
                                <Text style={styles.inputUnit}>min</Text>
                            </View>
                        </View>

                        {/* Current Weekly Volume */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Kilometraje Semanal Actual</Text>
                            <Text style={styles.subtitle}>¿Cuántos kilómetros corres por semana actualmente?</Text>

                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={currentWeeklyKm}
                                    onChangeText={setCurrentWeeklyKm}
                                    placeholder="Ej: 15"
                                    placeholderTextColor="#6b7280"
                                    keyboardType="decimal-pad"
                                />
                                <Text style={styles.inputUnit}>km/semana</Text>
                            </View>
                        </View>

                        {/* Info Box */}
                        <View style={styles.infoBox}>
                            <MaterialCommunityIcons name="information" size={20} color="#13ec5b" />
                            <Text style={styles.infoText}>
                                Con esta información, generaremos un plan progresivo personalizado para alcanzar tu objetivo de forma segura.
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Save Button */}
                    <View style={styles.footer}>
                        <Pressable
                            style={[
                                styles.saveButton,
                                (!targetDistance || !currentMaxDistance || !currentMaxTime || !currentWeeklyKm) && styles.saveButtonDisabled,
                            ]}
                            onPress={handleSave}
                            disabled={!targetDistance || !currentMaxDistance || !currentMaxTime || !currentWeeklyKm}
                        >
                            <Text style={styles.saveButtonText}>Guardar y Generar Plan</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#152e1e',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#9ca3af',
        marginBottom: 12,
    },
    distanceButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    distanceButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
    },
    distanceButtonActive: {
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        borderColor: '#13ec5b',
    },
    distanceButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#9ca3af',
    },
    distanceButtonTextActive: {
        color: '#13ec5b',
    },
    orText: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        paddingVertical: 14,
    },
    inputUnit: {
        fontSize: 14,
        color: '#9ca3af',
        marginLeft: 8,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#9ca3af',
        lineHeight: 20,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    saveButton: {
        backgroundColor: '#13ec5b',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#333',
        opacity: 0.5,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
});
