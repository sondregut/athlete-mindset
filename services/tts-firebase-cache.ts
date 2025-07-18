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
import { getElevenLabsApiKey, ELEVENLABS_TTS_ENDPOINT, ELEVENLABS_DEFAULT_MODEL, DEFAULT_VOICE_SETTINGS, VOICE_MAPPING } from '@/config/elevenlabs-config';
import { environmentDetection } from './environment-detection';
import { TTSFirebaseClient } from './tts-firebase-client';
import { smartLogger, accessStatsManager } from '@/utils/smart-logger';

// ElevenLabs voice IDs - these should match your actual ElevenLabs voice IDs
export type TTSVoice = string; // Now using voice IDs directly
export type TTSModel = 'eleven_multilingual_v2' | 'eleven_turbo_v2';

interface TTSOptions {
  voice?: TTSVoice;
  model?: TTSModel;
  speed?: number;
  isPersonalized?: boolean;
  sport?: string;
  userContext?: {
    sport?: string;
    experienceLevel?: string;
    primaryFocus?: string;
  };
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
  
  // Request queue for ElevenLabs API rate limiting
  private requestQueue: Array<() => Promise<void>> = [];
  private activeRequests = 0;
  private readonly MAX_CONCURRENT_REQUESTS = 3; // Below ElevenLabs limit of 5
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

