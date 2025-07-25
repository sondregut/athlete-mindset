import { Audio } from 'expo-av';
import { GeminiTTSService } from './gemini-tts-service';
import { TTSFirebaseCacheGemini } from './tts-firebase-cache-gemini';
import { GeminiCoreService } from './gemini-core-service';

export interface TTSOptions {
  voice?: string;
  model?: string;
  speed?: number;
  volume?: number;
}

export class TTSService {
  private static instance: TTSService;
  private geminiTTS: GeminiTTSService;
  private geminiCache: TTSFirebaseCacheGemini;

  private constructor() {
    this.geminiTTS = GeminiTTSService.getInstance();
    this.geminiCache = TTSFirebaseCacheGemini.getInstance();
  }

  static getInstance(): TTSService {
    if (!TTSService.instance) {
      TTSService.instance = new TTSService();
    }
    return TTSService.instance;
  }

  async synthesizeAndPlay(text: string, options: TTSOptions = {}): Promise<Audio.Sound | null> {
    console.log('[TTSService] Synthesizing speech with Gemini');
    
    try {
      if (!GeminiCoreService.isConfigured()) {
        throw new Error('Gemini API key not configured');
      }
      
      return await this.geminiTTS.synthesizeAndPlay(text, options);
    } catch (error: any) {
      console.error('[TTSService] Synthesis failed:', error.message);
      throw error;
    }
  }

  async synthesizeSpeechCached(text: string, options: TTSOptions = {}): Promise<string> {
    console.log('[TTSService] Using cached synthesis with Gemini');
    
    try {
      if (!GeminiCoreService.isConfigured()) {
        throw new Error('Gemini API key not configured');
      }
      
      return await this.geminiCache.synthesizeSpeech(text, {
        voice: options.voice,
        model: 'gemini-2.5-flash-preview-tts',
        speed: options.speed,
      });
    } catch (error: any) {
      console.error('[TTSService] Cached synthesis failed:', error.message);
      throw error;
    }
  }

  async stopCurrentAudio(): Promise<void> {
    await this.geminiTTS.stopCurrentAudio();
  }

  async pauseCurrentAudio(): Promise<void> {
    await this.geminiTTS.pauseCurrentAudio();
  }

  async resumeCurrentAudio(): Promise<void> {
    await this.geminiTTS.resumeCurrentAudio();
  }

  getCurrentSound(): Audio.Sound | null {
    return this.geminiTTS.getCurrentSound();
  }

  async getCacheStats() {
    return {
      service: 'Gemini',
      ...(await this.geminiCache.getCacheStats()),
    };
  }

  async clearAllCaches() {
    await this.geminiCache.clearCache();
    console.log('[TTSService] Cache cleared');
  }

  // Get available voices
  getAvailableVoices() {
    return GeminiTTSService.getAvailableVoices();
  }

  // Get the current active service name
  getActiveService(): string {
    return 'Gemini';
  }
}