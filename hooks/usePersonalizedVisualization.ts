import { useState, useEffect, useCallback } from 'react';
import { usePersonalizationStore } from '@/store/personalization-store';
import { usePersonalizationProfile } from './usePersonalizationProfile';
import { OpenAIPersonalizationService } from '@/services/openai-personalization-service';
import { Visualization, VisualizationStep } from '@/types/visualization';
import { PersonalizationRequest, ContextualFactors } from '@/types/personalization';
import { ExperienceLevel } from '@/types/personalization-profile';

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
}

export function usePersonalizedVisualization(
  visualization: Visualization,
  options: UsePersonalizedVisualizationOptions = {}
): UsePersonalizedVisualizationResult {
  const { profile: personalizationProfile } = usePersonalizationProfile();
  const { preferences, recordPersonalization } = usePersonalizationStore();
  const [personalizedSteps, setPersonalizedSteps] = useState<VisualizationStep[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const generatePersonalization = useCallback(async () => {
    // Check if personalization is enabled and profile exists
    if (!personalizationProfile?.is_personalization_enabled) {
      console.log('[usePersonalizedVisualization] Personalization disabled or no profile');
      return;
    }

    if (!preferences.enabled || !preferences.autoPersonalize) {
      console.log('[usePersonalizedVisualization] Personalization preferences disabled');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const service = OpenAIPersonalizationService.getInstance();
      
      // Build user context from personalization profile
      const userContext = {
        sport: personalizationProfile.sport_activity as any, // Sport is a string in personalization profile
        trackFieldEvent: personalizationProfile.specific_role,
        experienceLevel: personalizationProfile.experience_level as ExperienceLevel,
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

      // Generate personalized content
      const personalizedContent = await service.generatePersonalizedVisualization(request);
      
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
      
      // Get stats
      const serviceStats = service.getStats();
      setStats(serviceStats);
      
      console.log('[usePersonalizedVisualization] Generated personalized content:', {
        visualizationId: visualization.id,
        stepCount: steps.length,
        cacheKey: personalizedContent.cacheKey,
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
    if (preferences.enabled && preferences.autoPersonalize) {
      // Use cached personalized content if available and not forcing regeneration
      if (!options.forceRegenerate && visualization.personalizedSteps) {
        setPersonalizedSteps(visualization.personalizedSteps);
        return;
      }
      
      generatePersonalization();
    }
  }, [generatePersonalization, options.forceRegenerate]);

  const regenerate = useCallback(async () => {
    await generatePersonalization();
  }, [generatePersonalization]);

  return {
    personalizedSteps,
    isGenerating,
    error,
    regenerate,
    stats,
  };
}