import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { workoutsApi } from '@/services/api/workoutsApi';
import { WorkoutCompleted, WorkoutStats } from './types';

const CACHE_KEY_WORKOUTS = '@workouts_history';
const CACHE_KEY_STATS = '@workouts_stats';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface CacheData<T> {
    data: T;
    timestamp: number;
}

export const useWorkoutHistory = () => {
    const [workouts, setWorkouts] = useState<WorkoutCompleted[]>([]);
    const [stats, setStats] = useState<WorkoutStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Load from cache
    const loadFromCache = async () => {
        try {
            const [workoutsCache, statsCache] = await Promise.all([
                AsyncStorage.getItem(CACHE_KEY_WORKOUTS),
                AsyncStorage.getItem(CACHE_KEY_STATS),
            ]);

            if (workoutsCache) {
                const parsed: CacheData<WorkoutCompleted[]> = JSON.parse(workoutsCache);
                if (Date.now() - parsed.timestamp < CACHE_EXPIRY) {
                    setWorkouts(parsed.data);
                }
            }

            if (statsCache) {
                const parsed: CacheData<WorkoutStats> = JSON.parse(statsCache);
                if (Date.now() - parsed.timestamp < CACHE_EXPIRY) {
                    setStats(parsed.data);
                }
            }
        } catch (error) {
            console.error('Error loading from cache:', error);
        }
    };

    // Save to cache
    const saveToCache = async (workoutsData: WorkoutCompleted[], statsData: WorkoutStats) => {
        try {
            const workoutsCache: CacheData<WorkoutCompleted[]> = {
                data: workoutsData,
                timestamp: Date.now(),
            };
            const statsCache: CacheData<WorkoutStats> = {
                data: statsData,
                timestamp: Date.now(),
            };

            await Promise.all([
                AsyncStorage.setItem(CACHE_KEY_WORKOUTS, JSON.stringify(workoutsCache)),
                AsyncStorage.setItem(CACHE_KEY_STATS, JSON.stringify(statsCache)),
            ]);
        } catch (error) {
            console.error('Error saving to cache:', error);
        }
    };

    // Fetch workouts
    const fetchWorkouts = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
        try {
            if (refresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            setError(null);

            const [historyResponse, statsResponse] = await Promise.all([
                workoutsApi.getHistory(pageNum, 20),
                workoutsApi.getStats(),
            ]);

            if (refresh || pageNum === 1) {
                setWorkouts(historyResponse.workouts);
            } else {
                setWorkouts(prev => [...prev, ...historyResponse.workouts]);
            }

            setStats(statsResponse);
            setHasMore(pageNum < historyResponse.totalPages);
            setPage(pageNum);

            // Save to cache
            if (pageNum === 1) {
                await saveToCache(historyResponse.workouts, statsResponse);
            }
        } catch (err: any) {
            console.error('Error fetching workouts:', err);
            setError(err.message || 'Error loading workouts');

            // If offline, load from cache
            if (err.message === 'Network request failed') {
                await loadFromCache();
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // Load more (pagination)
    const loadMore = useCallback(() => {
        if (!isLoading && hasMore) {
            fetchWorkouts(page + 1);
        }
    }, [isLoading, hasMore, page, fetchWorkouts]);

    // Refresh
    const refresh = useCallback(() => {
        fetchWorkouts(1, true);
    }, [fetchWorkouts]);

    // Initial load
    useEffect(() => {
        loadFromCache().then(() => {
            fetchWorkouts(1);
        });
    }, []);

    return {
        workouts,
        stats,
        isLoading,
        isRefreshing,
        error,
        hasMore,
        loadMore,
        refresh,
    };
};
