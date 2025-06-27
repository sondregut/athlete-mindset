import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseMindset } from '@/services/firebase-mindset';
import { firebaseAuth } from '@/services/firebase-auth';

export interface BodyPainArea {
  location: string; // e.g., "head", "neck", "lower-back", "left-shoulder"
  severity: 'minor' | 'moderate' | 'significant';
}

export interface MindsetCheckin {
  id: string;
  date: string; // YYYY-MM-DD format
  mood: number; // 1-10 scale
  energy: number; // 1-10 scale
  motivation: number; // 1-10 scale
  selfDescription?: string; // Max 150 characters
  painDescription?: string; // Max 200 characters
  // Legacy fields for backward compatibility
  bodyPainAreas?: BodyPainArea[];
  overallPainLevel?: 'none' | 'minor' | 'moderate' | 'significant';
  gratitude?: string;
  reflection?: string;
  tags?: string[]; // e.g., ["stressed", "excited", "focused"]
  createdAt: string;
}

interface MindsetState {
  checkins: MindsetCheckin[];
  todaysCheckin: MindsetCheckin | null;
  
  // Loading states
  isSubmittingCheckin: boolean;
  isLoadingCheckins: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  submitCheckin: (checkin: Omit<MindsetCheckin, 'id' | 'date' | 'createdAt'>) => Promise<void>;
  updateCheckin: (id: string, updates: Partial<Omit<MindsetCheckin, 'id' | 'date' | 'createdAt'>>) => Promise<void>;
  getTodaysCheckin: () => MindsetCheckin | null;
  getCheckinStreak: () => number;
  getRecentCheckins: (days: number) => MindsetCheckin[];
  getAverageScores: (days: number) => { mood: number; energy: number; motivation: number };
  deleteCheckin: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
  syncWithFirebase: () => Promise<void>;
  getCheckinById: (id: string) => MindsetCheckin | undefined;
}

const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

