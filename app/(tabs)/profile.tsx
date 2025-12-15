import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Switch, Surface, TextInput, Button } from 'react-native-paper';
import { useTheme } from '@/hooks/useTheme';
import { useUserStore } from '@/features/profile/store/userStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { translateLevel } from '@/utils/translations';
import React from 'react';

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { userData, updateUserData } = useUserStore();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [prepMinutes, setPrepMinutes] = React.useState(
    (userData?.prepTimeMinutes || 0).toString()
  );
  const [prepSeconds, setPrepSeconds] = React.useState(
    (userData?.prepTimeSeconds !== undefined ? userData.prepTimeSeconds : 10).toString()
  );

  const handleSaveTimerSettings = async () => {
    const minutes = parseInt(prepMinutes) || 0;
    const seconds = parseInt(prepSeconds) || 0;

    if (seconds >= 60) {
      alert('Los segundos deben ser menores a 60');
      return;
    }

    await updateUserData({
      prepTimeMinutes: minutes,
      prepTimeSeconds: seconds,
    });

    alert('Configuración guardada correctamente');
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/onboarding/welcome');
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>👤</Text>
          <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 8, color: colors.textPrimary }}>
            Perfil
          </Text>
          <Text variant="bodyMedium" style={{ textAlign: 'center', color: colors.textSecondary, marginBottom: 8 }}>
            {userData?.name || 'Usuario'}
          </Text>
          {user?.email && (
            <Text variant="bodySmall" style={{ textAlign: 'center', color: colors.textSecondary, marginBottom: 24 }}>
              {user.email}
            </Text>
          )}
        </View>

        {/* Theme Switch */}
        <Surface style={[styles.settingCard, { backgroundColor: colors.surface }]} elevation={1}>
          <View style={styles.settingRow}>
            <MaterialCommunityIcons name="theme-light-dark" size={24} color={colors.primary} />
            <Text variant="titleMedium" style={{ color: colors.textPrimary, fontWeight: '600', flex: 1, marginLeft: 12 }}>
              Modo Oscuro
            </Text>
            <Switch value={isDark} onValueChange={toggleTheme} color={colors.primary} />
          </View>
        </Surface>

        {/* Audio Settings */}
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Configuración de Audio
        </Text>

        {/* Voice Switch */}
        <Surface style={[styles.settingCard, { backgroundColor: colors.surface }]} elevation={1}>
          <View style={styles.settingRow}>
            <MaterialCommunityIcons name="account-voice" size={24} color="#10b981" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text variant="titleMedium" style={{ color: colors.textPrimary, fontWeight: '600' }}>
                Anuncios de Voz
              </Text>
              <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 4 }}>
                Escuchar instrucciones durante el entrenamiento
              </Text>
            </View>
            <Switch
              value={userData?.voiceEnabled !== false}
              onValueChange={(value) => updateUserData({ voiceEnabled: value })}
              color="#10b981"
            />
          </View>
        </Surface>

        {/* Timer Sound Switch */}
        <Surface style={[styles.settingCard, { backgroundColor: colors.surface }]} elevation={1}>
          <View style={styles.settingRow}>
            <MaterialCommunityIcons name="volume-high" size={24} color="#f59e0b" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text variant="titleMedium" style={{ color: colors.textPrimary, fontWeight: '600' }}>
                Sonidos del Timer
              </Text>
              <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 4 }}>
                Reproducir sonidos de tick y campana
              </Text>
            </View>
            <Switch
              value={userData?.timerSoundEnabled !== false}
              onValueChange={(value) => updateUserData({ timerSoundEnabled: value })}
              color="#f59e0b"
            />
          </View>
        </Surface>

        {/* Timer Settings */}
        <Text variant="titleLarge" style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Configuración del Timer
        </Text>

        <Surface style={[styles.settingCard, { backgroundColor: colors.surface }]} elevation={1}>
          <View style={styles.settingHeader}>
            <MaterialCommunityIcons name="timer" size={24} color="#fbbf24" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text variant="titleMedium" style={{ color: colors.textPrimary, fontWeight: '600' }}>
                Tiempo de Preparación
              </Text>
              <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 4 }}>
                Tiempo antes de comenzar el primer round
              </Text>
            </View>
          </View>

          <View style={styles.timeInputs}>
            <View style={styles.timeInputGroup}>
              <TextInput
                label="Minutos"
                value={prepMinutes}
                onChangeText={setPrepMinutes}
                keyboardType="number-pad"
                mode="outlined"
                style={styles.timeInput}
                maxLength={2}
              />
              <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
                min
              </Text>
            </View>

            <Text variant="headlineMedium" style={{ color: colors.textSecondary, marginHorizontal: 8 }}>
              :
            </Text>

            <View style={styles.timeInputGroup}>
              <TextInput
                label="Segundos"
                value={prepSeconds}
                onChangeText={setPrepSeconds}
                keyboardType="number-pad"
                mode="outlined"
                style={styles.timeInput}
                maxLength={2}
              />
              <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
                seg
              </Text>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleSaveTimerSettings}
            style={{ marginTop: 16 }}
            icon="content-save"
          >
            Guardar Configuración
          </Button>
        </Surface>

        {/* User Info */}
        {userData && (
          <Surface style={[styles.settingCard, { backgroundColor: colors.surface }]} elevation={1}>
            <View style={styles.settingHeader}>
              <MaterialCommunityIcons name="account" size={24} color={colors.primary} />
              <Text variant="titleMedium" style={{ color: colors.textPrimary, fontWeight: '600', marginLeft: 12 }}>
                Información Personal
              </Text>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text variant="bodySmall" style={{ color: colors.textSecondary }}>Edad</Text>
                <Text variant="titleMedium" style={{ color: colors.textPrimary, fontWeight: 'bold' }}>
                  {userData.age} años
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text variant="bodySmall" style={{ color: colors.textSecondary }}>Peso</Text>
                <Text variant="titleMedium" style={{ color: colors.textPrimary, fontWeight: 'bold' }}>
                  {userData.weight} kg
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text variant="bodySmall" style={{ color: colors.textSecondary }}>Altura</Text>
                <Text variant="titleMedium" style={{ color: colors.textPrimary, fontWeight: 'bold' }}>
                  {userData.height} cm
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text variant="bodySmall" style={{ color: colors.textSecondary }}>Nivel</Text>
                <Text variant="titleMedium" style={{ color: colors.textPrimary, fontWeight: 'bold' }}>
                  {translateLevel(userData.level)}
                </Text>
              </View>
            </View>
          </Surface>
        )}

        {/* Logout Button */}
        <Surface style={[styles.settingCard, { backgroundColor: colors.surface }]} elevation={1}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            contentStyle={{ height: 56 }}
            labelStyle={{ fontSize: 16, fontWeight: '600', color: '#ef4444' }}
            style={{ borderRadius: 28, borderColor: '#ef4444' }}
            icon="logout"
          >
            Cerrar Sesión
          </Button>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
  },
  settingCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  timeInputGroup: {
    alignItems: 'center',
  },
  timeInput: {
    width: 100,
    textAlign: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
  },
});
