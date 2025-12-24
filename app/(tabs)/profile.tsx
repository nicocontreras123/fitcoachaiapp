import { View, ScrollView, StyleSheet, Alert, Image, Pressable } from 'react-native';
import { Text, Switch, Button } from 'react-native-paper';
import { useUserStore } from '@/features/profile/store/userStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { detectInstalledMusicApps, getMusicAppConfig, MusicApp } from '@/services/musicAppService';
import Constants from 'expo-constants';
import { PrepTimeModal } from '@/features/profile/components/PrepTimeModal';

export default function ProfileScreen() {
  const { userData, updateUserData } = useUserStore();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [showPrepModal, setShowPrepModal] = useState(false);
  const [installedMusicApps, setInstalledMusicApps] = useState<MusicApp[]>([]);

  // Detect installed music apps on mount
  useEffect(() => {
    const detectApps = async () => {
      const apps = await detectInstalledMusicApps();
      setInstalledMusicApps(apps);
    };
    detectApps();
  }, []);

  // Legacy state removed, handled now by Modal

  const handleSavePrepTime = async (minutes: number, seconds: number) => {
    await updateUserData({
      prepTimeMinutes: minutes,
      prepTimeSeconds: seconds,
    });
    // Alert removed as requested
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
    <SafeAreaView style={[styles.container, { backgroundColor: '#102216' }]}>
      {/* Sticky Header */}
      <View style={[styles.stickyHeader, { backgroundColor: 'rgba(16, 34, 22, 0.95)', borderColor: 'rgba(255,255,255,0.05)' }]}>
        <View style={styles.headerContent}>
          {/* Back button removed as requested */}
          <Text style={[styles.headerTitle, { color: '#fff', flex: 1, textAlign: 'center' }]}>Mi Perfil</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Profile Header section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarContainer, { borderColor: '#152e1e' }]}>
              {userData?.photoUrl ? (
                <Image source={{ uri: userData.photoUrl }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: '#1a1a1a' }]}>
                  <MaterialCommunityIcons name="account" size={40} color="#fff" />
                </View>
              )}
            </View>
            <View style={[styles.editButton, { borderColor: '#102216' }]}>
              <MaterialCommunityIcons name="pencil" size={14} color="#000" />
            </View>
          </View>

          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: '#fff' }]}>{userData?.name || 'Usuario'}</Text>
            <Text style={[styles.userEmail, { color: '#9ca3af' }]}>{user?.email || 'usuario@email.com'}</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#152e1e', borderColor: 'rgba(255,255,255,0.05)' }]}>
              <Text style={styles.statLabel}>EDAD</Text>
              <Text style={[styles.statValue, { color: '#fff' }]}>{userData?.age || '-'}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#152e1e', borderColor: 'rgba(255,255,255,0.05)' }]}>
              <Text style={styles.statLabel}>PESO</Text>
              <Text style={[styles.statValue, { color: '#fff' }]}>
                {userData?.weight || '-'} <Text style={styles.statUnit}>kg</Text>
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#152e1e', borderColor: 'rgba(255,255,255,0.05)' }]}>
              <Text style={styles.statLabel}>ALTURA</Text>
              <Text style={[styles.statValue, { color: '#fff' }]}>
                {userData?.height || '-'} <Text style={styles.statUnit}>cm</Text>
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#152e1e', borderColor: 'rgba(255,255,255,0.05)' }]}>
              <Text style={styles.statLabel}>NIVEL</Text>
              <Text style={[styles.statValue, { color: '#13ec5b', fontSize: 14 }]}>
                {userData?.level === 'advanced' ? 'Pro' : userData?.level === 'intermediate' ? 'Medio' : 'Inicio'}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionHeaderLabel}>AJUSTES DE APLICACIÓN</Text>

          <View style={[styles.settingsContainer, { backgroundColor: '#152e1e', borderColor: 'rgba(255,255,255,0.05)' }]}>

            {/* Dark Mode Toggle - Hidden as app is forced to dark mode */}

            {/* Voice Announcements */}
            <View style={[styles.settingRow, { borderBottomColor: 'rgba(255,255,255,0.05)' }]}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(19, 236, 91, 0.2)' }]}>
                  <MaterialCommunityIcons name="account-voice" size={20} color="#13ec5b" />
                </View>
                <Text style={[styles.settingText, { color: '#fff' }]}>Anuncios de Voz</Text>
              </View>
              <Switch
                value={userData?.voiceEnabled !== false}
                onValueChange={(value) => updateUserData({ voiceEnabled: value })}
                trackColor={{ false: '#767577', true: '#13ec5b' }}
                thumbColor={'#fff'}
              />
            </View>

            {/* Timer Sounds */}
            <View style={[styles.settingRow, { borderBottomColor: 'rgba(255,255,255,0.05)' }]}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(19, 236, 91, 0.2)' }]}>
                  <MaterialCommunityIcons name="volume-high" size={20} color="#13ec5b" />
                </View>
                <Text style={[styles.settingText, { color: '#fff' }]}>Sonidos del Timer</Text>
              </View>
              <Switch
                value={userData?.timerSoundEnabled !== false}
                onValueChange={(value) => updateUserData({ timerSoundEnabled: value })}
                trackColor={{ false: '#767577', true: '#13ec5b' }}
                thumbColor={'#fff'}
              />
            </View>

            {/* Motivational Coaching */}
            <View style={[styles.settingRow, { borderBottomColor: 'rgba(255,255,255,0.05)' }]}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(19, 236, 91, 0.2)' }]}>
                  <MaterialCommunityIcons name="bullhorn" size={20} color="#13ec5b" />
                </View>
                <View>
                  <Text style={[styles.settingText, { color: '#fff' }]}>Coaching Motivacional</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>
                    Frases motivadoras durante la rutina
                  </Text>
                </View>
              </View>
              <Switch
                value={userData?.motivationalCoachingEnabled === true}
                onValueChange={(value) => updateUserData({ motivationalCoachingEnabled: value })}
                trackColor={{ false: '#767577', true: '#13ec5b' }}
                thumbColor={'#fff'}
              />
            </View>

            {/* Music App Preference */}
            {installedMusicApps.length > 0 && (
              <View style={[styles.settingRow, { borderBottomColor: 'rgba(255,255,255,0.05)' }]}>
                <View style={styles.settingLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(19, 236, 91, 0.2)' }]}>
                    <MaterialCommunityIcons name="music" size={20} color="#13ec5b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingText, { color: '#fff' }]}>App de Música</Text>
                    <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>
                      {userData?.preferredMusicApp
                        ? getMusicAppConfig(userData.preferredMusicApp)?.name || 'Seleccionar'
                        : 'Seleccionar app'}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {installedMusicApps.map((app) => {
                    const config = getMusicAppConfig(app);
                    const isSelected = userData?.preferredMusicApp === app;
                    return (
                      <Pressable
                        key={app}
                        onPress={() => updateUserData({ preferredMusicApp: app })}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: isSelected ? config?.color : '#1a1a1a',
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderWidth: 2,
                          borderColor: isSelected ? config?.color : 'transparent',
                        }}
                      >
                        <MaterialCommunityIcons
                          name={config?.icon as any}
                          size={20}
                          color={isSelected ? '#fff' : config?.color}
                        />
                      </Pressable>
                    );
                  })}
                  {userData?.preferredMusicApp && (
                    <Pressable
                      onPress={() => updateUserData({ preferredMusicApp: null })}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: '#1a1a1a',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 2,
                        borderColor: '#4b5563',
                      }}
                    >
                      <MaterialCommunityIcons name="close" size={20} color="#9ca3af" />
                    </Pressable>
                  )}
                </View>
              </View>
            )}

            {/* Prep Time (Modal Trigger) */}
            <Pressable
              style={styles.settingRow}
              onPress={() => setShowPrepModal(true)}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(19, 236, 91, 0.2)' }]}>
                  <MaterialCommunityIcons name="timer-sand" size={20} color="#13ec5b" />
                </View>
                <View>
                  <Text style={[styles.settingText, { color: '#fff' }]}>Tiempo de Preparación</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 2 }}>
                    {userData?.prepTimeMinutes || 0}m : {userData?.prepTimeSeconds || 10}s
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#4b5563" />
            </Pressable>

          </View>

        </View>

        {/* Logout Button */}
        <View style={{ marginTop: 32, paddingHorizontal: 16 }}>
          <Button
            mode="contained"
            onPress={handleLogout}
            contentStyle={{ height: 56, justifyContent: 'center' }}
            labelStyle={{ fontSize: 16, fontWeight: '600', color: '#f87171' }}
            style={{ borderRadius: 16, backgroundColor: 'rgba(239, 68, 68, 0.1)', elevation: 0 }}
            icon={() => <MaterialCommunityIcons name="logout" size={20} color="#f87171" />}
          >
            Cerrar Sesión
          </Button>
          <Text style={{ textAlign: 'center', color: '#4b5563', fontSize: 12, marginTop: 24 }}>
            Versión {Constants.expoConfig?.version || '1.0.0'}
          </Text>
        </View>

        <PrepTimeModal
          visible={showPrepModal}
          onClose={() => setShowPrepModal(false)}
          onSave={handleSavePrepTime}
          initialMinutes={userData?.prepTimeMinutes || 0}
          initialSeconds={userData?.prepTimeSeconds || 10}
        />

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Lexend_700Bold', // Assuming fonts loaded
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 112, // 28 * 4
    height: 112,
    borderRadius: 56,
    overflow: 'hidden',
    borderWidth: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#13ec5b', // primary
    padding: 8,
    borderRadius: 20,
    borderWidth: 4,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af', // gray-400
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6b7280',
  },
  settingsSection: {
    marginTop: 32,
  },
  sectionHeaderLabel: {
    color: '#13ec5b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 24, // Matches HTML px-6
    textTransform: 'uppercase',
  },
  settingsContainer: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent', // Overridden inline
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  miniInput: {
    fontSize: 14,
    fontWeight: '400',
    padding: 0,
    minWidth: 20,
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
});
