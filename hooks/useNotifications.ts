import { useEffect, useRef } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { useNotificationStore } from '@/store/notification-store';
import { useSessionStore } from '@/store/session-store';
import * as Notifications from 'expo-notifications';

export const useNotifications = () => {
  const { 
    checkPermissionStatus, 
    rescheduleAllNotifications, 
    settings 
  } = useNotificationStore();
  
  const { logs, getStreak } = useSessionStore();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Check permission status on app start
    checkPermissionStatus();

    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener((notification: any) => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const data = response.notification.request.content.data;
      handleNotificationResponse(data);
    });

    // Set up app state listener for background notifications
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to foreground
        checkForMissedSessionReminder();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      subscription?.remove();
    };
  }, []);

  // Reschedule notifications when settings change
  useEffect(() => {
    if (settings.enabled) {
      rescheduleAllNotifications();
    }
  }, [settings, rescheduleAllNotifications]);

  const handleNotificationResponse = (data: any) => {
    if (!data) return;

    switch (data.type) {
      case 'celebration':
        // Could navigate to session details or show confetti
        console.log('Celebration notification tapped');
        break;
      case 'streak':
        // Could navigate to analytics or show streak celebration
        console.log('Streak notification tapped');
        break;
      case 'daily':
        // Navigate to log session screen
        console.log('Daily reminder tapped');
        break;
      case 'weekly':
        // Navigate to analytics/progress screen
        console.log('Weekly reminder tapped');
        break;
      case 'missed':
        // Navigate to log session with encouragement
        console.log('Missed session reminder tapped');
        break;
      case 'custom':
        // Handle custom reminder
        console.log('Custom reminder tapped');
        break;
      default:
        console.log('Unknown notification type:', data.type);
    }
  };

  const checkForMissedSessionReminder = async () => {
    if (!settings.enabled || !settings.missedSessionReminder) return;

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayString = now.toISOString().split('T')[0];
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    // Check if user logged a session today or yesterday
    const recentSessions = logs.filter(log => 
      log.date === todayString || log.date === yesterdayString
    );
    
    if (recentSessions.length === 0 && logs.length > 0) {
      // User hasn't logged in 2 days and has logged before
      const streak = getStreak();
      
      let message = "Don't break your momentum! Log your training session to keep building mental strength.";
      
      if (streak > 0) {
        message = `Your ${streak}-day streak is waiting! A quick session log can keep your progress alive.`;
      }
      
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Missing your training logs? 🤔',
            body: message,
            data: { type: 'missed' },
          },
          trigger: { seconds: 1 } as any,
        });
      } catch (error) {
        console.log('Failed to send missed session reminder:', error);
      }
    }
  };

  const sendCustomMotivationalMessage = async () => {
    if (!settings.enabled || !settings.streakMotivation) return;

    const streak = getStreak();
    const totalSessions = logs.length;
    
    let message = '';
    let title = '';
    
    if (streak >= 7) {
      title = 'You\'re incredible! 🌟';
      message = `${streak} days of consistent training shows real dedication. Keep building that mental toughness!`;
    } else if (totalSessions >= 10) {
      title = 'Look at your progress! 📈';
      message = `${totalSessions} sessions logged! You're developing both physical and mental fitness.`;
    } else if (totalSessions >= 5) {
      title = 'Great start! 💪';
      message = 'You\'re building the habit of mindful training. Every session makes you stronger!';
    } else {
      return; // Don't send motivational messages for new users
    }
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          data: { type: 'motivation' },
        },
        trigger: { seconds: 1 } as any,
      });
    } catch (error) {
      console.log('Failed to send motivational message:', error);
    }
  };

  return {
    handleNotificationResponse,
    checkForMissedSessionReminder,
    sendCustomMotivationalMessage,
  };
};