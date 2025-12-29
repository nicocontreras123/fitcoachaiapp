import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type TimerType = 'boxing' | 'running';

export interface TimerNotificationData {
    type: TimerType;
    // Boxing specific
    round?: number;
    totalRounds?: number;
    phase?: 'warmup' | 'workout' | 'cooldown' | 'rest';
    isPreparing?: boolean; // True for "Prepárate" phase
    // Running specific
    distance?: number;
    pace?: string;
    // Common
    timeRemaining?: number;
    timeElapsed?: number;
}

const TIMER_NOTIFICATION_ID = 'active-timer-notification';

export class TimerNotificationService {
    private static updateInterval: NodeJS.Timeout | null = null;
    private static currentData: TimerNotificationData | null = null;

    /**
     * Initialize timer notification channel for Android
     */
    static async initialize(): Promise<void> {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('timer-active', {
                name: 'Timer Activo',
                importance: Notifications.AndroidImportance.MIN, // MIN = no sound, no vibration, no popup
                vibrationPattern: [0],
                enableVibrate: false,
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                bypassDnd: false,
            });
        }
    }

    /**
     * Start timer notification
     */
    static async startTimerNotification(type: TimerType, initialData: TimerNotificationData): Promise<void> {
        try {
            await this.initialize();
            this.currentData = { ...initialData, type };

            // Create initial notification
            await this.updateNotification();

            console.log(`🔔 Timer notification started for ${type}`);
        } catch (error) {
            console.error('Error starting timer notification:', error);
        }
    }

    /**
     * Update timer notification with new data
     */
    static async updateTimerNotification(data: Partial<TimerNotificationData>): Promise<void> {
        if (!this.currentData) {
            console.warn('No active timer notification to update');
            return;
        }

        // Merge new data
        this.currentData = { ...this.currentData, ...data };

        // Update notification
        await this.updateNotification();
    }

    /**
     * Stop timer notification
     */
    static async stopTimerNotification(): Promise<void> {
        try {
            // Clear update interval if exists
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }

            // Dismiss notification
            await Notifications.dismissNotificationAsync(TIMER_NOTIFICATION_ID);

            this.currentData = null;

            console.log('🔔 Timer notification stopped');
        } catch (error) {
            console.error('Error stopping timer notification:', error);
        }
    }

    /**
     * Internal method to update the notification
     */
    private static async updateNotification(): Promise<void> {
        if (!this.currentData) return;

        const { title, body } = this.formatNotificationContent(this.currentData);

        console.log('🔔 [TIMER_NOTIFICATION] Updating:', { title, body, data: this.currentData });

        try {
            // Don't dismiss - just update with same ID to avoid flickering
            // Android will update the existing notification
            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    priority: Platform.OS === 'android' ? 'high' : 'default',
                    sticky: Platform.OS === 'android',
                    data: {
                        type: 'timer-notification',
                        screen: this.currentData.type === 'boxing' ? 'TimerBoxeo' : 'RunningTracker',
                    },
                    ...(Platform.OS === 'android' && {
                        categoryIdentifier: 'timer-active',
                    }),
                },
                trigger: null,
                identifier: TIMER_NOTIFICATION_ID,
            });
        } catch (error) {
            console.error('Error updating notification:', error);
        }
    }

    /**
     * Format notification content based on timer type and data
     */
    private static formatNotificationContent(data: TimerNotificationData): { title: string; body: string } {
        if (data.type === 'boxing') {
            return this.formatBoxingNotification(data);
        } else {
            return this.formatRunningNotification(data);
        }
    }

    /**
     * Format boxing timer notification
     */
    private static formatBoxingNotification(data: TimerNotificationData): { title: string; body: string } {
        const { round, totalRounds, phase, timeRemaining, isPreparing } = data;

        let title = '🥊 Timer de Boxeo';
        let body = '';

        if (isPreparing) {
            // "Prepárate" phase (10 seconds)
            title = '⏱️ Prepárate';
            body = timeRemaining ? this.formatTime(timeRemaining) : 'En progreso...';
        } else if (phase === 'warmup') {
            title = '🔥 Calentamiento';
            body = timeRemaining ? this.formatTime(timeRemaining) : 'En progreso...';
        } else if (phase === 'cooldown') {
            title = '❄️ Enfriamiento';
            body = timeRemaining ? this.formatTime(timeRemaining) : 'En progreso...';
        } else if (phase === 'rest') {
            title = '⏸️ Descanso';
            body = `Round ${round}/${totalRounds} - ${timeRemaining ? this.formatTime(timeRemaining) : ''}`;
        } else {
            // workout
            title = '🥊 Entrenamiento';
            body = `Round ${round}/${totalRounds} - ${timeRemaining ? this.formatTime(timeRemaining) : ''}`;
        }

        return { title, body };
    }

    /**
     * Format running timer notification
     */
    private static formatRunningNotification(data: TimerNotificationData): { title: string; body: string } {
        const { timeElapsed, distance, pace } = data;

        const title = '🏃 Carrera Activa';
        const parts: string[] = [];

        if (timeElapsed !== undefined) {
            parts.push(this.formatTime(timeElapsed));
        }

        if (distance !== undefined) {
            parts.push(`${distance.toFixed(2)} km`);
        }

        if (pace) {
            parts.push(`${pace} min/km`);
        }

        const body = parts.join(' • ') || 'En progreso...';

        return { title, body };
    }

    /**
     * Format time in MM:SS format
     */
    private static formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Check if there's an active timer notification
     */
    static hasActiveNotification(): boolean {
        return this.currentData !== null;
    }

    /**
     * Get current notification data
     */
    static getCurrentData(): TimerNotificationData | null {
        return this.currentData;
    }
}
