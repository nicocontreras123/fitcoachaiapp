import { View, StyleSheet } from 'react-native';
import { Text, Surface, ProgressBar } from 'react-native-paper';
import { COLORS, FONT_WEIGHT, SPACING, BORDER_RADIUS } from '@/constants/theme';

export function RunningTracker() {
    return (
        <Surface style={styles.container}>
            {/* Top Stats Row */}
            <View style={styles.statsRow}>
                <View>
                    <Text style={styles.label}>DISTANCIA</Text>
                    <Text style={styles.primaryStat}>5.4 <Text style={styles.unit}>km</Text></Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.label}>RITMO PROMEDIO</Text>
                    <Text style={styles.secondaryStat}>5:30 <Text style={styles.unit}>/km</Text></Text>
                </View>
            </View>

            {/* Progress Visualization */}
            <View style={styles.progressContainer}>
                <View style={styles.progressLabels}>
                    <Text style={styles.progressLabelLeft}>Objetivo: 8 km</Text>
                    <Text style={styles.progressLabelRight}>67%</Text>
                </View>
                <ProgressBar
                    progress={0.67}
                    color={COLORS.running.accent} // Lime visibility
                    style={styles.progressBar}
                />
            </View>

            {/* Metrics Grid */}
            <View style={styles.grid}>
                <Surface style={styles.card}>
                    <Text style={styles.cardIcon}>🔥</Text>
                    <Text style={styles.cardValue}>420</Text>
                    <Text style={styles.cardLabel}>KCAL</Text>
                </Surface>
                <Surface style={styles.card}>
                    <Text style={styles.cardIcon}>❤️</Text>
                    <Text style={styles.cardValue}>145</Text>
                    <Text style={styles.cardLabel}>BPM</Text>
                </Surface>
                <Surface style={styles.card}>
                    <Text style={styles.cardIcon}>⏱️</Text>
                    <Text style={styles.cardValue}>32:10</Text>
                    <Text style={styles.cardLabel}>TIEMPO</Text>
                </Surface>
            </View>

            {/* Outdoor Mode Toggle (Visual) */}
            <View style={styles.outdoorMode}>
                <Text style={styles.outdoorText}>MODO EXTERIORES: ACTIVO</Text>
            </View>
        </Surface>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        elevation: 2,
        borderWidth: 1,
        borderColor: COLORS.gray[100],
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.xl,
    },
    label: {
        color: COLORS.gray[500],
        fontSize: 12,
        fontWeight: FONT_WEIGHT.bold,
        marginBottom: SPACING.xs,
    },
    primaryStat: {
        fontSize: 48,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.running.primary, // Sky Blue
        lineHeight: 48,
    },
    secondaryStat: {
        fontSize: 32,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.gray[800],
    },
    unit: {
        fontSize: 16,
        color: COLORS.gray[400],
        fontWeight: FONT_WEIGHT.medium,
    },
    progressContainer: {
        marginBottom: SPACING.xl,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.xs,
    },
    progressLabelLeft: {
        color: COLORS.gray[600],
        fontSize: 14,
    },
    progressLabelRight: {
        color: COLORS.running.primary,
        fontWeight: FONT_WEIGHT.bold,
    },
    progressBar: {
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.gray[100],
    },
    grid: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.lg,
    },
    card: {
        flex: 1,
        backgroundColor: COLORS.running.surface, // Light Blue Tint
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        elevation: 0,
    },
    cardIcon: {
        fontSize: 20,
        marginBottom: 4,
    },
    cardValue: {
        fontSize: 18,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.gray[900],
    },
    cardLabel: {
        fontSize: 10,
        color: COLORS.gray[500],
        fontWeight: FONT_WEIGHT.bold,
    },
    outdoorMode: {
        backgroundColor: COLORS.gray[900],
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        alignItems: 'center',
    },
    outdoorText: {
        color: COLORS.running.accent, // Lime for visibility
        fontSize: 12,
        fontWeight: FONT_WEIGHT.bold,
        letterSpacing: 1,
    },
});
