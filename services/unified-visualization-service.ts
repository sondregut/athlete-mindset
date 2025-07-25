import { CloudFunctionsService } from './cloud-functions-service';
import { GeminiPersonalizationService } from './gemini-personalization-service';
import { TTSFirebaseCacheGemini } from './tts-firebase-cache-gemini';
import { PersonalizationRequest, PersonalizedContent, UserContext } from '@/types/personalization';
import { TTSOptions } from './tts-firebase-cache-gemini';
import { featureFlags } from '@/config/feature-flags';

/**
 * Unified service that can use either Cloud Functions or local processing
 * based on feature flags and availability
 */
export class UnifiedVisualizationService {
  private static instance: UnifiedVisualizationService | null = null;
  private cloudFunctions: CloudFunctionsService;
  private localPersonalization: GeminiPersonalizationService;
  private localTTS: TTSFirebaseCacheGemini;
  private useCloudFunctions: boolean = false;
  private cloudFunctionsHealthy: boolean = false;
  
  private constructor() {
    this.cloudFunctions = CloudFunctionsService.getInstance();
    this.localPersonalization = GeminiPersonalizationService.getInstance();
    this.localTTS = TTSFirebaseCacheGemini.getInstance();
    
    // Check feature flag and Cloud Functions health
    this.initializeProvider();
  }
  
  static getInstance(): UnifiedVisualizationService {
    if (!this.instance) {
      this.instance = new UnifiedVisualizationService();
    }
    return this.instance;
  }
  
  private async initializeProvider() {
    // Check if Cloud Functions are enabled via feature flag
    this.useCloudFunctions = await featureFlags.isEnabled('useCloudFunctions');
    
    if (this.useCloudFunctions) {
      // Verify Cloud Functions are actually working
      try {
        this.cloudFunctionsHealthy = await this.cloudFunctions.healthCheck();
        console.log('[UnifiedService] Cloud Functions health:', this.cloudFunctionsHealthy);
      } catch (error) {
        console.warn('[UnifiedService] Cloud Functions health check failed:', error);
        this.cloudFunctionsHealthy = false;
      }
    }
    
    console.log('[UnifiedService] Provider initialized:', {
      useCloudFunctions: this.useCloudFunctions,
      cloudFunctionsHealthy: this.cloudFunctionsHealthy,
      provider: this.getActiveProvider(),
    });
  }
  
  private getActiveProvider(): 'cloud' | 'local' {
    return this.useCloudFunctions && this.cloudFunctionsHealthy ? 'cloud' : 'local';
  }
  
  /**
   * Get personalized visualization content
   */
  async getPersonalizedVisualization(
    request: PersonalizationRequest
  ): Promise<PersonalizedContent> {
    const provider = this.getActiveProvider();
    console.log(`[UnifiedService] Using ${provider} provider for personalization`);
    
    try {
      if (provider === 'cloud') {
        // Use Cloud Functions
        return await this.cloudFunctions.getPersonalizedVisualization(
          request.visualizationId,
          request.userContext,
          false // forceRegenerate
        );
      } else {
        // Use local processing
        return await this.localPersonalization.generatePersonalizedVisualization(request);
      }
    } catch (error) {
      console.error(`[UnifiedService] ${provider} personalization failed:`, error);
      
      // If cloud failed, try local as fallback
      if (provider === 'cloud') {
        console.log('[UnifiedService] Falling back to local personalization');
        this.cloudFunctionsHealthy = false; // Mark as unhealthy for this session
        return await this.localPersonalization.generatePersonalizedVisualization(request);
      }
      
      throw error;
    }
  }
  
  /**
   * Generate TTS audio
   */
  async generateTTS(
    text: string,
    options: TTSOptions = {}
  ): Promise<string> {
    const provider = this.getActiveProvider();
    console.log(`[UnifiedService] Using ${provider} provider for TTS`);
    
    try {
      if (provider === 'cloud') {
        // Use Cloud Functions
        return await this.cloudFunctions.generateTTS(text, options);
      } else {
        // Use local processing
        return await this.localTTS.synthesizeSpeech(text, options);
      }
    } catch (error) {
      console.error(`[UnifiedService] ${provider} TTS failed:`, error);
      
      // If cloud failed, try local as fallback
      if (provider === 'cloud') {
        console.log('[UnifiedService] Falling back to local TTS');
        this.cloudFunctionsHealthy = false;
        return await this.localTTS.synthesizeSpeech(text, options);
      }
      
      throw error;
    }
  }
  
  /**
   * Preload visualization audio
   */
  async preloadVisualizationAudio(
    visualizationId: string,
    userContext: UserContext,
    voices: string[] = ['Kore'],
    options: TTSOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<Map<string, Map<number, string>>> {
    const provider = this.getActiveProvider();
    console.log(`[UnifiedService] Using ${provider} provider for preload`);
    
    try {
      if (provider === 'cloud') {
        // Use Cloud Functions batch preload
        return await this.cloudFunctions.preloadVisualizationAudio(
          visualizationId,
          userContext,
          voices,
          onProgress
        );
      } else {
        // Use local processing - need to get personalized content first
        const personalizationRequest: PersonalizationRequest = {
          visualizationId,
          userContext,
          baseContent: [], // Will be loaded by service
          visualizationTitle: '', // Will be loaded by service
          visualizationCategory: 'performance-process',
        };
        
        const personalizedContent = await this.localPersonalization.generatePersonalizedVisualization(
          personalizationRequest
        );
        
        // Convert to expected format for local preload
        const steps = personalizedContent.steps.map((step, index) => ({
          id: index,
          content: step.content,
        }));
        
        return await this.localTTS.preloadPersonalizedVisualization(
          steps,
          { sport: userContext.sport, trackFieldEvent: userContext.trackFieldEvent },
          voices,
          options,
          onProgress
        );
      }
    } catch (error) {
      console.error(`[UnifiedService] ${provider} preload failed:`, error);
      
      // For preload, we might not want to fallback as it could be expensive
      throw error;
    }
  }
  
  /**
   * Get current provider status
   */
  getProviderStatus() {
    return {
      activeProvider: this.getActiveProvider(),
      cloudFunctionsEnabled: this.useCloudFunctions,
      cloudFunctionsHealthy: this.cloudFunctionsHealthy,
    };
  }
  
  /**
   * Force refresh provider status
   */
  async refreshProviderStatus() {
    await this.initializeProvider();
    return this.getProviderStatus();
  }
  
  /**
   * Get cache statistics (local only for now)
   */
  async getCacheStats() {
    // Cloud Functions don't expose cache stats yet
    if (this.getActiveProvider() === 'local') {
      return await this.localTTS.getCacheStats();
    }
    
    return {
      local: { entries: 0, size: 0, maxSize: 0 },
      firebase: { entries: 0, size: 0 },
      totalRequests: 0,
      localCacheHits: 0,
      localCacheHitRate: '0%',
      firebaseCacheHits: 0,
      firebaseCacheHitRate: '0%',
      geminiApiCalls: 0,
      errors: 0,
      deduplicatedRequests: 0,
    };
  }
}