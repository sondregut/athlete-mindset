import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { getFirebaseApp } from '@/config/firebase';
import { 
  PersonalizationRequest, 
  PersonalizedContent,
  UserContext 
} from '@/types/personalization';
import { TTSOptions } from './tts-firebase-cache-gemini';

// Types for Cloud Functions
interface CloudPersonalizationRequest {
  visualizationId: string;
  userContext: UserContext;
  forceRegenerate?: boolean;
}

interface CloudTTSRequest {
  text: string;
  voice?: string;
  speed?: number;
  model?: string;
  cacheKey?: string;
}

interface CloudTTSResponse {
  url: string;
  cacheKey: string;
  duration?: number;
  cached: boolean;
}

interface CloudPreloadRequest {
  visualizationId: string;
  userContext: UserContext;
  voices?: string[];
}

interface CloudPreloadResponse {
  visualizationId: string;
  preloadedCount: number;
  urls: Record<string, Record<number, string>>;
}

export class CloudFunctionsService {
  private static instance: CloudFunctionsService | null = null;
  private functions;
  private personalizeVisualizationFn;
  private generateAudioTTSFn;
  private preloadVisualizationFn;
  
  private constructor() {
    this.functions = getFunctions(getFirebaseApp());
    
    // Initialize callable functions
    this.personalizeVisualizationFn = httpsCallable<CloudPersonalizationRequest, PersonalizedContent>(
      this.functions, 
      'personalizeVisualization'
    );
    
    this.generateAudioTTSFn = httpsCallable<CloudTTSRequest, CloudTTSResponse>(
      this.functions, 
      'generateAudioTTS'
    );
    
    this.preloadVisualizationFn = httpsCallable<CloudPreloadRequest, CloudPreloadResponse>(
      this.functions, 
      'preloadVisualization'
    );
  }
  
  static getInstance(): CloudFunctionsService {
    if (!this.instance) {
      this.instance = new CloudFunctionsService();
    }
    return this.instance;
  }
  
  /**
   * Get personalized visualization content from Cloud Functions
   */
  async getPersonalizedVisualization(
    visualizationId: string,
    userContext: UserContext,
    forceRegenerate = false
  ): Promise<PersonalizedContent> {
    try {
      console.log('[CloudFunctions] Requesting personalized visualization:', visualizationId);
      
      const result = await this.personalizeVisualizationFn({
        visualizationId,
        userContext,
        forceRegenerate,
      });
      
      console.log('[CloudFunctions] Received personalized content');
      return result.data;
    } catch (error: any) {
      console.error('[CloudFunctions] Personalization error:', error);
      
      // Re-throw with more context
      if (error.code === 'functions/unauthenticated') {
        throw new Error('Authentication required for personalization');
      } else if (error.code === 'functions/not-found') {
        throw new Error(`Visualization ${visualizationId} not found`);
      } else {
        throw new Error(`Personalization failed: ${error.message || 'Unknown error'}`);
      }
    }
  }
  
  /**
   * Generate TTS audio via Cloud Functions
   */
  async generateTTS(
    text: string,
    options: TTSOptions = {}
  ): Promise<string> {
    try {
      const { voice = 'Kore', model = 'gemini-2.0-flash', speed = 1.0 } = options;
      
      console.log('[CloudFunctions] Requesting TTS generation');
      
      const result = await this.generateAudioTTSFn({
        text,
        voice,
        speed,
        model,
      });
      
      const response = result.data;
      console.log('[CloudFunctions] TTS generated, cached:', response.cached);
      
      return response.url;
    } catch (error: any) {
      console.error('[CloudFunctions] TTS generation error:', error);
      throw new Error(`TTS generation failed: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Preload all audio for a visualization
   */
  async preloadVisualizationAudio(
    visualizationId: string,
    userContext: UserContext,
    voices: string[] = ['Kore'],
    onProgress?: (progress: number) => void
  ): Promise<Map<string, Map<number, string>>> {
    try {
      console.log('[CloudFunctions] Preloading visualization audio:', visualizationId);
      
      const result = await this.preloadVisualizationFn({
        visualizationId,
        userContext,
        voices,
      });
      
      const response = result.data;
      console.log('[CloudFunctions] Preloaded', response.preloadedCount, 'audio files');
      
      // Convert response format to Map structure expected by client
      const urlMap = new Map<string, Map<number, string>>();
      
      for (const [voice, steps] of Object.entries(response.urls)) {
        const stepMap = new Map<number, string>();
        for (const [stepId, url] of Object.entries(steps)) {
          stepMap.set(parseInt(stepId), url);
        }
        urlMap.set(voice, stepMap);
      }
      
      if (onProgress) {
        onProgress(100);
      }
      
      return urlMap;
    } catch (error: any) {
      console.error('[CloudFunctions] Preload error:', error);
      throw new Error(`Preload failed: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Health check for Cloud Functions
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to get a simple personalization to verify functions are working
      await this.personalizeVisualizationFn({
        visualizationId: 'test',
        userContext: { sport: 'test' },
      });
      return true;
    } catch (error) {
      console.warn('[CloudFunctions] Health check failed:', error);
      return false;
    }
  }
}