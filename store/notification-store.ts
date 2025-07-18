import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  dailyReminderTime: string; // HH:MM format
  weeklyGoalReminder: boolean;
  streakMotivation: boolean;
  sessionCompletionCelebration: boolean;
  missedSessionReminder: boolean;
  customReminders: CustomReminder[];
}

export interface CustomReminder {
  id: string;
  title: string;
  message: string;
  time: string; // HH:MM format
  daysOfWeek: number[]; // 0-6, Sunday = 0
  enabled: boolean;
  createdAt: string;
}

export interface ScheduledNotification {
  id: string;
  notificationId: string;
  type: 'daily' | 'weekly' | 'streak' | 'celebration' | 'missed' | 'custom';
  scheduledTime: Date;
  title: string;
  body: string;
}

interface NotificationState {
  settings: NotificationSettings;
  scheduledNotifications: ScheduledNotification[];
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  
  // Loading states
  isRequestingPermission: boolean;
  isSchedulingNotifications: boolean;
  isUpdatingSettings: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  requestPermission: () => Promise<boolean>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  scheduleNotification: (notification: Omit<ScheduledNotification, 'id'>) => Promise<string>;
  cancelNotification: (notificationId: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  rescheduleAllNotifications: () => Promise<void>;
  addCustomReminder: (reminder: Omit<CustomReminder, 'id' | 'createdAt'>) => Promise<void>;
  updateCustomReminder: (id: string, updates: Partial<CustomReminder>) => Promise<void>;
  deleteCustomReminder: (id: string) => Promise<void>;
  checkPermissionStatus: () => Promise<void>;
  
  // Getters
  getUpcomingNotifications: () => ScheduledNotification[];
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

const defaultSettings: NotificationSettings = {
  enabled: true,
  dailyReminder: true,
  dailyReminderTime: '09:00',
  weeklyGoalReminder: true,
  streakMotivation: true,
  sessionCompletionCelebration: true,
  missedSessionReminder: true,
  customReminders: [],
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      scheduledNotifications: [],
      permissionStatus: 'undetermined',
      
      // Loading states
      isRequestingPermission: false,
      isSchedulingNotifications: false,
      isUpdatingSettings: false,
      
      // Error state
      error: null,
      
      requestPermission: async () => {
        set({ isRequestingPermission: true, error: null });
        
        try {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          
          set({ permissionStatus: finalStatus as any });
          
          if (finalStatus === 'granted') {
            // Configure notification channel for Android
            if (Platform.OS === 'android') {
              await Notifications.setNotificationChannelAsync('default', {
                name: 'Training Reminders',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF8C42',
              });
            }
            return true;
          }
          
          return false;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to request notification permission';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isRequestingPermission: false });
        }
      },
      
      checkPermissionStatus: async () => {
        try {
          const { status } = await Notifications.getPermissionsAsync();
          set({ permissionStatus: status as any });
        } catch (error) {
          console.error('Failed to check permission status:', error);
        }
      },
      
      updateSettings: async (newSettings) => {
        set({ isUpdatingSettings: true, error: null });
        
        try {
          const updatedSettings = { ...get().settings, ...newSettings };
          set({ settings: updatedSettings });
          
          // Reschedule notifications with new settings
          await get().rescheduleAllNotifications();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update notification settings';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isUpdatingSettings: false });
        }
      },
      
      scheduleNotification: async (notification) => {
        const { permissionStatus } = get();
        
        if (permissionStatus !== 'granted') {
          throw new Error('Notification permission not granted');
        }
        
        try {
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: notification.title,
              body: notification.body,
              data: { type: notification.type },
            },
            trigger: { 
              type: SchedulableTriggerInputTypes.DATE,
              date: notification.scheduledTime 
            },
          });
          
          const scheduledNotification: ScheduledNotification = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            notificationId,
            type: notification.type,
            scheduledTime: notification.scheduledTime,
            title: notification.title,
            body: notification.body,
          };
          
          set((state) => ({
            scheduledNotifications: [...state.scheduledNotifications, scheduledNotification]
          }));
          
