import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { WeeklyRoutine, DayKey } from '../features/workouts/types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type NotificationIdentifiers = {
  weekEndReminder?: string;
  dailyWorkout?: string;
};

export class NotificationService {
  private static WEEKLY_ROUTINE_NOTIFICATION_ID = 'weekly-routine-reminder';
  private static DAILY_WORKOUT_NOTIFICATION_ID = 'daily-workout-reminder';

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
          name: 'Workout Reminders',
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
   * Schedule a notification to remind the user that the week has ended
   * Triggers on Sunday at 8:00 PM
   */
  static async scheduleWeekEndReminder(): Promise<string | null> {
    try {
      // Cancel existing week-end reminder first
      await this.cancelWeekEndReminder();

      // Schedule for every Sunday at 8:00 PM
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏁 Semana completada!',
          body: 'Tu semana de entrenamiento ha terminado. Genera tu nueva rutina para la próxima semana.',
          data: { type: 'week-end-reminder' },
          sound: 'default',
        },
        trigger: {
          weekday: 1, // Sunday (1 = Sunday, 2 = Monday, etc.)
          hour: 20,
          minute: 0,
          repeats: true,
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

      const daysOfWeek: DayKey[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
      const weekdayMap: { [key in DayKey]: number } = {
        lunes: 2,    // Monday
        martes: 3,   // Tuesday
        miercoles: 4, // Wednesday
        jueves: 5,   // Thursday
        viernes: 6,  // Friday
        sabado: 7,   // Saturday
        domingo: 1,  // Sunday
      };

      for (const dayKey of daysOfWeek) {
        const dayData = routine.days[dayKey];

        // Only schedule notification if it's not a rest day and has a workout
        if (!dayData.restDay && dayData.workout) {
          const weekday = weekdayMap[dayKey];

          await Notifications.scheduleNotificationAsync({
            content: {
              title: '💪 Hora de entrenar!',
              body: `Hoy es ${dayData.day}. Tienes un entrenamiento programado. ¡Vamos!`,
              data: {
                type: 'daily-workout-reminder',
                day: dayKey,
              },
              sound: 'default',
            },
            trigger: {
              weekday,
              hour: 7,
              minute: 0,
              repeats: true,
            },
          });

          console.log(`Daily workout reminder scheduled for ${dayKey}`);
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
   * Cancel all notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
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
