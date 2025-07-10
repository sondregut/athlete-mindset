import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VisualizationSession, VisualizationPreferences, VisualizationStats } from '@/types/visualization';
import { SessionLog } from '@/types/session';
import { getVisualizationById } from '@/constants/visualizations';

interface VisualizationState {
  // Current session state
  currentSession: VisualizationSession | null;
  isPaused: boolean;
  sessionStartTime: number | null;
  
  // Completed sessions
  completedSessions: VisualizationSession[];
  
  // User preferences
  preferences: VisualizationPreferences;
  
  // Actions
  startSession: (visualizationId: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  nextStep: () => void;
  previousStep: () => void;
  completeSession: () => void;
  abandonSession: () => void;
  updatePreferences: (prefs: Partial<VisualizationPreferences>) => void;
  
  // Getters
  getVisualizationStats: (visualizationId: string) => VisualizationStats;
  getTotalVisualizationTime: () => number;
  getStreakDays: () => number;
}

export const useVisualizationStore = create<VisualizationState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSession: null,
      isPaused: false,
      sessionStartTime: null,
      completedSessions: [],
      preferences: {
        audioEnabled: true,
        backgroundAudioEnabled: true,
        volume: 0.8,
        autoProgress: false,
        // TTS Settings
        ttsEnabled: true,
        ttsVoice: 'nova',
        ttsSpeed: 1.0,
        ttsModel: 'tts-1',
        autoPlayTTS: true,
        preloadNext: false,
      },

      // Start a new visualization session
      startSession: (visualizationId: string) => {
        const sessionId = `${visualizationId}-${Date.now()}`;
        set({
          currentSession: {
            id: sessionId,
            visualizationId,
            startedAt: new Date().toISOString(),
            currentStep: 0,
            completed: false,
            duration: 0,
          },
          isPaused: false,
          sessionStartTime: Date.now(),
        });
      },

      // Pause current session
      pauseSession: () => {
        const { currentSession, sessionStartTime } = get();
        if (currentSession && sessionStartTime && !get().isPaused) {
          const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
          set({
            currentSession: {
              ...currentSession,
              duration: currentSession.duration + elapsed,
            },
            isPaused: true,
            sessionStartTime: null,
          });
        }
      },

      // Resume paused session
      resumeSession: () => {
        const { isPaused } = get();
        if (isPaused) {
          set({
            isPaused: false,
            sessionStartTime: Date.now(),
          });
        }
      },

      // Move to next step
      nextStep: () => {
        const { currentSession } = get();
        if (currentSession) {
          set({
            currentSession: {
              ...currentSession,
              currentStep: currentSession.currentStep + 1,
            },
          });
        }
      },

      // Move to previous step
      previousStep: () => {
        const { currentSession } = get();
        if (currentSession && currentSession.currentStep > 0) {
          set({
            currentSession: {
              ...currentSession,
              currentStep: currentSession.currentStep - 1,
            },
          });
        }
      },

      // Complete current session
      completeSession: () => {
        const { currentSession, sessionStartTime, completedSessions } = get();
        if (currentSession) {
          const finalDuration = sessionStartTime 
            ? currentSession.duration + Math.floor((Date.now() - sessionStartTime) / 1000)
            : currentSession.duration;

          const completedSession: VisualizationSession = {
            ...currentSession,
            completedAt: new Date().toISOString(),
            completed: true,
            duration: finalDuration,
          };

          // Get visualization details
          const visualization = getVisualizationById(currentSession.visualizationId);

          // Create a session log for the main session store
          if (visualization) {
            // Import the session store
            const useSessionStore = require('./session-store').useSessionStore;
            const sessionStore = useSessionStore.getState();
            
            const sessionLog: SessionLog = {
              id: `viz-${Date.now()}`,
              date: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              sessionType: 'visualization',
              activity: 'Mental Training',
              visualizationId: visualization.id,
              visualizationTitle: visualization.title,
              duration: finalDuration,
              status: 'completed',
              notes: `Completed "${visualization.title}" visualization`
            };

            // Add to main session logs
            sessionStore.addLog(sessionLog);
          }

          set({
            completedSessions: [...completedSessions, completedSession],
            currentSession: null,
            isPaused: false,
            sessionStartTime: null,
          });
        }
      },

      // Abandon current session
      abandonSession: () => {
        set({
          currentSession: null,
          isPaused: false,
          sessionStartTime: null,
        });
      },

      // Update user preferences
      updatePreferences: (prefs: Partial<VisualizationPreferences>) => {
        const { preferences } = get();
        set({
          preferences: {
            ...preferences,
            ...prefs,
          },
        });
      },

      // Get stats for a specific visualization
      getVisualizationStats: (visualizationId: string): VisualizationStats => {
        const { completedSessions } = get();
        const sessions = completedSessions.filter(s => s.visualizationId === visualizationId);
        
        if (sessions.length === 0) {
          return {
            visualizationId,
            completionCount: 0,
            totalDuration: 0,
            averageDuration: 0,
          };
        }

        const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
        const lastSession = sessions[sessions.length - 1];

        return {
          visualizationId,
          completionCount: sessions.length,
          totalDuration,
          lastCompletedAt: lastSession.completedAt,
          averageDuration: Math.floor(totalDuration / sessions.length),
        };
      },

      // Get total visualization time across all sessions
      getTotalVisualizationTime: (): number => {
        const { completedSessions } = get();
        return completedSessions.reduce((sum, s) => sum + s.duration, 0);
      },

      // Get streak days (consecutive days with at least one visualization)
      getStreakDays: (): number => {
        const { completedSessions } = get();
        if (completedSessions.length === 0) return 0;

        // Sort sessions by date
        const sortedSessions = [...completedSessions].sort((a, b) => 
          new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
        );

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        // Check if there's a session today
        const todaySession = sortedSessions.find(s => {
          const sessionDate = new Date(s.completedAt!);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate.getTime() === currentDate.getTime();
        });

        if (!todaySession) {
          // Check if there was a session yesterday
          currentDate.setDate(currentDate.getDate() - 1);
          const yesterdaySession = sortedSessions.find(s => {
            const sessionDate = new Date(s.completedAt!);
            sessionDate.setHours(0, 0, 0, 0);
            return sessionDate.getTime() === currentDate.getTime();
          });
          
          if (!yesterdaySession) return 0;
        }

        // Count consecutive days
        for (let i = 0; i < 365; i++) {
          const hasSession = sortedSessions.some(s => {
            const sessionDate = new Date(s.completedAt!);
            sessionDate.setHours(0, 0, 0, 0);
            return sessionDate.getTime() === currentDate.getTime();
          });

          if (hasSession) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }

        return streak;
      },
    }),
    {
      name: 'visualization-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        completedSessions: state.completedSessions,
        preferences: state.preferences,
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration from version 0 to 1
          // Add new TTS preferences if they don't exist
          return {
            ...persistedState,
            preferences: {
              ...persistedState.preferences,
              ttsEnabled: persistedState.preferences?.ttsEnabled ?? true,
              ttsVoice: persistedState.preferences?.ttsVoice ?? 'nova',
              ttsSpeed: persistedState.preferences?.ttsSpeed ?? 1.0,
              ttsModel: persistedState.preferences?.ttsModel ?? 'tts-1',
              autoPlayTTS: persistedState.preferences?.autoPlayTTS ?? true,
              preloadNext: persistedState.preferences?.preloadNext ?? false,
            },
          };
        }
        return persistedState;
      },
    }
  )
);