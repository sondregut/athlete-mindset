import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STREAK_MILESTONES, Milestone } from '@/constants/milestones';

export interface Achievement {
  milestoneId: string;
  unlockedAt: string; // ISO date string
  streak: number;
  celebrated: boolean; // Whether the user has seen the celebration
}

interface AchievementState {
  achievements: Achievement[];
  lastCheckedStreak: number;
  
  // Actions
  checkAndUnlockMilestone: (currentStreak: number) => Milestone | null;
  getUnlockedAchievements: () => Achievement[];
  hasUnlockedMilestone: (milestoneId: string) => boolean;
  markMilestoneCelebrated: (milestoneId: string) => void;
  getAchievementByMilestoneId: (milestoneId: string) => Achievement | undefined;
  resetAchievements: () => void; // For development
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      achievements: [],
      lastCheckedStreak: 0,
      
      checkAndUnlockMilestone: (currentStreak: number) => {
        const state = get();
        
        // Don't check if streak decreased or stayed the same
        if (currentStreak <= state.lastCheckedStreak) {
          set({ lastCheckedStreak: currentStreak });
          return null;
        }
        
        // Find milestones that should be unlocked
        let newlyUnlockedMilestone: Milestone | null = null;
        
        for (const milestone of STREAK_MILESTONES) {
          const isAlreadyUnlocked = state.hasUnlockedMilestone(milestone.id);
          const shouldUnlock = currentStreak >= milestone.threshold;
          
          if (!isAlreadyUnlocked && shouldUnlock) {
            // Unlock this milestone
            const newAchievement: Achievement = {
              milestoneId: milestone.id,
              unlockedAt: new Date().toISOString(),
              streak: currentStreak,
              celebrated: false,
            };
            
            set((state) => ({
              achievements: [...state.achievements, newAchievement],
              lastCheckedStreak: currentStreak,
            }));
            
            // Return the first newly unlocked milestone for celebration
            if (!newlyUnlockedMilestone) {
              newlyUnlockedMilestone = milestone;
            }
          }
        }
        
        // Update last checked streak even if no new milestone
        if (!newlyUnlockedMilestone) {
          set({ lastCheckedStreak: currentStreak });
        }
        
        return newlyUnlockedMilestone;
      },
      
      getUnlockedAchievements: () => {
        return get().achievements;
      },
      
      hasUnlockedMilestone: (milestoneId: string) => {
        return get().achievements.some(a => a.milestoneId === milestoneId);
      },
      
      markMilestoneCelebrated: (milestoneId: string) => {
        set((state) => ({
          achievements: state.achievements.map(a =>
            a.milestoneId === milestoneId 
              ? { ...a, celebrated: true }
              : a
          ),
        }));
      },
      
      getAchievementByMilestoneId: (milestoneId: string) => {
        return get().achievements.find(a => a.milestoneId === milestoneId);
      },
      
      resetAchievements: () => {
        set({ 
          achievements: [],
          lastCheckedStreak: 0,
        });
      },
    }),
    {
      name: 'athlete-achievement-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);