export const useMindsetStore = create<MindsetState>()(
  persist(
    (set, get) => ({
      checkins: [],
      todaysCheckin: null,
      
      // Loading states
      isSubmittingCheckin: false,
      isLoadingCheckins: false,
      
      // Error state
      error: null,
      
      submitCheckin: async (checkinData) => {
        set({ isSubmittingCheckin: true, error: null });
        
        try {
          const today = getTodayDateString();
          const state = get();
          
          // Check if there's already a check-in for today
          const existingCheckin = state.checkins.find(c => c.date === today);
          
          const checkin: MindsetCheckin = {
            id: existingCheckin?.id || `checkin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            date: today,
            createdAt: existingCheckin?.createdAt || new Date().toISOString(),
            ...checkinData,
            // Ensure selfDescription doesn't exceed 150 characters
            selfDescription: checkinData.selfDescription ? checkinData.selfDescription.slice(0, 150) : undefined,
          };
          
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 300));
          
          let updatedCheckins;
          if (existingCheckin) {
            // Update existing check-in
            updatedCheckins = state.checkins.map(c => 
              c.id === existingCheckin.id ? checkin : c
            );
          } else {
            // Add new check-in
            updatedCheckins = [...state.checkins, checkin];
          }
          
          set({ 
            checkins: updatedCheckins,
            todaysCheckin: checkin,
          });
          
          // Sync with Firebase if user is authenticated
          const user = firebaseAuth.getCurrentUser();
          if (user) {
            firebaseMindset.submitCheckin(checkin).catch(error => {
              console.error('Failed to sync checkin to Firebase:', error);
              // Don't throw - allow offline functionality
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to submit check-in';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isSubmittingCheckin: false });
        }
      },
      
      updateCheckin: async (id, updates) => {
        set({ isSubmittingCheckin: true, error: null });
        
        try {
          const state = get();
          const checkinToUpdate = state.checkins.find(c => c.id === id);
          
          if (!checkinToUpdate) {
            throw new Error('Check-in not found');
          }
          
          const updatedCheckin: MindsetCheckin = {
            ...checkinToUpdate,
            ...updates,
            // Ensure selfDescription doesn't exceed 150 characters
            selfDescription: updates.selfDescription !== undefined 
              ? updates.selfDescription.slice(0, 150) 
              : checkinToUpdate.selfDescription,
          };
          
          const updatedCheckins = state.checkins.map(c => 
            c.id === id ? updatedCheckin : c
          );
          
          set({ 
            checkins: updatedCheckins,
            todaysCheckin: state.todaysCheckin?.id === id ? updatedCheckin : state.todaysCheckin,
          });
          
          // Sync with Firebase if user is authenticated
          const user = firebaseAuth.getCurrentUser();
          if (user) {
            firebaseMindset.submitCheckin(updatedCheckin).catch(error => {
              console.error('Failed to sync updated checkin to Firebase:', error);
              // Don't throw - allow offline functionality
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update check-in';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isSubmittingCheckin: false });
        }
      },
      
      getTodaysCheckin: () => {
        const today = getTodayDateString();
        const state = get();
        const todaysCheckin = state.checkins.find(c => c.date === today) || null;
        
        // Update todaysCheckin in state if it's different
        if (state.todaysCheckin?.id !== todaysCheckin?.id) {
          set({ todaysCheckin });
        }
        
        return todaysCheckin;
      },
      
      getCheckinStreak: () => {
        const state = get();
        const sortedCheckins = [...state.checkins].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        if (sortedCheckins.length === 0) return 0;
        
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < sortedCheckins.length; i++) {
          const checkinDate = new Date(sortedCheckins[i].date);
          const expectedDate = new Date(today);
          expectedDate.setDate(today.getDate() - i);
          
          // Check if the check-in is for the expected date (allowing for same day)
          if (checkinDate.toDateString() === expectedDate.toDateString()) {
            streak++;
          } else {
            break;
          }
        }
        
        return streak;
      },
      
      getRecentCheckins: (days) => {
        const state = get();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return state.checkins
          .filter(c => new Date(c.date) >= cutoffDate)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },
      
      getAverageScores: (days) => {
        const recentCheckins = get().getRecentCheckins(days);
        
        if (recentCheckins.length === 0) {
          return { mood: 0, energy: 0, motivation: 0 };
        }
        
        const totals = recentCheckins.reduce(
          (acc, checkin) => ({
            mood: acc.mood + checkin.mood,
            energy: acc.energy + checkin.energy,
            motivation: acc.motivation + checkin.motivation,
          }),
          { mood: 0, energy: 0, motivation: 0 }
        );
        
        return {
          mood: Math.round((totals.mood / recentCheckins.length) * 10) / 10,
          energy: Math.round((totals.energy / recentCheckins.length) * 10) / 10,
          motivation: Math.round((totals.motivation / recentCheckins.length) * 10) / 10,
        };
      },
      
      deleteCheckin: async (id) => {
        set({ isLoadingCheckins: true, error: null });
        
        try {
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const state = get();
          const updatedCheckins = state.checkins.filter(c => c.id !== id);
          
          set({ 
            checkins: updatedCheckins,
            todaysCheckin: state.todaysCheckin?.id === id ? null : state.todaysCheckin,
          });
          
          // Sync with Firebase if user is authenticated
          const user = firebaseAuth.getCurrentUser();
          if (user) {
            const checkinToDelete = state.checkins.find(c => c.id === id);
            if (checkinToDelete) {
              firebaseMindset.deleteCheckin(checkinToDelete.date).catch(error => {
                console.error('Failed to delete checkin from Firebase:', error);
                // Don't throw - allow offline functionality
              });
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete check-in';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoadingCheckins: false });
        }
      },
      
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      
      getCheckinById: (id) => {
        return get().checkins.find(c => c.id === id);
      },
      
      // Sync with Firebase
      syncWithFirebase: async () => {
        const user = firebaseAuth.getCurrentUser();
        if (!user) return;
        
        try {
          // Add a small delay to ensure user document is created
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Set up real-time listener for Firebase changes
          firebaseMindset.onCheckinsChange((firebaseCheckins) => {
            // Merge Firebase data with local data
            set((state) => {
              const localIds = new Set(state.checkins.map(c => c.date)); // Using date as unique identifier
              const firebaseIds = new Set(firebaseCheckins.map(c => c.date));
              
              // Keep local check-ins that aren't in Firebase (offline created)
              const offlineCheckins = state.checkins.filter(c => !firebaseIds.has(c.date));
              
              // Merge and sort by date
              const mergedCheckins = [...firebaseCheckins, ...offlineCheckins]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              
              // Update today's checkin if needed
              const today = getTodayDateString();
              const todaysCheckin = mergedCheckins.find(c => c.date === today) || null;
              
              return { 
                checkins: mergedCheckins,
                todaysCheckin
              };
            });
          });
        } catch (error) {
          console.error('Failed to set up Firebase sync:', error);
        }
      },
    }),
    {
      name: 'mindset-checkin-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const mindsetTags = [
  'focused', 'energized', 'confident', 'relaxed', 'motivated',
  'stressed', 'tired', 'anxious', 'excited', 'determined',
  'grateful', 'optimistic', 'challenged', 'peaceful', 'inspired'
];