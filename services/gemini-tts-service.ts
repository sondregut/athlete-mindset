import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { GeminiCoreService } from './gemini-core-service';
import { GeminiTTSRestService } from './gemini-tts-rest-service';
import { geminiQuotaManager } from './gemini-quota-manager';
import { smartLogger } from '@/utils/smart-logger';

// Map legacy voice IDs to Gemini voices
const VOICE_MAPPING: Record<string, string> = {
  // Legacy ElevenLabs IDs -> Gemini voice names
  '21m00Tcm4TlvDq8ikWAM': 'Aoede',     // Female, calm -> Aoede (warm)
  'pNInz6obpgDQGcFmaJgB': 'Fenrir',    // Male, energetic -> Fenrir (energetic)
  'EXAVITQu4vr4xnSDxMaL': 'Aoede',     // Female, warm -> Aoede (warm)
  'IKne3meq5aSn9XLyUdCD': 'Charon',    // Male, deep -> Charon (deep)
  'ThT5KcBeYPX3keUQqHPh': 'Kore',      // Female, professional -> Kore (neutral)
  'pqHfZKP75CvOlQylNhV4': 'Kore',      // Neutral, clear -> Kore
  '9BWtsMINqrJLrRacOk9x': 'Kore',      // Male, clear -> Kore (neutral)
  'zcAOhNBS3c14rBihAFp1': 'Charon',    // Male, deep -> Charon (deep)
  // Legacy OpenAI voice names
  'nova': 'Aoede',
  'alloy': 'Kore',
  'echo': 'Charon',
  'fable': 'Puck',
  'onyx': 'Charon',
  'shimmer': 'Aoede',
  // Legacy onboarding voices
  'christina': 'Aoede',
  'mark': 'Kore',
  'benjamin': 'Charon',
};

// Default Gemini voice if mapping not found
const DEFAULT_GEMINI_VOICE = 'Kore';

export interface GeminiTTSOptions {
  voice?: string;
  model?: string;
  speed?: number;
  volume?: number;
  tone?: string; // e.g., 'calm', 'energetic', 'professional'
}

export class GeminiTTSService {
  private static instance: GeminiTTSService;
  private geminiCore: GeminiCoreService;
  private geminiRest: GeminiTTSRestService;
  private currentSound: Audio.Sound | null = null;
  private tempDir: string;
  private lastRequestTime: number = 0;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue: boolean = false;
  private useRestFallback: boolean = false;
  private activeRequests: Set<AbortController> = new Set();

  private constructor() {
    this.geminiCore = GeminiCoreService.getInstance();
    this.geminiRest = GeminiTTSRestService.getInstance();
    this.tempDir = `${FileSystem.cacheDirectory}gemini-tts/`;
    this.initializeTempDir();
  }

  static getInstance(): GeminiTTSService {
    if (!GeminiTTSService.instance) {
      GeminiTTSService.instance = new GeminiTTSService();
    }
    return GeminiTTSService.instance;
  }