  private constructor() {
    this.apiKey = getElevenLabsApiKey();
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
    const { 
      voice = '21m00Tcm4TlvDq8ikWAM', // Rachel voice as default
      model = 'eleven_multilingual_v2', 
      speed = 1.0, 
      isPersonalized = false,
      sport,
      userContext
    } = options;
    
    // Create a comprehensive key that includes personalization context
    let keyString = `${text}-${voice}-${model}-${speed}`;
    
    if (isPersonalized) {
      // Add personalization context to cache key for cross-user sharing
      // Users with same sport/context can share personalized audio
      const personalizationContext = sport || userContext?.sport || 'unknown';
      keyString += `-personalized-${personalizationContext}`;
    } else {
      keyString += '-original';
    }
    
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      keyString
    );
    return hash.substring(0, 16);
  }

  async synthesizeSpeech(text: string, options: TTSOptions = {}): Promise<string> {
    console.log('[TTS] synthesizeSpeech called with text:', text.substring(0, 50) + '...');
    console.log('[TTS] Options:', options);
    console.log('[TTS] API Key available:', !!this.apiKey);
    
    if (!this.isInitialized) {
      console.log('[TTS] Initializing service...');
      await this.initialize();
    }

    // Validate and fix options to prevent OpenAI model being used as voice ID
    const validatedOptions = { ...options };
    
    // Ensure model is valid ElevenLabs model
    if (!validatedOptions.model || !['eleven_multilingual_v2', 'eleven_turbo_v2'].includes(validatedOptions.model)) {
      validatedOptions.model = 'eleven_multilingual_v2';
    }

    const cacheKey = await this.getCacheKey(text, validatedOptions);
    console.log('[TTS] Cache key:', cacheKey);
    smartLogger.log('tts-request', `TTS request for key: ${cacheKey}`);

    // 1. Check memory cache
    if (this.memoryCache.has(cacheKey)) {
      smartLogger.log('tts-memory-hit', '✅ Memory cache hit');
      return this.memoryCache.get(cacheKey)!;
    }

    // 2. Check local cache
    const localEntry = this.localCacheIndex.get(cacheKey);
    if (localEntry) {
      const fileInfo = await FileSystem.getInfoAsync(localEntry.uri);
      if (fileInfo.exists) {
        smartLogger.log('tts-local-hit', '✅ Local cache hit');
        this.addToMemoryCache(cacheKey, localEntry.uri);
        
        // Update access time in Firestore (async, don't wait)
        this.updateFirestoreAccess(cacheKey).catch(() => {});
        
        return localEntry.uri;
      }
    }

    // 3. Check Firebase
    try {
      const firebaseUrl = await this.getFromFirebase(cacheKey);
      if (firebaseUrl) {
        smartLogger.log('tts-firebase-hit', '✅ Firebase cache hit');
        
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
    const audioUri = await this.generateAndCache(text, validatedOptions, cacheKey);
    console.log('🎵 Generated audio URI:', audioUri);
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
    const { voice = '21m00Tcm4TlvDq8ikWAM', model = 'eleven_multilingual_v2', speed = 1.0 } = options;
    
    // Generate audio using ElevenLabs
    const audioData = await this.callElevenLabsTTS(text, voice, model, speed);
    
    // Save locally first
    const localUri = `${this.localCacheDir}${cacheKey}.mp3`;
    console.log('💾 Saving audio to local file:', localUri);
    
    await FileSystem.writeAsStringAsync(localUri, audioData, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Verify file was written
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (!fileInfo.exists) {
      throw new Error(`Failed to write audio file to ${localUri}`);
    }
    
    const fileSize = 'size' in fileInfo ? fileInfo.size : 0;
    console.log(`✅ Audio file saved successfully: ${fileSize} bytes`);
    
    // Upload to Firebase Storage using client SDK
    let firebaseUrl: string | null = null;
    if (this.useClientSDK && this.clientSDK) {
      try {
        console.log(`TTS Cache: Uploading ${cacheKey} to Firebase Storage`);
        // Ensure audioData is passed as base64 string (it already is from callElevenLabsTTS)
        if (typeof audioData !== 'string') {
          console.error('TTS Cache: audioData is not a string, skipping Firebase upload');
          firebaseUrl = null;
        } else {
          firebaseUrl = await this.clientSDK.uploadToFirebase(cacheKey, audioData, {
            text,
            voice,
            model,
            speed,
            fileSize
          });
          // Only log success if we actually got a URL back
          if (firebaseUrl) {
            console.log(`✅ TTS Cache: Successfully uploaded ${cacheKey} to Firebase`);
          } else {
            console.log(`⚠️ TTS Cache: Upload returned no URL for ${cacheKey}`);
          }
        }
      } catch (error: any) {
        console.error(`❌ TTS Cache: Firebase upload failed for ${cacheKey}:`, error.message);
        firebaseUrl = null;
        // Continue without Firebase upload - local cache will work
      }
    }
    
    // Update local cache with Firebase URL if available
    this.localCacheIndex.set(cacheKey, {
      uri: localUri,
      timestamp: Date.now(),
      firebaseUrl: firebaseUrl || undefined
    });
    await this.saveLocalCacheIndex();
    
    // Add to memory cache
    this.addToMemoryCache(cacheKey, localUri);
    
    return localUri;
  }

  private async callElevenLabsTTS(text: string, voice: TTSVoice, model: TTSModel, speed: number): Promise<string> {
    return new Promise((resolve, reject) => {
      // Add request to queue
      this.requestQueue.push(async () => {
        try {
          const result = await this.executeElevenLabsRequest(text, voice, model, speed);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      // Process queue
      this.processQueue();
    });
  }

  private async executeElevenLabsRequest(text: string, voice: TTSVoice, model: TTSModel, speed: number): Promise<string> {
    // Map OpenAI voice names to ElevenLabs voice IDs if needed
    let voiceId = voice;
    if (voice in VOICE_MAPPING) {
      voiceId = VOICE_MAPPING[voice as keyof typeof VOICE_MAPPING];
    }
    
    // Enforce minimum time between requests to avoid rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const delay = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`⏱️ TTS Rate Limiting: Waiting ${delay}ms before request`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    
    console.log('[TTS] Making ElevenLabs API request...');
    console.log('[TTS] URL:', `${ELEVENLABS_TTS_ENDPOINT}/${voiceId}`);
    console.log('[TTS] Voice ID:', voiceId);
    console.log('[TTS] Model:', model || ELEVENLABS_DEFAULT_MODEL);
    
    try {
      const response = await fetch(`${ELEVENLABS_TTS_ENDPOINT}/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: model || ELEVENLABS_DEFAULT_MODEL,
          voice_settings: {
            ...DEFAULT_VOICE_SETTINGS,
            stability: speed > 1 ? 0.3 : speed < 1 ? 0.7 : 0.5, // Adjust stability based on speed
          }
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[TTS] ElevenLabs API error:', response.status, error);
        if (response.status === 429) {
          console.error('⚠️ ElevenLabs rate limit exceeded - consider reducing concurrent requests');
        }
        throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
      }
      
      console.log('[TTS] ElevenLabs API response OK');
    } catch (fetchError: any) {
      console.error('[TTS] Fetch error:', fetchError.message);
      throw fetchError;
    }

    // Get response as blob and convert to base64
    const blob = await response.blob();
    return await this.blobToBase64(blob);
  }

  private async processQueue(): Promise<void> {
    // Process requests up to the concurrent limit
    while (this.requestQueue.length > 0 && this.activeRequests < this.MAX_CONCURRENT_REQUESTS) {
      const request = this.requestQueue.shift();
      if (request) {
        this.activeRequests++;
        console.log(`🔄 TTS Queue: Processing request (${this.activeRequests}/${this.MAX_CONCURRENT_REQUESTS} active, ${this.requestQueue.length} queued)`);
        
        // Execute request and handle completion
        request().finally(() => {
          this.activeRequests--;
          console.log(`✅ TTS Queue: Request completed (${this.activeRequests}/${this.MAX_CONCURRENT_REQUESTS} active, ${this.requestQueue.length} queued)`);
          
          // Process next request if queue is not empty
          if (this.requestQueue.length > 0) {
            this.processQueue();
          }
        });
      }
    }
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
      const docRef = doc(this.db, 'tts-cache', cacheKey);
      
      // Check if document exists first
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Document exists - safe to update
        await updateDoc(docRef, {
          accessCount: increment(1),
          lastAccessed: serverTimestamp()
        });
        accessStatsManager.logUpdate(cacheKey);
      } else {
        // Document doesn't exist - skip silently (this is normal for local-only files)
        accessStatsManager.logSkip(cacheKey);
      }
    } catch (error: any) {
      // Handle any other errors gracefully
      smartLogger.error('tts-access-stats-error', `⚠️ TTS: Access stats update failed for ${cacheKey}: ${error.message}`);
    }
  }

  async playAudio(uri: string, options: { volume?: number } = {}): Promise<Audio.Sound> {
    try {
      console.log('🎵 TTSFirebaseCache.playAudio called with URI:', uri);
      smartLogger.log('tts-play-audio', 'TTSFirebaseCache.playAudio called');
      
      // Validate URI
      if (!uri || uri === 'undefined' || uri === 'null') {
        throw new Error(`Invalid audio URI: ${uri}`);
      }
      
      // Wait if another audio is being set up
      while (this.isPlayingAudio) {
        console.log('Waiting for previous audio to finish setup...');
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      this.isPlayingAudio = true;
      
      // Fade out and stop current sound if exists
      if (this.currentSound) {
        console.log('Fading out existing audio...');
        try {
          const status = await this.currentSound.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            // Fade out over 200ms
            await this.currentSound.setVolumeAsync(0.5);
            await new Promise(resolve => setTimeout(resolve, 100));
            await this.currentSound.setVolumeAsync(0);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          if (status.isLoaded) {
            await this.currentSound.stopAsync();
            await this.currentSound.unloadAsync();
          }
        } catch (error) {
          console.error('Error stopping existing audio:', error);
        }
        this.currentSound = null;
      }

      console.log('🎵 Creating audio sound from URI:', uri);
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { 
          shouldPlay: true,
          volume: options.volume || 1.0,
        }
      );

      this.currentSound = sound;
      this.isPlayingAudio = false;
      
      console.log('✅ Audio playback started successfully');
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

    // Process in batches - queue system will handle rate limiting
    const batchSize = 2; // Smaller batches work better with queue system
    
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
      
      // Smaller delay since queue system handles rate limiting
      if (i + batchSize < steps.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return preloadedAudio;
  }

  /**
   * Preload personalized visualization with TTS caching
   * This method generates audio for personalized content with proper cache keys
   */
  async preloadPersonalizedVisualization(
    steps: Array<{ id: number; content: string }>,
    personalizationContext: {
      sport: string;
      experienceLevel?: string;
      primaryFocus?: string;
    },
    voices: TTSVoice[] = ['21m00Tcm4TlvDq8ikWAM'], // Default to Rachel voice, but allow multiple voices
    options: Omit<TTSOptions, 'isPersonalized' | 'sport' | 'userContext'> = {},
    onProgress?: (percent: number) => void
  ): Promise<Map<string, Map<number, string>>> {
    console.log(`[TTS Cache] Preloading personalized visualization for ${personalizationContext.sport}`);
    console.log(`[TTS Cache] ${steps.length} steps, ${voices.length} voices`);
    
    const preloadedAudio = new Map<string, Map<number, string>>();
    const totalOperations = steps.length * voices.length;
    let completedOperations = 0;

    // Initialize result maps for each voice
    for (const voice of voices) {
      preloadedAudio.set(voice, new Map<number, string>());
    }

    // Process with queue system handling rate limiting
    const batchSize = 2; // Batch size works with queue system
    
    for (let i = 0; i < steps.length; i += batchSize) {
      const batch = steps.slice(i, i + batchSize);
      
      // Process each voice for this batch
      for (const voice of voices) {
        const voiceBatchPromises = batch.map(async (step) => {
          try {
            const personalizedOptions: TTSOptions = {
              ...options,
              voice,
              isPersonalized: true,
              sport: personalizationContext.sport,
              userContext: {
                sport: personalizationContext.sport,
                experienceLevel: personalizationContext.experienceLevel,
                primaryFocus: personalizationContext.primaryFocus,
              }
            };
            
            const audioUri = await this.synthesizeSpeech(step.content, personalizedOptions);
            preloadedAudio.get(voice)?.set(step.id, audioUri);
            completedOperations++;
            
            if (onProgress) {
              onProgress(Math.round((completedOperations / totalOperations) * 100));
            }
            
            return { stepId: step.id, voice, success: true };
          } catch (error) {
            console.error(`Failed to preload personalized step ${step.id} for voice ${voice}:`, error);
            completedOperations++;
            return { stepId: step.id, voice, success: false, error };
          }
        });

        await Promise.all(voiceBatchPromises);
        
        // Minimal delay - queue system handles rate limiting
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      
      // Minimal delay between step batches
      if (i + batchSize < steps.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`[TTS Cache] Preloading complete for ${personalizationContext.sport}`);
    return preloadedAudio;
  }

  async getCacheStats() {
    await this.calculateLocalCacheSize();
    
    return {
      memoryCache: this.memoryCache.size,
      localCache: this.localCacheIndex.size,
      localCacheSize: this.currentLocalCacheSize,
      isInitialized: this.isInitialized,
      requestQueue: {
        queued: this.requestQueue.length,
        active: this.activeRequests,
        maxConcurrent: this.MAX_CONCURRENT_REQUESTS
      }
    };
  }

  /**
   * Test helper: Clear a specific cache entry to force regeneration
   * Useful for testing upload functionality
   */
  async clearSpecificCacheEntry(text: string, voice: TTSVoice = '21m00Tcm4TlvDq8ikWAM', model: TTSModel = 'eleven_multilingual_v2', speed: number = 1.0): Promise<void> {
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
   * Test helper: Firebase upload test
   * Tests Firebase Storage uploads using base64 encoding
   */
  async testFirebaseUpload(): Promise<void> {
    console.log('\n🧪 === FIREBASE UPLOAD TEST ===');
    
    if (!this.useClientSDK || !this.clientSDK) {
      console.log('Client SDK not available - skipping Firebase upload test');
      return;
    }
    
    try {
      await this.clientSDK.isReady();
      
      const testText = 'This is a test of Firebase Storage upload functionality.';
      const testVoice: TTSVoice = '21m00Tcm4TlvDq8ikWAM';
      const testModel: TTSModel = 'eleven_multilingual_v2';
      const testSpeed = 1.0;
      
      console.log(`Testing upload with text: "${testText}"`);
      console.log(`Voice: ${testVoice}, Model: ${testModel}, Speed: ${testSpeed}`);
      
      // Clear any existing cache for this test
      await this.clearSpecificCacheEntry(testText, testVoice, testModel, testSpeed);
      
      // Generate and cache (this will trigger upload)
      const audioUri = await this.synthesizeSpeech(testText, {
        voice: testVoice,
        model: testModel,
        speed: testSpeed
      });
      
      console.log(`✅ Test completed successfully!`);
      console.log(`Audio URI: ${audioUri}`);
      
      // Check if it was uploaded to Firebase
      const cacheKey = await this.getCacheKey(testText, {
        voice: testVoice,
        model: testModel,
        speed: testSpeed
      });
      
      const localEntry = this.localCacheIndex.get(cacheKey);
      if (localEntry?.firebaseUrl) {
        console.log(`✅ Firebase upload confirmed: ${localEntry.firebaseUrl}`);
      } else {
        console.log(`⚠️ Firebase upload may have failed - check logs above`);
      }
      
    } catch (error: any) {
      console.error(`❌ Firebase upload test failed:`, error.message);
    }
    
    console.log('🧪 === FIREBASE UPLOAD TEST COMPLETE ===\n');
  }

  /**
   * Upload existing cache to Firebase
   * Uploads all locally cached audio files to Firebase Storage
   */
  async uploadExistingCacheToFirebase(): Promise<void> {
    console.log('\n📤 === UPLOAD EXISTING CACHE TO FIREBASE ===');
    
    if (!this.useClientSDK || !this.clientSDK) {
      console.log('Client SDK not available - skipping existing cache upload');
      return;
    }
    
    try {
      await this.clientSDK.isReady();
      
      const entries = Array.from(this.localCacheIndex.entries());
      console.log(`Found ${entries.length} cached files to potentially upload`);
      
      let uploadedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;
      
      for (const [cacheKey, entry] of entries) {
        try {
          // Skip if already uploaded to Firebase
          if (entry.firebaseUrl) {
            console.log(`⏭️ Skipping ${cacheKey} - already in Firebase`);
            skippedCount++;
            continue;
          }
          
          // Read the local file
          const fileInfo = await FileSystem.getInfoAsync(entry.uri);
          if (!fileInfo.exists) {
            console.log(`⚠️ Local file missing for ${cacheKey}`);
            failedCount++;
            continue;
          }
          
          const base64Data = await FileSystem.readAsStringAsync(entry.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          // We need to reconstruct metadata from the cache key
          // This is a limitation - we don't store original metadata
          console.log(`📤 Uploading ${cacheKey}...`);
          
          const firebaseUrl = await this.clientSDK.uploadToFirebase(cacheKey, base64Data, {
            text: 'Unknown - from existing cache',
            voice: '21m00Tcm4TlvDq8ikWAM', // Default Rachel voice - we don't have this info
            model: 'eleven_multilingual_v2', // Default - we don't have this info
            speed: 1.0, // Default - we don't have this info
            fileSize: 'size' in fileInfo ? fileInfo.size : 0
          });
          
          // Update local cache entry with Firebase URL
          this.localCacheIndex.set(cacheKey, {
            ...entry,
            firebaseUrl
          });
          
          uploadedCount++;
          console.log(`✅ Uploaded ${cacheKey}`);
          
          // Add delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error: any) {
          console.error(`❌ Failed to upload ${cacheKey}:`, error.message);
          failedCount++;
        }
      }
      
      // Save updated cache index
      await this.saveLocalCacheIndex();
      
      console.log(`\n📊 Upload Summary:`);
      console.log(`✅ Uploaded: ${uploadedCount}`);
      console.log(`⏭️ Skipped: ${skippedCount}`);
      console.log(`❌ Failed: ${failedCount}`);
      
    } catch (error: any) {
      console.error(`❌ Upload existing cache failed:`, error.message);
    }
    
    console.log('📤 === UPLOAD EXISTING CACHE COMPLETE ===\n');
  }
}