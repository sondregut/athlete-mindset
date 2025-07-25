import * as FileSystem from 'expo-file-system';
import { GeminiCoreService } from './gemini-core-service';
import { geminiQuotaManager } from './gemini-quota-manager';
import { smartLogger } from '@/utils/smart-logger';

// Handle both React Native and Node.js environments
let GEMINI_API_KEY: string | undefined;
try {
  // Try React Native environment
  const env = require('@env');
  GEMINI_API_KEY = env.GEMINI_API_KEY;
} catch {
  // Fall back to Node.js environment
  GEMINI_API_KEY = process.env.GEMINI_API_KEY;
}

export interface GeminiTTSOptions {
  voice?: string;
  model?: string;
  speed?: number;
  volume?: number;
  tone?: string;
}

export class GeminiTTSRestService {
  private static instance: GeminiTTSRestService;
  private tempDir: string;
  private lastRequestTime: number = 0;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue: boolean = false;

  private constructor() {
    this.tempDir = `${FileSystem.cacheDirectory}gemini-tts/`;
    this.initializeTempDir();
  }

  static getInstance(): GeminiTTSRestService {
    if (!GeminiTTSRestService.instance) {
      GeminiTTSRestService.instance = new GeminiTTSRestService();
    }
    return GeminiTTSRestService.instance;
  }

  private async initializeTempDir() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.tempDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.tempDir, { intermediates: true });
      }
    } catch (error) {
      console.error('[GeminiTTSRest] Failed to create temp directory:', error);
    }
  }

  async generateAudioWithREST(
    text: string,
    voice: string = 'Kore',
    tone: string = 'calm',
    speed: number = 1.0
  ): Promise<ArrayBuffer | null> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }
    
    // Check quota before making request
    const quotaCheck = await geminiQuotaManager.canMakeRequest();
    if (!quotaCheck.allowed) {
      console.error('[GeminiTTSRest] Request blocked by quota manager:', quotaCheck.reason);
      throw new Error(`Quota limit reached: ${quotaCheck.reason}`);
    }

    const model = 'gemini-2.5-flash-preview-tts';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const requestBody = {
      contents: [{
        parts: [{
          text: text
        }]
      }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice
            }
          }
        }
      }
    };

    try {
      // Record the request
      await geminiQuotaManager.recordRequest();
      
      console.log('[GeminiTTSRest] Making REST API request for TTS');
      console.log('[GeminiTTSRest] Voice:', voice, 'Model:', model);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[GeminiTTSRest] API Error:', response.status, errorText);
        
        // Special handling for quota errors
        if (response.status === 429) {
          let errorObj;
          try {
            errorObj = JSON.parse(errorText);
          } catch (e) {
            // If parsing fails, use the raw text
          }
          
          console.error('[GeminiTTSRest] ❌ QUOTA EXCEEDED - You have hit your daily API limit');
          console.error('[GeminiTTSRest] 📊 Check your usage at: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas');
          console.error('[GeminiTTSRest] 💳 Check billing at: https://console.cloud.google.com/billing');
          console.error('[GeminiTTSRest] ⏰ Quotas reset at midnight Pacific Time');
          
          if (errorObj?.error?.details) {
            errorObj.error.details.forEach((detail: any) => {
              if (detail.violations) {
                detail.violations.forEach((violation: any) => {
                  console.error(`[GeminiTTSRest] Quota metric: ${violation.quotaMetric}`);
                });
              }
            });
          }
          
          // Record quota error
          await geminiQuotaManager.recordQuotaError();
        }
        
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      // Check for audio data in response
      if (data.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const audioData = data.candidates[0].content.parts[0].inlineData;
        console.log('[GeminiTTSRest] Received audio data, mimeType:', audioData.mimeType);
        
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

      console.error('[GeminiTTSRest] No audio data in response');
      return null;
    } catch (error: any) {
      console.error('[GeminiTTSRest] Request failed:', error);
      throw error;
    }
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

  async saveAudioToFile(audioData: ArrayBuffer): Promise<string> {
    // Generate unique filename
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
      console.error('[GeminiTTSRest] Cleanup error:', error);
    }
  }

  // Rate limiting wrapper
  async generateAudioWithRateLimit(
    text: string,
    voice: string,
    tone: string,
    speed: number
  ): Promise<ArrayBuffer | null> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await this.generateAudioWithREST(text, voice, tone, speed);
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
}