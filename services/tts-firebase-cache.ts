import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  increment,
  Firestore
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes,
  uploadString, 
  getDownloadURL,
  FirebaseStorage 
} from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { Audio } from 'expo-av';
import { firebaseTTSConfig } from '@/config/firebase-tts-config';
import { getOpenAIApiKey, OPENAI_TTS_ENDPOINT } from '@/config/api-config';
import { environmentDetection } from './environment-detection';
import { TTSFirebaseClient } from './tts-firebase-client';

export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
export type TTSModel = 'tts-1' | 'tts-1-hd';

interface TTSOptions {
  voice?: TTSVoice;
  model?: TTSModel;
  speed?: number;
  isPersonalized?: boolean;
}

interface CacheEntry {
  text: string;
  voice: string;
  model: string;
  speed: number;
  storageUrl: string;
  fileSize: number;
  createdAt: any;
  accessCount: number;
  lastAccessed: any;
  hash: string;
}

interface LocalCacheEntry {
  uri: string;
  timestamp: number;
  firebaseUrl?: string;
}

export class TTSFirebaseCache {
  private static instance: TTSFirebaseCache;
  private app: FirebaseApp;
  private db: Firestore;
  private storage: FirebaseStorage;
  private apiKey: string;
  private localCacheDir: string;
  private memoryCache: Map<string, string> = new Map();
  private localCacheIndex: Map<string, LocalCacheEntry> = new Map();
  private currentSound: Audio.Sound | null = null;
  private isInitialized = false;
  private readonly MAX_MEMORY_CACHE = 50; // 50 items in memory
  private readonly MAX_LOCAL_CACHE_SIZE = 100 * 1024 * 1024; // 100MB local
  private currentLocalCacheSize = 0;
  private isPlayingAudio = false;
  private useClientSDK = false;
  private clientSDK: TTSFirebaseClient | null = null;

  private constructor() {
    this.apiKey = getOpenAIApiKey();
    this.localCacheDir = `${FileSystem.documentDirectory}tts-firebase-cache/`;
    
    // Initialize Firebase
    if (!getApps().length) {
      this.app = initializeApp(firebaseTTSConfig);
    } else {
      this.app = getApps()[0];
    }
    
    this.db = getFirestore(this.app);
    this.storage = getStorage(this.app);
    
    this.initialize();
  }

  static getInstance(): TTSFirebaseCache {
    if (!TTSFirebaseCache.instance) {
      TTSFirebaseCache.instance = new TTSFirebaseCache();
    }
    return TTSFirebaseCache.instance;
  }

