import { Tabs, useRouter } from 'expo-router';
import { View, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface TabBarIconProps {
  name: string;
  color: string;
  focused: boolean;
}

function TabBarIcon({ name, color, focused }: TabBarIconProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.15,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  const getIconName = () => {
    switch (name) {
      case 'home': return 'home-variant';
      case 'workouts': return 'dumbbell';
      case 'tracking': return 'chart-line';
      case 'profile': return 'account-circle';
      default: return 'circle';
    }
  };

  return (
    <View style={styles.iconContainer}>
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            transform: [{ scale: scaleAnim }, { rotate: rotation }],
            backgroundColor: focused ? color + '15' : 'transparent',
          }
        ]}
      >
        <MaterialCommunityIcons name={getIconName()} size={focused ? 28 : 24} color={color} />
      </Animated.View>
      {focused && (
        <View style={[styles.activeDot, { backgroundColor: color }]} />
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/onboarding/welcome');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return null;
  }

  const TAB_BAR_HEIGHT = 68;
  const totalHeight = TAB_BAR_HEIGHT + insets.bottom;

  // Neo-brutalist color scheme
  const activeColors = {
    home: '#06b6d4',      // Cyan
    workouts: '#f43f5e',  // Rose
    tracking: '#8b5cf6',  // Purple
    profile: '#10b981',   // Emerald
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? '#52525b' : '#a1a1aa',
        tabBarStyle: {
          backgroundColor: isDark ? '#18181b' : '#fafafa',
          borderTopWidth: 0,
          height: totalHeight,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          marginTop: -2,
          marginBottom: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarActiveTintColor: activeColors.home,
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="rutinas"
        options={{
          title: 'Rutinas',
          tabBarActiveTintColor: activeColors.workouts,
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="workouts" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: 'Track',
          tabBarActiveTintColor: activeColors.tracking,
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="tracking" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarActiveTintColor: activeColors.profile,
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="profile" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
    position: 'absolute',
    bottom: -12,
  },
});