          return scheduledNotification.id;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to schedule notification';
          set({ error: errorMessage });
          throw error;
        }
      },
      
      cancelNotification: async (notificationId) => {
        try {
          const { scheduledNotifications } = get();
          const notification = scheduledNotifications.find(n => n.id === notificationId);
          
          if (notification) {
            await Notifications.cancelScheduledNotificationAsync(notification.notificationId);
            
            set((state) => ({
              scheduledNotifications: state.scheduledNotifications.filter(n => n.id !== notificationId)
            }));
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to cancel notification';
          set({ error: errorMessage });
          throw error;
        }
      },
      
      cancelAllNotifications: async () => {
        try {
          await Notifications.cancelAllScheduledNotificationsAsync();
          set({ scheduledNotifications: [] });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to cancel all notifications';
          set({ error: errorMessage });
          throw error;
        }
      },
      
      rescheduleAllNotifications: async () => {
        set({ isSchedulingNotifications: true, error: null });
        
        try {
          // Cancel all existing notifications
          await get().cancelAllNotifications();
          
          const { settings } = get();
          
          if (!settings.enabled) {
            return;
          }
          
          // Schedule daily reminder
          if (settings.dailyReminder) {
            const [hours, minutes] = settings.dailyReminderTime.split(':').map(Number);
            const now = new Date();
            const scheduledTime = new Date();
            scheduledTime.setHours(hours, minutes, 0, 0);
            
            // If the time has passed today, schedule for tomorrow
            if (scheduledTime <= now) {
              scheduledTime.setDate(scheduledTime.getDate() + 1);
            }
            
            await get().scheduleNotification({
              type: 'daily',
              scheduledTime,
              title: 'Time for your training session! 🏃‍♂️',
              body: 'Log your mindful training session and track your progress.',
              notificationId: '',
            });
          }
          
          // Schedule weekly goal reminder (every Sunday)
          if (settings.weeklyGoalReminder) {
            const now = new Date();
            const nextSunday = new Date();
            const daysUntilSunday = (7 - now.getDay()) % 7;
            nextSunday.setDate(now.getDate() + (daysUntilSunday || 7));
            nextSunday.setHours(10, 0, 0, 0);
            
            await get().scheduleNotification({
              type: 'weekly',
              scheduledTime: nextSunday,
              title: 'Weekly Goal Check-in 📊',
              body: 'How did you do this week? Review your progress and set new goals.',
              notificationId: '',
            });
          }
          
          // Schedule custom reminders
          for (const reminder of settings.customReminders) {
            if (reminder.enabled) {
              const [hours, minutes] = reminder.time.split(':').map(Number);
              
              for (const dayOfWeek of reminder.daysOfWeek) {
                const now = new Date();
                const scheduledTime = new Date();
                scheduledTime.setHours(hours, minutes, 0, 0);
                
                // Calculate next occurrence of this day of week
                const daysUntilTarget = (dayOfWeek - now.getDay() + 7) % 7;
                if (daysUntilTarget === 0 && scheduledTime <= now) {
                  scheduledTime.setDate(scheduledTime.getDate() + 7);
                } else {
                  scheduledTime.setDate(scheduledTime.getDate() + daysUntilTarget);
                }
                
                await get().scheduleNotification({
                  type: 'custom',
                  scheduledTime,
                  title: reminder.title,
                  body: reminder.message,
                  notificationId: '',
                });
              }
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to reschedule notifications';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isSchedulingNotifications: false });
        }
      },
      
      addCustomReminder: async (reminder) => {
        const newReminder: CustomReminder = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          ...reminder,
        };
        
        set((state) => ({
          settings: {
            ...state.settings,
            customReminders: [...state.settings.customReminders, newReminder],
          },
        }));
        
        // Reschedule notifications to include the new reminder
        await get().rescheduleAllNotifications();
      },
      
      updateCustomReminder: async (id, updates) => {
        set((state) => ({
          settings: {
            ...state.settings,
            customReminders: state.settings.customReminders.map(reminder =>
              reminder.id === id ? { ...reminder, ...updates } : reminder
            ),
          },
        }));
        
        // Reschedule notifications with updated reminder
        await get().rescheduleAllNotifications();
      },
      
      deleteCustomReminder: async (id) => {
        set((state) => ({
          settings: {
            ...state.settings,
            customReminders: state.settings.customReminders.filter(reminder => reminder.id !== id),
          },
        }));
        
        // Reschedule notifications without the deleted reminder
        await get().rescheduleAllNotifications();
      },
      
      getUpcomingNotifications: () => {
        const { scheduledNotifications } = get();
        const now = new Date();
        
        return scheduledNotifications
          .filter(notification => notification.scheduledTime > now)
          .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
      },
      
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        permissionStatus: state.permissionStatus,
      }),
    }
  )
);