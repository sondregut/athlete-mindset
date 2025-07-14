import { getAllVisualizations } from '@/constants/visualizations';
import { PersonalizationProfile } from '@/types/personalization-profile';
import { OpenAIPersonalizationService } from './openai-personalization-service';
import { TTSFirebaseCache } from './tts-firebase-cache';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const PRELOAD_STATUS_KEY = 'personalization_preload_status';
const PRELOADED_CONTENT_PREFIX = 'personalized_content_';

interface PreloadStatus {
  profileHash: string;
  completedAt: string;
  visualizationCount: number;
  totalSteps: number;
}

interface PreloadedContent {
  visualizationId: string;
  steps: Array<{
    title: string;
    content: string;
    duration: number;
  }>;
  generatedAt: string;
  profileHash: string;
}

export class PersonalizationPreloader {
  private static instance: PersonalizationPreloader;
  private personalizationService: OpenAIPersonalizationService;
  private ttsService: TTSFirebaseCache;
  private isPreloading = false;
  private onProgressCallback?: (progress: number, message: string) => void;

  private constructor() {
    this.personalizationService = OpenAIPersonalizationService.getInstance();
    this.ttsService = TTSFirebaseCache.getInstance();
  }

  static getInstance(): PersonalizationPreloader {
    if (!PersonalizationPreloader.instance) {
      PersonalizationPreloader.instance = new PersonalizationPreloader();
    }
    return PersonalizationPreloader.instance;
  }

  /**
   * Generate a hash of the user profile to detect when it changes
   */
  private async generateProfileHash(profile: PersonalizationProfile): Promise<string> {
    const profileString = JSON.stringify({
      sport: profile.sport_activity,
      trackFieldEvent: profile.specific_role,
      experienceLevel: profile.experience_level,
      primaryFocus: profile.preferred_style,
      goals: profile.primary_goals,
    });
    
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      profileString,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    
    return hash;
  }

  /**
   * Check if content needs to be regenerated based on profile changes
   */
  async needsRegeneration(profile: PersonalizationProfile): Promise<boolean> {
    try {
      const currentHash = await this.generateProfileHash(profile);
      const statusStr = await AsyncStorage.getItem(PRELOAD_STATUS_KEY);
      
      if (!statusStr) return true;
      
      const status: PreloadStatus = JSON.parse(statusStr);
      return status.profileHash !== currentHash;
    } catch (error) {
      console.error('Error checking regeneration status:', error);
      return true;
    }
  }

  /**
   * Get preloaded content for a specific visualization
   */
  async getPreloadedContent(visualizationId: string): Promise<PreloadedContent | null> {
    try {
      const key = `${PRELOADED_CONTENT_PREFIX}${visualizationId}`;
      const contentStr = await AsyncStorage.getItem(key);
      
      if (!contentStr) return null;
      
      return JSON.parse(contentStr);
    } catch (error) {
      console.error('Error getting preloaded content:', error);
      return null;
    }
  }

  /**
   * Clear all preloaded content
   */
  async clearAllContent(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const preloadKeys = keys.filter(key => key.startsWith(PRELOADED_CONTENT_PREFIX));
      
      if (preloadKeys.length > 0) {
        await AsyncStorage.multiRemove(preloadKeys);
      }
      
      await AsyncStorage.removeItem(PRELOAD_STATUS_KEY);
      console.log(`Cleared ${preloadKeys.length} preloaded content items`);
    } catch (error) {
      console.error('Error clearing preloaded content:', error);
    }
  }

  /**
   * Preload all personalized content for a user profile
   */
  async preloadAllContent(
    profile: PersonalizationProfile,
    onProgress?: (progress: number, message: string) => void
  ): Promise<void> {
    if (this.isPreloading) {
      console.warn('Preloading already in progress');
      return;
    }

    this.isPreloading = true;
    this.onProgressCallback = onProgress;

    try {
      const profileHash = await this.generateProfileHash(profile);
      const visualizations = getAllVisualizations();
      const totalVisualizations = visualizations.length;
      let completedVisualizations = 0;
      let totalSteps = 0;

      console.log(`Starting preload for ${totalVisualizations} visualizations`);
      this.reportProgress(0, `Starting personalization for ${totalVisualizations} visualizations...`);

      for (const visualization of visualizations) {
        try {
          // Generate personalized content
          this.reportProgress(
            (completedVisualizations / totalVisualizations) * 0.5,
            `Personalizing "${visualization.title}"...`
          );

          const personalizedSteps = await this.personalizationService.generatePersonalizedVisualizationFromProfile(
            visualization,
            profile
          );

          // Save personalized content
          const preloadedContent: PreloadedContent = {
            visualizationId: visualization.id,
            steps: personalizedSteps,
            generatedAt: new Date().toISOString(),
            profileHash,
          };

          await AsyncStorage.setItem(
            `${PRELOADED_CONTENT_PREFIX}${visualization.id}`,
            JSON.stringify(preloadedContent)
          );

          totalSteps += personalizedSteps.length;

          // Generate TTS audio for each step
          const audioProgress = 0.5 + (completedVisualizations / totalVisualizations) * 0.5;
          
          for (let stepIndex = 0; stepIndex < personalizedSteps.length; stepIndex++) {
            const step = personalizedSteps[stepIndex];
            
            this.reportProgress(
              audioProgress,
              `Generating audio for "${visualization.title}" (${stepIndex + 1}/${personalizedSteps.length})...`
            );

            try {
              // This will cache the audio automatically
              await this.ttsService.synthesizeSpeech(step.content, {
                voice: 'nova', // Default voice, user can change later
                model: 'tts-1',
                speed: 1.0,
              });
            } catch (audioError) {
              console.error(`Failed to generate audio for step ${stepIndex}:`, audioError);
              // Continue with other steps even if one fails
            }
          }

          completedVisualizations++;
          console.log(`Completed ${visualization.id} (${completedVisualizations}/${totalVisualizations})`);
          
        } catch (error) {
          console.error(`Failed to preload visualization ${visualization.id}:`, error);
          // Continue with other visualizations
        }
      }

      // Save preload status
      const status: PreloadStatus = {
        profileHash,
        completedAt: new Date().toISOString(),
        visualizationCount: completedVisualizations,
        totalSteps,
      };

      await AsyncStorage.setItem(PRELOAD_STATUS_KEY, JSON.stringify(status));

      this.reportProgress(
        100,
        `Completed! Personalized ${completedVisualizations} visualizations with ${totalSteps} total steps.`
      );

      console.log(`Preloading completed: ${completedVisualizations}/${totalVisualizations} visualizations`);

    } catch (error) {
      console.error('Error during preloading:', error);
      throw error;
    } finally {
      this.isPreloading = false;
      this.onProgressCallback = undefined;
    }
  }

  /**
   * Get the current preload status
   */
  async getPreloadStatus(): Promise<PreloadStatus | null> {
    try {
      const statusStr = await AsyncStorage.getItem(PRELOAD_STATUS_KEY);
      return statusStr ? JSON.parse(statusStr) : null;
    } catch (error) {
      console.error('Error getting preload status:', error);
      return null;
    }
  }

  /**
   * Check if preloading is currently in progress
   */
  isPreloadingInProgress(): boolean {
    return this.isPreloading;
  }

  private reportProgress(progress: number, message: string) {
    if (this.onProgressCallback) {
      this.onProgressCallback(progress, message);
    }
  }
}