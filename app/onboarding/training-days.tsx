import { useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import { COLORS } from '@/constants/theme';
import { PrimaryButton, ProgressIndicator, DayButton } from '@/components/common';

const DAYS = [
    { id: 'monday', label: 'L', fullName: 'Lunes' },
    { id: 'tuesday', label: 'M', fullName: 'Martes' },
    { id: 'wednesday', label: 'X', fullName: 'Miércoles' },
    { id: 'thursday', label: 'J', fullName: 'Jueves' },
    { id: 'friday', label: 'V', fullName: 'Viernes' },
    { id: 'saturday', label: 'S', fullName: 'Sábado' },
    { id: 'sunday', label: 'D', fullName: 'Domingo' },
];

const FEEDBACK_MESSAGES: Record<number, string> = {
    1: '1 día es un buen comienzo. Cada paso cuenta!',
    2: '2 días a la semana es perfecto para mantener el hábito.',
    3: '3 días es excelente para ver resultados consistentes.',
    4: '¡Excelente elección! 4 días a la semana es perfecto para desarrollar músculo y mejorar resistencia.',
    5: '5 días demuestra gran compromiso. Asegúrate de descansar bien.',
    6: '6 días es intenso! Recuerda que el descanso también es importante.',
    7: '7 días requiere dedicación total. No olvides escuchar a tu cuerpo.',
};

export default function TrainingDaysScreen() {
    const router = useRouter();
    const { formData, setFormData } = useOnboardingStore();

    const [frequency, setFrequency] = useState(formData.weekly_frequency || 4);
    const [selectedDays, setSelectedDays] = useState<string[]>(
        formData.available_days || []
    );

    const toggleDay = (dayId: string) => {
        setSelectedDays(prev =>
            prev.includes(dayId)
                ? prev.filter(d => d !== dayId)
                : [...prev, dayId]
        );
    };

    const selectAllDays = () => {
        if (selectedDays.length === 7) {
            setSelectedDays([]);
        } else {
            setSelectedDays(DAYS.map(d => d.id));
        }
    };

    const handleContinue = () => {
        setFormData({
            weekly_frequency: frequency,
            available_days: selectedDays,
        });
        router.push('/onboarding/goals');
    };

    return (
        <View style={styles.container}>
            {/* Progress Indicator */}
            <View style={styles.headerContainer}>
                <ProgressIndicator
                    current={5}
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
                    <Text style={styles.headline}>
                        Establece tu{'\n'}
                        <Text style={styles.headlineAccent}>Horario</Text>
                    </Text>
                    <Text style={styles.subtitle}>
                        La consistencia es clave. Elige los días que puedes dedicarte para crear un hábito.
                    </Text>
                </View>

                {/* Frequency Slider */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Meta Semanal</Text>
                        <View style={styles.frequencyDisplay}>
                            <Text style={styles.frequencyNumber}>{frequency}</Text>
                            <Text style={styles.frequencyLabel}>Días</Text>
                        </View>
                    </View>

                    <View style={styles.sliderCard}>
                        <Slider
                            style={styles.slider}
                            minimumValue={1}
                            maximumValue={7}
                            step={1}
                            value={frequency}
                            onValueChange={setFrequency}
                            minimumTrackTintColor={COLORS.primary.DEFAULT}
                            maximumTrackTintColor="#326744"
                            thumbTintColor={COLORS.primary.DEFAULT}
                        />
                        <View style={styles.sliderLabels}>
                            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                <Text
                                    key={num}
                                    style={[
                                        styles.sliderLabel,
                                        num === frequency && styles.sliderLabelActive,
                                    ]}
                                >
                                    {num}
                                </Text>
                            ))}
                        </View>
                    </View>

                    {/* Feedback Message */}
                    <View style={styles.feedbackCard}>
                        <MaterialCommunityIcons
                            name="check-circle"
                            size={20}
                            color={COLORS.primary.DEFAULT}
                            style={styles.feedbackIcon}
                        />
                        <Text style={styles.feedbackText}>
                            <Text style={styles.feedbackBold}>¡Excelente elección! </Text>
                            {FEEDBACK_MESSAGES[frequency]}
                        </Text>
                    </View>
                </View>

                {/* Day Selector */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Días Preferidos</Text>
                        <Text style={styles.selectAllButton} onPress={selectAllDays}>
                            {selectedDays.length === 7 ? 'Deseleccionar' : 'Seleccionar Todos'}
                        </Text>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.daysScrollContent}
                    >
                        {DAYS.map((day) => (
                            <View key={day.id} style={styles.dayButtonWrapper}>
                                <DayButton
                                    label={day.fullName}
                                    isSelected={selectedDays.includes(day.id)}
                                    onPress={() => toggleDay(day.id)}
                                />
                            </View>
                        ))}
                    </ScrollView>

                    <Text style={styles.daysHint}>Toca para alternar días</Text>

                    {selectedDays.length < frequency && selectedDays.length > 0 && (
                        <Text style={styles.warningText}>
                            Selecciona al menos {frequency} días para tu frecuencia semanal
                        </Text>
                    )}
                </View>

                {/* Bottom spacer */}
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Fixed Bottom Button */}
            <View style={styles.bottomContainer}>
                <PrimaryButton
                    onPress={handleContinue}
                    icon="arrow-right"
                    disabled={selectedDays.length < frequency}
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
        paddingTop: 8,
        paddingBottom: 32,
    },
    headlineContainer: {
        marginBottom: 40,
    },
    headline: {
        fontSize: 32,
        fontFamily: 'Lexend_700Bold',
        color: '#ffffff',
        lineHeight: 38,
        letterSpacing: -0.5,
        marginBottom: 12,
    },
    headlineAccent: {
        color: COLORS.primary.DEFAULT,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Lexend_400Regular',
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 26,
    },
    section: {
        marginBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Lexend_700Bold',
        color: '#ffffff',
    },
    frequencyDisplay: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    frequencyNumber: {
        fontSize: 24,
        fontFamily: 'Lexend_700Bold',
        color: COLORS.primary.DEFAULT,
    },
    frequencyLabel: {
        fontSize: 14,
        fontFamily: 'Lexend_500Medium',
        color: 'rgba(255,255,255,0.6)',
    },
    sliderCard: {
        backgroundColor: '#162e20',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        padding: 20,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingHorizontal: 4,
    },
    sliderLabel: {
        fontSize: 12,
        fontFamily: 'Lexend_500Medium',
        color: 'rgba(255,255,255,0.4)',
    },
    sliderLabelActive: {
        color: COLORS.primary.DEFAULT,
        fontFamily: 'Lexend_700Bold',
    },
    feedbackCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginTop: 16,
        padding: 12,
        backgroundColor: `${COLORS.primary.DEFAULT}1A`,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: `${COLORS.primary.DEFAULT}33`,
    },
    feedbackIcon: {
        marginTop: 2,
    },
    feedbackText: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'Lexend_400Regular',
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 20,
    },
    feedbackBold: {
        fontFamily: 'Lexend_700Bold',
        color: COLORS.primary.DEFAULT,
    },
    selectAllButton: {
        fontSize: 12,
        fontFamily: 'Lexend_600SemiBold',
        color: COLORS.primary.DEFAULT,
    },
    daysScrollContent: {
        paddingHorizontal: 0,
        gap: 8,
    },
    dayButtonWrapper: {
        width: 90,
    },
    daysHint: {
        textAlign: 'center',
        fontSize: 12,
        fontFamily: 'Lexend_400Regular',
        color: 'rgba(255,255,255,0.4)',
        marginTop: 12,
    },
    warningText: {
        textAlign: 'center',
        fontSize: 12,
        fontFamily: 'Lexend_600SemiBold',
        color: '#ff6b35',
        marginTop: 8,
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
