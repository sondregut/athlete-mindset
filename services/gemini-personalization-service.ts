import { GeminiCoreService } from './gemini-core-service';
import {
  PersonalizationRequest,
  PersonalizedContent,
  PersonalizedStep,
  UserContext,
} from '@/types/personalization';
import { PersonalizationCache } from './personalization-cache';

// Sport-specific context for better personalization
const SPORT_CONTEXTS: Record<string, any> = {
  'track-and-field': {
    equipment: ['spikes', 'starting blocks', 'track surface', 'field equipment'],
    environments: ['track', 'stadium', 'field', 'indoor track', 'throwing circle'],
    mentalChallenges: ['pre-race nerves', 'maintaining focus', 'explosive starts', 'endurance mindset'],
    movements: ['sprint mechanics', 'jumping technique', 'throwing form', 'pacing strategy'],
  },
  'sprinting': {
    equipment: ['sprint spikes', 'starting blocks', 'track lanes'],
    environments: ['100m track', '200m curve', 'stadium', 'practice track'],
    mentalChallenges: ['explosive power', 'reaction time', 'staying relaxed at speed', 'block starts'],
    movements: ['drive phase', 'acceleration', 'top speed mechanics', 'block clearance'],
  },
  'distance_running': {
    equipment: ['distance spikes', 'racing flats', 'GPS watch'],
    environments: ['track', 'cross country course', 'roads', 'trails'],
    mentalChallenges: ['pacing discipline', 'pain tolerance', 'mental toughness', 'race strategy'],
    movements: ['efficient stride', 'breathing rhythm', 'surge tactics', 'kick finish'],
  },
  'high_jump': {
    equipment: ['high jump spikes', 'landing mat', 'crossbar', 'standards'],
    environments: ['high jump apron', 'field house', 'outdoor field'],
    mentalChallenges: ['approach consistency', 'fearlessness', 'technical focus', 'bar clearance'],
    movements: ['J-curve approach', 'plant step', 'takeoff', 'Fosbury flop', 'arch position'],
  },
  'pole_vault': {
    equipment: ['pole', 'vault spikes', 'landing pit', 'standards', 'crossbar'],
    environments: ['runway', 'vault pit', 'indoor facility'],
    mentalChallenges: ['speed-to-height conversion', 'trust in pole', 'inverted awareness', 'height psychology'],
    movements: ['approach run', 'pole plant', 'swing up', 'inversion', 'push off'],
  },
  'horizontal_jumps': {
    equipment: ['jumping spikes', 'takeoff board', 'sand pit', 'measuring tape'],
    environments: ['runway', 'jumping pit', 'indoor facility'],
    mentalChallenges: ['speed control', 'board accuracy', 'flight focus', 'landing preparation'],
    movements: ['approach rhythm', 'penultimate step', 'takeoff', 'flight technique', 'landing'],
  },
  'throws': {
    equipment: ['shot put', 'discus', 'javelin', 'hammer', 'throwing shoes', 'circle'],
    environments: ['throwing circle', 'sector', 'cage', 'field'],
    mentalChallenges: ['explosive power', 'technical precision', 'rhythm', 'release timing'],
    movements: ['glide', 'spin', 'approach run', 'release', 'follow through'],
  },
  'dance': {
    equipment: ['dance shoes', 'practice wear', 'mirrors', 'barre'],
    environments: ['studio', 'stage', 'rehearsal space', 'performance venue'],
    mentalChallenges: ['artistic expression', 'memorization', 'stage presence', 'perfectionism'],
    movements: ['technique', 'flexibility', 'rhythm', 'choreography', 'performance quality'],
  },
  'general': {
    equipment: ['training gear', 'equipment', 'practice space'],
    environments: ['training facility', 'competition venue', 'practice area'],
    mentalChallenges: ['focus', 'confidence', 'preparation', 'performance'],
    movements: ['technique', 'form', 'execution', 'consistency'],
  },
};

export class GeminiPersonalizationService {
  private static instance: GeminiPersonalizationService | null = null;
  private geminiCore: GeminiCoreService;
  private cache: PersonalizationCache;
  private templates: Map<string, Array<{ stepNumber: number; template: string }>> = new Map();
  private stats = {
    totalRequests: 0,
    cacheHits: 0,
    apiCalls: 0,
    errors: 0,
  };

  private constructor() {
    this.geminiCore = GeminiCoreService.getInstance();
    this.cache = new PersonalizationCache();
    this.loadTemplates();
  }

  static getInstance(): GeminiPersonalizationService {
    if (!this.instance) {
      this.instance = new GeminiPersonalizationService();
    }
    return this.instance;
  }

