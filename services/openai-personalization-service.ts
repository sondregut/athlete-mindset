import {
  PersonalizationRequest,
  PersonalizedContent,
  PersonalizedStep,
  PersonalizationError,
  PersonalizationStats,
} from '@/types/personalization';
import { PersonalizationCache } from './personalization-cache';
import { PersonalizationPrompts } from './personalization-prompts';
import { getOpenAIApiKey } from '@/config/api-config';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIPersonalizationService {
  private static instance: OpenAIPersonalizationService | null = null;
  private apiKey: string;
  private cache: PersonalizationCache;
  private requestQueue: Promise<any> = Promise.resolve();
  private lastRequestTime: number = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests
  private stats: PersonalizationStats = {
    totalRequests: 0,
    cacheHits: 0,
    apiCalls: 0,
    totalTokensUsed: 0,
    averageResponseTime: 0,
    errorCount: 0,
  };

  private constructor() {
    this.apiKey = getOpenAIApiKey();
    this.cache = new PersonalizationCache();
    
    if (!this.apiKey) {
      console.error('[OpenAIPersonalization] API key not found in environment variables');
      throw new Error('OpenAI API key is required');
    }
    
    console.log('[OpenAIPersonalization] Service initialized with API key:', 
      this.apiKey ? `${this.apiKey.substring(0, 7)}...${this.apiKey.substring(this.apiKey.length - 4)}` : 'missing'
    );
  }

  static getInstance(): OpenAIPersonalizationService {
    if (!this.instance) {
      this.instance = new OpenAIPersonalizationService();
    }
    return this.instance;
  }

  async generatePersonalizedVisualization(
    request: PersonalizationRequest
  ): Promise<PersonalizedContent> {
    const startTime = Date.now();
    this.stats.totalRequests++;
    
    try {
      // Generate cache key
      const cacheKey = await this.cache.generateCacheKey(
        request.userContext,
        request.visualizationId,
        request.contextualFactors
      );
      
      // Check cache first
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.stats.cacheHits++;
        console.log('[OpenAIPersonalization] Cache hit for visualization');
        return cached;
      }
      
      // Queue the request to enforce rate limiting
      const result = await this.requestQueue.then(async () => {
        // Enforce minimum interval between requests
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
          await new Promise(resolve => 
            setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
          );
        }
        
        this.lastRequestTime = Date.now();
        return this.callOpenAI(request, cacheKey);
      });
      
      // Update queue
      this.requestQueue = this.requestQueue.then(() => {}).catch(() => {});
      
      // Cache the result
      await this.cache.set(cacheKey, result, request.userContext);
      
      // Update stats
      const responseTime = Date.now() - startTime;
      this.stats.averageResponseTime = 
        (this.stats.averageResponseTime * (this.stats.apiCalls - 1) + responseTime) / 
        this.stats.apiCalls;
      
      return result;
    } catch (error) {
      this.stats.errorCount++;
      console.error('[OpenAIPersonalization] Error generating content:', error);
      
      // Return fallback content
      return this.createFallbackContent(request);
    }
  }

  private async callOpenAI(
    request: PersonalizationRequest,
    cacheKey: string
  ): Promise<PersonalizedContent> {
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: PersonalizationPrompts.generateSystemPrompt(),
      },
      {
        role: 'user',
        content: PersonalizationPrompts.generateUserPrompt(request),
      },
    ];
    
    const requestBody = {
      model: 'gpt-4o-mini', // Using GPT-4o-mini as requested
      messages,
      temperature: 0.7,
      max_tokens: 1500,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    };
    
    let retries = 3;
    let lastError: Error | null = null;
    
    while (retries > 0) {
      try {
        console.log('[OpenAIPersonalization] Calling OpenAI API...');
        this.stats.apiCalls++;
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[OpenAIPersonalization] API Error:', response.status, errorText);
          
          if (response.status === 401) {
            throw new Error('Invalid API key');
          } else if (response.status === 429) {
            // Rate limited - wait longer before retry
            console.log('[OpenAIPersonalization] Rate limited, waiting before retry...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            retries--;
            continue;
          } else {
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
          }
        }
        
        const data: OpenAIResponse = await response.json();
        
        if (!data.choices || data.choices.length === 0) {
          throw new Error('No response from OpenAI');
        }
        
        // Update token usage stats
        if (data.usage) {
          this.stats.totalTokensUsed += data.usage.total_tokens;
        }
        
        // Parse the response
        const content = data.choices[0].message.content;
        const personalizedSteps = PersonalizationPrompts.parseResponse(content);
        
        // Create personalized content
        const steps: PersonalizedStep[] = personalizedSteps.map((step, index) => ({
          content: step,
          duration: PersonalizationPrompts.estimateDuration(step),
          emphasis: this.determineEmphasis(step, request.tone),
          personalizedElements: this.identifyPersonalizedElements(
            step,
            request.baseContent[index] || ''
          ),
        }));
        
        return {
          steps,
          generatedAt: new Date().toISOString(),
          cacheKey,
          model: 'gpt-4o-mini',
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
        };
        
      } catch (error: any) {
        console.error('[OpenAIPersonalization] API call error:', error);
        lastError = error;
        
        if (error.message === 'Invalid API key') {
          throw error; // Don't retry for auth errors
        }
        
        retries--;
        if (retries > 0) {
          console.log(`[OpenAIPersonalization] Retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    throw lastError || new Error('Failed to generate personalized content');
  }

  private determineEmphasis(
    content: string,
    tone?: string
  ): 'normal' | 'slow' | 'powerful' {
    // Determine emphasis based on content and tone
    if (tone === 'calming' || content.includes('breathe') || content.includes('relax')) {
      return 'slow';
    }
    if (tone === 'energizing' || content.includes('power') || content.includes('explosive')) {
      return 'powerful';
    }
    return 'normal';
  }

  private identifyPersonalizedElements(
    personalizedStep: string,
    baseStep: string
  ): string[] {
    // Identify what elements were personalized
    const elements: string[] = [];
    
    // Simple heuristic: find sport-specific terms not in base
    const personalizedWords = personalizedStep.toLowerCase().split(/\s+/);
    const baseWords = baseStep.toLowerCase().split(/\s+/);
    
    const sportTerms = [
      'track', 'sprint', 'hurdle', 'jump', 'throw', 'run', 'race',
      'court', 'field', 'pool', 'gym', 'mat', 'ring',
      'teammate', 'opponent', 'coach', 'crowd',
    ];
    
    for (const word of personalizedWords) {
      if (!baseWords.includes(word) && sportTerms.some(term => word.includes(term))) {
        elements.push(word);
      }
    }
    
    return [...new Set(elements)]; // Remove duplicates
  }

  private createFallbackContent(request: PersonalizationRequest): PersonalizedContent {
    // Create fallback content using the base content
    console.log('[OpenAIPersonalization] Using fallback content');
    
    const steps: PersonalizedStep[] = request.baseContent.map(content => ({
      content,
      duration: PersonalizationPrompts.estimateDuration(content),
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

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models/gpt-4o-mini', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      
      console.log('[OpenAIPersonalization] Connection test:', response.status);
      return response.ok;
    } catch (error) {
      console.error('[OpenAIPersonalization] Connection test failed:', error);
      return false;
    }
  }

  getStats(): PersonalizationStats & { cacheStats: any } {
    return {
      ...this.stats,
      cacheStats: this.cache.getStats(),
    };
  }

  async clearCache(): Promise<void> {
    await this.cache.clearCache();
  }
}