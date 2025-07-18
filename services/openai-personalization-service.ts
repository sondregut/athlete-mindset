import { OPENAI_API_KEY } from '@env';
import { PersonalizationProfile } from '@/types/personalization-profile';
import { Visualization, VisualizationStep } from '@/types/visualization';
import { PersonalizationRequest, PersonalizedContent, PersonalizationStats } from '@/types/personalization';
import { checkNetworkConnection } from '@/utils/network';

export class OpenAIPersonalizationService {
  private static instance: OpenAIPersonalizationService;
  private stats: PersonalizationStats = {
    totalRequests: 0,
    cacheHits: 0,
    apiCalls: 0,
    totalTokensUsed: 0,
    averageResponseTime: 0,
    errorCount: 0,
  };

  private constructor() {}

  static getInstance(): OpenAIPersonalizationService {
    if (!OpenAIPersonalizationService.instance) {
      OpenAIPersonalizationService.instance = new OpenAIPersonalizationService();
    }
    return OpenAIPersonalizationService.instance;
  }

  /**
   * Generate personalized visualization text using OpenAI's GPT-4o model
   */
  async generatePersonalizedText(
    profile: PersonalizationProfile, 
    baseVisualization: Visualization
  ): Promise<Visualization> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    console.log('🚀 Starting OpenAI personalization process...');
    console.log('👤 Profile received:', profile);
    console.log('🎯 Base visualization:', baseVisualization.title);

