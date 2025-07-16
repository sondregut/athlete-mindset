#!/usr/bin/env bun
/**
 * ElevenLabs Conversational AI Proof of Concept
 * Demonstrates how to integrate AI personalization with the existing app
 */

import { PersonalizationRequest, PersonalizedContent } from '../types/personalization';
import { PersonalizationProfile } from '../types/personalization-profile';

// Mock ElevenLabs API configuration
interface ElevenLabsConfig {
  apiKey: string;
  baseUrl: string;
  model: 'gpt-4o' | 'claude-sonnet-4' | 'gemini-1.5-pro';
}

interface ConversationRequest {
  agent_id: string;
  dynamic_variables: Record<string, any>;
  system_prompt_override?: string;
}

interface ConversationResponse {
  conversation_id: string;
  agent_response: string;
  metadata: {
    tokens_used: number;
    latency_ms: number;
    model_used: string;
  };
}

// Mock ElevenLabs AI Personalization Service
class ElevenLabsAIPersonalizationService {
  private static instance: ElevenLabsAIPersonalizationService;
  private config: ElevenLabsConfig;
  private cache: Map<string, PersonalizedContent> = new Map();
  
  private constructor() {
    this.config = {
      apiKey: process.env.ELEVENLABS_API_KEY || 'mock-api-key',
      baseUrl: 'https://api.elevenlabs.io/v1/conversational-ai',
      model: 'gpt-4o'
    };
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
      // Prepare dynamic variables for ElevenLabs
      const dynamicVariables = this.prepareDynamicVariables(request);
      
      // Create system prompt for visualization personalization
      const systemPrompt = this.createSystemPrompt(request);
      
      // Mock API call (in real implementation, this would call ElevenLabs API)
      const response = await this.mockElevenLabsAPI({
        agent_id: 'visualization-agent',
        dynamic_variables: dynamicVariables,
        system_prompt_override: systemPrompt
      });
      
      // Parse response into personalized content
      const personalizedContent = this.parseAPIResponse(response, request);
      
      // Cache the result
      this.cache.set(cacheKey, personalizedContent);
      
      console.log(`[ElevenLabsAI] Generated ${personalizedContent.steps.length} personalized steps`);
      
      return personalizedContent;
      
    } catch (error) {
      console.error(`[ElevenLabsAI] Error generating content:`, error);
      throw error;
    }
  }
  
  private prepareDynamicVariables(request: PersonalizationRequest): Record<string, any> {
    const { userContext, contextualFactors } = request;
    
    return {
      // Sport context
      sport: userContext.sport || 'general',
      event: userContext.trackFieldEvent || 'general',
      experience_level: userContext.experienceLevel || 'intermediate',
      primary_focus: userContext.primaryFocus || 'performance',
      
      // Visualization context
      visualization_title: request.visualizationTitle,
      visualization_category: request.visualizationCategory,
      content_tone: request.tone || 'motivational',
      content_length: request.length || 'medium',
      
      // Contextual factors
      time_of_day: contextualFactors?.timeOfDay || 'any',
      location: contextualFactors?.location || 'any',
      time_until_event: contextualFactors?.timeUntilEvent || 'unknown',
      
      // Sport-specific mappings
      venue: this.getSportVenue(userContext.sport, userContext.trackFieldEvent),
      equipment: this.getSportEquipment(userContext.sport, userContext.trackFieldEvent),
      technique: this.getSportTechnique(userContext.sport, userContext.trackFieldEvent),
      goal: this.getSportGoal(userContext.sport, userContext.trackFieldEvent),
    };
  }
  
  private createSystemPrompt(request: PersonalizationRequest): string {
    return `You are an expert sports psychologist creating personalized mental training visualizations.

Your task is to personalize the following visualization steps for an athlete:

ATHLETE CONTEXT:
- Sport: {{sport}}
- Event: {{event}}
- Experience Level: {{experience_level}}
- Primary Focus: {{primary_focus}}
- Venue: {{venue}}
- Equipment: {{equipment}}
- Technique: {{technique}}
- Goal: {{goal}}

VISUALIZATION DETAILS:
- Title: {{visualization_title}}
- Category: {{visualization_category}}
- Tone: {{content_tone}}
- Length: {{content_length}}

ORIGINAL STEPS TO PERSONALIZE:
${request.baseContent.map((step, index) => `${index + 1}. ${step}`).join('\n')}

PERSONALIZATION GUIDELINES:
1. Replace generic terms with sport-specific language
2. Include specific venue, equipment, and technique references
3. Maintain the same structure and timing
4. Keep the {{content_tone}} tone throughout
5. Focus on {{primary_focus}} aspects
6. Make it relevant for {{experience_level}} athletes

Respond with ONLY the personalized steps, one per line, numbered 1-${request.baseContent.length}.`;
  }
  
  private async mockElevenLabsAPI(request: ConversationRequest): Promise<ConversationResponse> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock response based on sport type
    const sport = request.dynamic_variables.sport;
    const event = request.dynamic_variables.event;
    
    const mockResponses = {
      'pole_vault': [
        'Find a comfortable position and close your eyes. Take deep breaths, visualizing the pole in your hands and feeling its weight and balance.',
        'Visualize yourself on the runway at the track. See the standards, the crossbar at your target height, and the landing pit beyond.',
        'See yourself executing the perfect vault - powerful 14-step approach, precise plant at the box, smooth pole bend, and effortless clearance.',
        'Experience the exhilaration of clearing your personal best height. Feel the pride, accomplishment, and confidence flowing through you.',
        'Open your eyes and carry this vaulting confidence with you to your next practice or competition.'
      ],
      'long_jump': [
        'Find a comfortable position and close your eyes. Take deep breaths, feeling the explosive power in your legs ready to launch.',
        'Visualize yourself on the runway approaching the takeoff board. See the sand pit stretching out ahead, measuring your target distance.',
        'See yourself executing the perfect jump - controlled 20-step approach, explosive takeoff, optimal flight position, and strong landing.',
        'Experience the satisfaction of hitting your distance goal. Feel the power, speed, and technical precision that made it possible.',
        'Open your eyes and carry this jumping confidence with you to your next training session or meet.'
      ],
      'basketball': [
        'Find a comfortable position and close your eyes. Take deep breaths, feeling the basketball in your hands and its familiar texture.',
        'Visualize yourself on the court. See the hardwood, the hoop, your teammates, and the crowd in the stands.',
        'See yourself playing at your peak - making shots, solid defense, smart passes, and reading the game perfectly.',
        'Experience the flow state of perfect basketball performance. Feel the rhythm, timing, and basketball IQ in action.',
        'Open your eyes and carry this basketball confidence with you to your next game or practice.'
      ]
    };
    
    const response = mockResponses[event as keyof typeof mockResponses] || [
      'Find a comfortable position and close your eyes. Take deep breaths.',
      'Visualize yourself in your sport environment. See all the details.',
      'See yourself performing at your absolute best. Feel the confidence.',
      'Experience the emotion of success. Let it fill your entire being.',
      'Open your eyes and carry this athletic confidence with you.'
    ];
    
    return {
      conversation_id: `conv_${Date.now()}`,
      agent_response: response.join('\n'),
      metadata: {
        tokens_used: 150,
        latency_ms: 500,
        model_used: this.config.model
      }
    };
  }
  
  private parseAPIResponse(response: ConversationResponse, request: PersonalizationRequest): PersonalizedContent {
    const steps = response.agent_response.split('\n')
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
      model: response.metadata.model_used,
      promptTokens: response.metadata.tokens_used,
      completionTokens: response.metadata.tokens_used
    };
  }
  
  private generateCacheKey(request: PersonalizationRequest): string {
    const keyParts = [
      request.visualizationId,
      request.userContext.sport,
      request.userContext.trackFieldEvent,
      request.userContext.experienceLevel,
      request.tone,
      request.length
    ];
    return `elevenlabs-${keyParts.join('-')}`;
  }
  
  private getSportVenue(sport?: string, event?: string): string {
    const venues = {
      'track-and-field': 'track and field stadium',
      'basketball': 'basketball court',
      'swimming': 'swimming pool',
      'tennis': 'tennis court',
      'soccer': 'soccer field'
    };
    return venues[sport as keyof typeof venues] || 'athletic venue';
  }
  
  private getSportEquipment(sport?: string, event?: string): string {
    const equipment = {
      'pole-vault': 'pole, standards, crossbar',
      'long-jump': 'takeoff board, sand pit',
      'high-jump': 'crossbar, landing mat',
      'basketball': 'basketball, hoop',
      'swimming': 'pool, lane lines',
      'tennis': 'racket, ball, net'
    };
    return equipment[event as keyof typeof equipment] || equipment[sport as keyof typeof equipment] || 'athletic equipment';
  }
  
  private getSportTechnique(sport?: string, event?: string): string {
    const techniques = {
      'pole-vault': 'approach, plant, swing, clearance',
      'long-jump': 'approach, takeoff, flight, landing',
      'high-jump': 'approach, takeoff, clearance, landing',
      'basketball': 'dribbling, shooting, defense, teamwork',
      'swimming': 'stroke technique, turns, breathing',
      'tennis': 'serve, groundstrokes, volleys, movement'
    };
    return techniques[event as keyof typeof techniques] || techniques[sport as keyof typeof techniques] || 'athletic technique';
  }
  
  private getSportGoal(sport?: string, event?: string): string {
    const goals = {
      'pole-vault': 'clearing target height',
      'long-jump': 'achieving maximum distance',
      'high-jump': 'clearing personal best height',
      'basketball': 'team success and individual performance',
      'swimming': 'achieving target time',
      'tennis': 'winning points and matches'
    };
    return goals[event as keyof typeof goals] || goals[sport as keyof typeof goals] || 'optimal performance';
  }
  
  private estimateDuration(content: string): number {
    // Estimate ~1 second per word for visualization
    const wordCount = content.split(' ').length;
    return Math.max(wordCount * 1.2, 10); // Minimum 10 seconds
  }
  
  private identifyPersonalizedElements(content: string, request: PersonalizationRequest): string[] {
    const elements = [];
    const baseContent = request.baseContent.join(' ').toLowerCase();
    
    // Check for sport-specific terms
    if (request.userContext.sport && !baseContent.includes(request.userContext.sport)) {
      elements.push(`sport: ${request.userContext.sport}`);
    }
    
    if (request.userContext.trackFieldEvent && !baseContent.includes(request.userContext.trackFieldEvent)) {
      elements.push(`event: ${request.userContext.trackFieldEvent}`);
    }
    
    // Check for venue-specific terms
    const venue = this.getSportVenue(request.userContext.sport, request.userContext.trackFieldEvent);
    if (content.toLowerCase().includes(venue.toLowerCase())) {
      elements.push(`venue: ${venue}`);
    }
    
    // Check for equipment-specific terms
    const equipment = this.getSportEquipment(request.userContext.sport, request.userContext.trackFieldEvent);
    if (content.toLowerCase().includes(equipment.split(',')[0].toLowerCase())) {
      elements.push(`equipment: ${equipment}`);
    }
    
    return elements;
  }
  
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      cacheEntries: Array.from(this.cache.keys())
    };
  }
  
  clearCache() {
    this.cache.clear();
  }
}

