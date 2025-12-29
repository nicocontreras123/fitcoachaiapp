import { Tabs } from 'expo-router';
import { Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';

interface TabBarIconProps {
  name: string;
  color: string;
  focused: boolean;
}

function TabBarIcon({ name, color, focused }: TabBarIconProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.1 : 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  const getIconName = () => {
    switch (name) {
      case 'home': return focused ? 'home' : 'home-outline';
      case 'workouts': return focused ? 'dumbbell' : 'dumbbell';
      case 'tracking': return focused ? 'map-marker' : 'map-marker-outline'; // Changed to Map icon style requested
      case 'profile': return focused ? 'account' : 'account-outline';
      default: return 'circle';
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
      <MaterialCommunityIcons
        name={getIconName()}
        size={24}
        color={color}
      />
    </Animated.View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#13ec5b',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarStyle: {
          backgroundColor: '#102216',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          height: 60 + insets.bottom,
          paddingTop: 12,
          paddingBottom: insets.bottom + 6,
          paddingHorizontal: 8,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 10,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="rutinas"
        options={{
          title: 'Rutinas',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="workouts" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          href: null,
          title: 'Mapa',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="tracking" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="profile" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="running-plan"
        options={{
          href: null, // Hide from tab bar - this is a detail view
          title: 'Plan de Carrera',
        }}
      />
    </Tabs>
  );
}
