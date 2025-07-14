import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { Audio } from 'expo-av';
import { TTSMemoryCache } from './tts-memory-cache';
import { TTSFirebaseCache } from './tts-firebase-cache';
import { TTSOpenAIService, TTSVoice, TTSModel } from './tts-openai-service';

export { TTSVoice, TTSModel };

interface TTSOptions {
  voice?: TTSVoice;
  model?: TTSModel;
  speed?: number;
}

interface LocalCacheEntry {
  key: string;
  uri: string;
  metadata: {
    text: string;
    voice: string;
    speed: number;
    model: string;
    createdAt: number;
    lastAccessed: number;
    accessCount: number;
    fileSize: number;
  };
}

export class TTSCacheService {
  private static instance: TTSCacheService;
  
  private memoryCache: TTSMemoryCache;
  private firebaseCache: TTSFirebaseCache;
  private openaiService: TTSOpenAIService;
  
  private cacheDir: string;
  private localCacheIndex: Map<string, LocalCacheEntry> = new Map();
  private maxLocalCacheSize = 100 * 1024 * 1024; // 100MB
  private currentLocalCacheSize = 0;
  
  private currentSound: Audio.Sound | null = null;

  private constructor() {
    this.memoryCache = new TTSMemoryCache(50); // 50MB memory cache
    this.firebaseCache = new TTSFirebaseCache();
    this.openaiService = new TTSOpenAIService();
    
    this.cacheDir = `${FileSystem.documentDirectory}tts-cache/`;
    this.initializeCache();
  }

  static getInstance(): TTSCacheService {
    if (!TTSCacheService.instance) {
      TTSCacheService.instance = new TTSCacheService();
    }
    return TTSCacheService.instance;
  }