  private async initializeTempDir() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.tempDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.tempDir, { intermediates: true });
      }
    } catch (error) {
      console.error('[GeminiTTS] Failed to create temp directory:', error);
    }
  }

  async synthesizeAndPlay(text: string, options: GeminiTTSOptions = {}): Promise<Audio.Sound | null> {
    try {
      // Stop any currently playing audio
      await this.stopCurrentAudio();

      const { 
        voice = '21m00Tcm4TlvDq8ikWAM', // Default to Rachel voice
        speed = 1.0,
        volume = 0.8,
        tone = 'calm'
      } = options;

      // Generate audio file
      const audioUri = await this.synthesizeToFile(text, { ...options, voice, speed, tone });
      
      if (!audioUri) {
        throw new Error('Failed to generate audio');
      }

      // Create and play audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false, volume }
      );
      
      // Note: expo-av doesn't support rate adjustment directly
      // Speed is handled during synthesis
      
      // Start playback
      await sound.playAsync();
      
      this.currentSound = sound;
      smartLogger.log('tts-success', 'Gemini audio playback started');
      
      return sound;
    } catch (error) {
      smartLogger.log('tts-error', `Gemini TTS failed: ${error}`);
      console.error('Gemini TTS Error:', error);
      return null;
    }
  }

  async synthesizeToFile(text: string, options: GeminiTTSOptions = {}): Promise<string | null> {
    try {
      const { 
        voice = '21m00Tcm4TlvDq8ikWAM', // Default to Rachel voice
        speed = 1.0,
        tone = 'calm'
      } = options;

      // Map voice to Gemini voice name
      const geminiVoice = this.mapVoiceToGemini(voice);

      smartLogger.log('tts-request', `Synthesizing text (${text.length} chars) with Gemini voice ${geminiVoice}`);

      // Generate audio with Gemini (with rate limiting)
      const audioData = await this.generateAudioWithRateLimit(text, geminiVoice, tone, speed);
      
      if (!audioData) {
        throw new Error('Failed to generate audio');
      }

      // Save audio file (already in correct format from API)
      const audioUri = this.useRestFallback 
        ? await this.geminiRest.saveAudioToFile(audioData)
        : await this.saveAudioToFile(audioData);

      return audioUri;
    } catch (error) {
      smartLogger.log('tts-error', `Gemini TTS failed: ${error}`);
      console.error('Gemini TTS Error:', error);
      return null;
    }
  }

  private async generateAudioWithGemini(
    text: string, 
    voice: string, 
    tone: string,
    speed: number
  ): Promise<ArrayBuffer | null> {
    // Check quota before making request
    const quotaCheck = await geminiQuotaManager.canMakeRequest();
    if (!quotaCheck.allowed) {
      console.error('[GeminiTTS] Request blocked by quota manager:', quotaCheck.reason);
      if (quotaCheck.waitTime) {
        console.log(`[GeminiTTS] Wait ${quotaCheck.waitTime}ms before next request`);
      }
      throw new Error(`Quota limit reached: ${quotaCheck.reason}`);
    }

    // If we've already determined we need REST fallback, use it directly
    if (this.useRestFallback) {
      console.log('[GeminiTTS] Using REST API fallback for TTS');
      return await this.geminiRest.generateAudioWithREST(text, voice, tone, speed);
    }

    try {
      // Record the request
      await geminiQuotaManager.recordRequest();
      
      // Get model with proper voice configuration
      const model = this.geminiCore.getTTSModel(voice);
      
      console.log('[GeminiTTS] Generating audio with SDK, voice:', voice);
      console.log('[GeminiTTS] Text:', text.substring(0, 100) + '...');

      // Create the request for TTS with just the text content
      const result = await model.generateContent(text);

      // Extract audio data from response
      const response = result.response;
      
      // Check if the response contains audio data
      if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const audioData = response.candidates[0].content.parts[0].inlineData;
        console.log('[GeminiTTS] Received audio data via SDK, mimeType:', audioData.mimeType);
        
        // Validate mime type
        if (!audioData.mimeType.includes('audio')) {
          throw new Error(`Unexpected mime type: ${audioData.mimeType}`);
        }
        
        // Convert base64 to ArrayBuffer
        const binaryString = atob(audioData.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // The audio is L16 PCM at 24kHz, need to convert to WAV
        const pcmData = bytes.buffer;
        const wavData = this.convertPCMToWAV(pcmData);
        return wavData;
      }

      // Check if we have fileData instead
      if (response.candidates?.[0]?.content?.parts?.[0]?.fileData) {
        console.error('[GeminiTTS] Received fileData response, which is not supported yet');
        throw new Error('File-based audio responses not supported');
      }

      // If we get text instead of audio, it means something went wrong
      try {
        const textResponse = response.text();
        if (textResponse) {
          console.error('[GeminiTTS] Received text response instead of audio:', textResponse.substring(0, 200));
          console.error('[GeminiTTS] SDK may not support audio generation, falling back to REST API');
        }
      } catch (e) {
        // text() will throw if response doesn't contain text
      }

      throw new Error('Failed to generate audio - no audio data in response');
    } catch (error: any) {
      console.error('[GeminiTTS] SDK failed to generate audio:', error.message);
      
      // Check for quota exceeded error
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        console.error('[GeminiTTS] Quota exceeded - daily limit reached');
        console.error('[GeminiTTS] Visit https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas to check your usage');
        
        // Record quota error
        await geminiQuotaManager.recordQuotaError();
        
        throw new Error('Gemini API quota exceeded. Please check your billing status or wait for quota reset.');
      }
      
      // Check for specific error types that indicate we should use REST API
      if (error.message?.includes('models/gemini') || 
          error.message?.includes('response modalities') ||
          error.message?.includes('no audio data')) {
        console.log('[GeminiTTS] SDK doesn\'t support audio generation, switching to REST API fallback');
        this.useRestFallback = true;
        
        // Try again with REST API
        try {
          return await this.geminiRest.generateAudioWithREST(text, voice, tone, speed);
        } catch (restError: any) {
          console.error('[GeminiTTS] REST API also failed:', restError.message);
          
          // Check for quota error in REST API response
          if (restError.message?.includes('429') || restError.message?.includes('quota')) {
            console.error('[GeminiTTS] Quota exceeded on REST API as well');
            await geminiQuotaManager.recordQuotaError();
            throw new Error('Gemini API quota exceeded. Please check your billing status or wait for quota reset.');
          }
          
          throw restError;
        }
      }
      
      throw error; // Re-throw other errors
    }
  }

  private mapVoiceToGemini(voice: string): string {
    // If it's already a Gemini voice name, use it directly
    const geminiVoiceNames = ['Kore', 'Aoede', 'Charon', 'Fenrir', 'Puck'];
    if (geminiVoiceNames.includes(voice)) {
      return voice;
    }
    
    // Otherwise map from legacy voice ID
    return VOICE_MAPPING[voice] || DEFAULT_GEMINI_VOICE;
  }

  private getToneInstruction(tone: string): string {
    const toneMap: Record<string, string> = {
      'calm': 'in a calm, soothing manner',
      'energetic': 'with energy and enthusiasm',
      'professional': 'in a clear, professional tone',
      'warm': 'with warmth and encouragement',
      'motivational': 'in an inspiring, motivational way',
      'gentle': 'gently and peacefully',
      // Add your custom tones here:
      'confident': 'with strong confidence and conviction',
      'focused': 'in a focused, determined manner',
      'relaxed': 'in a relaxed, easy-going way',
      'intense': 'with intensity and power',
    };
    
    return toneMap[tone] || '';
  }

  private async saveAudioToFile(audioData: ArrayBuffer): Promise<string> {
    // Generate unique filename
    // We convert PCM to WAV, so use .wav extension
    const filename = `gemini_tts_${Date.now()}.wav`;
    const fileUri = `${this.tempDir}${filename}`;
    
    // Convert ArrayBuffer to base64
    const base64 = this.arrayBufferToBase64(audioData);
    
    // Write to file
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Clean up old files
    this.cleanupOldFiles();
    
    return fileUri;
  }

  private convertPCMToWAV(pcmData: ArrayBuffer): ArrayBuffer {
    // Gemini returns L16 PCM at 24kHz
    const sampleRate = 24000;
    const bitsPerSample = 16;
    const channels = 1;
    
    const pcmLength = pcmData.byteLength;
    const wavLength = 44 + pcmLength; // WAV header is 44 bytes
    
    const buffer = new ArrayBuffer(wavLength);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, wavLength - 8, true); // File size - 8
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * bitsPerSample / 8, true); // ByteRate
    view.setUint16(32, channels * bitsPerSample / 8, true); // BlockAlign
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, pcmLength, true);
    
    // Copy PCM data
    const pcmView = new Uint8Array(pcmData);
    const wavView = new Uint8Array(buffer);
    wavView.set(pcmView, 44);
    
    return buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private async cleanupOldFiles() {
    try {
      const files = await FileSystem.readDirectoryAsync(this.tempDir);
      const now = Date.now();
      const maxAge = 10 * 60 * 1000; // 10 minutes
      
      for (const file of files) {
        const fileUri = `${this.tempDir}${file}`;
        const info = await FileSystem.getInfoAsync(fileUri);
        if (info.exists && info.modificationTime && (now - info.modificationTime > maxAge)) {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        }
      }
    } catch (error) {
      console.error('[GeminiTTS] Cleanup error:', error);
    }
  }

  async stopCurrentAudio(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch (error) {
        // Ignore errors when stopping
      }
      this.currentSound = null;
    }
  }

  async pauseCurrentAudio(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.pauseAsync();
      } catch (error) {
        console.error('Error pausing audio:', error);
      }
    }
  }

  async resumeCurrentAudio(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.playAsync();
      } catch (error) {
        console.error('Error resuming audio:', error);
      }
    }
  }

  getCurrentSound(): Audio.Sound | null {
    return this.currentSound;
  }

  // Get available Gemini voices
  static getAvailableVoices() {
    // Gemini has multiple voice options available (Orbit not currently supported)
    return [
      { id: 'Kore', name: 'Kore', description: 'Neutral, clear and professional', personality: 'Clear, friendly, natural' },
      { id: 'Aoede', name: 'Aoede', description: 'Warm and expressive', personality: 'Warm, expressive' },
      { id: 'Charon', name: 'Charon', description: 'Deep and authoritative', personality: 'Deep, authoritative' },
      { id: 'Fenrir', name: 'Fenrir', description: 'Energetic and dynamic', personality: 'Energetic, dynamic' },
      { id: 'Puck', name: 'Puck', description: 'Playful and light', personality: 'Playful, light' },
    ];
  }

  private async generateAudioWithRateLimit(
    text: string, 
    voice: string, 
    tone: string,
    speed: number
  ): Promise<ArrayBuffer | null> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await this.generateAudioWithGemini(text, voice, tone, speed);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      // Ensure at least 6 seconds between requests (10 requests per minute limit)
      if (timeSinceLastRequest < 6000) {
        await new Promise(resolve => setTimeout(resolve, 6000 - timeSinceLastRequest));
      }
      
      const request = this.requestQueue.shift();
      if (request) {
        this.lastRequestTime = Date.now();
        await request();
      }
    }
    
    this.isProcessingQueue = false;
  }
  
  // Cancel all pending requests
  cancelAllRequests(): void {
    // Clear the request queue
    this.requestQueue = [];
    
    // Cancel any active requests
    this.activeRequests.forEach(controller => {
      try {
        controller.abort();
      } catch (error) {
        // Ignore abort errors
      }
    });
    this.activeRequests.clear();
    
    // Stop current audio if playing
    this.stopCurrentAudio().catch(() => {});
    
    console.log('[GeminiTTS] All requests cancelled');
  }
}