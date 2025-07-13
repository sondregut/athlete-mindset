import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth } from '@/config/firebase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  dailyReminderTime: string;
  weeklyGoalReminder: boolean;
  streakMotivation: boolean;
  sessionCompletionCelebration: boolean;
  missedSessionReminder: boolean;
  customReminders: CustomReminder[];
}

export interface CustomReminder {
  id: string;
  title: string;
  time: string;
  daysOfWeek: number[]; // 0 = Sunday, 6 = Saturday
  enabled: boolean;
}

class FirebaseNotificationService {
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }

      // Get Expo push token
      const token = await this.registerForPushNotifications();
      if (token) {
        await this.saveTokenToFirestore(token);
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Register for push notifications and get token
   */
  private async registerForPushNotifications(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id' // Replace with your actual project ID
      });
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Save push token to Firestore
   */
  private async saveTokenToFirestore(token: string): Promise<void> {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore();
      await setDoc(doc(db, 'users', user.uid, 'settings', 'notifications'), {
        pushToken: token,
        platform: Platform.OS,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  /**
   * Schedule daily training reminder
   */
  async scheduleDailyReminder(time: string): Promise<void> {
    try {
      // Cancel existing daily reminder
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Parse time (format: "HH:mm")
      const [hours, minutes] = time.split(':').map(Number);
      
      // Create trigger
      const trigger: any = {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      };

      // Schedule notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time to Train! 💪",
          body: "Ready to log today's training session?",
          data: { type: 'daily_reminder' },
          sound: true,
        },
        trigger,
      });

      console.log('Daily reminder scheduled for', time);
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
      throw error;
    }
  }

  /**
   * Schedule weekly goal check-in (Sundays)
   */
  async scheduleWeeklyGoalReminder(): Promise<void> {
    try {
      const trigger: any = {
        type: SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday
        hour: 19, // 7 PM
        minute: 0,
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Weekly Goal Check-in 🎯",
          body: "Time to review your progress and set goals for next week!",
          data: { type: 'weekly_goal' },
          sound: true,
        },
        trigger,
      });

      console.log('Weekly goal reminder scheduled');
    } catch (error) {
      console.error('Error scheduling weekly goal reminder:', error);
      throw error;
    }
  }

  /**
   * Send immediate notification (for testing or immediate alerts)
   */
  async sendImmediateNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
        },
        trigger: null, // null trigger = immediate
      });
    } catch (error) {
      console.error('Error sending immediate notification:', error);
      throw error;
    }
  }

  /**
   * Schedule custom reminder
   */
  async scheduleCustomReminder(reminder: CustomReminder): Promise<void> {
    try {
      const [hours, minutes] = reminder.time.split(':').map(Number);

      // Schedule for each selected day of the week
      for (const dayOfWeek of reminder.daysOfWeek) {
        const trigger: any = {
          type: SchedulableTriggerInputTypes.WEEKLY,
          weekday: dayOfWeek + 1, // expo uses 1-7 (Sunday = 1)
          hour: hours,
          minute: minutes,
        };

        await Notifications.scheduleNotificationAsync({
          content: {
            title: reminder.title,
            body: "Time for your scheduled training reminder!",
            data: { type: 'custom_reminder', reminderId: reminder.id },
            sound: true,
          },
          trigger,
          identifier: `custom_${reminder.id}_${dayOfWeek}`,
        });
      }

      console.log('Custom reminder scheduled:', reminder.title);
    } catch (error) {
      console.error('Error scheduling custom reminder:', error);
      throw error;
    }
  }

  /**
   * Cancel custom reminder
   */
  async cancelCustomReminder(reminderId: string): Promise<void> {
    try {
      // Cancel all notifications for this reminder (all days)
      for (let day = 0; day < 7; day++) {
        await Notifications.cancelScheduledNotificationAsync(`custom_${reminderId}_${day}`);
      }
    } catch (error) {
      console.error('Error canceling custom reminder:', error);
    }
  }

  /**
   * Send streak motivation notification
   */
  async sendStreakMotivation(streak: number): Promise<void> {
    const messages = [
      `${streak} days strong! Keep the momentum going! 🔥`,
      `Amazing ${streak}-day streak! You're unstoppable! 💪`,
      `${streak} days of dedication! Your consistency is inspiring! ⭐`,
      `Wow! ${streak} days in a row! Keep crushing it! 🚀`,
    ];

    const message = messages[Math.floor(Math.random() * messages.length)];

    await this.sendImmediateNotification(
      'Streak Alert! 🔥',
      message,
      { type: 'streak_motivation', streak }
    );
  }

  /**
   * Send session completion celebration
   */
  async sendSessionCompletionCelebration(sessionType: string): Promise<void> {
    const messages = {
      training: "Great training session! Recovery is where the magic happens! 💪",
      competition: "Competition complete! Time to reflect and grow! 🏆",
      recovery: "Smart recovery work! Your body thanks you! 🧘",
      skill: "Skills sharpened! Every rep counts! 🎯",
      other: "Session logged! Consistency is key! ⭐"
    };

    await this.sendImmediateNotification(
      'Session Complete! ✅',
      messages[sessionType as keyof typeof messages] || messages.other,
      { type: 'session_completion' }
    );
  }

  /**
   * Check and send missed session reminder
   */
  async checkMissedSessionReminder(lastSessionDate: Date): Promise<void> {
    const daysSinceLastSession = Math.floor(
      (Date.now() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastSession >= 3) {
      await this.sendImmediateNotification(
        'Missing You! 👋',
        `It's been ${daysSinceLastSession} days since your last session. Ready to get back on track?`,
        { type: 'missed_session', daysSinceLastSession }
      );
    }
  }

  /**
   * Update notification settings in Firestore
   */
  async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');

      const db = getFirestore();
      await setDoc(doc(db, 'users', user.uid, 'settings', 'notifications'), {
        ...settings,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Reschedule notifications based on new settings
      if (settings.dailyReminder !== undefined || settings.dailyReminderTime !== undefined) {
        const currentSettings = await this.getSettings();
        if (currentSettings.dailyReminder && currentSettings.dailyReminderTime) {
          await this.scheduleDailyReminder(currentSettings.dailyReminderTime);
        }
      }

      if (settings.weeklyGoalReminder !== undefined) {
        if (settings.weeklyGoalReminder) {
          await this.scheduleWeeklyGoalReminder();
        }
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  /**
   * Get notification settings from Firestore
   */
  async getSettings(): Promise<NotificationSettings> {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        return this.getDefaultSettings();
      }

      const db = getFirestore();
      const docRef = doc(db, 'users', user.uid, 'settings', 'notifications');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as NotificationSettings;
      }

      return this.getDefaultSettings();
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Get default notification settings
   */
  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: false,
      dailyReminder: true,
      dailyReminderTime: '19:00',
      weeklyGoalReminder: true,
      streakMotivation: true,
      sessionCompletionCelebration: true,
      missedSessionReminder: true,
      customReminders: []
    };
  }

  /**
   * Setup notification listeners
   */
  setupListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ): void {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      onNotificationReceived?.(notification);
    });

    // Listener for interactions with notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      onNotificationResponse?.(response);
    });
  }

  /**
   * Clean up listeners
   */
  removeListeners(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }
}

export const firebaseNotifications = new FirebaseNotificationService();