// Example usage demonstration
async function demonstratePersonalization() {
  console.log('🚀 ElevenLabs AI Personalization Proof of Concept\n');
  
  const aiService = ElevenLabsAIPersonalizationService.getInstance();
  
  // Mock user profile
  const profile: PersonalizationProfile = {
    id: 'user-123',
    name: 'Test User',
    sport_activity: 'Track & Field - Pole Vault',
    specific_role: 'Pole Vaulter',
    experience_level: 'intermediate',
    primary_goals: ['improve-technique', 'build-confidence'],
    preferred_style: 'high-energy',
    completed_at: new Date().toISOString(),
    is_personalization_enabled: true
  };
  
  // Test visualization request
  const request: PersonalizationRequest = {
    userContext: {
      sport: 'track-and-field',
      trackFieldEvent: 'pole-vault',
      experienceLevel: 'intermediate',
      primaryFocus: 'performance',
      goals: 'improve technique, increase height'
    },
    visualizationId: 'peak-performance-sports',
    visualizationTitle: 'Peak Performance Visualization',
    visualizationCategory: 'performance-process',
    baseContent: [
      'Find a comfortable position and close your eyes. Take deep breaths.',
      'Visualize yourself in your performance environment. See the details.',
      'See yourself performing at your absolute best. Feel the confidence.',
      'Experience the emotion of success. Let it fill your body.',
      'Open your eyes and carry this feeling with you.'
    ],
    tone: 'motivational',
    length: 'medium'
  };
  
  try {
    console.log('📊 Generating personalized visualization...');
    const result = await aiService.generatePersonalizedVisualization(request);
    
    console.log('\n✅ Personalization Complete!');
    console.log(`Model: ${result.model}`);
    console.log(`Cache Key: ${result.cacheKey}`);
    console.log(`Generated: ${result.generatedAt}`);
    console.log(`Steps: ${result.steps.length}`);
    
    console.log('\n📝 Personalized Content:');
    result.steps.forEach((step, index) => {
      console.log(`\nStep ${index + 1}:`);
      console.log(`  Content: "${step.content}"`);
      console.log(`  Duration: ${step.duration}s`);
      console.log(`  Personalized Elements: ${step.personalizedElements.join(', ')}`);
    });
    
    console.log('\n🔄 Testing Cache...');
    const cachedResult = await aiService.generatePersonalizedVisualization(request);
    console.log(`Cache working: ${cachedResult.cacheKey === result.cacheKey}`);
    
    console.log('\n📈 Cache Stats:');
    console.log(aiService.getCacheStats());
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the demonstration
demonstratePersonalization().catch(console.error);