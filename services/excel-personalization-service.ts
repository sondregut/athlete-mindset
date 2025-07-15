import {
  PersonalizationRequest,
  PersonalizedContent,
  PersonalizedStep,
  UserContext,
} from '@/types/personalization';
import { PersonalizationProfile } from '@/types/personalization-profile';

interface ExcelPersonalizationData {
  [visualizationId: string]: {
    [stepNumber: string]: {
      template: string;
      [sport: string]: string;
    };
  };
}

export class ExcelPersonalizationService {
  private static instance: ExcelPersonalizationService | null = null;
  private data: ExcelPersonalizationData;
  private stats = {
    totalRequests: 0,
    successfulMatches: 0,
    fallbacks: 0,
  };

  private constructor() {
    // Load pre-parsed personalization data
    try {
      // In production, this would be bundled with the app
      // For now, we'll load it dynamically
      this.data = require('@/data/personalization/parsed/personalization-data.json') as ExcelPersonalizationData;
      console.log('[ExcelPersonalization] Service initialized with', 
        Object.keys(this.data).length, 'visualizations');
    } catch (error) {
      console.warn('[ExcelPersonalization] No personalization data found, using empty data');
      this.data = {};
    }
  }

  static getInstance(): ExcelPersonalizationService {
    if (!this.instance) {
      this.instance = new ExcelPersonalizationService();
    }
    return this.instance;
  }

  async generatePersonalizedVisualization(
    request: PersonalizationRequest
  ): Promise<PersonalizedContent> {
    this.stats.totalRequests++;
    
    try {
      const visualizationData = this.data[request.visualizationId];
      if (!visualizationData) {
        console.log('[ExcelPersonalization] No data found for visualization:', request.visualizationId);
        return this.createFallbackContent(request);
      }

      const sportKey = this.getSportKey(request.userContext);
      const personalizedSteps: PersonalizedStep[] = [];

      // Process each step
      request.baseContent.forEach((baseContent, index) => {
        const stepData = visualizationData[index.toString()];
        
        if (stepData && stepData[sportKey]) {
          // Found personalized content for this sport
          this.stats.successfulMatches++;
          personalizedSteps.push({
            content: stepData[sportKey],
            duration: this.estimateDuration(stepData[sportKey]),
            emphasis: 'normal',
            personalizedElements: this.identifyPersonalizedElements(
              stepData[sportKey],
              baseContent
            ),
          });
        } else {
          // Use template/base content as fallback
          this.stats.fallbacks++;
          personalizedSteps.push({
            content: baseContent,
            duration: this.estimateDuration(baseContent),
            emphasis: 'normal',
            personalizedElements: [],
          });
        }
      });

      return {
        steps: personalizedSteps,
        generatedAt: new Date().toISOString(),
        cacheKey: `excel-${request.visualizationId}-${sportKey}`,
        model: 'excel-local',
      };
    } catch (error) {
      console.error('[ExcelPersonalization] Error generating content:', error);
      return this.createFallbackContent(request);
    }
  }

  private getSportKey(userContext: UserContext): string {
    // Map user context to Excel column names
    if (userContext.trackFieldEvent) {
      // Map track field events to Excel column names
      const eventMapping: Record<string, string> = {
        'sprints-100m': 'sprinting',
        'sprints-200m': 'sprinting',
        'running-all-distances': 'distance_running',
        'high-jump': 'high_jump',
        'pole-vault': 'pole_vault',
        'long-triple-jump': 'horizontal_jumps',
        'throws-all': 'throws',
      };
      
      return eventMapping[userContext.trackFieldEvent] || 'track_field_general';
    }

    if (userContext.sport) {
      // Map sports to Excel column names
      const sportMapping: Record<string, string> = {
        'track-and-field': 'track_field_general',
        'other': 'general_sport',
        'dance': 'dance',
      };

      return sportMapping[userContext.sport] || userContext.sport.toLowerCase().replace(/[\s-]/g, '_');
    }

    return 'general';
  }

  private estimateDuration(content: string): number {
    // Estimate duration based on word count
    const words = content.split(/\s+/).length;
    const minutes = words / 150; // Average speaking rate
    const seconds = Math.ceil(minutes * 60 * 1.2); // 20% padding
    return Math.max(seconds, 10); // Minimum 10 seconds
  }

  private identifyPersonalizedElements(
    personalizedContent: string,
    baseContent: string
  ): string[] {
    // Simple comparison to identify what changed
    const personalizedWords = personalizedContent.toLowerCase().split(/\s+/);
    const baseWords = baseContent.toLowerCase().split(/\s+/);
    const elements: string[] = [];

    personalizedWords.forEach((word, index) => {
      if (baseWords[index] !== word && word.length > 3) {
        elements.push(word);
      }
    });

    return [...new Set(elements)].slice(0, 5); // Return up to 5 unique changes
  }

  private createFallbackContent(request: PersonalizationRequest): PersonalizedContent {
    console.log('[ExcelPersonalization] Using fallback content');
    
    const steps: PersonalizedStep[] = request.baseContent.map(content => ({
      content,
      duration: this.estimateDuration(content),
      emphasis: 'normal',
      personalizedElements: [],
    }));

    return {
      steps,
      generatedAt: new Date().toISOString(),
      cacheKey: 'fallback',
      model: 'fallback',
    };
  }

  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.totalRequests > 0 
        ? (this.stats.successfulMatches / this.stats.totalRequests) * 100 
        : 0,
    };
  }

  // Check if personalization is available for a given sport
  hasPersonalizationFor(visualizationId: string, sport: string): boolean {
    const visualizationData = this.data[visualizationId];
    if (!visualizationData) return false;
    
    const sportKey = sport.toLowerCase().replace(/[\s-]/g, '_');
    return Object.values(visualizationData).some(step => sportKey in step);
  }

  // Get list of supported sports for a visualization
  getSupportedSports(visualizationId: string): string[] {
    const visualizationData = this.data[visualizationId];
    if (!visualizationData) return [];
    
    const sports = new Set<string>();
    Object.values(visualizationData).forEach(step => {
      Object.keys(step).forEach(key => {
        if (key !== 'template') {
          sports.add(key);
        }
      });
    });
    
    return Array.from(sports);
  }

  /**
   * Convenience method to generate personalized visualization from a Visualization object
   */
  async generatePersonalizedVisualizationFromProfile(
    visualization: { id: string; title: string; category: string; steps: Array<{ content: string }> },
    profile: PersonalizationProfile
  ): Promise<Array<{ title: string; content: string; duration: number }>> {
    const request: PersonalizationRequest = {
      userContext: {
        sport: profile.sport_activity as any,
        trackFieldEvent: profile.specific_role as any,
        experienceLevel: profile.experience_level as any,
        primaryFocus: profile.preferred_style as any,
        goals: profile.primary_goals?.join(', '),
      },
      visualizationId: visualization.id,
      visualizationTitle: visualization.title,
      visualizationCategory: visualization.category as any,
      baseContent: visualization.steps.map(step => step.content),
    };
    
    const result = await this.generatePersonalizedVisualization(request);
    
    return result.steps.map((step: PersonalizedStep, index: number) => ({
      title: `Step ${index + 1}`,
      content: step.content,
      duration: step.duration || 30,
    }));
  }
}