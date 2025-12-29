import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { WeeklyRoutine } from '../features/workouts/types';

type DayKey = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => {
    // Show all notifications (WEEKLY triggers handle day filtering)
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

export type NotificationIdentifiers = {
  weekEndReminder?: string;
  dailyWorkout?: string;
};

export class NotificationService {


  /**
   * Request notification permissions from the user
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('workout-reminders', {
          name: 'Recordatorios de Entrenamiento',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#102216',
          sound: 'default',
          enableVibrate: true,
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Cancel ALL scheduled notifications (useful for debugging)
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ All scheduled notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  /**
   * List all scheduled notifications (for debugging)
   */
  static async listScheduledNotifications(): Promise<void> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`📋 Total scheduled notifications: ${notifications.length}`);
      notifications.forEach((notif, index) => {
        console.log(`  ${index + 1}. ${notif.content.title} - ${notif.content.body}`);
        console.log(`     Trigger:`, notif.trigger);
        console.log(`     Data:`, notif.content.data);
      });
    } catch (error) {
      console.error('Error listing notifications:', error);
    }
  }

  /**
   * Schedule a notification to remind the user that the week has ended
   * Triggers on Sunday at 8:00 PM
   */
  static async scheduleWeekEndReminder(): Promise<string | null> {
    try {
      // Cancel existing week-end reminder first
      await this.cancelWeekEndReminder();

      // Use DAILY trigger at 8 PM - will fire every day but we can filter in the app
      // This is more reliable than CALENDAR which isn't supported on Android
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏁 Semana completada!',
          body: 'Tu semana de entrenamiento ha terminado. Genera tu nueva rutina para la próxima semana.',
          data: { type: 'week-end-reminder', targetDay: 0 }, // 0 = Sunday
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 20,
          minute: 0,
        },
      });

      console.log(`Week-end reminder scheduled: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling week-end reminder:', error);
      return null;
    }
  }

  /**
   * Cancel the week-end reminder notification
   */
  static async cancelWeekEndReminder(): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const weekEndNotification = scheduledNotifications.find(
        (notification) => notification.content.data?.type === 'week-end-reminder'
      );

      if (weekEndNotification) {
        await Notifications.cancelScheduledNotificationAsync(weekEndNotification.identifier);
        console.log('Week-end reminder cancelled');
      }
    } catch (error) {
      console.error('Error cancelling week-end reminder:', error);
    }
  }

  /**
   * Schedule daily workout reminders based on the weekly routine
   * Notifies the user at 7:00 AM on days they have workouts
   */
  static async scheduleDailyWorkoutReminders(routine: WeeklyRoutine): Promise<void> {
    try {
      // Cancel all existing daily workout reminders
      await this.cancelDailyWorkoutReminders();

      const daysOfWeek: DayKey[] = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

      // Map day names to weekday numbers (1 = Sunday, 2 = Monday, etc.)
      const weekdayMap: { [key in DayKey]: number } = {
        domingo: 1,   // Sunday
        lunes: 2,     // Monday
        martes: 3,    // Tuesday
        miercoles: 4, // Wednesday
        jueves: 5,    // Thursday
        viernes: 6,   // Friday
        sabado: 7,    // Saturday
      };

      for (const dayKey of daysOfWeek) {
        const dayData = routine.days[dayKey];

        // Only schedule notification if day exists, it's not a rest day and has a workout
        if (dayData && !dayData.restDay && dayData.workout) {
          const weekday = weekdayMap[dayKey];

          // Use WEEKLY trigger to only fire on specific day of week
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '💪 Hora de entrenar!',
              body: `Hoy es ${dayKey}. Tienes un entrenamiento programado. ¡Vamos!`,
              data: {
                type: 'daily-workout-reminder',
                day: dayKey,
              },
              sound: 'default',
              ...(Platform.OS === 'android' && {
                channelId: 'workout-reminders',
              }),
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: weekday,
              hour: 7,
              minute: 0,
            },
          });

          console.log(`✅ Daily workout reminder scheduled for ${dayKey} (weekday ${weekday})`);
        } else {
          console.log(`⏭️ Skipping ${dayKey} - ${!dayData ? 'no data' : dayData.restDay ? 'rest day' : 'no workout'}`);
        }
      }
    } catch (error) {
      console.error('Error scheduling daily workout reminders:', error);
    }
  }

  /**
   * Cancel all daily workout reminder notifications
   */
  static async cancelDailyWorkoutReminders(): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const dailyNotifications = scheduledNotifications.filter(
        (notification) => notification.content.data?.type === 'daily-workout-reminder'
      );

      for (const notification of dailyNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      console.log(`Cancelled ${dailyNotifications.length} daily workout reminders`);
    } catch (error) {
      console.error('Error cancelling daily workout reminders:', error);
    }
  }

  /**
   * Get all scheduled notifications (useful for debugging)
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Send an immediate notification (useful for testing)
   */
  static async sendImmediateNotification(title: string, body: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending immediate notification:', error);
    }
  }
}
