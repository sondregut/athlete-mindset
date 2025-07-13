import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export interface FallbackTTSOptions {
  language?: string;
  pitch?: number; // 0.5 to 2.0
  rate?: number; // 0.1 to 2.0
  voice?: string;
}

class FallbackTTSService {
  private static instance: FallbackTTSService;
  private isSpeaking: boolean = false;

  private constructor() {
    console.log('Initializing Fallback TTS Service');
  }

  static getInstance(): FallbackTTSService {
    if (!FallbackTTSService.instance) {
      FallbackTTSService.instance = new FallbackTTSService();
    }
    return FallbackTTSService.instance;
  }

  async speak(text: string, options: FallbackTTSOptions = {}): Promise<void> {
    try {
      // Stop any ongoing speech
      if (this.isSpeaking) {
        await Speech.stop();
      }

      const speakOptions: Speech.SpeechOptions = {
        language: options.language || 'en-US',
        pitch: options.pitch || 1.0,
        rate: options.rate || 1.0,
        voice: options.voice,
        onStart: () => {
          this.isSpeaking = true;
          console.log('Fallback TTS started');
        },
        onDone: () => {
          this.isSpeaking = false;
          console.log('Fallback TTS completed');
        },
        onStopped: () => {
          this.isSpeaking = false;
          console.log('Fallback TTS stopped');
        },
        onError: (error) => {
          this.isSpeaking = false;
          console.error('Fallback TTS error:', error);
        },
      };

      console.log('Speaking with fallback TTS:', text.substring(0, 50) + '...');
      await Speech.speak(text, speakOptions);
    } catch (error) {
      console.error('Fallback TTS failed:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.isSpeaking) {
      await Speech.stop();
      this.isSpeaking = false;
    }
  }

  async pause(): Promise<void> {
    if (this.isSpeaking && Platform.OS === 'ios') {
      await Speech.pause();
    }
  }

  async resume(): Promise<void> {
    if (Platform.OS === 'ios') {
      await Speech.resume();
    }
  }

  async getAvailableVoices(): Promise<Speech.Voice[]> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices;
    } catch (error) {
      console.error('Failed to get available voices:', error);
      return [];
    }
  }

  isSpeakingNow(): boolean {
    return this.isSpeaking;
  }

  // Map OpenAI voice characteristics to speech parameters
  mapOpenAIVoiceToSpeechParams(voice: string): FallbackTTSOptions {
    const voiceMap: Record<string, FallbackTTSOptions> = {
      'alloy': { pitch: 1.0, rate: 1.0 },      // Neutral
      'echo': { pitch: 0.9, rate: 0.95 },     // Warm and slightly deeper
      'fable': { pitch: 1.1, rate: 1.05 },    // Expressive and slightly higher
      'onyx': { pitch: 0.8, rate: 0.9 },      // Deep and authoritative
      'nova': { pitch: 1.05, rate: 1.0 },     // Friendly and conversational
      'shimmer': { pitch: 1.15, rate: 0.95 }, // Soft and soothing
    };

    return voiceMap[voice] || { pitch: 1.0, rate: 1.0 };
  }

  // Check if device TTS is available
  async isAvailable(): Promise<boolean> {
    try {
      // Test by getting available voices
      const voices = await this.getAvailableVoices();
      return voices.length > 0;
    } catch (error) {
      console.error('TTS availability check failed:', error);
      return false;
    }
  }
}

export default FallbackTTSService;