  private async initializeCache() {
    try {
      console.log('Initializing TTS cache system...');
      
      // Create cache directory
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }
      
      // Load local cache index
      const indexString = await AsyncStorage.getItem('tts-cache-index');
      if (indexString) {
        const indexData = JSON.parse(indexString);
        this.localCacheIndex = new Map(Object.entries(indexData));
        
        // Calculate current cache size
        this.currentLocalCacheSize = 0;
        for (const entry of this.localCacheIndex.values()) {
          this.currentLocalCacheSize += entry.metadata.fileSize;
        }
      }
      
      // Clean up old entries
      await this.cleanupLocalCache();
      
      // Preload popular content from Firebase
      await this.firebaseCache.preloadPopular();
      
      console.log('TTS cache system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TTS cache:', error);
    }
  }

  async synthesizeSpeech(text: string, options: TTSOptions = {}): Promise<string> {
    const { voice = 'nova', model = 'tts-1', speed = 1.0 } = options;
    
    // Generate cache key
    const cacheKey = await this.generateCacheKey(text, { voice, model, speed });
    
    console.log(`TTS request for key: ${cacheKey}`);
    
    // 1. Check memory cache
    const memoryCached = this.memoryCache.get(cacheKey);
    if (memoryCached) {
      console.log('✅ Memory cache hit');
      return memoryCached;
    }
    
    // 2. Check local file cache
    const localCached = await this.getFromLocalCache(cacheKey);
    if (localCached) {
      console.log('✅ Local cache hit');
      // Add to memory cache
      const fileInfo = await FileSystem.getInfoAsync(localCached);
      this.memoryCache.set(cacheKey, localCached, (fileInfo as any).size || 0);
      return localCached;
    }
    
    // 3. Check Firebase cache
    const firebaseCached = await this.firebaseCache.get(cacheKey);
    if (firebaseCached) {
      console.log('✅ Firebase cache hit');
      // Download and cache locally
      const localUri = await this.downloadAndCacheLocally(cacheKey, firebaseCached, {
        text, voice, speed, model
      });
      return localUri;
    }
    
    // 4. Generate via OpenAI API
    console.log('❌ Cache miss - generating via OpenAI API');
    const audioBlob = await this.openaiService.synthesizeSpeech(text, { voice, model, speed });
    
    // Save to all cache layers
    const localUri = await this.saveToAllCaches(cacheKey, audioBlob, {
      text, voice, speed, model
    });
    
    return localUri;
  }

  private async generateCacheKey(text: string, options: TTSOptions): Promise<string> {
    const keyString = `${text}-${options.voice}-${options.model}-${options.speed}`;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      keyString
    );
    return `tts_${hash.substring(0, 16)}`;
  }

  private async getFromLocalCache(key: string): Promise<string | null> {
    const entry = this.localCacheIndex.get(key);
    if (!entry) return null;
    
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(entry.uri);
    if (!fileInfo.exists) {
      // Remove from index if file is missing
      this.localCacheIndex.delete(key);
      await this.saveLocalCacheIndex();
      return null;
    }
    
    // Update access metrics
    entry.metadata.lastAccessed = Date.now();
    entry.metadata.accessCount++;
    await this.saveLocalCacheIndex();
    
    return entry.uri;
  }

  private async downloadAndCacheLocally(
    key: string,
    url: string,
    metadata: { text: string; voice: string; speed: number; model: string }
  ): Promise<string> {
    const localUri = `${this.cacheDir}${key}.mp3`;
    
    // Download file
    const downloadResult = await FileSystem.downloadAsync(url, localUri);
    
    if (downloadResult.status !== 200) {
      throw new Error(`Failed to download from Firebase: ${downloadResult.status}`);
    }
    
    // Get file size
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    const fileSize = (fileInfo as any).size || 0;
    
    // Add to local cache index
    const entry: LocalCacheEntry = {
      key,
      uri: localUri,
      metadata: {
        ...metadata,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 1,
        fileSize,
      },
    };
    
    this.localCacheIndex.set(key, entry);
    this.currentLocalCacheSize += fileSize;
    await this.saveLocalCacheIndex();
    
    // Add to memory cache
    this.memoryCache.set(key, localUri, fileSize);
    
    // Trigger cleanup if needed
    if (this.currentLocalCacheSize > this.maxLocalCacheSize) {
      setTimeout(() => this.cleanupLocalCache(), 1000);
    }
    
    return localUri;
  }

  private async saveToAllCaches(
    key: string,
    audioBlob: Blob,
    metadata: { text: string; voice: string; speed: number; model: string }
  ): Promise<string> {
    // Save to local file system
    const localUri = `${this.cacheDir}${key}.mp3`;
    
    // Convert blob to base64
    const base64Audio = await this.blobToBase64(audioBlob);
    
    // Save to file system
    await FileSystem.writeAsStringAsync(localUri, base64Audio, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Get file size
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    const fileSize = (fileInfo as any).size || audioBlob.size;
    
    // Add to local cache index
    const entry: LocalCacheEntry = {
      key,
      uri: localUri,
      metadata: {
        ...metadata,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 1,
        fileSize,
      },
    };
    
    this.localCacheIndex.set(key, entry);
    this.currentLocalCacheSize += fileSize;
    await this.saveLocalCacheIndex();
    
    // Add to memory cache
    this.memoryCache.set(key, localUri, fileSize);
    
    // Firebase uploads disabled for React Native/Expo Go compatibility
    // Skip Firebase upload to prevent blob creation errors
    
    return localUri;
  }

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

  private async saveLocalCacheIndex() {
    const indexData = Object.fromEntries(this.localCacheIndex);
    await AsyncStorage.setItem('tts-cache-index', JSON.stringify(indexData));
  }

  private async cleanupLocalCache() {
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    for (const [key, entry] of this.localCacheIndex.entries()) {
      // Remove old entries
      if (now - entry.metadata.createdAt > maxAge) {
        await this.removeFromLocalCache(key);
      }
    }
    
    // If still over size limit, remove least recently used
    while (this.currentLocalCacheSize > this.maxLocalCacheSize && this.localCacheIndex.size > 0) {
      let lruKey: string | null = null;
      let lruTime = Infinity;
      
      for (const [key, entry] of this.localCacheIndex.entries()) {
        if (entry.metadata.lastAccessed < lruTime) {
          lruTime = entry.metadata.lastAccessed;
          lruKey = key;
        }
      }
      
      if (lruKey) {
        await this.removeFromLocalCache(lruKey);
      } else {
        break;
      }
    }
  }

  private async removeFromLocalCache(key: string) {
    const entry = this.localCacheIndex.get(key);
    if (!entry) return;
    
    try {
      await FileSystem.deleteAsync(entry.uri, { idempotent: true });
      this.currentLocalCacheSize -= entry.metadata.fileSize;
      this.localCacheIndex.delete(key);
      console.log(`Removed from local cache: ${key}`);
    } catch (error) {
      console.error(`Failed to remove ${key} from local cache:`, error);
    }
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

  async getCacheStats() {
    const memoryStats = this.memoryCache.getStats();
    const firebaseStats = await this.firebaseCache.getStats();
    
    return {
      memory: memoryStats,
      local: {
        entries: this.localCacheIndex.size,
        currentSize: this.currentLocalCacheSize,
        maxSize: this.maxLocalCacheSize,
      },
      firebase: firebaseStats,
    };
  }

  async clearAllCaches() {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear local cache
    await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
    await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
    this.localCacheIndex.clear();
    this.currentLocalCacheSize = 0;
    await AsyncStorage.removeItem('tts-cache-index');
    
    console.log('All TTS caches cleared');
  }
}