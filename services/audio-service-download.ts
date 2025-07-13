import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';

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

class AudioService {
  private static instance: AudioService;
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
    // Try multiple ways to get the API key
    let apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      apiKey = Constants.expoConfig?.extra?.openaiApiKey;
    }
    
    if (!apiKey) {
      // Try manifest for older Expo versions
      apiKey = Constants.manifest?.extra?.openaiApiKey;
    }
    
    if (!apiKey) {
      console.error('OpenAI API key not found in environment variables');
      throw new Error('OpenAI API key is required. Please add OPENAI_API_KEY to your .env file.');
    }
    
    this.apiKey = apiKey;
    
    // Log API key status (safely)
    console.log('API Key loaded:', this.apiKey ? `${this.apiKey.substring(0, 7)}...${this.apiKey.substring(this.apiKey.length - 4)}` : 'Not found');
    console.log('Constants.expoConfig:', Constants.expoConfig);
    console.log('Environment check:', {
      hasExpoConfig: !!Constants.expoConfig,
      hasExtra: !!Constants.expoConfig?.extra,
      hasApiKey: !!Constants.expoConfig?.extra?.openaiApiKey,
    });
    
    this.cacheDir = `${FileSystem.documentDirectory}audio-cache/`;
    this.initializeCache();
  }

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
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
        console.log('Returning cached audio:', cachedEntry.uri);
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
      console.error(`TTS attempt ${retryCount + 1} failed:`, error.message);
      
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
    
    const fileUri = `${this.cacheDir}${cacheKey}.mp3`;
    
    try {
      const requestBody = {
        model,
        input: text,
        voice,
        speed,
        response_format: 'mp3',
      };
      
      console.log('TTS Request:', { 
        model, 
        voice, 
        speed, 
        textLength: text.length,
        apiKey: this.apiKey ? 'Present' : 'Missing',
        fileUri 
      });
      
      // Use FileSystem.downloadAsync for better binary data handling
      console.log('Downloading audio from OpenAI...');
      const downloadResult = await FileSystem.downloadAsync(
        'https://api.openai.com/v1/audio/speech',
        fileUri,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          httpMethod: 'POST',
          body: JSON.stringify(requestBody),
        }
      );

      console.log('Download result:', {
        status: downloadResult.status,
        uri: downloadResult.uri,
        headers: downloadResult.headers,
      });

      if (downloadResult.status !== 200) {
        // Try to read error response
        let errorMessage = `HTTP ${downloadResult.status}`;
        try {
          const errorText = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          console.error('Error response:', errorText);
          
          // Try to parse JSON error
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error?.message || errorText;
          } catch {
            errorMessage = errorText || errorMessage;
          }
        } catch (e) {
          console.error('Failed to read error response:', e);
        }
        
        // Delete the error file
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
        
        throw new Error(`OpenAI API error: ${downloadResult.status} - ${errorMessage}`);
      }

      // Verify file was downloaded
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      console.log('File downloaded:', {
        exists: fileInfo.exists,
        size: (fileInfo as any).size || 'unknown',
        uri: fileUri,
      });

      if (!fileInfo.exists) {
        throw new Error('Audio file was not saved properly');
      }

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
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
      });
      
      // Clean up failed download
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch (cleanupError) {
        console.error('Failed to cleanup:', cleanupError);
      }
      
      throw error;
    }
  }

  async preloadAudio(texts: string[], options: TTSOptions = {}): Promise<void> {
    // Preload multiple audio files in parallel
    const promises = texts.map(text => this.synthesizeSpeech(text, options));
    await Promise.all(promises);
  }

  async playAudio(uri: string, options: { volume?: number } = {}): Promise<Audio.Sound> {
    try {
      console.log('Playing audio from:', uri);
      
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
      
      // Create a simple test request
      const testUri = `${this.cacheDir}test-${Date.now()}.json`;
      
      const downloadResult = await FileSystem.downloadAsync(
        'https://api.openai.com/v1/models',
        testUri,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      
      console.log('API test response:', downloadResult.status);
      
      // Clean up test file
      await FileSystem.deleteAsync(testUri, { idempotent: true });
      
      if (downloadResult.status === 401) {
        console.error('API Key is invalid or expired');
        return false;
      }
      
      return downloadResult.status >= 200 && downloadResult.status < 300;
    } catch (error: any) {
      console.error('API test failed:', error);
      return false;
    }
  }

  async testNetworkConnectivity(): Promise<boolean> {
    try {
      const testUri = `${this.cacheDir}network-test-${Date.now()}.txt`;
      
      const downloadResult = await FileSystem.downloadAsync(
        'https://www.google.com/robots.txt',
        testUri
      );
      
      // Clean up test file
      await FileSystem.deleteAsync(testUri, { idempotent: true });
      
      return downloadResult.status >= 200 && downloadResult.status < 300;
    } catch (error) {
      console.error('No network connectivity');
      return false;
    }
  }
}

export default AudioService;