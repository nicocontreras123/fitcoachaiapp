import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Surface, ActivityIndicator, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWorkoutHistory } from './useWorkoutHistory';
import { ProgressCharts } from './ProgressCharts';
import { WorkoutCompleted, WorkoutType } from './types';
import { LinearGradient } from 'expo-linear-gradient';

const WORKOUT_ICONS = {
    boxing: 'boxing-glove',
    running: 'run',
    gym: 'dumbbell',
};

const WORKOUT_COLORS = {
    boxing: '#dc2626',
    running: '#0ea5e9',
    gym: '#4f46e5',
};

export const HistoryScreen: React.FC = () => {
    const { workouts, stats, isLoading, isRefreshing, hasMore, loadMore, refresh } = useWorkoutHistory();
    const [filterType, setFilterType] = useState<WorkoutType | 'all'>('all');

    const formatDate = (isoString: string): string => {
        const date = new Date(isoString);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;

        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const filteredWorkouts = filterType === 'all'
        ? workouts
        : workouts.filter(w => w.workoutType === filterType);

    const renderWorkoutCard = ({ item }: { item: WorkoutCompleted }) => (
        <Surface style={styles.workoutCard} elevation={1}>
            <View style={styles.workoutHeader}>
                <View style={[styles.iconContainer, { backgroundColor: WORKOUT_COLORS[item.workoutType] + '20' }]}>
                    <MaterialCommunityIcons
                        name={WORKOUT_ICONS[item.workoutType] as any}
                        size={24}
                        color={WORKOUT_COLORS[item.workoutType]}
                    />
                </View>

                <View style={styles.workoutInfo}>
                    <Text style={styles.workoutTitle}>{item.workoutData.title}</Text>
                    <Text style={styles.workoutDate}>{formatDate(item.completedAt)}</Text>
                </View>

                <View style={styles.workoutStats}>
                    <View style={styles.statBadge}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color="#3b82f6" />
                        <Text style={styles.statText}>{formatDuration(item.duration)}</Text>
                    </View>
                    <View style={styles.statBadge}>
                        <MaterialCommunityIcons name="fire" size={14} color="#f59e0b" />
                        <Text style={styles.statText}>{item.caloriesBurned}</Text>
                    </View>
                </View>
            </View>

            {item.notes && (
                <Text style={styles.workoutNotes} numberOfLines={2}>
                    "{item.notes}"
                </Text>
            )}
        </Surface>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Historial</Text>
                <Text style={styles.headerSubtitle}>Tu progreso de entrenamientos</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor="#13ec5b" />
                }
            >
                {/* Progress Charts */}
                {stats && (
                    <View style={styles.chartsSection}>
                        <ProgressCharts stats={stats} />
                    </View>
                )}

                {/* Filters */}
                <View style={styles.filtersSection}>
                    <Text style={styles.sectionTitle}>Entrenamientos</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
                        <Chip
                            selected={filterType === 'all'}
                            onPress={() => setFilterType('all')}
                            style={[styles.filterChip, filterType === 'all' && styles.filterChipSelected]}
                            textStyle={styles.filterChipText}
                        >
                            Todos
                        </Chip>
                        <Chip
                            selected={filterType === 'boxing'}
                            onPress={() => setFilterType('boxing')}
                            icon={() => <MaterialCommunityIcons name="boxing-glove" size={16} color="#dc2626" />}
                            style={[styles.filterChip, filterType === 'boxing' && styles.filterChipSelected]}
                            textStyle={styles.filterChipText}
                        >
                            Boxeo
                        </Chip>
                        <Chip
                            selected={filterType === 'running'}
                            onPress={() => setFilterType('running')}
                            icon={() => <MaterialCommunityIcons name="run" size={16} color="#0ea5e9" />}
                            style={[styles.filterChip, filterType === 'running' && styles.filterChipSelected]}
                            textStyle={styles.filterChipText}
                        >
                            Running
                        </Chip>
                        <Chip
                            selected={filterType === 'gym'}
                            onPress={() => setFilterType('gym')}
                            icon={() => <MaterialCommunityIcons name="dumbbell" size={16} color="#4f46e5" />}
                            style={[styles.filterChip, filterType === 'gym' && styles.filterChipSelected]}
                            textStyle={styles.filterChipText}
                        >
                            Gym
                        </Chip>
                    </ScrollView>
                </View>

                {/* Workouts List */}
                <View style={styles.workoutsSection}>
                    {isLoading && filteredWorkouts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <ActivityIndicator size="large" color="#13ec5b" />
                        </View>
                    ) : filteredWorkouts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#9ca3af" />
                            <Text style={styles.emptyText}>No hay entrenamientos</Text>
                            <Text style={styles.emptySubtext}>
                                Completa tu primera rutina para verla aquí
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredWorkouts}
                            renderItem={renderWorkoutCard}
                            keyExtractor={(item) => item._id || item.completedAt}
                            scrollEnabled={false}
                            onEndReached={loadMore}
                            onEndReachedThreshold={0.5}
                            ListFooterComponent={
                                hasMore ? (
                                    <View style={styles.loadingFooter}>
                                        <ActivityIndicator size="small" color="#13ec5b" />
                                    </View>
                                ) : null
                            }
                        />
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#102216',
    },
    header: {
        padding: 16,
        paddingTop: 24,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#9ca3af',
    },
    chartsSection: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    filtersSection: {
        paddingVertical: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    filters: {
        paddingHorizontal: 16,
    },
    filterChip: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginRight: 8,
        borderColor: 'transparent',
    },
    filterChipSelected: {
        backgroundColor: '#13ec5b',
    },
    filterChipText: {
        color: '#ffffff',
        fontWeight: '600',
    },
    workoutsSection: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    workoutCard: {
        backgroundColor: '#193322',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    workoutHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    workoutInfo: {
        flex: 1,
    },
    workoutTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 4,
    },
    workoutDate: {
        fontSize: 12,
        color: '#9ca3af',
    },
    workoutStats: {
        gap: 4,
        alignItems: 'flex-end',
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#ffffff',
    },
    workoutNotes: {
        fontSize: 14,
        color: '#9ca3af',
        fontStyle: 'italic',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8,
        textAlign: 'center',
    },
    loadingFooter: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});
