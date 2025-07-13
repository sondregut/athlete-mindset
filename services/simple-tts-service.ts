import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { getOpenAIApiKey, OPENAI_TTS_ENDPOINT } from '@/config/api-config';

export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
export type TTSModel = 'tts-1' | 'tts-1-hd';

interface TTSOptions {
  voice?: TTSVoice;
  model?: TTSModel;
  speed?: number;
}

interface CacheEntry {
  uri: string;
  timestamp: number;
  text: string;
  voice: string;
  model: string;
  speed: number;
}

export class SimpleTTSService {
  private static instance: SimpleTTSService;
  private apiKey: string;
  private cacheDir: string;
  private currentSound: Audio.Sound | null = null;
  private cacheIndex: Map<string, CacheEntry> = new Map();
  private isInitialized = false;

  private constructor() {
    this.apiKey = getOpenAIApiKey();
    console.log('SimpleTTSService: API key loaded:', this.apiKey ? 'Yes' : 'No');
    console.log('SimpleTTSService: API key length:', this.apiKey?.length || 0);
    // Use document directory for persistent storage
    this.cacheDir = `${FileSystem.documentDirectory}tts-persistent-cache/`;
    this.initialize();
  }

  static getInstance(): SimpleTTSService {
    if (!SimpleTTSService.instance) {
      SimpleTTSService.instance = new SimpleTTSService();
    }
    return SimpleTTSService.instance;
  }