  private loadTemplates() {
    try {
      // Load pre-extracted templates from JSON
      const templateData = require('@/data/personalization/templates/visualization-templates.json');
      
      for (const [visualizationId, templates] of Object.entries(templateData)) {
        this.templates.set(visualizationId, templates as Array<{ stepNumber: number; template: string }>);
      }

      console.log('[GeminiPersonalization] Loaded templates for', this.templates.size, 'visualizations');
    } catch (error) {
      console.error('[GeminiPersonalization] Error loading templates:', error);
      this.templates = new Map();
    }
  }

  async generatePersonalizedVisualization(
    request: PersonalizationRequest
  ): Promise<PersonalizedContent> {
    this.stats.totalRequests++;

    try {
      // Check cache first
      const cacheKey = await this.cache.generateCacheKey(
        request.userContext,
        request.visualizationId,
        request.contextualFactors
      );

      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.stats.cacheHits++;
        console.log('[GeminiPersonalization] Cache hit for', request.visualizationId);
        return cached;
      }

      // Get templates from loaded data or fall back to base content
      const templates = this.templates.get(request.visualizationId);
      console.log('[GeminiPersonalization] Templates found for', request.visualizationId, ':', !!templates);
      
      const stepsToPersonalize = templates 
        ? templates.map(t => t.template)
        : request.baseContent;

      console.log('[GeminiPersonalization] Steps to personalize:', stepsToPersonalize.length);
      
      if (!stepsToPersonalize || stepsToPersonalize.length === 0) {
        console.error('[GeminiPersonalization] No content available for visualization:', request.visualizationId);
        throw new Error('No content to personalize');
      }

      // Generate personalized content via Gemini
      this.stats.apiCalls++;
      console.log('[GeminiPersonalization] Calling Gemini API for sport:', request.userContext.sport);
      const personalizedSteps = await this.personalizeWithGemini(
        stepsToPersonalize,
        request
      );

      const personalizedContent: PersonalizedContent = {
        steps: personalizedSteps,
        generatedAt: new Date().toISOString(),
        cacheKey,
        model: 'gemini-1.5-pro',
      };

      // Cache the result
      await this.cache.set(cacheKey, personalizedContent, request.userContext);

      return personalizedContent;
    } catch (error) {
      this.stats.errors++;
      console.error('[GeminiPersonalization] Error generating personalized content:', error);
      
      // Fall back to base content
      return this.createFallbackContent(request);
    }
  }

  private async personalizeWithGemini(
    templates: string[],
    request: PersonalizationRequest
  ): Promise<PersonalizedStep[]> {
    const sport = this.formatSportName(request.userContext.sport);
    const trackFieldEvent = request.userContext.trackFieldEvent;
    
    // Build context about the user's sport
    let sportContext = sport;
    let sportDetails = SPORT_CONTEXTS.general;
    
    if (sport === 'Track and Field' && trackFieldEvent) {
      const eventKey = this.mapTrackFieldEventToContext(trackFieldEvent);
      sportContext = `Track and Field (${this.formatTrackFieldEvent(trackFieldEvent)})`;
      sportDetails = SPORT_CONTEXTS[eventKey] || SPORT_CONTEXTS['track-and-field'];
    } else if (sport === 'Dance') {
      sportDetails = SPORT_CONTEXTS.dance;
    } else {
      // Try to find a matching sport context
      const sportKey = sport.toLowerCase().replace(/[\s-]/g, '_');
      sportDetails = SPORT_CONTEXTS[sportKey] || SPORT_CONTEXTS.general;
    }

    const prompt = `You are personalizing a mental training visualization for an athlete.

ATHLETE PROFILE:
- Sport: ${sportContext}
- Experience: Dedicated athlete seeking mental performance improvement

SPORT-SPECIFIC CONTEXT:
- Equipment: ${sportDetails.equipment.join(', ')}
- Environments: ${sportDetails.environments.join(', ')}
- Mental Challenges: ${sportDetails.mentalChallenges.join(', ')}
- Key Movements: ${sportDetails.movements.join(', ')}

VISUALIZATION: ${request.visualizationTitle}
Category: ${request.visualizationCategory}

PERSONALIZATION GUIDELINES:
1. Replace generic references with sport-specific scenarios
2. Use actual equipment names from the sport context above
3. Reference real movements and techniques from their sport
4. Include sport-specific environments listed above
5. Address the mental challenges specific to their sport
6. Maintain the emotional journey and timing of each step
7. Keep language accessible and motivational
8. Ensure smooth transitions between steps

For each template below, create a personalized version that:
- Maintains the same psychological purpose and structure
- Uses concrete, vivid sport-specific imagery
- Keeps similar duration (can vary ±10%)
- Flows naturally from step to step
- Feels authentic to someone who participates in ${sportContext}

Templates to personalize:
${templates.map((t, i) => `Step ${i + 1}: ${t}`).join('\n\n')}

Return a JSON object with an array called "steps", where each step contains:
- "content": the personalized script text
- "duration": suggested duration in seconds (integer)
- "sportElements": array of 2-3 specific sport terms you incorporated`;

    try {
      const model = this.geminiCore.getJSONModel();
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      console.log('[GeminiPersonalization] Raw response:', response.substring(0, 200) + '...');
      
      const parsed = JSON.parse(response);
      console.log('[GeminiPersonalization] Parsed response keys:', Object.keys(parsed));
      
      const steps = parsed.steps || [];
      console.log('[GeminiPersonalization] Found', steps.length, 'steps in response');

      if (steps.length === 0) {
        console.error('[GeminiPersonalization] No steps found in response:', parsed);
        throw new Error('Gemini returned empty steps array');
      }

      return steps.map((step: any, index: number) => ({
        content: step.content || templates[index],
        duration: step.duration || this.estimateDuration(step.content || templates[index]),
        emphasis: 'normal',
        personalizedElements: step.sportElements || [`Adapted for ${sportContext}`],
      }));
    } catch (error) {
      console.error('[GeminiPersonalization] API call failed:', error);
      throw error;
    }
  }

  private formatSportName(sport?: string): string {
    if (!sport) return 'General Athletics';
    
    const sportMap: Record<string, string> = {
      'track-and-field': 'Track and Field',
      'other': 'General Athletics',
    };
    
    return sportMap[sport] || sport;
  }

  private formatTrackFieldEvent(event: string): string {
    const eventMap: Record<string, string> = {
      'sprints-100m': '100m Sprint',
      'sprints-200m': '200m Sprint',
      'running-all-distances': 'Distance Running',
      'high-jump': 'High Jump',
      'pole-vault': 'Pole Vault',
      'long-triple-jump': 'Long Jump/Triple Jump',
      'throws-all': 'Throws',
    };
    
    return eventMap[event] || event;
  }

  private mapTrackFieldEventToContext(event: string): string {
    const contextMap: Record<string, string> = {
      'sprints-100m': 'sprinting',
      'sprints-200m': 'sprinting',
      'running-all-distances': 'distance_running',
      'high-jump': 'high_jump',
      'pole-vault': 'pole_vault',
      'long-triple-jump': 'horizontal_jumps',
      'throws-all': 'throws',
    };
    
    return contextMap[event] || 'track-and-field';
  }

  private estimateDuration(content: string): number {
    // Estimate ~150 words per minute for guided visualization
    const words = content.split(/\s+/).length;
    const minutes = words / 150;
    return Math.round(minutes * 60); // Convert to seconds
  }

  private createFallbackContent(request: PersonalizationRequest): PersonalizedContent {
    // Validate base content exists and is array
    const baseContent = Array.isArray(request.baseContent) ? request.baseContent : [];
    
    if (baseContent.length === 0) {
      console.warn('[GeminiPersonalization] No base content available for fallback');
      // Provide minimal fallback content
      baseContent.push(
        'Take a moment to center yourself and focus on your breathing.',
        'Visualize yourself performing at your best.',
        'Feel the confidence and strength within you.',
        'Carry this positive energy with you as you continue.'
      );
    }
    
    return {
      steps: baseContent.map((content, index) => ({
        content: typeof content === 'string' ? content : 'Continue with your visualization.',
        duration: this.estimateDuration(typeof content === 'string' ? content : ''),
        emphasis: 'normal',
        personalizedElements: [],
      })),
      generatedAt: new Date().toISOString(),
      cacheKey: `fallback-${request.visualizationId}`,
      model: 'fallback',
    };
  }

  getStats() {
    return {
      ...this.stats,
      cacheHitRate: this.stats.totalRequests > 0 
        ? (this.stats.cacheHits / this.stats.totalRequests * 100).toFixed(1) + '%'
        : '0%',
      apiCallRate: this.stats.totalRequests > 0
        ? (this.stats.apiCalls / this.stats.totalRequests * 100).toFixed(1) + '%'
        : '0%',
    };
  }

  async clearCache() {
    await this.cache.clearCache();
    console.log('[GeminiPersonalization] Cache cleared');
  }
}