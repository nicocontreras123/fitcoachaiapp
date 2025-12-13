import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useUserStore } from '@/features/profile/store/userStore';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const router = useRouter();
  const { hasCompletedOnboarding, isLoading } = useUserStore();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !authLoading) {
      if (!user) {
        router.replace('/onboarding/welcome');
      } else if (hasCompletedOnboarding) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding/personal-info');
      }
    }
  }, [hasCompletedOnboarding, isLoading, user, authLoading, router]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#0284c7" />
    </View>
  );
}