  private async initialize() {
    try {
      // Create cache directory
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }

      // Load cache index
      const cacheData = await AsyncStorage.getItem('simple-tts-cache-index');
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        this.cacheIndex = new Map(Object.entries(parsed));
        
        // Clean up stale entries
        await this.cleanupStaleEntries();
      }

      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      this.isInitialized = true;
      console.log('SimpleTTSService initialized with', this.cacheIndex.size, 'cached entries');
    } catch (error) {
      console.error('Failed to initialize TTS service:', error);
    }
  }

  private async cleanupStaleEntries() {
    const staleKeys: string[] = [];
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

    for (const [key, entry] of this.cacheIndex.entries()) {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(entry.uri);
      if (!fileInfo.exists) {
        staleKeys.push(key);
      } else if (now - entry.timestamp > maxAge) {
        // Remove old entries
        try {
          await FileSystem.deleteAsync(entry.uri, { idempotent: true });
          staleKeys.push(key);
        } catch (error) {
          console.warn('Failed to delete old cache file:', error);
        }
      }
    }

    // Remove stale entries from index
    if (staleKeys.length > 0) {
      console.log(`Cleaning up ${staleKeys.length} stale cache entries`);
      staleKeys.forEach(key => this.cacheIndex.delete(key));
      await this.saveCacheIndex();
    }
  }

  private async getCacheKey(text: string, options: TTSOptions): Promise<string> {
    const { voice = 'nova', model = 'tts-1', speed = 1.0 } = options;
    const keyString = `${text}-${voice}-${model}-${speed}`;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      keyString
    );
    return `tts_${hash.substring(0, 16)}`;
  }

  async synthesizeSpeech(text: string, options: TTSOptions = {}): Promise<string> {
    console.log('=== synthesizeSpeech called ===');
    console.log('Text:', text.substring(0, 50) + '...');
    console.log('Options:', options);
    
    if (!this.isInitialized) {
      console.log('Service not initialized, initializing now...');
      await this.initialize();
    }

    const { voice = 'nova', model = 'tts-1', speed = 1.0 } = options;
    const cacheKey = await this.getCacheKey(text, options);
    console.log('Cache key:', cacheKey);
    
    // Check cache
    const cached = this.cacheIndex.get(cacheKey);
    if (cached) {
      const fileInfo = await FileSystem.getInfoAsync(cached.uri);
      if (fileInfo.exists) {
        console.log('✅ Cache hit for:', cacheKey);
        return cached.uri;
      } else {
        // Remove stale entry
        console.log('Removing stale cache entry:', cacheKey);
        this.cacheIndex.delete(cacheKey);
        await this.saveCacheIndex();
      }
    }

    // Generate new audio
    console.log('❌ Cache miss - generating new audio for:', text.substring(0, 50) + '...');
    
    try {
      const audioUri = await this.generateAudio(text, options);
      
      // Save to cache
      const cacheUri = `${this.cacheDir}${cacheKey}.mp3`;
      await FileSystem.copyAsync({
        from: audioUri,
        to: cacheUri
      });

      // Update cache index with full metadata
      this.cacheIndex.set(cacheKey, {
        uri: cacheUri,
        timestamp: Date.now(),
        text,
        voice,
        model,
        speed
      });
      await this.saveCacheIndex();

      // Clean up temp file
      try {
        await FileSystem.deleteAsync(audioUri, { idempotent: true });
      } catch (error) {
        console.warn('Failed to clean up temp file:', error);
      }

      return cacheUri;
    } catch (error: any) {
      console.error('TTS synthesis failed:', error);
      throw new Error(`Speech synthesis failed: ${error.message}`);
    }
  }

  private async generateAudio(text: string, options: TTSOptions): Promise<string> {
    const { voice = 'nova', model = 'tts-1', speed = 1.0 } = options;
    
    console.log('=== generateAudio called ===');
    console.log('API Key exists:', !!this.apiKey);
    console.log('API Key starts with:', this.apiKey?.substring(0, 7));
    console.log('API Key ends with:', this.apiKey?.substring(this.apiKey.length - 4));
    
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const requestBody = {
      model,
      input: text,
      voice,
      speed,
      response_format: 'mp3'
    };

    console.log('Calling OpenAI TTS API...');
    console.log('Request details:', { 
      endpoint: OPENAI_TTS_ENDPOINT,
      method: 'POST',
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey.length,
      body: requestBody 
    });
    
    try {
      // Use standard fetch for the API call
      const response = await fetch(OPENAI_TTS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('API Response:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorText || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your OpenAI API key.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        throw new Error(`OpenAI API error: ${errorMessage}`);
      }

      // Get response as blob
      console.log('Converting response to blob...');
      const blob = await response.blob();
      console.log('Blob size:', blob.size, 'bytes');

      // Convert blob to base64
      console.log('Converting blob to base64...');
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Extract base64 from data URL
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      if (!base64) {
        throw new Error('Failed to convert audio to base64');
      }

      // Save to file
      const fileUri = `${FileSystem.cacheDirectory}tts_temp_${Date.now()}.mp3`;
      console.log('Saving audio to:', fileUri);
      
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Verify file was written
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      console.log('File saved successfully, size:', (fileInfo as any).size || 'unknown');

      return fileUri;
    } catch (error: any) {
      console.error('TTS generation failed:', error);
      
      if (error.message?.includes('Network request failed') || 
          error.message?.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  async playAudio(uri: string, options: { volume?: number } = {}): Promise<Audio.Sound> {
    try {
      // Stop and unload current sound if exists
      if (this.currentSound) {
        try {
          const status = await this.currentSound.getStatusAsync();
          if (status.isLoaded) {
            await this.currentSound.stopAsync();
            await this.currentSound.unloadAsync();
          }
        } catch (e) {
          console.warn('Error cleaning up previous sound:', e);
        }
        this.currentSound = null;
      }

      console.log('Creating audio from URI:', uri);
      
      // Verify file exists
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist at: ' + uri);
      }
      console.log('Audio file exists, size:', (fileInfo as any).size, 'bytes');

      // Create and play new sound
      console.log('Creating Audio.Sound with volume:', options.volume || 1.0);
      const { sound, status } = await Audio.Sound.createAsync(
        { uri },
        { 
          shouldPlay: true,
          volume: options.volume || 1.0,
        }
      );

      this.currentSound = sound;
      console.log('Audio created, initial status:', status);
      
      // Check if sound is actually playing
      if (status.isLoaded && !status.isPlaying) {
        console.log('Audio loaded but not playing, attempting to play manually');
        await sound.playAsync();
      }
      
      return sound;
    } catch (error) {
      console.error('Failed to play audio:', error);
      this.currentSound = null;
      throw error;
    }
  }

  async stopCurrentAudio(): Promise<void> {
    if (this.currentSound) {
      try {
        const status = await this.currentSound.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await this.currentSound.stopAsync();
          }
          await this.currentSound.unloadAsync();
        }
        this.currentSound = null;
      } catch (error) {
        console.error('Error stopping audio:', error);
        // Set to null even if error occurs
        this.currentSound = null;
      }
    }
  }

  private async saveCacheIndex() {
    const cacheData = Object.fromEntries(this.cacheIndex);
    await AsyncStorage.setItem('simple-tts-cache-index', JSON.stringify(cacheData));
  }

  async clearCache(): Promise<void> {
    try {
      await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
      await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      this.cacheIndex.clear();
      await AsyncStorage.removeItem('simple-tts-cache-index');
      console.log('TTS cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  async getCacheStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  }> {
    let totalSize = 0;
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;

    for (const entry of this.cacheIndex.values()) {
      const fileInfo = await FileSystem.getInfoAsync(entry.uri);
      if (fileInfo.exists) {
        totalSize += (fileInfo as any).size || 0;
        oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp);
        newestTimestamp = Math.max(newestTimestamp, entry.timestamp);
      }
    }

    return {
      totalEntries: this.cacheIndex.size,
      totalSize,
      oldestEntry: oldestTimestamp === Infinity ? null : new Date(oldestTimestamp),
      newestEntry: newestTimestamp === 0 ? null : new Date(newestTimestamp),
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async preloadVisualization(
    steps: Array<{ id: number; content: string }>,
    options: TTSOptions = {},
    onProgress?: (percent: number) => void
  ): Promise<Map<number, string>> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const preloadedAudio = new Map<number, string>();
    const totalSteps = steps.length;
    let completedSteps = 0;

    // Process in batches to avoid rate limits
    const batchSize = 3;
    
    console.log(`Starting preload of ${totalSteps} visualization steps...`);

    try {
      for (let i = 0; i < steps.length; i += batchSize) {
        const batch = steps.slice(i, i + batchSize);
        
        // Process batch in parallel
        const batchPromises = batch.map(async (step) => {
          try {
            const audioUri = await this.synthesizeSpeech(step.content, options);
            preloadedAudio.set(step.id, audioUri);
            completedSteps++;
            
            // Report progress
            const progress = Math.round((completedSteps / totalSteps) * 100);
            console.log(`Preloaded step ${step.id + 1}/${totalSteps} (${progress}%)`);
            
            if (onProgress) {
              onProgress(progress);
            }
            
            return { stepId: step.id, success: true };
          } catch (error) {
            console.error(`Failed to preload step ${step.id}:`, error);
            return { stepId: step.id, success: false, error };
          }
        });

        // Wait for batch to complete
        const results = await Promise.all(batchPromises);
        
        // Check if any failed
        const failures = results.filter(r => !r.success);
        if (failures.length > 0) {
          console.warn(`${failures.length} steps failed to preload in this batch`);
        }

        // Add delay between batches to avoid rate limits (except for last batch)
        if (i + batchSize < steps.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`Preloading complete. Successfully loaded ${preloadedAudio.size}/${totalSteps} steps`);
      
      // If we failed to load any steps, throw an error
      if (preloadedAudio.size === 0) {
        throw new Error('Failed to preload any audio steps');
      }

      return preloadedAudio;
    } catch (error) {
      console.error('Preloading failed:', error);
      throw error;
    }
  }
}