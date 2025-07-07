import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionLog, SessionType } from '@/types/session';
import { StorageError, ValidationError } from '@/hooks/useErrorHandler';
import * as Notifications from 'expo-notifications';
import { firebaseSessions } from '@/services/firebase-sessions';
import { firebaseAuth } from '@/services/firebase-auth';
import { firebaseNotifications } from '@/services/firebase-notifications';
import { useNotificationStore } from '@/store/notification-store';
import { useAchievementStore } from './achievement-store';

interface SessionState {
  logs: SessionLog[];
  currentSession: SessionLog | null;
  
  // Timer state
  sessionTimer: any;
  elapsedTime: string;
  
  // Loading states
  isCompletingSession: boolean;
  isClearingData: boolean;
  isCalculatingAnalytics: boolean;
  isExportingData: boolean;
  isEditingSession: boolean;
  
  // Error state
  error: string | null;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Actions
  addLog: (log: SessionLog) => void;
  updateCurrentSession: (data: Partial<SessionLog>) => void;
  completeCurrentSession: () => Promise<any>;
  resetCurrentSession: () => void;
  editSession: (sessionId: string, data: Partial<SessionLog>) => Promise<void>;
  setCurrentSessionForEdit: (sessionId: string) => void;
  clearDuplicateSessions: () => void;
  clearAllSessions: () => Promise<void>;
  startSessionTimer: () => void;
  stopSessionTimer: () => void;
  updateElapsedTime: () => void;
  initializeTimer: () => void;
  
  // Getters
  getStreak: () => number;
  getWeeklyLogs: () => number;
  getRecentLogs: (count: number) => SessionLog[];
  getSessionById: (sessionId: string) => SessionLog | undefined;
  getBrainHealth: () => number;
  
  // Analytics (with loading states)
  getMonthlyStats: () => Promise<{ thisMonth: number; lastMonth: number }>;
  getLongestStreak: () => Promise<number>;
  getTotalSessions: () => number;
  getMindsetInsights: () => Promise<{ topCues: string[]; avgReadiness: number }>;
  getSessionTypeBreakdown: () => Promise<{ [key: string]: number }>;
  getPerformanceTrends: () => Promise<{ avgRPE: number; avgRating: number }>;
  
  // Export functionality
  exportSessionData: () => Promise<string>;
  
  // Notification helpers
  sendSessionCompletionNotification: (session: SessionLog) => Promise<void>;
  sendStreakNotification: (streak: number) => Promise<void>;
  
  // Firebase sync
  deleteSession: (sessionId: string) => Promise<void>;
  syncWithFirebase: () => Promise<void>;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      logs: [],
      currentSession: null,
      sessionTimer: null,
      elapsedTime: '00:00:00',
      
      // Loading states
      isCompletingSession: false,
      isClearingData: false,
      isCalculatingAnalytics: false,
      isExportingData: false,
      isEditingSession: false,
      
      // Error state
      error: null,
      
      // Error handling
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      
      addLog: (log) => set((state) => ({ 
        logs: [log, ...state.logs] 
      })),
      
