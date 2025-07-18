import { ELEVENLABS_API_KEY } from '@env';
import { TTSFirebaseCache } from './tts-firebase-cache';

export interface ElevenLabsTTSOptions {
  voice: string;
  model?: string;
  speed?: number;
  stability?: number;
  similarityBoost?: number;
}

export class ElevenLabsTTSService {
  private static instance: ElevenLabsTTSService;
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private firebaseCache: TTSFirebaseCache;

  private constructor() {
    this.apiKey = ELEVENLABS_API_KEY;
    this.firebaseCache = TTSFirebaseCache.getInstance();
  }

  static getInstance(): ElevenLabsTTSService {
    if (!ElevenLabsTTSService.instance) {
      ElevenLabsTTSService.instance = new ElevenLabsTTSService();
    }
    return ElevenLabsTTSService.instance;
  }

  async synthesizeSpeech(
    text: string,
    options: ElevenLabsTTSOptions
  ): Promise<string> {
    console.log(`[ElevenLabsTTS] Synthesizing speech with voice: ${options.voice}`);

    try {
      // Use the existing TTS service for caching and synthesis
      const ttsOptions = {
        voice: options.voice,
        model: (options.model || 'eleven_multilingual_v2') as any,
        speed: options.speed || 1.0,
        isPersonalized: true
      };
      
      const audioUrl = await this.firebaseCache.synthesizeSpeech(text, ttsOptions);
      return audioUrl;

    } catch (error) {
      console.error(`[ElevenLabsTTS] Error synthesizing speech:`, error);
      throw error;
    }
  }

  private generateCacheKey(text: string, options: ElevenLabsTTSOptions): string {
    // Create a deterministic cache key based on content and options
    const keyData = {
      text,
      voice: options.voice,
      model: options.model || 'eleven_multilingual_v2',
      speed: options.speed || 1.0,
      stability: options.stability || 0.5,
      similarityBoost: options.similarityBoost || 0.5,
    };
    
    // Simple hash function for cache key
    const keyString = JSON.stringify(keyData);
    return `elevenlabs-${this.simpleHash(keyString)}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  async getVoices(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices || [];
      
    } catch (error) {
      console.error('[ElevenLabsTTS] Error fetching voices:', error);
      throw error;
    }
  }

  async getUsage(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
      
    } catch (error) {
      console.error('[ElevenLabsTTS] Error fetching usage:', error);
      throw error;
    }
  }
}

export default ElevenLabsTTSService;