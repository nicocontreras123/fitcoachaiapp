import { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import { Equipment } from '@/features/profile/types';
import { COLORS } from '@/constants/theme';
import { PrimaryButton, ProgressIndicator, EquipmentCard } from '@/components/common';

// Equipment organized by sport
const ALL_EQUIPMENT_OPTIONS = [
    // Boxing specific
    {
        id: 'punching-bag' as Equipment,
        label: 'Saco de boxeo',
        description: 'Pesado o de velocidad',
        imageUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400',
        sports: ['boxing'],
    },
    {
        id: 'boxing-gloves' as Equipment,
        label: 'Guantes de boxeo',
        description: 'Para entrenamiento',
        imageUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400',
        sports: ['boxing'],
    },

    // Running specific
    {
        id: 'treadmill' as Equipment,
        label: 'Trotadora',
        description: 'Caminadora eléctrica',
        imageUrl: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400',
        sports: ['running'],
    },
    {
        id: 'dumbbells' as Equipment,
        label: 'Pesas/Mancuernas',
        description: 'Pares o individuales',
        imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
        sports: ['gym', 'functional'],
    },
    {
        id: 'barbell' as Equipment,
        label: 'Barra olímpica',
        description: 'Con o sin discos',
        imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
        sports: ['gym'],
    },
    {
        id: 'kettlebells' as Equipment,
        label: 'Pesas rusas',
        description: 'Cualquier peso',
        imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
        sports: ['gym', 'functional'],
    },
    {
        id: 'pull-up-bar' as Equipment,
        label: 'Barra de dominadas',
        description: 'Puerta o estructura',
        imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
        sports: ['gym', 'functional'],
    },
    {
        id: 'bench' as Equipment,
        label: 'Banco de pesas',
        description: 'Plano o ajustable',
        imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
        sports: ['gym'],
    },
    {
        id: 'squat-rack' as Equipment,
        label: 'Rack de sentadillas',
        description: 'Para ejercicios pesados',
        imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
        sports: ['gym'],
    },

    // General/Multi-sport
    {
        id: 'jump-rope' as Equipment,
        label: 'Cuerda para saltar',
        description: 'Velocidad o con peso',
        imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
        sports: ['boxing', 'functional', 'general'],
    },
    {
        id: 'resistance-bands' as Equipment,
        label: 'Bandas elásticas',
        description: 'Loop o tubo',
        imageUrl: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400',
        sports: ['gym', 'functional', 'general'],
    },
    {
        id: 'yoga-mat' as Equipment,
        label: 'Colchoneta/Mat',
        description: 'Para ejercicios de piso',
        imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400',
        sports: ['functional', 'general'],
    },
    {
        id: 'ab-wheel' as Equipment,
        label: 'Rueda abdominal',
        description: 'Core y abdominales',
        imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
        sports: ['functional', 'general'],
    },
];

export default function EquipmentScreen() {
    const router = useRouter();
    const { formData, setFormData } = useOnboardingStore();

    const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>(
        formData.equipment || []
    );
    const [noEquipment, setNoEquipment] = useState(false);

    // Filter equipment based on selected sports
    const filteredEquipment = useMemo(() => {
        const selectedSports = formData.sports || [];

        if (selectedSports.length === 0) {
            // If no sports selected, show all equipment
            return ALL_EQUIPMENT_OPTIONS;
        }

        // Show equipment that matches any of the selected sports or is general
        return ALL_EQUIPMENT_OPTIONS.filter(equipment =>
            equipment.sports.some(sport =>
                selectedSports.includes(sport) || sport === 'general'
            )
        );
    }, [formData.sports]);

    const toggleEquipment = (id: Equipment) => {
        if (noEquipment) {
            setNoEquipment(false);
        }

        setSelectedEquipment(prev =>
            prev.includes(id)
                ? prev.filter(e => e !== id)
                : [...prev, id]
        );
    };

    const handleNoEquipment = () => {
        setNoEquipment(!noEquipment);
        if (!noEquipment) {
            setSelectedEquipment([]);
        }
    };

    const handleContinue = () => {
        if (noEquipment) {
            setFormData({ equipment: ['none'] });
        } else {
            setFormData({ equipment: selectedEquipment });
        }
        router.push('/onboarding/level-selection');
    };

    return (
        <View style={styles.container}>
            {/* Progress Indicator */}
            <View style={styles.headerContainer}>
                <ProgressIndicator
                    current={3}
                    total={6}
                    onBack={() => router.back()}
                />
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Headline */}
                <View style={styles.headlineContainer}>
                    <Text style={styles.headline}>¿Qué implementos tienes?</Text>
                    <Text style={styles.subtitle}>
                        Selecciona todo lo que tengas disponible. Construiremos tu rutina personalizada con estas herramientas.
                    </Text>
                </View>

                {/* No Equipment Option */}
                <Pressable
                    style={[styles.noEquipmentCard, noEquipment && styles.noEquipmentCardSelected]}
                    onPress={handleNoEquipment}
                >
                    <View style={styles.noEquipmentContent}>
                        <View style={styles.noEquipmentIcon}>
                            <MaterialCommunityIcons
                                name="account"
                                size={24}
                                color={noEquipment ? COLORS.primary.DEFAULT : '#ffffff'}
                            />
                        </View>
                        <View style={styles.noEquipmentText}>
                            <Text style={styles.noEquipmentTitle}>Sin equipamiento</Text>
                            <Text style={styles.noEquipmentDescription}>
                                Entreno solo con peso corporal
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.checkbox, noEquipment && styles.checkboxSelected]}>
                        {noEquipment && (
                            <MaterialCommunityIcons name="check" size={16} color={COLORS.background.dark} />
                        )}
                    </View>
                </Pressable>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>O SELECCIONA ITEMS</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Equipment Grid */}
                <View style={styles.grid}>
                    {filteredEquipment.map((equipment) => (
                        <View key={equipment.id} style={styles.gridItem}>
                            <EquipmentCard
                                title={equipment.label}
                                description={equipment.description}
                                imageUrl={equipment.imageUrl}
                                isSelected={selectedEquipment.includes(equipment.id)}
                                onPress={() => toggleEquipment(equipment.id)}
                            />
                        </View>
                    ))}
                </View>

                {/* Bottom spacer */}
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Fixed Bottom Button */}
            <View style={styles.bottomContainer}>
                <PrimaryButton
                    onPress={handleContinue}
                    icon="arrow-right"
                    disabled={!noEquipment && selectedEquipment.length === 0}
                >
                    CONTINUAR
                </PrimaryButton>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background.dark,
    },
    headerContainer: {
        paddingTop: 16,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 32,
    },
    headlineContainer: {
        marginBottom: 16,
    },
    headline: {
        fontSize: 28,
        fontFamily: 'Lexend_700Bold',
        color: '#ffffff',
        lineHeight: 36,
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'Lexend_400Regular',
        color: '#9ca3af',
        lineHeight: 22,
    },
    noEquipmentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingLeft: 16,
        paddingRight: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: '#162d1f',
        marginVertical: 16,
    },
    noEquipmentCardSelected: {
        borderColor: COLORS.primary.DEFAULT,
    },
    noEquipmentContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        overflow: 'hidden',
    },
    noEquipmentIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noEquipmentText: {
        flex: 1,
        marginRight: 8,
    },
    noEquipmentTitle: {
        fontSize: 14,
        fontFamily: 'Lexend_700Bold',
        color: '#ffffff',
        marginBottom: 2,
    },
    noEquipmentDescription: {
        fontSize: 12,
        fontFamily: 'Lexend_400Regular',
        color: '#9ca3af',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#6b7280',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    checkboxSelected: {
        borderColor: COLORS.primary.DEFAULT,
        backgroundColor: COLORS.primary.DEFAULT,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    dividerText: {
        fontSize: 10,
        fontFamily: 'Lexend_600SemiBold',
        color: '#6b7280',
        marginHorizontal: 16,
        letterSpacing: 1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 8,
    },
    gridItem: {
        width: '48%',
    },
    bottomSpacer: {
        height: 120,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 32,
        backgroundColor: 'transparent',
        shadowColor: COLORS.background.dark,
        shadowOffset: { width: 0, height: -20 },
        shadowOpacity: 1,
        shadowRadius: 30,
    },
});
