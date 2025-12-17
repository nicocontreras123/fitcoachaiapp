import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WorkoutStats } from './types';

const screenWidth = Dimensions.get('window').width;

interface ProgressChartsProps {
    stats: WorkoutStats | null;
}

export const ProgressCharts: React.FC<ProgressChartsProps> = ({ stats }) => {
    if (!stats) return null;

    const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const chartConfig = {
        backgroundColor: '#193322',
        backgroundGradientFrom: '#193322',
        backgroundGradientTo: '#102216',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(19, 236, 91, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: 'rgba(255, 255, 255, 0.1)',
        },
    };

    // Weekly bar chart data
    const weeklyData = {
        labels: stats.weeklyData.map(w => w.week.split('-')[2] || w.week),
        datasets: [{
            data: stats.weeklyData.map(w => w.count),
        }],
    };

    // Weekly duration line chart
    const weeklyDurationData = {
        labels: stats.weeklyData.map(w => w.week.split('-')[2] || w.week),
        datasets: [{
            data: stats.weeklyData.map(w => Math.round(w.duration / 60)), // minutes
        }],
    };

    // Sport distribution pie chart
    const pieData = [
        {
            name: 'Boxeo',
            count: stats.byType.boxing,
            color: '#dc2626',
            legendFontColor: '#fff',
            legendFontSize: 12,
        },
        {
            name: 'Running',
            count: stats.byType.running,
            color: '#0ea5e9',
            legendFontColor: '#fff',
            legendFontSize: 12,
        },
        {
            name: 'Gym',
            count: stats.byType.gym,
            color: '#4f46e5',
            legendFontColor: '#fff',
            legendFontSize: 12,
        },
    ].filter(item => item.count > 0);

    return (
        <View style={styles.container}>
            {/* Stats Cards */}
            <View style={styles.statsRow}>
                <Surface style={styles.statCard} elevation={2}>
                    <MaterialCommunityIcons name="dumbbell" size={28} color="#13ec5b" />
                    <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
                    <Text style={styles.statLabel}>Entrenamientos</Text>
                </Surface>

                <Surface style={styles.statCard} elevation={2}>
                    <MaterialCommunityIcons name="fire" size={28} color="#f59e0b" />
                    <Text style={styles.statValue}>{stats.currentStreak}</Text>
                    <Text style={styles.statLabel}>Racha días</Text>
                </Surface>

                <Surface style={styles.statCard} elevation={2}>
                    <MaterialCommunityIcons name="clock-outline" size={28} color="#3b82f6" />
                    <Text style={styles.statValue}>{formatDuration(stats.totalDuration)}</Text>
                    <Text style={styles.statLabel}>Tiempo Total</Text>
                </Surface>
            </View>

            {/* Weekly Workouts Bar Chart */}
            {weeklyData.datasets[0].data.length > 0 && (
                <Surface style={styles.chartCard} elevation={1}>
                    <Text style={styles.chartTitle}>Entrenamientos por Semana</Text>
                    <BarChart
                        data={weeklyData}
                        width={screenWidth - 64}
                        height={220}
                        chartConfig={chartConfig}
                        style={styles.chart}
                        yAxisSuffix=""
                        fromZero
                        showValuesOnTopOfBars
                    />
                </Surface>
            )}

            {/* Weekly Duration Line Chart */}
            {weeklyDurationData.datasets[0].data.length > 0 && (
                <Surface style={styles.chartCard} elevation={1}>
                    <Text style={styles.chartTitle}>Tiempo de Entrenamiento (min)</Text>
                    <LineChart
                        data={weeklyDurationData}
                        width={screenWidth - 64}
                        height={220}
                        chartConfig={chartConfig}
                        style={styles.chart}
                        bezier
                        fromZero
                    />
                </Surface>
            )}

            {/* Sport Distribution Pie Chart */}
            {pieData.length > 0 && (
                <Surface style={styles.chartCard} elevation={1}>
                    <Text style={styles.chartTitle}>Distribución por Deporte</Text>
                    <PieChart
                        data={pieData}
                        width={screenWidth - 64}
                        height={220}
                        chartConfig={chartConfig}
                        accessor="count"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        style={styles.chart}
                    />
                </Surface>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 16,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#193322',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 11,
        color: '#9ca3af',
        marginTop: 4,
        textAlign: 'center',
    },
    chartCard: {
        backgroundColor: '#193322',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 12,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
});
