import { PersonalizationRequest, PersonalizedContent } from '../types/personalization';
import { getElevenLabsApiKey } from '../config/elevenlabs-config';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '@env';

// Sport-specific context for personalization
interface SportContext {
  sport: string;
  venue: string;
  equipment: string;
  technique: string;
  goal: string;
  environment: string;
}

// OpenAI + ElevenLabs Hybrid Configuration
// Uses OpenAI for content generation and ElevenLabs for voice synthesis

export class ElevenLabsAIPersonalizationService {
  private static instance: ElevenLabsAIPersonalizationService;
  private elevenLabsApiKey: string;
  private openai: OpenAI;
  private cache: Map<string, PersonalizedContent> = new Map();
  private textCache: Map<string, string> = new Map(); // Cache for OpenAI text responses
  
  private constructor() {
    this.elevenLabsApiKey = getElevenLabsApiKey();
    this.openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
  }
  
  static getInstance(): ElevenLabsAIPersonalizationService {
    if (!ElevenLabsAIPersonalizationService.instance) {
      ElevenLabsAIPersonalizationService.instance = new ElevenLabsAIPersonalizationService();
    }
    return ElevenLabsAIPersonalizationService.instance;
  }
  
  async generatePersonalizedVisualization(request: PersonalizationRequest): Promise<PersonalizedContent> {
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`[ElevenLabsAI] Cache hit for ${cacheKey}`);
      return cached;
    }
    
    console.log(`[ElevenLabsAI] Generating personalized content for ${request.visualizationId}`);
    
    try {
      // Get sport context
      const sportContext = this.getSportContext(request.userContext);
      
      // Generate personalized text using OpenAI
      const personalizedText = await this.generatePersonalizedText(request, sportContext);
      
      // Parse response into personalized content
      const personalizedContent = this.parsePersonalizedText(personalizedText, request);
      
      // Cache the result
      this.cache.set(cacheKey, personalizedContent);
      
      console.log(`[ElevenLabsAI] Generated ${personalizedContent.steps.length} personalized steps`);
      
      return personalizedContent;
      
    } catch (error) {
      console.error(`[ElevenLabsAI] Error generating content:`, error);
      throw error;
    }
  }
  
  private getSportContext(userContext: any): SportContext {
    // Map user context to sport-specific details
    const sport = userContext.sport || 'generic';
    const event = userContext.trackFieldEvent || sport;
    
    const sportContexts: Record<string, SportContext> = {
      'generic': {
        sport: 'generic',
        venue: 'performance environment',
        equipment: 'equipment',
        technique: 'technique',
        goal: 'optimal performance',
        environment: 'training environment'
      },
      'pole-vault': {
        sport: 'pole vault',
        venue: 'track and field stadium',
        equipment: 'pole, standards, crossbar',
        technique: 'run-up, plant, swing, clearance',
        goal: 'clearing target height',
        environment: 'runway and landing pit'
      },
      'soccer': {
        sport: 'soccer',
        venue: 'soccer field',
        equipment: 'ball, goal, cleats',
        technique: 'passing, shooting, dribbling',
        goal: 'team success and individual performance',
        environment: 'pitch with teammates'
      },
      'distance-running': {
        sport: 'distance running',
        venue: 'running track or route',
        equipment: 'running shoes',
        technique: 'pacing, form, breathing',
        goal: 'achieving target time and endurance',
        environment: 'track, road, or trail'
      }
    };
    
    return sportContexts[event] || sportContexts['generic'];
  }
  
  private async generatePersonalizedText(request: PersonalizationRequest, sportContext: SportContext): Promise<string> {
    const textCacheKey = this.generateTextCacheKey(request, sportContext);
    
    // Check text cache first
    const cachedText = this.textCache.get(textCacheKey);
    if (cachedText) {
      console.log(`[OpenAI] Text cache hit for ${textCacheKey}`);
      return cachedText;
    }
    
    console.log(`[OpenAI] Generating personalized text for ${sportContext.sport}`);
    
    try {
      const prompt = this.createOpenAIPrompt(request, sportContext);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a sports psychology expert creating personalized mental training visualizations. Your task is to make minimal but impactful changes to visualization scripts for different sports while maintaining the exact structure and flow.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3, // Lower temperature for more consistent, focused responses
      });
      
      const personalizedText = response.choices[0]?.message?.content || '';
      
      // Cache the text response
      this.textCache.set(textCacheKey, personalizedText);
      
      console.log(`[OpenAI] Generated personalized text (${personalizedText.length} chars)`);
      
      return personalizedText;
      
    } catch (error) {
      console.error(`[OpenAI] Error generating personalized text:`, error);
      throw error;
    }
  }
  
  private generateTextCacheKey(request: PersonalizationRequest, sportContext: SportContext): string {
    return `openai-${this.generateCacheKey(request)}-${sportContext.sport}`;
  }
  
  private createOpenAIPrompt(request: PersonalizationRequest, sportContext: SportContext): string {
    return `Please personalize this visualization script for ${sportContext.sport} while keeping 85-90% of the original text unchanged.

SPORT CONTEXT:
- Sport: ${sportContext.sport}
- Venue: ${sportContext.venue}
- Equipment: ${sportContext.equipment}
- Technique: ${sportContext.technique}
- Goal: ${sportContext.goal}
- Environment: ${sportContext.environment}

VISUALIZATION DETAILS:
- Title: ${request.visualizationTitle}
- Category: ${request.visualizationCategory}
- Tone: ${request.tone || 'motivational'}
- Experience Level: ${request.userContext.experienceLevel || 'intermediate'}

ORIGINAL STEPS TO PERSONALIZE:
${request.baseContent.map((step, index) => `${index + 1}. ${step}`).join('\n')}

PERSONALIZATION RULES:
1. Keep 85-90% of the original text unchanged
2. Replace generic terms with sport-specific ones:
   - "performance environment" → "${sportContext.venue}"
   - "your activity" → "${sportContext.sport}"
   - "equipment" → "${sportContext.equipment}"
   - "technique" → specific ${sportContext.technique} terms
3. Maintain the exact same structure, timing, and flow
4. Keep the ${request.tone || 'motivational'} tone throughout
5. Make changes feel natural and seamless
6. Do NOT add or remove content, only replace specific terms
7. Keep the same number of steps (${request.baseContent.length})

Respond with ONLY the ${request.baseContent.length} personalized steps, one per line, numbered 1-${request.baseContent.length}.`;
  }
  
  private parsePersonalizedText(personalizedText: string, request: PersonalizationRequest): PersonalizedContent {
    const steps = personalizedText.split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '')) // Remove numbering
      .map(content => ({
        content,
        duration: this.estimateDuration(content),
        emphasis: 'normal' as const,
        personalizedElements: this.identifyPersonalizedElements(content, request)
      }));
    
    return {
      steps,
      generatedAt: new Date().toISOString(),
      cacheKey: this.generateCacheKey(request),
      model: 'gpt-4',
      promptTokens: 500, // Approximate
      completionTokens: 300 // Approximate
    };
  }
  
  private generateCacheKey(request: PersonalizationRequest): string {
    const keyParts = [
      'elevenlabs-ai',
      request.visualizationId,
      request.userContext.sport || 'generic',
      request.userContext.trackFieldEvent || 'generic',
      request.tone || 'motivational'
    ];
    return keyParts.join('-');
  }
  
  private estimateDuration(content: string): number {
    // Estimate ~1 second per word for visualization
    const wordCount = content.split(' ').length;
    return Math.max(wordCount * 1.2, 10); // Minimum 10 seconds
  }
  
  private identifyPersonalizedElements(content: string, request: PersonalizationRequest): string[] {
    const elements: string[] = [];
    const baseContent = request.baseContent.join(' ').toLowerCase();
    
    // Check for sport-specific terms that weren't in the original
    const sportTerms = ['pole', 'vault', 'runway', 'standards', 'crossbar', 'soccer', 'field', 'ball', 'goal', 'pitch', 'running', 'track', 'route', 'pace'];
    
    sportTerms.forEach(term => {
      if (content.toLowerCase().includes(term) && !baseContent.includes(term)) {
        elements.push(`sport-term: ${term}`);
      }
    });
    
    return elements;
  }
  
  getCacheStats() {
    return {
      contentCacheSize: this.cache.size,
      textCacheSize: this.textCache.size,
      contentCacheEntries: Array.from(this.cache.keys()),
      textCacheEntries: Array.from(this.textCache.keys())
    };
  }
  
  clearCache() {
    this.cache.clear();
    this.textCache.clear();
  }
}

export default ElevenLabsAIPersonalizationService;