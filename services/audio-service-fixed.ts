import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
export type TTSModel = 'tts-1' | 'tts-1-hd';

interface AudioCacheEntry {
  uri: string;
  timestamp: number;
  hash: string;
}

interface TTSOptions {
  voice?: TTSVoice;
  model?: TTSModel;
  speed?: number; // 0.25 to 4.0
}

class AudioServiceFixed {
  private static instance: AudioServiceFixed;
  private apiKey: string;
  private cacheDir: string;
  private cacheIndex: Map<string, AudioCacheEntry> = new Map();
  private audioQueue: Map<string, Promise<string>> = new Map();
  private currentSound: Audio.Sound | null = null;
  private requestQueue: Promise<any> = Promise.resolve();
  private lastRequestTime: number = 0;
  private failureCount: number = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests
  private readonly MAX_FAILURES = 3;

  private constructor() {
    const apiKey = Constants.expoConfig?.extra?.openaiApiKey;
    if (!apiKey) {
      console.error('OpenAI API key not found in environment variables');
      throw new Error('OpenAI API key is required. Please add OPENAI_API_KEY to your .env file.');
    }
    this.apiKey = apiKey;
    
    // Log API key status (safely)
    console.log('API Key loaded:', this.apiKey ? `${this.apiKey.substring(0, 7)}...${this.apiKey.substring(this.apiKey.length - 4)}` : 'Not found');
    
    this.cacheDir = `${FileSystem.documentDirectory}audio-cache/`;
    this.initializeCache();
  }

  static getInstance(): AudioServiceFixed {
    if (!AudioServiceFixed.instance) {
      AudioServiceFixed.instance = new AudioServiceFixed();
    }
    return AudioServiceFixed.instance;
  }

