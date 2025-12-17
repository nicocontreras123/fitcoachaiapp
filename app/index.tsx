import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useUserStore } from '@/features/profile/store/userStore';
import { useAuth } from '@/contexts/AuthContext';

import LottieView from 'lottie-react-native';

export default function Index() {
  const router = useRouter();
  const { hasCompletedOnboarding, isLoading } = useUserStore();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !authLoading) {




      if (!user) {

        router.replace('/onboarding/welcome');
      } else if (hasCompletedOnboarding) {

        try {
          router.replace('/(tabs)');

        } catch (error) {
          console.error('❌ Navigation error:', error);
        }
      } else {

        router.replace('/onboarding/personal-info');
      }
    } else {

    }
  }, [hasCompletedOnboarding, isLoading, user, authLoading, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#102216' }}>
      <LottieView
        source={require('../assets/logo_animation.json')}
        autoPlay
        loop
        style={{ width: 200, height: 200 }}
      />
    </View>
  );
}
