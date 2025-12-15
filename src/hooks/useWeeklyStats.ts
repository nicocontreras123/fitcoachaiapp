import { useState, useEffect } from 'react';
import { api } from '@/services/api';

interface WeeklyStats {
  weeklyKm: number;
  weeklyRounds: number;
  dailyActivity: number[];
  totalWorkouts: number;
}

export const useWeeklyStats = () => {
  const [stats, setStats] = useState<WeeklyStats>({
    weeklyKm: 0,
    weeklyRounds: 0,
    dailyActivity: [0, 0, 0, 0, 0, 0, 0],
    totalWorkouts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getWeeklyStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching weekly stats:', err);
      setError(err.message || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, refetch: fetchStats };
};