  private async initializeCache() {
    try {
      console.log('Initializing audio cache at:', this.cacheDir);
      
      // Create cache directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      console.log('Cache directory exists:', dirInfo.exists);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
        console.log('Created cache directory');
      }

      // Load cache index from AsyncStorage
      const cacheIndexString = await AsyncStorage.getItem('audio-cache-index');
      if (cacheIndexString) {
        const cacheData = JSON.parse(cacheIndexString);
        this.cacheIndex = new Map(Object.entries(cacheData));
      }

      // Clean up old cache entries (older than 7 days)
      await this.cleanupCache();
    } catch (error) {
      console.error('Failed to initialize audio cache:', error);
    }
  }

  private async cleanupCache() {
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const [key, entry] of this.cacheIndex.entries()) {
      if (now - entry.timestamp > maxAge) {
        try {
          await FileSystem.deleteAsync(entry.uri, { idempotent: true });
          this.cacheIndex.delete(key);
        } catch (error) {
          console.error('Failed to delete cached audio:', error);
        }
      }
    }

    await this.saveCacheIndex();
  }

  private async saveCacheIndex() {
    const cacheData = Object.fromEntries(this.cacheIndex);
    await AsyncStorage.setItem('audio-cache-index', JSON.stringify(cacheData));
  }

  private async generateCacheKey(text: string, options: TTSOptions): Promise<string> {
    const keyString = `${text}-${options.voice || 'alloy'}-${options.model || 'tts-1'}-${options.speed || 1.0}`;
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, keyString);
  }

  async synthesizeSpeech(text: string, options: TTSOptions = {}): Promise<string> {
    const { voice = 'nova', model = 'tts-1', speed = 1.0 } = options;
    
    // Generate cache key
    const cacheKey = await this.generateCacheKey(text, options);
    
    // Check if already in queue
    if (this.audioQueue.has(cacheKey)) {
      return this.audioQueue.get(cacheKey)!;
    }

    // Check cache
    const cachedEntry = this.cacheIndex.get(cacheKey);
    if (cachedEntry) {
      const fileInfo = await FileSystem.getInfoAsync(cachedEntry.uri);
      if (fileInfo.exists) {
        return cachedEntry.uri;
      } else {
        // Cache entry exists but file is missing, remove from index
        this.cacheIndex.delete(cacheKey);
      }
    }

    // Create promise for this synthesis request with rate limiting
    const synthesisPromise = this.requestQueue.then(async () => {
      // Enforce minimum interval between requests
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest));
      }
      
      this.lastRequestTime = Date.now();
      return this.performSynthesisWithRetry(text, voice, model, speed, cacheKey);
    });

    this.audioQueue.set(cacheKey, synthesisPromise);
    this.requestQueue = synthesisPromise.catch(() => {}); // Continue queue even if this request fails

    try {
      const uri = await synthesisPromise;
      return uri;
    } finally {
      this.audioQueue.delete(cacheKey);
    }
  }

  private async performSynthesisWithRetry(
    text: string,
    voice: TTSVoice,
    model: TTSModel,
    speed: number,
    cacheKey: string,
    retryCount: number = 0
  ): Promise<string> {
    try {
      const result = await this.performSynthesis(text, voice, model, speed, cacheKey);
      this.failureCount = 0; // Reset failure count on success
      return result;
    } catch (error: any) {
      const isRateLimitError = error.message?.includes('429');
      const maxRetries = isRateLimitError ? 3 : 1;
      
      if (retryCount < maxRetries && this.failureCount < this.MAX_FAILURES) {
        if (isRateLimitError) {
          // Exponential backoff for rate limit errors
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          console.log(`Rate limited, retrying after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.failureCount++;
        return this.performSynthesisWithRetry(text, voice, model, speed, cacheKey, retryCount + 1);
      }
      
      throw error;
    }
  }

  private async performSynthesis(
    text: string, 
    voice: TTSVoice, 
    model: TTSModel, 
    speed: number,
    cacheKey: string
  ): Promise<string> {
    console.log(`Starting TTS synthesis for text: "${text.substring(0, 50)}..."`);
    
    try {
      // Test network connectivity first
      const hasNetwork = await this.testNetworkConnectivity();
      if (!hasNetwork) {
        throw new Error('No network connectivity. Please check your internet connection.');
      }
      
      console.log('Making TTS API request...');
      console.log('Platform:', Platform.OS);
      
      // CRITICAL FIX: Use XMLHttpRequest for React Native instead of fetch
      // This is a known issue with some React Native/Expo configurations
      if (Platform.OS !== 'web') {
        return await this.performSynthesisWithXHR(text, voice, model, speed, cacheKey);
      }
      
      // Original fetch implementation for web
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: text,
          voice,
          speed,
          response_format: 'mp3',
        }),
      });

      console.log('TTS Response status:', response.status);

      if (!response.ok) {
        let errorMessage = `${response.status} ${response.statusText}`;
        try {
          const errorBody = await response.text();
          console.error('OpenAI API Error Response:', errorBody);
          errorMessage = errorBody || errorMessage;
        } catch (e) {
          console.error('Failed to read error response:', e);
        }
        
        throw new Error(`OpenAI API error: ${response.status} - ${errorMessage}`);
      }

      // Get audio data as blob
      console.log('Converting response to blob...');
      const audioBlob = await response.blob();
      console.log('Blob size:', audioBlob.size, 'bytes');
      
      // Convert blob to base64
      const base64Audio = await this.blobToBase64(audioBlob);

      // Save to cache
      const fileUri = `${this.cacheDir}${cacheKey}.mp3`;
      console.log('Saving to cache:', fileUri);
      
      await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Update cache index
      this.cacheIndex.set(cacheKey, {
        uri: fileUri,
        timestamp: Date.now(),
        hash: cacheKey,
      });
      await this.saveCacheIndex();

      console.log('TTS synthesis complete:', fileUri);
      return fileUri;
    } catch (error: any) {
      console.error('Speech synthesis failed:', error);
      throw error;
    }
  }

  // Alternative implementation using XMLHttpRequest for React Native
  private async performSynthesisWithXHR(
    text: string,
    voice: TTSVoice,
    model: TTSModel,
    speed: number,
    cacheKey: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log('Using XMLHttpRequest for TTS API call...');
      
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://api.openai.com/v1/audio/speech', true);
      xhr.setRequestHeader('Authorization', `Bearer ${this.apiKey}`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.responseType = 'blob';
      
      xhr.onload = async () => {
        console.log('XHR Response status:', xhr.status);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const audioBlob = xhr.response;
            console.log('XHR Blob received, size:', audioBlob.size);
            
            // Convert blob to base64
            const base64Audio = await this.blobToBase64(audioBlob);
            
            // Save to cache
            const fileUri = `${this.cacheDir}${cacheKey}.mp3`;
            await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
              encoding: FileSystem.EncodingType.Base64,
            });
            
            // Update cache index
            this.cacheIndex.set(cacheKey, {
              uri: fileUri,
              timestamp: Date.now(),
              hash: cacheKey,
            });
            await this.saveCacheIndex();
            
            resolve(fileUri);
          } catch (error) {
            reject(error);
          }
        } else {
          // Try to read error response
          const reader = new FileReader();
          reader.onloadend = () => {
            const errorText = reader.result as string;
            console.error('XHR Error response:', errorText);
            reject(new Error(`OpenAI API error: ${xhr.status} - ${errorText}`));
          };
          reader.readAsText(xhr.response);
        }
      };
      
      xhr.onerror = () => {
        console.error('XHR Network error');
        reject(new Error('Network request failed - XMLHttpRequest error'));
      };
      
      xhr.ontimeout = () => {
        console.error('XHR Timeout');
        reject(new Error('Request timeout'));
      };
      
      xhr.timeout = 30000; // 30 second timeout
      
      const requestBody = JSON.stringify({
        model,
        input: text,
        voice,
        speed,
        response_format: 'mp3',
      });
      
      console.log('Sending XHR request...');
      xhr.send(requestBody);
    });
  }

  // Helper method to convert blob to base64
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async preloadAudio(texts: string[], options: TTSOptions = {}): Promise<void> {
    // Preload multiple audio files in parallel
    const promises = texts.map(text => this.synthesizeSpeech(text, options));
    await Promise.all(promises);
  }

  async playAudio(uri: string, options: { volume?: number } = {}): Promise<Audio.Sound> {
    try {
      // Stop current sound if playing
      if (this.currentSound) {
        await this.currentSound.unloadAsync();
      }

      // Create and load new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { 
          shouldPlay: true,
          volume: options.volume || 1.0,
        }
      );

      this.currentSound = sound;
      return sound;
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  async stopCurrentAudio(): Promise<void> {
    if (this.currentSound) {
      await this.currentSound.stopAsync();
      await this.currentSound.unloadAsync();
      this.currentSound = null;
    }
  }

  async pauseCurrentAudio(): Promise<void> {
    if (this.currentSound) {
      await this.currentSound.pauseAsync();
    }
  }

  async resumeCurrentAudio(): Promise<void> {
    if (this.currentSound) {
      await this.currentSound.playAsync();
    }
  }

  async clearCache(): Promise<void> {
    try {
      // Delete all cached files
      await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
      await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      
      // Clear cache index
      this.cacheIndex.clear();
      await AsyncStorage.removeItem('audio-cache-index');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  getCacheSize(): number {
    return this.cacheIndex.size;
  }

  resetFailureCount(): void {
    this.failureCount = 0;
  }

  async testAPIKey(): Promise<boolean> {
    try {
      console.log('Testing OpenAI API key...');
      
      // For React Native, use XMLHttpRequest for better compatibility
      if (Platform.OS !== 'web') {
        return await this.testAPIKeyWithXHR();
      }
      
      // Web implementation
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      
      console.log('API test response:', testResponse.status);
      
      if (testResponse.status === 401) {
        console.error('API Key is invalid or expired');
        return false;
      }
      
      return testResponse.ok;
    } catch (error: any) {
      console.error('API test failed:', error);
      return false;
    }
  }

  private async testAPIKeyWithXHR(): Promise<boolean> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://api.openai.com/v1/models', true);
      xhr.setRequestHeader('Authorization', `Bearer ${this.apiKey}`);
      
      xhr.onload = () => {
        console.log('XHR API test response:', xhr.status);
        if (xhr.status === 401) {
          console.error('API Key is invalid or expired');
          resolve(false);
        } else {
          resolve(xhr.status >= 200 && xhr.status < 300);
        }
      };
      
      xhr.onerror = () => {
        console.error('XHR API test network error');
        resolve(false);
      };
      
      xhr.timeout = 10000;
      xhr.send();
    });
  }

  async testNetworkConnectivity(): Promise<boolean> {
    try {
      // Use a simple HEAD request for faster response
      const response = await fetch('https://www.google.com/robots.txt', {
        method: 'HEAD',
      });
      return response.ok;
    } catch (error) {
      console.error('No network connectivity');
      return false;
    }
  }

  // Debug method to test different approaches
  async debugNetworkIssue(): Promise<void> {
    console.log('=== Debugging Network Issue ===');
    console.log('Platform:', Platform.OS);
    console.log('Dev mode:', __DEV__);
    
    // Test 1: Basic fetch
    try {
      console.log('\n1. Testing basic fetch to Google...');
      const googleResponse = await fetch('https://www.google.com/robots.txt');
      console.log('Google fetch successful:', googleResponse.status);
    } catch (error: any) {
      console.error('Google fetch failed:', error.message);
    }
    
    // Test 2: XMLHttpRequest to Google
    try {
      console.log('\n2. Testing XMLHttpRequest to Google...');
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://www.google.com/robots.txt', true);
        xhr.onload = () => {
          console.log('Google XHR successful:', xhr.status);
          resolve(true);
        };
        xhr.onerror = () => {
          console.error('Google XHR failed');
          reject(new Error('XHR failed'));
        };
        xhr.send();
      });
    } catch (error: any) {
      console.error('Google XHR error:', error.message);
    }
    
    // Test 3: Fetch to OpenAI
    try {
      console.log('\n3. Testing fetch to OpenAI...');
      const openaiResponse = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      console.log('OpenAI fetch successful:', openaiResponse.status);
    } catch (error: any) {
      console.error('OpenAI fetch failed:', error.message);
    }
    
    // Test 4: XMLHttpRequest to OpenAI
    try {
      console.log('\n4. Testing XMLHttpRequest to OpenAI...');
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://api.openai.com/v1/models', true);
        xhr.setRequestHeader('Authorization', `Bearer ${this.apiKey}`);
        xhr.onload = () => {
          console.log('OpenAI XHR successful:', xhr.status);
          resolve(true);
        };
        xhr.onerror = () => {
          console.error('OpenAI XHR failed');
          reject(new Error('XHR failed'));
        };
        xhr.send();
      });
    } catch (error: any) {
      console.error('OpenAI XHR error:', error.message);
    }
    
    console.log('\n=== Debug Complete ===');
  }
}

export default AudioServiceFixed;