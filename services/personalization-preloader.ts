import { getAllVisualizations } from '@/constants/visualizations';
import { PersonalizationProfile } from '@/types/personalization-profile';
import { ExcelPersonalizationService } from './excel-personalization-service';
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
  private static isPreloadingGlobally = false; // Global flag to prevent duplicate preloading
  private personalizationService: ExcelPersonalizationService;
  private ttsService: TTSFirebaseCache;
  private isPreloading = false;
  private onProgressCallback?: (progress: number, message: string) => void;

  private constructor() {
    this.personalizationService = ExcelPersonalizationService.getInstance();
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
    const profileData = {
      sport: profile.sport_activity,
      trackFieldEvent: profile.specific_role,
      experienceLevel: profile.experience_level,
      primaryFocus: profile.preferred_style,
      goals: profile.primary_goals,
    };
    
    const profileString = JSON.stringify(profileData);
    console.log('🧮 Generating hash from profile data:', profileData);
    console.log('🧮 Profile string for hashing:', profileString);
    
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
      
      console.log(`🔍 Checking if regeneration needed for profile:`, {
        sport: profile.sport_activity,
        experience: profile.experience_level,
        goals: profile.primary_goals
      });
      console.log(`Current profile hash: ${currentHash}`);
      
      if (!statusStr) {
        console.log('📝 No previous preload status found - regeneration needed');
        return true;
      }
      
      const status: PreloadStatus = JSON.parse(statusStr);
      const hasChanged = status.profileHash !== currentHash;
      
      console.log(`Previous profile hash: ${status.profileHash}`);
      if (hasChanged) {
        console.log('🔄 Profile hash changed - regeneration needed');
        console.log(`Previous status:`, status);
      } else {
        console.log('✅ Profile hash unchanged - no regeneration needed');
      }
      
      return hasChanged;
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
    // Check global flag first
    if (PersonalizationPreloader.isPreloadingGlobally) {
      console.warn('Global preloading already in progress, skipping duplicate request');
      return;
    }
    
    if (this.isPreloading) {
      console.warn('Instance preloading already in progress');
      return;
    }

    // Set both flags
    PersonalizationPreloader.isPreloadingGlobally = true;
    this.isPreloading = true;
    this.onProgressCallback = onProgress;

    try {
      const profileHash = await this.generateProfileHash(profile);
      console.log(`Generated profile hash: ${profileHash}`);
      console.log(`Profile sport: ${profile.sport_activity}, experience: ${profile.experience_level}`);
      
      // Check if regeneration is needed (profile changed)
      const needsRegeneration = await this.needsRegeneration(profile);
      
      if (needsRegeneration) {
        console.log('🔄 Profile changed detected - clearing existing cached content');
        this.reportProgress(0, 'Clearing previous personalized content...');
        await this.clearAllContent();
        console.log('✅ Cache cleared - starting fresh content generation');
      } else {
        console.log('✅ Profile unchanged - existing content is still valid');
        // If no regeneration needed, we can skip the whole process
        this.reportProgress(100, 'Personalized content is up to date');
        // Clear global flag since we're not actually preloading
        PersonalizationPreloader.isPreloadingGlobally = false;
        return;
      }

      const visualizations = getAllVisualizations();
      const totalVisualizations = visualizations.length;
      let completedVisualizations = 0;
      let totalSteps = 0;

      console.log(`Starting preload for ${totalVisualizations} visualizations`);
      this.reportProgress(5, `Starting personalization for ${totalVisualizations} visualizations...`);

      for (const visualization of visualizations) {
        try {
          // Generate personalized content
          this.reportProgress(
            5 + (completedVisualizations / totalVisualizations) * 45,
            `Personalizing "${visualization.title}"...`
          );

          const personalizedSteps = await this.personalizationService.generatePersonalizedVisualizationFromProfile(
            visualization,
            profile
          );
          
          console.log(`Generated personalized content for "${visualization.title}" with sport: ${profile.sport_activity}`);
          console.log(`First step preview: ${personalizedSteps[0]?.content.substring(0, 100)}...`);

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
          const audioProgress = 50 + (completedVisualizations / totalVisualizations) * 45;
          
          for (let stepIndex = 0; stepIndex < personalizedSteps.length; stepIndex++) {
            const step = personalizedSteps[stepIndex];
            
            this.reportProgress(
              audioProgress + (stepIndex / personalizedSteps.length) * 5,
              `Generating audio for "${visualization.title}" (${stepIndex + 1}/${personalizedSteps.length})...`
            );

            try {
              // This will cache the audio automatically
              await this.ttsService.synthesizeSpeech(step.content, {
                voice: '21m00Tcm4TlvDq8ikWAM', // Default Rachel voice, user can change later
                model: 'eleven_multilingual_v2',
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
      // Clear both flags
      this.isPreloading = false;
      PersonalizationPreloader.isPreloadingGlobally = false;
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