      updateCurrentSession: (data) => set((state) => {
        // If there's no current session, create a new one with the provided data
        if (!state.currentSession) {
          const newSession: SessionLog = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            date: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            sessionType: 'training',
            activity: '',
            status: 'intention',
            ...data
          };
          return { currentSession: newSession };
        }
        
        // Otherwise, update the existing session
        return {
          currentSession: { 
            ...state.currentSession, 
            ...data 
          }
        };
      }),
      
      completeCurrentSession: async () => {
        const { currentSession, logs } = get();
        if (!currentSession) {
          throw new Error('No active session to complete');
        }

        set({ isCompletingSession: true, error: null });
        
        try {
          // Validate session data
          if (!currentSession.sessionType) {
            throw new ValidationError('Session type is required');
          }
          
          // Simulate processing time for complex completion logic
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check if this session already exists in logs (for edit mode)
          const existingSessionIndex = logs.findIndex(log => log.id === currentSession.id);
          if (existingSessionIndex >= 0) {
            // Update existing session
            const updatedLogs = [...logs];
            updatedLogs[existingSessionIndex] = currentSession;
            set({ logs: updatedLogs, currentSession: null });
          } else {
            // Add new session
            set((state) => ({
              logs: [currentSession, ...state.logs],
              currentSession: null
            }));
            
            // Check for streak milestones after adding the new session
            const newStreak = get().getStreak();
            const unlockedMilestone = useAchievementStore.getState().checkAndUnlockMilestone(newStreak);
            
            // Send celebration notification
            get().sendSessionCompletionNotification(currentSession);
            
            // Sync with Firebase if user is authenticated
            const user = firebaseAuth.getCurrentUser();
            if (user) {
              firebaseSessions.createSession(currentSession).catch(error => {
                console.error('Failed to sync session to Firebase:', error);
                // Don't throw - allow offline functionality
              });
            }
            
            // Return the unlocked milestone (if any) so the UI can show celebration
            return unlockedMilestone;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to complete session';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isCompletingSession: false });
        }
      },
      
      resetCurrentSession: () => set({ currentSession: null }),
      
      getStreak: () => {
        const { logs } = get();
        if (logs.length === 0) return 0;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let streak = 0;
        let currentDate = new Date(today);
        
        while (true) {
          const dateString = currentDate.toISOString().split('T')[0];
          const hasLogForDate = logs.some(log => log.date.startsWith(dateString));
          
          if (hasLogForDate) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }
        
        return streak;
      },
      
      getWeeklyLogs: () => {
        const { logs } = get();
        const today = new Date();
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        return logs.filter(log => {
          const logDate = new Date(log.date);
          return logDate >= oneWeekAgo && logDate <= today;
        }).length;
      },
      
      getRecentLogs: (count) => {
        const { logs } = get();
        return logs.slice(0, count);
      },
      
      editSession: async (sessionId, data) => {
        set({ isEditingSession: true });
        
        try {
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 300));
          
          set((state) => ({
            logs: state.logs.map(log => 
              log.id === sessionId ? { ...log, ...data } : log
            )
          }));
          
          // Sync with Firebase if user is authenticated
          const user = firebaseAuth.getCurrentUser();
          if (user) {
            firebaseSessions.updateSession(sessionId, data).catch(error => {
              console.error('Failed to sync session update to Firebase:', error);
              // Don't throw - allow offline functionality
            });
          }
        } finally {
          set({ isEditingSession: false });
        }
      },
      
      setCurrentSessionForEdit: (sessionId) => {
        const { logs } = get();
        const sessionToEdit = logs.find(log => log.id === sessionId);
        if (sessionToEdit) {
          set({ currentSession: { ...sessionToEdit } });
        }
      },
      
      getSessionById: (sessionId) => {
        const { logs } = get();
        return logs.find(log => log.id === sessionId);
      },
      
      getBrainHealth: () => {
        const { logs } = get();
        const currentStreak = get().getStreak();
        const weeklyLogs = get().getWeeklyLogs();
        
        // Check days since last log
        let daysSinceLastLog = 0;
        if (logs.length > 0) {
          const lastLogDate = new Date(logs[0].date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          lastLogDate.setHours(0, 0, 0, 0);
          daysSinceLastLog = Math.floor((today.getTime() - lastLogDate.getTime()) / (1000 * 60 * 60 * 24));
        } else {
          daysSinceLastLog = 999; // No logs ever
        }
        
        // Calculate brain health score (1-5)
        if (currentStreak >= 7 || weeklyLogs >= 6) {
          return 5; // Very Healthy - Super fit brain
        } else if (currentStreak >= 3 || weeklyLogs >= 4) {
          return 4; // Healthy - Fit brain
        } else if (currentStreak >= 1 || weeklyLogs >= 2) {
          return 3; // Normal - Average brain
        } else if (daysSinceLastLog <= 3) {
          return 2; // Unhealthy - Weak brain
        } else {
          return 1; // Very Unhealthy - Very weak brain
        }
      },
      
      clearDuplicateSessions: () => set((state) => {
        const uniqueLogs = state.logs.reduce((acc: SessionLog[], current) => {
          const existingIndex = acc.findIndex(log => log.id === current.id);
          if (existingIndex === -1) {
            acc.push(current);
          } else {
            // Keep the more recent one (with more complete data)
            if (current.status === 'completed' || current.createdAt > acc[existingIndex].createdAt) {
              acc[existingIndex] = current;
            }
          }
          return acc;
        }, []);
        
        return { logs: uniqueLogs };
      }),
      
      clearAllSessions: async () => {
        set({ isClearingData: true, error: null });
        
        try {
          // Simulate processing time for data cleanup
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const { sessionTimer } = get();
          if (sessionTimer) {
            clearInterval(sessionTimer);
          }
          
          // Clear data from AsyncStorage
          try {
            await AsyncStorage.removeItem('athlete-mindset-storage');
          } catch (storageError) {
            throw new StorageError('Failed to clear stored data', 'clear');
          }
          
          set({ 
            logs: [], 
            currentSession: null, 
            sessionTimer: null, 
            elapsedTime: '00:00:00' 
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to clear sessions';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isClearingData: false });
        }
      },
      
      startSessionTimer: () => {
        const { currentSession, sessionTimer } = get();
        
        // Clear existing timer if any
        if (sessionTimer) {
          clearInterval(sessionTimer);
        }
        
        if (currentSession && currentSession.startTime) {
          const updateTimer = () => {
            const { currentSession } = get();
            if (currentSession && currentSession.startTime) {
              const now = new Date();
              const start = new Date(currentSession.startTime);
              const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
              
              const hours = Math.floor(diff / 3600).toString().padStart(2, '0');
              const minutes = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
              const seconds = (diff % 60).toString().padStart(2, '0');
              
              set({ elapsedTime: `${hours}:${minutes}:${seconds}` });
            }
          };
          
          // Update immediately
          updateTimer();
          
          // Start interval
          const newTimer = setInterval(updateTimer, 1000);
          set({ sessionTimer: newTimer });
        }
      },
      
      stopSessionTimer: () => {
        const { sessionTimer } = get();
        if (sessionTimer) {
          clearInterval(sessionTimer);
          set({ sessionTimer: null });
        }
      },
      
      updateElapsedTime: () => {
        const { currentSession } = get();
        if (currentSession && currentSession.startTime) {
          const now = new Date();
          const start = new Date(currentSession.startTime);
          const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
          
          const hours = Math.floor(diff / 3600).toString().padStart(2, '0');
          const minutes = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
          const seconds = (diff % 60).toString().padStart(2, '0');
          
          set({ elapsedTime: `${hours}:${minutes}:${seconds}` });
        }
      },
      
      initializeTimer: () => {
        const { currentSession } = get();
        // Only start timer if there's an active session
        if (currentSession && currentSession.status === 'active' && currentSession.startTime) {
          get().startSessionTimer();
        }
      },
      
      // Analytics functions
      getMonthlyStats: async () => {
        set({ isCalculatingAnalytics: true, error: null });
        
        try {
          // Simulate processing time for complex analytics
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const { logs } = get();
          if (!Array.isArray(logs)) {
            throw new Error('Invalid session data format');
          }
          
          const now = new Date();
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          
          const thisMonthCount = logs.filter(log => {
            try {
              const logDate = new Date(log.date);
              return logDate >= thisMonth && logDate < nextMonth;
            } catch {
              return false;
            }
          }).length;
          
          const lastMonthCount = logs.filter(log => {
            try {
              const logDate = new Date(log.date);
              return logDate >= lastMonth && logDate < thisMonth;
            } catch {
              return false;
            }
          }).length;
          
          return { thisMonth: thisMonthCount, lastMonth: lastMonthCount };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to calculate monthly stats';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isCalculatingAnalytics: false });
        }
      },
      
      getLongestStreak: async () => {
        set({ isCalculatingAnalytics: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 150));
          
          const { logs } = get();
          if (logs.length === 0) return 0;
          
          // Sort logs by date
          const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          let longestStreak = 1;
          let currentStreak = 1;
          
          for (let i = 1; i < sortedLogs.length; i++) {
            const prevDate = new Date(sortedLogs[i - 1].date);
            const currDate = new Date(sortedLogs[i].date);
            const diffTime = currDate.getTime() - prevDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
              currentStreak++;
            } else {
              longestStreak = Math.max(longestStreak, currentStreak);
              currentStreak = 1;
            }
          }
          
          return Math.max(longestStreak, currentStreak);
        } finally {
          set({ isCalculatingAnalytics: false });
        }
      },
      
      getTotalSessions: () => {
        const { logs } = get();
        return logs.length;
      },
      
      getMindsetInsights: async () => {
        set({ isCalculatingAnalytics: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 250));
          
          const { logs } = get();
          const completedLogs = logs.filter(log => log.status === 'completed');
          
          // Count mindset cues
          const cueCount: { [key: string]: number } = {};
          let totalReadiness = 0;
          let readinessCount = 0;
          
          completedLogs.forEach(log => {
            if (log.mindsetCues) {
              log.mindsetCues.forEach(cue => {
                cueCount[cue] = (cueCount[cue] || 0) + 1;
              });
            }
            
            if (log.readinessRating) {
              totalReadiness += log.readinessRating;
              readinessCount++;
            }
          });
          
          const topCues = Object.entries(cueCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([cue]) => cue);
          
          const avgReadiness = readinessCount > 0 ? totalReadiness / readinessCount : 0;
          
          return { topCues, avgReadiness };
        } finally {
          set({ isCalculatingAnalytics: false });
        }
      },
      
      getSessionTypeBreakdown: async () => {
        set({ isCalculatingAnalytics: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const { logs } = get();
          const breakdown: { [key: string]: number } = {};
          
          logs.forEach(log => {
            const type = log.sessionType === 'other' && log.customSessionType 
              ? log.customSessionType 
              : log.sessionType;
            breakdown[type] = (breakdown[type] || 0) + 1;
          });
          
          return breakdown;
        } finally {
          set({ isCalculatingAnalytics: false });
        }
      },
      
      getPerformanceTrends: async () => {
        set({ isCalculatingAnalytics: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 150));
          
          const { logs } = get();
          const completedLogs = logs.filter(log => log.status === 'completed');
          
          let totalRPE = 0;
          let totalRating = 0;
          let rpeCount = 0;
          let ratingCount = 0;
          
          completedLogs.forEach(log => {
            if (log.rpe) {
              totalRPE += log.rpe;
              rpeCount++;
            }
            if (log.sessionRating) {
              totalRating += log.sessionRating;
              ratingCount++;
            }
          });
          
          return {
            avgRPE: rpeCount > 0 ? totalRPE / rpeCount : 0,
            avgRating: ratingCount > 0 ? totalRating / ratingCount : 0
          };
        } finally {
          set({ isCalculatingAnalytics: false });
        }
      },
      
      // Export functionality
      exportSessionData: async () => {
        set({ isExportingData: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 600));
          
          const { logs } = get();
          if (logs.length === 0) {
            return 'No session data to export';
          }
          
          const headers = [
            'Date',
            'Session Type',
            'Activity',
            'Status',
            'Intention',
            'Mindset Cues',
            'Readiness Rating',
            'RPE',
            'Session Rating',
            'Duration (seconds)',
            'Positives',
            'Stretch Goal'
          ].join(',');
          
          const rows = logs.map(session => [
            session.date,
            session.sessionType,
            session.activity || '',
            session.status,
            session.intention || '',
            session.mindsetCues ? session.mindsetCues.join('; ') : '',
            session.readinessRating || '',
            session.rpe || '',
            session.sessionRating || '',
            session.duration || '',
            session.positives ? session.positives.join('; ') : '',
            session.stretchGoal || ''
          ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
          
          return [headers, ...rows].join('\n');
        } finally {
          set({ isExportingData: false });
        }
      },
      
      // Notification helpers
      sendSessionCompletionNotification: async (session: SessionLog) => {
        try {
          // Check if celebration notifications are enabled
          const notificationSettings = await firebaseNotifications.getSettings();
          
          if (notificationSettings.enabled && notificationSettings.sessionCompletionCelebration) {
            await firebaseNotifications.sendSessionCompletionCelebration(session.sessionType);
          }
          
          // Check for streak milestones
          const currentStreak = get().getStreak();
          if (currentStreak % 5 === 0 && currentStreak > 0) {
            await get().sendStreakNotification(currentStreak);
          }
        } catch (error) {
          console.log('Failed to send completion notification:', error);
          // Don't throw error for notification failures
        }
      },
      
      sendStreakNotification: async (streak: number) => {
        try {
          const notificationSettings = await firebaseNotifications.getSettings();
          
          if (notificationSettings.enabled && notificationSettings.streakMotivation) {
            await firebaseNotifications.sendStreakMotivation(streak);
          }
        } catch (error) {
          console.log('Failed to send streak notification:', error);
          // Don't throw error for notification failures
        }
      },
      
      // Delete session
      deleteSession: async (sessionId: string) => {
        set({ isEditingSession: true, error: null });
        
        try {
          // Remove from local state
          set((state) => ({
            logs: state.logs.filter(log => log.id !== sessionId)
          }));
          
          // Sync with Firebase if user is authenticated
          const user = firebaseAuth.getCurrentUser();
          if (user) {
            await firebaseSessions.deleteSession(sessionId).catch(error => {
              console.error('Failed to delete session from Firebase:', error);
              // Don't throw - allow offline functionality
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete session';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isEditingSession: false });
        }
      },
      
      // Sync with Firebase
      syncWithFirebase: async () => {
        const user = firebaseAuth.getCurrentUser();
        if (!user) return;
        
        try {
          // Add a small delay to ensure user document is created
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Set up real-time listener for Firebase changes
          firebaseSessions.onSessionsChange((firebaseLogs) => {
            // Merge Firebase data with local data
            set((state) => {
              const localIds = new Set(state.logs.map(log => log.id));
              const firebaseIds = new Set(firebaseLogs.map(log => log.id));
              
              // Add new sessions from Firebase that aren't local
              const newSessions = firebaseLogs.filter(log => !localIds.has(log.id));
              
              // Keep local sessions that aren't in Firebase (offline created)
              const offlineSessions = state.logs.filter(log => !firebaseIds.has(log.id));
              
              // Merge and sort by creation date
              const mergedLogs = [...firebaseLogs, ...offlineSessions]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              
              return { logs: mergedLogs };
            });
          });
        } catch (error) {
          console.error('Failed to set up Firebase sync:', error);
        }
      }
    }),
    {
      name: 'athlete-mindset-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        logs: state.logs, 
        currentSession: state.currentSession,
        elapsedTime: state.elapsedTime 
      }),
    }
  )
);