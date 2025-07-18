import { useState, useEffect, useCallback, useRef } from 'react';
import { usePersonalizationStore } from '@/store/personalization-store';
import { usePersonalizationProfile } from './usePersonalizationProfile';
import { OpenAIPersonalizationService } from '@/services/openai-personalization-service';
import { TTSFirebaseCache } from '@/services/tts-firebase-cache';
import { Visualization, VisualizationStep } from '@/types/visualization';
import { PersonalizationRequest, ContextualFactors } from '@/types/personalization';

interface UsePersonalizedVisualizationOptions {
  contextualFactors?: ContextualFactors;
  forceRegenerate?: boolean;
}

interface UsePersonalizedVisualizationResult {
  personalizedSteps: VisualizationStep[] | null;
  isGenerating: boolean;
  error: string | null;
  regenerate: () => Promise<void>;
  stats: any;
  preloadTTS: (voices?: string[]) => Promise<void>;
  isPreloadingTTS: boolean;
}

export function usePersonalizedVisualization(
  visualization: Visualization,
  options: UsePersonalizedVisualizationOptions = {}
): UsePersonalizedVisualizationResult {
  const { profile: personalizationProfile, isLoading: isProfileLoading } = usePersonalizationProfile();
  const { preferences, recordPersonalization } = usePersonalizationStore();
  const [personalizedSteps, setPersonalizedSteps] = useState<VisualizationStep[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isPreloadingTTS, setIsPreloadingTTS] = useState(false);
  
  // Add refs to prevent duplicate generations
  const isGeneratingRef = useRef(false);
  const lastGeneratedProfileRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

  const generatePersonalization = useCallback(async () => {
    console.log('[usePersonalizedVisualization] generatePersonalization called', {
      isGeneratingRef: isGeneratingRef.current,
      isProfileLoading,
      hasProfile: !!personalizationProfile,
      profileEnabled: personalizationProfile?.is_personalization_enabled,
      preferencesEnabled: preferences.enabled && preferences.autoPersonalize
    });
    
    // Prevent concurrent generations
    if (isGeneratingRef.current) {
      console.log('[usePersonalizedVisualization] Generation already in progress, skipping');
      return;
    }
    
    // Create a profile key to track changes
    const profileKey = personalizationProfile ? 
      `${personalizationProfile.sport_activity}-${personalizationProfile.experience_level}-${personalizationProfile.primary_goals?.join(',')}` : 
      null;
    
    // Skip if we've already generated for this profile
    if (!options.forceRegenerate && profileKey && profileKey === lastGeneratedProfileRef.current) {
      console.log('[usePersonalizedVisualization] Already generated for this profile, skipping');
      return;
    }
    
    // Check if personalization is enabled and profile exists
    if (!personalizationProfile) {
      console.log('[usePersonalizedVisualization] No profile loaded yet - waiting for profile');
      return;
    }
    
    if (!personalizationProfile.is_personalization_enabled) {
      console.log('[usePersonalizedVisualization] Personalization disabled by user - using original content');
      console.log('[usePersonalizedVisualization] Profile state:', {
        sport: personalizationProfile.sport_activity,
        enabled: personalizationProfile.is_personalization_enabled
      });
      return;
    }

    if (!preferences.enabled || !preferences.autoPersonalize) {
      console.log('[usePersonalizedVisualization] Personalization preferences disabled - using original content');
      console.log('[usePersonalizedVisualization] Preferences:', {
        enabled: preferences.enabled,
        autoPersonalize: preferences.autoPersonalize
      });
      return;
    }

    isGeneratingRef.current = true;
    setIsGenerating(true);
    setError(null);

    try {
      // Generate personalized content using OpenAI
      console.log('[usePersonalizedVisualization] Generating personalized content for sport:', personalizationProfile.sport_activity);
      
      // Build user context from personalization profile
      const userContext = {
        sport: personalizationProfile.sport_activity as any, // Sport is a string in personalization profile
        trackFieldEvent: personalizationProfile.specific_role as any,
        experienceLevel: personalizationProfile.experience_level as any,
        primaryFocus: personalizationProfile.primary_goals?.[0] as any, // Use first goal as primary focus
        goals: personalizationProfile.primary_goals?.join(', '),
        ageRange: undefined, // Not collected in personalization
        recentSessionCount: undefined,
        currentStreak: undefined,
      };

      // Build personalization request
      const request: PersonalizationRequest = {
        userContext,
        visualizationId: visualization.id,
        visualizationTitle: visualization.title,
        visualizationCategory: visualization.category,
        baseContent: visualization.steps.map(step => step.content),
        contextualFactors: options.contextualFactors,
        tone: preferences.preferredTone,
        length: preferences.contentLength,
      };

      // Use the new OpenAI Personalization Service
      const aiService = OpenAIPersonalizationService.getInstance();
      const personalizedContent = await aiService.generatePersonalizedVisualization(request);
      console.log('[usePersonalizedVisualization] Generated content using OpenAI Service');

      // Convert to visualization steps
      const steps: VisualizationStep[] = personalizedContent.steps.map((step, index) => ({
        id: index + 1,
        content: step.content,
        duration: step.duration,
        // Preserve any audio files from original steps
        audioFile: visualization.steps[index]?.audioFile,
        audioUrl: visualization.steps[index]?.audioUrl,
      }));

      setPersonalizedSteps(steps);
      recordPersonalization();
      lastGeneratedProfileRef.current = profileKey;

      // Get stats from the AI service
      const serviceStats = aiService.getStats();
      setStats(serviceStats);

      console.log('[usePersonalizedVisualization] Generated personalized content:', {
        visualizationId: visualization.id,
        stepCount: steps.length,
        cacheKey: personalizedContent.cacheKey,
        sport: personalizationProfile.sport_activity,
        firstStepPreview: steps[0]?.content.substring(0, 100) + '...'
      });
      
    } catch (err: any) {
      console.error('[usePersonalizedVisualization] Error:', err);
      setError(err.message || 'Failed to generate personalized content');
      
      // Fall back to original content
      if (preferences.cachePersonalizedContent && visualization.personalizedSteps) {
        setPersonalizedSteps(visualization.personalizedSteps);
      }
    } finally {
      setIsGenerating(false);
      isGeneratingRef.current = false;
    }
  }, [
    visualization,
    personalizationProfile,
    preferences,
    options.contextualFactors,
    options.forceRegenerate,
    recordPersonalization,
  ]);

  // Generate on mount or when dependencies change
  useEffect(() => {
    // Wait for profile to load before attempting personalization
    if (personalizationProfile && preferences.enabled && preferences.autoPersonalize && !hasInitializedRef.current) {
      console.log('[usePersonalizedVisualization] Profile loaded, generating personalization for:', {
        sport: personalizationProfile.sport_activity,
        enabled: personalizationProfile.is_personalization_enabled
      });
      hasInitializedRef.current = true;
      generatePersonalization();
    }
  }, [personalizationProfile, preferences.enabled, preferences.autoPersonalize, generatePersonalization]);

  const regenerate = useCallback(async () => {
    await generatePersonalization();
  }, [generatePersonalization]);

  const preloadTTS = useCallback(async (voices: string[] = ['nova']) => {
    console.log('[usePersonalizedVisualization] preloadTTS called', {
      hasPersonalizedSteps: !!personalizedSteps,
      hasProfile: !!personalizationProfile,
      voices
    });
    
    if (!personalizedSteps || !personalizationProfile) {
      console.log('[usePersonalizedVisualization] No personalized steps or profile - cannot preload TTS');
      return;
    }
    
    setIsPreloadingTTS(true);
    
    try {
      const ttsCache = TTSFirebaseCache.getInstance();
      
      // Convert personalized steps to format expected by TTS cache
      const stepsForTTS = personalizedSteps.map(step => ({
        id: step.id,
        content: step.content
      }));
      
      const personalizationContext = {
        sport: personalizationProfile.sport_activity,
        experienceLevel: personalizationProfile.experience_level,
        primaryFocus: personalizationProfile.primary_goals?.[0]
      };
      
      console.log('[usePersonalizedVisualization] Starting TTS preload for:', personalizationContext);
      
      // Preload TTS for all requested voices
      const preloadedAudio = await ttsCache.preloadPersonalizedVisualization(
        stepsForTTS,
        personalizationContext,
        voices as any[], // Type assertion since we know these are valid voices
        {
          model: 'eleven_multilingual_v2',
          speed: 1.0
        },
        (progress) => {
          console.log(`[usePersonalizedVisualization] TTS preload progress: ${progress}%`);
        }
      );
      
      console.log('[usePersonalizedVisualization] TTS preload complete', {
        voiceCount: preloadedAudio.size,
        stepsPerVoice: preloadedAudio.get(voices[0])?.size || 0
      });
      
    } catch (error: any) {
      console.error('[usePersonalizedVisualization] TTS preload error:', error);
      setError(error.message || 'Failed to preload TTS audio');
    } finally {
      setIsPreloadingTTS(false);
    }
  }, [personalizedSteps, personalizationProfile]);

  return {
    personalizedSteps,
    isGenerating: isGenerating || isProfileLoading, // Consider profile loading as part of generation
    error,
    regenerate,
    stats,
    preloadTTS,
    isPreloadingTTS,
  };
}