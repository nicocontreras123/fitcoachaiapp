import { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { workoutsApi } from '@/services/api/workoutsApi';
import { WorkoutCompleted, WorkoutStats } from '@/features/history/types';
import { useAuth } from '@/contexts/AuthContext';

const CACHE_KEY = '@dashboard_stats';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos

interface CacheData {
  data: DashboardStats;
  timestamp: number;
}

export interface DashboardStats {
  // Día actual
  todayWorkouts: number;
  todayDuration: number; // segundos
  todayCalories: number;
  todayDistance: number; // metros (solo running)

  // Objetivo diario
  dailyGoalPercentage: number; // 0-100

  // Comparación
  vsYesterday: {
    workouts: number; // diff porcentual ej: +12 o -5
    duration: number;
    calories: number;
  };

  // Stats generales
  totalWorkouts: number;
  currentStreak: number; // días consecutivos
  weeklyData: Array<{ day: string, count: number, duration: number }>;

  // Estado
  isLoading: boolean;
  error: string | null;
}

export const useDashboardStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todayWorkouts: 0,
    todayDuration: 0,
    todayCalories: 0,
    todayDistance: 0,
    dailyGoalPercentage: 0,
    vsYesterday: { workouts: 0, duration: 0, calories: 0 },
    totalWorkouts: 0,
    currentStreak: 0,
    weeklyData: [],
    isLoading: true,
    error: null,
  });

  // Helper: Calcular diferencia porcentual
  const calculatePercentDiff = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Helper: Normalizar fecha a medianoche
  const normalizeDate = (date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  // Helper: Filtrar workouts por día
  const filterWorkoutsByDay = (workouts: WorkoutCompleted[], targetDate: Date): WorkoutCompleted[] => {
    const normalizedTarget = normalizeDate(targetDate);
    return workouts.filter(w => {
      const workoutDate = normalizeDate(new Date(w.completedAt));
      return workoutDate.getTime() === normalizedTarget.getTime();
    });
  };

  // Calcular stats del día
  const calculateDayStats = (workouts: WorkoutCompleted[], day: Date) => {
    const dayWorkouts = filterWorkoutsByDay(workouts, day);

    const duration = dayWorkouts.reduce((sum, w) => sum + w.duration, 0);
    const calories = dayWorkouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
    const distance = dayWorkouts
      .filter(w => w.workoutType === 'running' && w.workoutData.distance)
      .reduce((sum, w) => sum + (w.workoutData.distance || 0), 0);

    return {
      count: dayWorkouts.length,
      duration,
      calories,
      distance,
    };
  };

  // Calcular últimos 7 días para gráfico
  const calculateWeeklyData = (workouts: WorkoutCompleted[]) => {
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const normalizedDate = normalizeDate(date);
      const dayKey = normalizedDate.toISOString().split('T')[0];
      const dayWorkouts = filterWorkoutsByDay(workouts, normalizedDate);

      weeklyData.push({
        day: dayKey,
        count: dayWorkouts.length,
        duration: dayWorkouts.reduce((sum, w) => sum + w.duration, 0),
      });
    }
    return weeklyData;
  };

  // Cargar desde caché
  const loadFromCache = async (): Promise<DashboardStats | null> => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp }: CacheData = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error loading cache:', error);
    }
    return null;
  };

  // Guardar en caché
  const saveToCache = async (data: DashboardStats) => {
    try {
      const cacheData: CacheData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  };

  // Fetch stats desde API
  const fetchStats = async () => {
    if (!user) {
      setStats(prev => ({ ...prev, isLoading: false, error: 'Usuario no autenticado' }));
      return;
    }

    try {
      setStats(prev => ({ ...prev, isLoading: true, error: null }));

      // Intentar cargar desde caché primero
      const cachedData = await loadFromCache();
      if (cachedData) {
        setStats({ ...cachedData, isLoading: true }); // Mostrar datos del caché mientras actualiza
      }

      // Fetch desde API
      const [historyResponse, apiStats] = await Promise.all([
        workoutsApi.getHistory(1, 100), // últimos 100 workouts
        workoutsApi.getStats(),
      ]);

      const workouts = historyResponse.workouts;

      // Si no hay workouts, retornar estado vacío
      if (workouts.length === 0) {
        const emptyStats: DashboardStats = {
          todayWorkouts: 0,
          todayDuration: 0,
          todayCalories: 0,
          todayDistance: 0,
          dailyGoalPercentage: 0,
          vsYesterday: { workouts: 0, duration: 0, calories: 0 },
          totalWorkouts: 0,
          currentStreak: 0,
          weeklyData: [],
          isLoading: false,
          error: null,
        };
        setStats(emptyStats);
        await saveToCache(emptyStats);
        return;
      }

      // Calcular stats de hoy
      const today = new Date();
      const todayStats = calculateDayStats(workouts, today);

      // Calcular stats de ayer
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStats = calculateDayStats(workouts, yesterday);

      // Calcular comparación
      const vsYesterday = {
        workouts: calculatePercentDiff(todayStats.count, yesterdayStats.count),
        duration: calculatePercentDiff(todayStats.duration, yesterdayStats.duration),
        calories: calculatePercentDiff(todayStats.calories, yesterdayStats.calories),
      };

      // Calcular objetivo diario (1 workout = 100%)
      const dailyGoalPercentage = Math.min(100, todayStats.count * 100);

      // Calcular últimos 7 días para gráfico
      const weeklyData = calculateWeeklyData(workouts);

      // Combinar todo
      const dashboardStats: DashboardStats = {
        todayWorkouts: todayStats.count,
        todayDuration: todayStats.duration,
        todayCalories: todayStats.calories,
        todayDistance: todayStats.distance,
        dailyGoalPercentage,
        vsYesterday,
        totalWorkouts: apiStats.totalWorkouts,
        currentStreak: apiStats.currentStreak,
        weeklyData,
        isLoading: false,
        error: null,
      };

      setStats(dashboardStats);
      await saveToCache(dashboardStats);

    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);

      // En caso de error, intentar usar caché aunque esté expirado
      const cachedData = await loadFromCache();
      if (cachedData) {
        setStats({ ...cachedData, isLoading: false, error: 'Usando datos en caché' });
      } else {
        setStats(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Error al cargar estadísticas',
        }));
      }
    }
  };

  // Refresh manual
  const refresh = async () => {
    await fetchStats();
  };

  // Fetch inicial
  useEffect(() => {
    fetchStats();
  }, [user]);

  return {
    ...stats,
    refresh,
  };
};
