import { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text, ProgressBar, useTheme, Chip } from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import { Equipment } from '@/features/profile/types';

const EQUIPMENT_OPTIONS = [
    { id: 'jump-rope' as Equipment, label: 'Cuerda para saltar', icon: '🪢' },
    { id: 'punching-bag' as Equipment, label: 'Saco de boxeo', icon: '🥊' },
    { id: 'treadmill' as Equipment, label: 'Trotadora/Caminadora', icon: '🏃' },
    { id: 'dumbbells' as Equipment, label: 'Pesas/Mancuernas', icon: '🏋️' },
    { id: 'resistance-bands' as Equipment, label: 'Bandas elásticas', icon: '🎗️' },
    { id: 'pull-up-bar' as Equipment, label: 'Barra de dominadas', icon: '💪' },
    { id: 'kettlebells' as Equipment, label: 'Pesas rusas', icon: '⚫' },
    { id: 'yoga-mat' as Equipment, label: 'Colchoneta/Mat', icon: '🧘' },
    { id: 'none' as Equipment, label: 'Sin equipamiento', icon: '🚫' },
];

export default function EquipmentScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { formData, setFormData } = useOnboardingStore();

    const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>(
        formData.equipment || []
    );

    const toggleEquipment = (id: Equipment) => {
        // Si selecciona "Sin equipamiento", limpiar todo lo demás
        if (id === 'none') {
            setSelectedEquipment(['none']);
            return;
        }

        // Si ya tiene "Sin equipamiento" y selecciona otro, quitar "none"
        if (selectedEquipment.includes('none')) {
            setSelectedEquipment([id]);
            return;
        }

        // Toggle normal
        setSelectedEquipment(prev =>
            prev.includes(id)
                ? prev.filter(e => e !== id)
                : [...prev, id]
        );
    };

    const handleContinue = () => {
        setFormData({ equipment: selectedEquipment });
        router.push('/onboarding/level-selection');
    };

    const handleSkip = () => {
        setFormData({ equipment: ['none'] });
        router.push('/onboarding/level-selection');
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10 }}>
                <ProgressBar progress={0.5} color={theme.colors.primary} style={{ height: 6, borderRadius: 3 }} />
                <Text style={{ marginTop: 10, textAlign: 'right', color: theme.colors.onSurfaceVariant }}>3 de 5</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }}>
                <Animated.View entering={FadeInDown.delay(100).duration(500)}>
                    <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 8, color: theme.colors.onBackground }}>
                        ¿Qué equipamiento tienes?
                    </Text>
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 32 }}>
                        Selecciona el equipamiento disponible para personalizar tus rutinas
                    </Text>

                    {/* Chips de equipamiento */}
                    <View style={styles.chipsContainer}>
                        {EQUIPMENT_OPTIONS.map((equipment) => (
                            <Chip
                                key={equipment.id}
                                selected={selectedEquipment.includes(equipment.id)}
                                onPress={() => toggleEquipment(equipment.id)}
                                style={[
                                    styles.chip,
                                    selectedEquipment.includes(equipment.id) && {
                                        backgroundColor: theme.colors.primaryContainer,
                                    }
                                ]}
                                textStyle={{
                                    color: selectedEquipment.includes(equipment.id)
                                        ? theme.colors.onPrimaryContainer
                                        : theme.colors.onSurface,
                                }}
                                icon={() => <Text style={{ fontSize: 16 }}>{equipment.icon}</Text>}
                            >
                                {equipment.label}
                            </Chip>
                        ))}
                    </View>

                    {/* Resumen */}
                    {selectedEquipment.length > 0 && !selectedEquipment.includes('none') && (
                        <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 24 }}>
                            <Text variant="titleSmall" style={{ color: theme.colors.primary, marginBottom: 8 }}>
                                ✓ {selectedEquipment.length} equipamiento{selectedEquipment.length > 1 ? 's' : ''} seleccionado{selectedEquipment.length > 1 ? 's' : ''}
                            </Text>
                        </Animated.View>
                    )}

                    {/* Botones */}
                    <View style={{ marginTop: 40, gap: 12 }}>
                        <Button
                            mode="contained"
                            onPress={handleContinue}
                            disabled={selectedEquipment.length === 0}
                            contentStyle={{ height: 50 }}
                        >
                            Continuar
                        </Button>
                        <Button
                            mode="outlined"
                            onPress={handleSkip}
                            contentStyle={{ height: 50 }}
                        >
                            Saltar (sin equipamiento)
                        </Button>
                        <Button
                            mode="text"
                            onPress={() => router.back()}
                            contentStyle={{ height: 50 }}
                        >
                            Atrás
                        </Button>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        marginBottom: 4,
    },
});