  private async initialize() {
    try {
      // Check environment and decide which SDK to use
      const envInfo = await environmentDetection.getEnvironmentInfo();
      this.useClientSDK = envInfo.useClientSDK;
      
      console.log(`TTS Cache: Using ${this.useClientSDK ? 'Client' : 'Admin'} SDK mode`);
      
      if (this.useClientSDK) {
        // Initialize client SDK
        this.clientSDK = new TTSFirebaseClient(this.app);
        await this.clientSDK.isReady(); // Ensure auth is ready
      }
      
      // Create local cache directory
      const dirInfo = await FileSystem.getInfoAsync(this.localCacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.localCacheDir, { intermediates: true });
      }

      // Load local cache index
      const cacheData = await AsyncStorage.getItem('tts-firebase-cache-index');
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        this.localCacheIndex = new Map(Object.entries(parsed));
        await this.calculateLocalCacheSize();
      }

      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      this.isInitialized = true;
      console.log('TTSFirebaseCache initialized');
      console.log(`SDK Mode: ${this.useClientSDK ? 'Client' : 'Admin'}`);
      console.log(`Memory cache: ${this.memoryCache.size} items`);
      console.log(`Local cache: ${this.localCacheIndex.size} files, ${(this.currentLocalCacheSize / 1024 / 1024).toFixed(2)}MB`);
    } catch (error) {
      console.error('Failed to initialize TTS Firebase cache:', error);
    }
  }

  private async calculateLocalCacheSize() {
    this.currentLocalCacheSize = 0;
    const staleKeys: string[] = [];

    for (const [key, entry] of this.localCacheIndex.entries()) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(entry.uri);
        if (fileInfo.exists && 'size' in fileInfo) {
          this.currentLocalCacheSize += fileInfo.size;
        } else {
          staleKeys.push(key);
        }
      } catch (error) {
        staleKeys.push(key);
      }
    }

    // Remove stale entries
    for (const key of staleKeys) {
      this.localCacheIndex.delete(key);
    }

    if (staleKeys.length > 0) {
      await this.saveLocalCacheIndex();
    }
  }

  private async getCacheKey(text: string, options: TTSOptions): Promise<string> {
    const { voice = 'nova', model = 'tts-1', speed = 1.0, isPersonalized = false } = options;
    const keyString = `${text}-${voice}-${model}-${speed}-${isPersonalized ? 'personalized' : 'original'}`;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      keyString
    );
    return hash.substring(0, 16);
  }

  async synthesizeSpeech(text: string, options: TTSOptions = {}): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const cacheKey = await this.getCacheKey(text, options);
    console.log(`TTS request for key: ${cacheKey}`);

    // 1. Check memory cache
    if (this.memoryCache.has(cacheKey)) {
      console.log('✅ Memory cache hit');
      return this.memoryCache.get(cacheKey)!;
    }

    // 2. Check local cache
    const localEntry = this.localCacheIndex.get(cacheKey);
    if (localEntry) {
      const fileInfo = await FileSystem.getInfoAsync(localEntry.uri);
      if (fileInfo.exists) {
        console.log('✅ Local cache hit');
        this.addToMemoryCache(cacheKey, localEntry.uri);
        
        // Update access time in Firestore (async, don't wait)
        this.updateFirestoreAccess(cacheKey).catch(console.error);
        
        return localEntry.uri;
      }
    }

    // 3. Check Firebase
    try {
      const firebaseUrl = await this.getFromFirebase(cacheKey);
      if (firebaseUrl) {
        console.log('✅ Firebase cache hit');
        
        // Download to local cache
        const localUri = await this.downloadToLocalCache(cacheKey, firebaseUrl);
        this.addToMemoryCache(cacheKey, localUri);
        
        return localUri;
      }
    } catch (error) {
      console.error('Firebase lookup failed:', error);
    }

    // 4. Generate new audio
    console.log('❌ Cache miss - generating new audio');
    const audioUri = await this.generateAndCache(text, options, cacheKey);
    return audioUri;
  }

  private async getFromFirebase(cacheKey: string): Promise<string | null> {
    try {
      if (this.useClientSDK && this.clientSDK) {
        // Use client SDK
        console.log('TTS Cache: Using client SDK for Firebase lookup');
        return await this.clientSDK.getFromFirebase(cacheKey);
      } else {
        // This path should rarely be used in React Native
        console.log('TTS Cache: Using direct Firestore lookup (non-client SDK)');
        const docRef = doc(this.db, 'tts-cache', cacheKey);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as CacheEntry;
          console.log('✅ TTS Cache: Found in Firestore');
          
          // Update access stats (non-blocking)
          this.safeUpdateAccessStats(cacheKey, data.accessCount || 0).catch(error => {
            // Error is already handled inside safeUpdateAccessStats, no need to log again
          });
          
          return data.storageUrl;
        } else {
          console.log('TTS Cache: Not found in Firestore');
        }
      }
    } catch (error: any) {
      console.error('TTS Cache: Firestore lookup error:', error.message);
      if (error.code === 'permission-denied') {
        console.log('⚠️ TTS Cache: Firestore permission denied - falling back to local cache only');
        console.log('⚠️ Please update Firestore rules to allow anonymous read access');
      }
    }

    return null;
  }

  private async downloadToLocalCache(cacheKey: string, firebaseUrl: string): Promise<string> {
    const localUri = `${this.localCacheDir}${cacheKey}.mp3`;
    
    // Download from Firebase Storage
    const downloadResult = await FileSystem.downloadAsync(firebaseUrl, localUri);
    
    if (downloadResult.status === 200) {
      // Add to local cache index
      this.localCacheIndex.set(cacheKey, {
        uri: localUri,
        timestamp: Date.now(),
        firebaseUrl
      });
      
      await this.saveLocalCacheIndex();
      await this.enforceLocalCacheLimit();
      
      return localUri;
    } else {
      throw new Error('Failed to download from Firebase');
    }
  }

  private async generateAndCache(text: string, options: TTSOptions, cacheKey: string): Promise<string> {
    const { voice = 'nova', model = 'tts-1', speed = 1.0 } = options;
    
    // Generate audio using OpenAI
    const audioData = await this.callOpenAITTS(text, voice, model, speed);
    
    // Save locally first
    const localUri = `${this.localCacheDir}${cacheKey}.mp3`;
    await FileSystem.writeAsStringAsync(localUri, audioData, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Get file size
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    const fileSize = 'size' in fileInfo ? fileInfo.size : 0;
    
    // Firebase Storage uploads disabled for React Native/Expo Go compatibility
    // Skip upload entirely to prevent blob creation errors
    
    // Update local cache
    this.localCacheIndex.set(cacheKey, {
      uri: localUri,
      timestamp: Date.now()
    });
    await this.saveLocalCacheIndex();
    
    // Add to memory cache
    this.addToMemoryCache(cacheKey, localUri);
    
    return localUri;
  }

  private async callOpenAITTS(text: string, voice: TTSVoice, model: TTSModel, speed: number): Promise<string> {
    const response = await fetch(OPENAI_TTS_ENDPOINT, {
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
        response_format: 'mp3'
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    // Get response as blob and convert to base64
    const blob = await response.blob();
    return await this.blobToBase64(blob);
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

  /**
   * Convert base64 to ArrayBuffer (for future use if needed)
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Safely update access statistics (only if document exists)
   */
  private async safeUpdateAccessStats(cacheKey: string, currentCount: number): Promise<void> {
    try {
      const docRef = doc(this.db, 'tts-cache', cacheKey);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          accessCount: currentCount + 1,
          lastAccessed: serverTimestamp()
        });
        console.log(`✅ TTS Cache: Updated access stats for ${cacheKey}`);
      } else {
        console.log(`ℹ️ TTS Cache: Document ${cacheKey} not in Firestore, skipping access stats`);
      }
    } catch (error: any) {
      console.log(`⚠️ TTS Cache: Access stats update failed for ${cacheKey}: ${error.message}`);
    }
  }

  private addToMemoryCache(key: string, uri: string) {
    // LRU eviction
    if (this.memoryCache.size >= this.MAX_MEMORY_CACHE) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }
    this.memoryCache.set(key, uri);
  }

  private async saveLocalCacheIndex() {
    const cacheData = Object.fromEntries(this.localCacheIndex);
    await AsyncStorage.setItem('tts-firebase-cache-index', JSON.stringify(cacheData));
  }

  private async enforceLocalCacheLimit() {
    await this.calculateLocalCacheSize();
    
    if (this.currentLocalCacheSize > this.MAX_LOCAL_CACHE_SIZE) {
      // Sort by timestamp and remove oldest
      const sorted = Array.from(this.localCacheIndex.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      while (this.currentLocalCacheSize > this.MAX_LOCAL_CACHE_SIZE && sorted.length > 0) {
        const [key, entry] = sorted.shift()!;
        
        try {
          await FileSystem.deleteAsync(entry.uri, { idempotent: true });
          this.localCacheIndex.delete(key);
          
          const fileInfo = await FileSystem.getInfoAsync(entry.uri);
          if ('size' in fileInfo) {
            this.currentLocalCacheSize -= fileInfo.size;
          }
        } catch (error) {
          console.error('Error removing old cache file:', error);
        }
      }
      
      await this.saveLocalCacheIndex();
    }
  }

  private async updateFirestoreAccess(cacheKey: string) {
    try {
      await updateDoc(doc(this.db, 'tts-cache', cacheKey), {
        accessCount: increment(1),
        lastAccessed: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to update access stats:', error);
    }
  }

  async playAudio(uri: string, options: { volume?: number } = {}): Promise<Audio.Sound> {
    try {
      console.log('TTSFirebaseCache.playAudio called');
      
      // Wait if another audio is being set up
      while (this.isPlayingAudio) {
        console.log('Waiting for previous audio to finish setup...');
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      this.isPlayingAudio = true;
      
      // Stop and cleanup current sound if exists
      if (this.currentSound) {
        console.log('Stopping existing audio...');
        try {
          const status = await this.currentSound.getStatusAsync();
          if (status.isLoaded) {
            await this.currentSound.stopAsync();
            await this.currentSound.unloadAsync();
          }
        } catch (error) {
          console.error('Error stopping existing audio:', error);
        }
        this.currentSound = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { 
          shouldPlay: true,
          volume: options.volume || 1.0,
        }
      );

      this.currentSound = sound;
      this.isPlayingAudio = false;
      
      return sound;
    } catch (error) {
      this.isPlayingAudio = false;
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  async stopCurrentAudio(): Promise<void> {
    console.log('TTSFirebaseCache.stopCurrentAudio called');
    this.isPlayingAudio = false;
    
    if (this.currentSound) {
      try {
        const status = await this.currentSound.getStatusAsync();
        if (status.isLoaded) {
          await this.currentSound.stopAsync();
          await this.currentSound.unloadAsync();
        }
        this.currentSound = null;
      } catch (error) {
        console.error('Error stopping audio:', error);
        this.currentSound = null;
      }
    }
  }


  async clearLocalCache(): Promise<void> {
    try {
      await FileSystem.deleteAsync(this.localCacheDir, { idempotent: true });
      await FileSystem.makeDirectoryAsync(this.localCacheDir, { intermediates: true });
      
      this.localCacheIndex.clear();
      this.memoryCache.clear();
      await AsyncStorage.removeItem('tts-firebase-cache-index');
      
      console.log('Local TTS cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // Batch preload visualization
  async preloadVisualization(
    steps: Array<{ id: number; content: string }>,
    options: TTSOptions = {},
    onProgress?: (percent: number) => void
  ): Promise<Map<number, string>> {
    const preloadedAudio = new Map<number, string>();
    const totalSteps = steps.length;
    let completedSteps = 0;

    // Process in batches to avoid rate limits
    const batchSize = 3;
    
    for (let i = 0; i < steps.length; i += batchSize) {
      const batch = steps.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (step) => {
        try {
          const audioUri = await this.synthesizeSpeech(step.content, options);
          preloadedAudio.set(step.id, audioUri);
          completedSteps++;
          
          if (onProgress) {
            onProgress(Math.round((completedSteps / totalSteps) * 100));
          }
          
          return { stepId: step.id, success: true };
        } catch (error) {
          console.error(`Failed to preload step ${step.id}:`, error);
          return { stepId: step.id, success: false, error };
        }
      });

      await Promise.all(batchPromises);
      
      // Add delay between batches to avoid rate limits
      if (i + batchSize < steps.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return preloadedAudio;
  }

  async getCacheStats() {
    await this.calculateLocalCacheSize();
    
    return {
      memoryCache: this.memoryCache.size,
      localCache: this.localCacheIndex.size,
      localCacheSize: this.currentLocalCacheSize,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Test helper: Clear a specific cache entry to force regeneration
   * Useful for testing upload functionality
   */
  async clearSpecificCacheEntry(text: string, voice: TTSVoice = 'nova', model: TTSModel = 'tts-1', speed: number = 1.0): Promise<void> {
    const cacheKey = await this.getCacheKey(text, { voice, model, speed });
    console.log(`🧪 Test: Clearing cache entry for key ${cacheKey}`);
    
    // Remove from memory cache
    if (this.memoryCache.has(cacheKey)) {
      this.memoryCache.delete(cacheKey);
      console.log('✅ Removed from memory cache');
    }
    
    // Remove from local cache
    if (this.localCacheIndex.has(cacheKey)) {
      const entry = this.localCacheIndex.get(cacheKey);
      if (entry) {
        try {
          await FileSystem.deleteAsync(entry.uri, { idempotent: true });
          this.localCacheIndex.delete(cacheKey);
          await this.saveLocalCacheIndex();
          console.log('✅ Removed from local cache');
        } catch (error) {
          console.error('Failed to delete local file:', error);
        }
      }
    }
    
    console.log(`🧪 Cache cleared for "${text.substring(0, 50)}..." - next request will trigger upload`);
  }

  /**
   * Test helper: Firebase upload test disabled
   * Firebase Storage uploads are not compatible with React Native/Expo Go
   */
  async testFirebaseUpload(): Promise<void> {
    console.log('\n🧪 === FIREBASE UPLOAD TEST DISABLED ===');
    console.log('Firebase Storage uploads are disabled for React Native/Expo Go compatibility.');
    console.log('Using local caching only.\n');
  }

  /**
   * Upload existing cache disabled
   * Firebase Storage uploads are not compatible with React Native/Expo Go
   */
  async uploadExistingCacheToFirebase(): Promise<void> {
    console.log('\n📤 === UPLOAD EXISTING CACHE DISABLED ===');
    console.log('Firebase Storage uploads are disabled for React Native/Expo Go compatibility.');
    console.log('Using local caching only.\n');
  }
}