import { Tabs } from 'expo-router';
import { View, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';

interface TabBarIconProps {
  name: string;
  color: string;
  focused: boolean;
}

function TabBarIcon({ name, color, focused }: TabBarIconProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      // Sequence of animations when tab becomes active
      Animated.sequence([
        // Initial bounce
        Animated.spring(bounceAnim, {
          toValue: 1,
          friction: 3,
          tension: 100,
          useNativeDriver: true,
        }),
        // Settle
        Animated.spring(bounceAnim, {
          toValue: 0,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();

      // Parallel animations for scale, opacity, and rotation (native driver)
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.15,
          friction: 4,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Separate glow animation (JS driver)
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      // Reset animations when tab becomes inactive
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.6,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Separate glow animation (JS driver)
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [focused]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '12deg'],
  });

  const bounceTranslate = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.2],
  });

  const getIconName = () => {
    switch (name) {
      case 'home': return focused ? 'home' : 'home-outline';
      case 'workouts': return focused ? 'dumbbell' : 'dumbbell';
      case 'tracking': return focused ? 'play-circle' : 'play-circle-outline';
      case 'profile': return focused ? 'account-circle' : 'account-circle-outline';
      default: return 'circle';
    }
  };

  return (
    <View style={styles.iconContainer}>
      {/* Glow background - only uses opacity */}
      <Animated.View
        style={[
          styles.glowBackground,
          {
            backgroundColor: color,
            opacity: glowOpacity,
          }
        ]}
      />

      {/* Icon with animations */}
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            transform: [
              { scale: scaleAnim },
              { rotate: rotation },
              { translateY: bounceTranslate }
            ],
            opacity: opacityAnim,
          }
        ]}
      >
        <MaterialCommunityIcons
          name={getIconName()}
          size={26}
          color={color}
        />
      </Animated.View>
    </View>
  );
}

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // No necesitamos verificar el usuario aquí porque app/index.tsx ya lo hace

  const TAB_BAR_HEIGHT = 65;
  const totalHeight = TAB_BAR_HEIGHT + insets.bottom;

  // Modern color scheme optimized for dark mode
  const activeColors = {
    home: '#06b6d4',      // Cyan - Bright and modern
    workouts: '#f43f5e',  // Rose - Energetic
    tracking: '#8b5cf6',  // Purple - Dynamic
    profile: '#10b981',   // Emerald - Fresh
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? '#71717a' : '#a1a1aa', // Zinc-500/400
        tabBarStyle: {
          backgroundColor: isDark ? '#09090b' : '#ffffff', // Zinc-950/White
          borderTopWidth: 1,
          borderTopColor: isDark ? '#27272a' : '#e4e4e7', // Zinc-800/Zinc-200
          height: totalHeight,
          paddingBottom: insets.bottom,
          paddingTop: 10,
          paddingHorizontal: 8,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.4 : 0.05,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 10,
          letterSpacing: 0.3,
          marginTop: 4,
          marginBottom: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
          gap: 2,
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
          title: 'Entrenar',
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
    height: 40,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  glowBackground: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    zIndex: 1,
  },
});