    try {
      if (!OPENAI_API_KEY) {
        console.error('❌ OpenAI API key is not configured');
        console.error('💡 Please add OPENAI_API_KEY to your .env file');
        throw new Error('OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env file.');
      }

      // Validate API key format
      if (!OPENAI_API_KEY.startsWith('sk-')) {
        console.error('❌ OpenAI API key appears to be invalid (should start with "sk-")');
        throw new Error('Invalid OpenAI API key format. Keys should start with "sk-".');
      }

      console.log('🔑 OpenAI API key is available and valid format');

      // Check network connectivity first
      const isConnected = await checkNetworkConnection();
      if (!isConnected) {
        console.error('❌ Network connection failed');
        throw new Error('Network request failed: No internet connection detected');
      }

      console.log('🌐 Network connection verified');

      // Generate cache key for this sport + visualization combination
      const cacheKey = this.generatePersonalizationCacheKey(profile, baseVisualization);
      console.log('🗝️ Cache key generated:', cacheKey);

      // Check if we have cached personalized content for this sport
      const cachedContent = await this.getCachedPersonalization(cacheKey);
      if (cachedContent) {
        console.log('🎯 Using cached personalized content for', profile.sport_activity);
        this.stats.cacheHits++;
        return {
          ...baseVisualization,
          steps: cachedContent,
          personalizedSteps: cachedContent,
          lastPersonalized: new Date().toISOString()
        };
      }

      console.log('🔄 Generating new personalized content for', profile.sport_activity);

      // Construct the high-quality prompt optimized for TTS
      const userMessage = {
        role: 'user' as const,
        content: `You are an expert sports psychology coach specializing in creating audio visualization scripts.
Your task is to transform a generic visualization script into a professional, sport-specific audio script for text-to-speech.

**Athlete's Profile:**
- Sport: ${profile.sport_activity}
- Experience Level: ${profile.experience_level}
- Specific Role: ${profile.specific_role || 'Not specified'}
- Primary Goals: ${profile.primary_goals.join(', ')}
- Preferred Energy Style: ${profile.preferred_style}

**Original Visualization Script:**
${JSON.stringify(baseVisualization.steps, null, 2)}

**CRITICAL INSTRUCTIONS for Audio Scripts:**
1. **Remove ALL titles, headers, and step numbers** - These should not be spoken aloud
2. **Remove awkward phrases** like "you can also imagine (your name) 2.0" or meta-references
3. **Write for spoken audio** - Use natural, flowing speech patterns
4. **Make it sport-specific** - Use appropriate terminology, movements, and sensory details for ${profile.sport_activity}. Generate naturally relevant content based on the sport.
5. **Use natural speech transitions** - Start sentences with "Now", "Next", "Take a moment to", "Feel yourself"
6. **Include specific sensory details** for ${profile.sport_activity}
7. **Match energy style** - ${profile.preferred_style} tone throughout
8. **Use present tense** - "You are standing", not "You will stand"
9. **Flow naturally** - Each step should flow into the next without jarring transitions
10. **Keep timing realistic** - Content should match the duration for comfortable speaking

**Examples of GOOD audio script writing:**
- "Take a deep breath and feel your feet firmly planted on the track surface..."
- "Now visualize yourself in your starting position, feeling confident and ready..."
- "Feel the energy building in your muscles as you prepare to explode forward..."

**Examples of BAD audio script writing:**
- "Step 1: Introduction" (NO titles!)
- "You can also imagine John 2.0" (NO awkward references!)
- "This visualization will help you..." (NO meta-commentary!)

**Response Format:**
{
  "steps": [
    {
      "id": 1,
      "content": "Take a deep breath and feel yourself standing confidently at the starting line...",
      "duration": 30
    },
    ...
  ]
}

Return ONLY the JSON object. No other text.`
      };

      // Make the API call to OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert sports psychology coach specializing in audio visualization scripts. You transform generic scripts into professional, sport-specific audio content optimized for text-to-speech. You respond only with valid JSON objects containing natural, flowing audio scripts without titles, headers, or meta-commentary.'
            },
            userMessage
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      this.stats.apiCalls++;

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 429) {
          throw new Error(`OpenAI API rate limit exceeded (${response.status}): ${errorText}`);
        } else if (response.status === 401) {
          throw new Error(`Invalid OpenAI API key (${response.status}): ${errorText}`);
        }
        
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from OpenAI API');
      }

      const content = data.choices[0].message.content;
      
      // Parse the JSON response
      let personalizedSteps: VisualizationStep[];
      try {
        const parsedContent = JSON.parse(content);
        
        // Expect object with steps array
        if (parsedContent.steps && Array.isArray(parsedContent.steps)) {
          personalizedSteps = parsedContent.steps;
        } else if (Array.isArray(parsedContent)) {
          // Fallback for direct array (legacy format)
          personalizedSteps = parsedContent;
        } else {
          console.error('Invalid response structure:', parsedContent);
          throw new Error('Response does not contain a valid steps array');
        }
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        console.error('Parse error:', parseError);
        throw new Error('Invalid JSON response from OpenAI');
      }

      // Validate the structure
      if (!personalizedSteps || personalizedSteps.length !== baseVisualization.steps.length) {
        throw new Error('Personalized steps count does not match original');
      }

      // Ensure each step has required fields
      personalizedSteps.forEach((step, index) => {
        if (!step.content || typeof step.content !== 'string') {
          throw new Error(`Step ${index + 1} missing valid content`);
        }
        if (!step.id) {
          step.id = index + 1;
        }
        if (!step.duration) {
          step.duration = baseVisualization.steps[index]?.duration || 30;
        }
      });

      // Update stats
      if (data.usage) {
        this.stats.totalTokensUsed += data.usage.total_tokens;
      }

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      this.stats.averageResponseTime = 
        (this.stats.averageResponseTime * (this.stats.apiCalls - 1) + responseTime) / this.stats.apiCalls;

      // Cache the personalized content for this sport
      await this.cachePersonalization(cacheKey, personalizedSteps);
      console.log('💾 Cached personalized content for', profile.sport_activity);

      // Return the personalized visualization
      return {
        ...baseVisualization,
        steps: personalizedSteps,
        personalizedSteps: personalizedSteps,
        lastPersonalized: new Date().toISOString(),
      };

    } catch (error: any) {
      this.stats.errorCount++;
      console.error('❌ OpenAI Personalization Error Details:', {
        message: error.message || error,
        name: error.name,
        stack: error.stack,
        profile: profile,
        visualizationId: baseVisualization.id
      });
      
      // Log additional context for debugging
      if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
        console.error('🌐 Network connectivity issue detected during OpenAI request');
        console.error('💡 Try checking internet connection or API key validity');
      } else if (error.message.includes('API key')) {
        console.error('🔑 API key issue detected - check .env file');
      } else if (error.message.includes('rate limit')) {
        console.error('⏱️ Rate limit hit - try again in a moment');
      }
      
      console.log('🔄 Falling back to original visualization content');
      // Return original visualization as fallback
      return baseVisualization;
    }
  }

  /**
   * Generate personalized visualization content using the existing PersonalizationRequest structure
   */
  async generatePersonalizedVisualization(request: PersonalizationRequest): Promise<PersonalizedContent> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured');
      }

      // Check network connectivity first
      const isConnected = await checkNetworkConnection();
      if (!isConnected) {
        throw new Error('Network request failed: No internet connection detected');
      }

      // Extract user context information
      const { userContext, baseContent, tone, length } = request;

      // Build the personalization prompt
      const userMessage = {
        role: 'user' as const,
        content: `You are an expert sports psychology coach specializing in visualization techniques.
Your task is to rewrite a generic guided visualization script to be highly personalized for an athlete.

**Athlete's Profile:**
- Sport: ${userContext.sport || 'Not specified'}
- Experience Level: ${userContext.experienceLevel || 'Not specified'}
- Primary Focus: ${userContext.primaryFocus || 'Not specified'}
- Goals: ${userContext.goals || 'Not specified'}
- Track & Field Event: ${userContext.trackFieldEvent || 'Not specified'}

**Visualization Details:**
- Title: ${request.visualizationTitle}
- Category: ${request.visualizationCategory}
- Preferred Tone: ${tone || 'motivational'}
- Content Length: ${length || 'medium'}

**Original Visualization Content:**
${baseContent.map((content, index) => `Step ${index + 1}: ${content}`).join('\n\n')}

**Your Instructions:**
1. Rewrite each step to be highly specific to the athlete's sport (${userContext.sport}).
2. Use vivid, sport-specific imagery and terminology appropriate for their sport.
3. Incorporate their primary focus (${userContext.primaryFocus}) and goals throughout.
4. Match the preferred tone (${tone}) in language and delivery.
5. Adjust complexity based on experience level (${userContext.experienceLevel}).
6. Keep the core psychological message and purpose of each step intact.
7. Maintain the same number of steps.
8. Use second person ("you") for immersive experience.
9. Include specific sensory details relevant to their sport.

**Response Format:**
Return your response as a single, valid JSON object with a "steps" array:
{
  "steps": [
    {
      "content": "personalized content here...",
      "duration": 30,
      "personalizedElements": ["sport-specific imagery", "goal integration"]
    },
    ...
  ]
}

Do not include any other text or explanations. Only return the JSON object.`
      };

      // Make the API call
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert sports psychology coach. You respond only with valid JSON objects containing personalized visualization steps.'
            },
            userMessage
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      this.stats.apiCalls++;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parse the response
      const parsedContent = JSON.parse(content);
      
      if (!parsedContent.steps || !Array.isArray(parsedContent.steps)) {
        throw new Error('Invalid response structure from OpenAI');
      }

      // Update stats
      if (data.usage) {
        this.stats.totalTokensUsed += data.usage.total_tokens;
      }

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      this.stats.averageResponseTime = 
        (this.stats.averageResponseTime * (this.stats.apiCalls - 1) + responseTime) / this.stats.apiCalls;

      return {
        steps: parsedContent.steps,
        generatedAt: new Date().toISOString(),
        cacheKey: this.generateCacheKey(request),
        model: 'gpt-4o',
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
      };

    } catch (error: any) {
      this.stats.errorCount++;
      console.error('OpenAI Personalization Error:', error.message || error);
      
      // Log additional context for debugging
      if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
        console.error('Network connectivity issue detected during OpenAI request');
      }
      
      // Return fallback content
      return {
        steps: request.baseContent.map((content: string) => ({
          content,
          duration: 30,
          personalizedElements: [],
        })),
        generatedAt: new Date().toISOString(),
        cacheKey: this.generateCacheKey(request),
        model: 'fallback',
      };
    }
  }

  /**
   * Generate a cache key for the personalization request
   */
  private generateCacheKey(request: PersonalizationRequest): string {
    const keyData = {
      sport: request.userContext.sport,
      experienceLevel: request.userContext.experienceLevel,
      primaryFocus: request.userContext.primaryFocus,
      visualizationId: request.visualizationId,
      tone: request.tone,
      length: request.length,
    };
    
    return btoa(JSON.stringify(keyData)).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Get service statistics
   */
  getStats(): PersonalizationStats {
    return { ...this.stats };
  }

  /**
   * Reset service statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      apiCalls: 0,
      totalTokensUsed: 0,
      averageResponseTime: 0,
      errorCount: 0,
    };
  }

  /**
   * Generate cache key for personalization based on sport and visualization
   */
  private generatePersonalizationCacheKey(profile: PersonalizationProfile, visualization: Visualization): string {
    const keyData = {
      sport: profile.sport_activity,
      visualizationId: visualization.id,
      experienceLevel: profile.experience_level,
      preferredStyle: profile.preferred_style,
      version: '1.0' // Increment this to invalidate cache when prompts change
    };
    
    return `personalization_${btoa(JSON.stringify(keyData)).replace(/[^a-zA-Z0-9]/g, '')}`;
  }

  /**
   * Cache personalized content to AsyncStorage
   */
  private async cachePersonalization(cacheKey: string, steps: VisualizationStep[]): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(steps));
    } catch (error) {
      console.error('Failed to cache personalized content:', error);
    }
  }

  /**
   * Get cached personalized content from AsyncStorage
   */
  private async getCachedPersonalization(cacheKey: string): Promise<VisualizationStep[] | null> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const cached = await AsyncStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached personalized content:', error);
      return null;
    }
  }
}