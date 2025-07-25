import { getStorage, ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseApp, getFirebaseStorage, getFirebaseFirestore, getFirebaseAuth } from '@/config/firebase';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import { GeminiTTSService } from './gemini-tts-service';
import { GeminiCoreService } from './gemini-core-service';
import { geminiQuotaManager } from './gemini-quota-manager';

export type TTSVoice = string;
export type TTSModel = 'gemini-2.5-flash-preview-tts' | 'eleven_multilingual_v2' | string;

export interface TTSOptions {
  voice?: TTSVoice;
  model?: TTSModel;
  speed?: number;
  tone?: string;
}

interface CacheMetadata {
  text: string;
  voice: string;
  model: string;
  speed: number;
  generatedAt: number;
  source: 'gemini' | 'elevenlabs';
  size?: number;
}

interface PersonalizationContext {
  sport?: string;
  trackFieldEvent?: string;
}

export class TTSFirebaseCacheGemini {
  private static instance: TTSFirebaseCacheGemini;
  private storage = getFirebaseStorage();
  private firestore = getFirebaseFirestore();
  private geminiTTS: GeminiTTSService;
  private localCacheDir: string;
  private maxLocalCacheSize = 100 * 1024 * 1024; // 100MB
  private currentLocalCacheSize = 0;
  private localCacheIndex = new Map<string, { uri: string; size: number; lastAccessed: number }>();
  
  // Rate limiting
  private lastApiCall = 0;
  private minApiCallInterval = 1000; // 1 second between API calls
  private pendingRequests = new Map<string, Promise<string>>(); // Request deduplication
  
  // Analytics
  private stats = {
    localCacheHits: 0,
    firebaseCacheHits: 0,
    geminiApiCalls: 0,
    totalRequests: 0,
    errors: 0,
    deduplicatedRequests: 0,
  };

  private constructor() {
    this.geminiTTS = GeminiTTSService.getInstance();
    this.localCacheDir = `${FileSystem.documentDirectory}tts-cache-gemini/`;
    this.initializeLocalCache();
  }

  static getInstance(): TTSFirebaseCacheGemini {
    if (!TTSFirebaseCacheGemini.instance) {
      TTSFirebaseCacheGemini.instance = new TTSFirebaseCacheGemini();
    }
    return TTSFirebaseCacheGemini.instance;
  }

  private async initializeLocalCache() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.localCacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.localCacheDir, { intermediates: true });
      }
      
      // Clean up old MP3 files
      await this.cleanupOldMP3Files();
      
      // Load cache index
      await this.loadLocalCacheIndex();
    } catch (error) {
      console.error('[TTSFirebaseCacheGemini] Failed to initialize local cache:', error);
    }
  }
  
  private async cleanupOldMP3Files() {
    try {
      const files = await FileSystem.readDirectoryAsync(this.localCacheDir);
      let deletedCount = 0;
      
      for (const file of files) {
        if (file.endsWith('.mp3')) {
          try {
            await FileSystem.deleteAsync(`${this.localCacheDir}${file}`, { idempotent: true });
            deletedCount++;
            console.log('[TTSFirebaseCacheGemini] Deleted old MP3 file:', file);
          } catch (error) {
            console.error('[TTSFirebaseCacheGemini] Failed to delete MP3 file:', file, error);
          }
        }
      }
      
      if (deletedCount > 0) {
        console.log(`[TTSFirebaseCacheGemini] Cleaned up ${deletedCount} old MP3 files`);
      }
    } catch (error) {
      console.error('[TTSFirebaseCacheGemini] Error during MP3 cleanup:', error);
    }
  }

  private async loadLocalCacheIndex() {
    try {
      const files = await FileSystem.readDirectoryAsync(this.localCacheDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const metadataUri = `${this.localCacheDir}${file}`;
          const metadataStr = await FileSystem.readAsStringAsync(metadataUri);
          const metadata = JSON.parse(metadataStr);
          const audioFile = file.replace('.json', '.mp3');
          const audioUri = `${this.localCacheDir}${audioFile}`;
          
          const fileInfo = await FileSystem.getInfoAsync(audioUri);
          if (fileInfo.exists) {
            const size = (fileInfo as any).size || 0;
            this.localCacheIndex.set(metadata.cacheKey, {
              uri: audioUri,
              size,
              lastAccessed: Date.now(),
            });
            this.currentLocalCacheSize += size;
          }
        }
      }
      
      console.log(`[TTSFirebaseCacheGemini] Loaded ${this.localCacheIndex.size} cached items`);
    } catch (error) {
      console.error('[TTSFirebaseCacheGemini] Failed to load cache index:', error);
    }
  }

  async synthesizeSpeech(text: string, options: TTSOptions = {}): Promise<string> {
    const { 
      voice = 'Kore', 
      model = 'gemini-2.5-flash-preview-tts', 
      speed = 1.0,
      tone = 'calm'
    } = options;
    
    this.stats.totalRequests++;
    
    // Generate cache key
    const cacheKey = await this.generateCacheKey(text, voice, model, speed, tone);
    
    // Check if request is already pending (deduplication)
    if (this.pendingRequests.has(cacheKey)) {
      this.stats.deduplicatedRequests++;
      console.log('[TTSFirebaseCacheGemini] Request already pending, waiting for result');
      return this.pendingRequests.get(cacheKey)!;
    }
    
    // 1. Check local cache
    const localCached = this.localCacheIndex.get(cacheKey);
    if (localCached) {
      this.stats.localCacheHits++;
      console.log('[TTSFirebaseCacheGemini] Local cache hit');
      
      // Update last accessed time
      localCached.lastAccessed = Date.now();
      
      return localCached.uri;
    }
    
    // 2. Check Firebase cache
    try {
      const firebaseUrl = await this.checkFirebaseCache(cacheKey);
      if (firebaseUrl) {
        this.stats.firebaseCacheHits++;
        console.log('[TTSFirebaseCacheGemini] Firebase cache hit');
        
        // Download and cache locally
        const localUri = await this.downloadAndCacheLocally(cacheKey, firebaseUrl);
        return localUri;
      }
    } catch (error) {
      console.warn('[TTSFirebaseCacheGemini] Firebase cache check failed:', error);
    }
    
    // 3. Generate with Gemini API (wrapped in promise for deduplication)
    const generationPromise = (async () => {
      console.log('[TTSFirebaseCacheGemini] Generating new audio with Gemini');
      
      // Rate limiting
      const now = Date.now();
      const timeSinceLastCall = now - this.lastApiCall;
      if (timeSinceLastCall < this.minApiCallInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minApiCallInterval - timeSinceLastCall));
      }
      
      try {
        this.stats.geminiApiCalls++;
        this.lastApiCall = Date.now();
        
        // Use Gemini TTS to generate audio file
        const generatedUri = await this.geminiTTS.synthesizeToFile(text, {
          voice,
          speed,
          tone,
        });
        
        if (!generatedUri) {
          throw new Error('Failed to generate audio with Gemini');
        }
        
        // Save to local cache and upload to Firebase
        const metadata: CacheMetadata = {
          text,
          voice,
          model,
          speed,
          generatedAt: Date.now(),
          source: 'gemini',
        };
        
        const localUri = await this.saveToLocalCache(cacheKey, generatedUri, metadata);
        
        // Upload to Firebase in background
        this.uploadToFirebase(cacheKey, localUri, metadata).catch(error => {
          console.warn('[TTSFirebaseCacheGemini] Failed to upload to Firebase:', error);
        });
        
        return localUri;
      } catch (error) {
        this.stats.errors++;
        console.error('[TTSFirebaseCacheGemini] Gemini generation failed:', error);
        throw error;
      } finally {
        // Remove from pending requests
        this.pendingRequests.delete(cacheKey);
      }
    })();
    
    // Store in pending requests for deduplication
    this.pendingRequests.set(cacheKey, generationPromise);
    
    return generationPromise;
  }

  private async generateCacheKey(text: string, voice: string, model: string, speed: number, tone: string): Promise<string> {
    const keyString = `${text}|${voice}|${model}|${speed}|${tone}`;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      keyString
    );
    return `tts_gemini_${hash.substring(0, 16)}`;
  }

  // Public method to get cache key for testing
  async getCacheKey(text: string, options: TTSOptions = {}): Promise<string> {
    const { 
      voice = 'Kore', 
      model = 'gemini-2.5-flash-preview-tts', 
      speed = 1.0,
      tone = 'calm'
    } = options;
    
    return this.generateCacheKey(text, voice, model, speed, tone);
  }

  private async checkFirebaseCache(cacheKey: string): Promise<string | null> {
    try {
      // Check Firestore metadata
      const metadataDoc = await getDoc(doc(this.firestore, 'tts-cache', cacheKey));
      if (!metadataDoc.exists()) {
        return null;
      }
      
      // Get download URL from Storage
      const storageRef = ref(this.storage, `tts-cache/${cacheKey}.mp3`);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      return null;
    }
  }

  private async downloadAndCacheLocally(cacheKey: string, url: string): Promise<string> {
    // Determine extension from URL
    const extension = url.includes('.wav') ? '.wav' : '.mp3';
    const localUri = `${this.localCacheDir}${cacheKey}${extension}`;
    
    // Download file
    const downloadResult = await FileSystem.downloadAsync(url, localUri);
    if (downloadResult.status !== 200) {
      throw new Error(`Failed to download from Firebase: ${downloadResult.status}`);
    }
    
    // Get file size
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    const size = (fileInfo as any).size || 0;
    
    // Update local cache index
    this.localCacheIndex.set(cacheKey, {
      uri: localUri,
      size,
      lastAccessed: Date.now(),
    });
    this.currentLocalCacheSize += size;
    
    // Clean up if needed
    if (this.currentLocalCacheSize > this.maxLocalCacheSize) {
      this.cleanupLocalCache();
    }
    
    return localUri;
  }

  private async saveToLocalCache(cacheKey: string, sourceUri: string, metadata: CacheMetadata): Promise<string> {
    // Use .wav extension since Gemini generates WAV files
    const localUri = `${this.localCacheDir}${cacheKey}.wav`;
    const metadataUri = `${this.localCacheDir}${cacheKey}.json`;
    
    try {
      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(this.localCacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.localCacheDir, { intermediates: true });
      }
      
      // Copy audio file
      await FileSystem.copyAsync({
        from: sourceUri,
        to: localUri,
      });
    } catch (error) {
      console.error('[TTSFirebaseCacheGemini] Failed to copy audio file:', error);
      throw new Error(`Failed to save audio file: ${error}`);
    }
    
    // Save metadata
    await FileSystem.writeAsStringAsync(metadataUri, JSON.stringify({
      ...metadata,
      cacheKey,
    }));
    
    // Get file size
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    const size = (fileInfo as any).size || 0;
    
    // Update cache index
    this.localCacheIndex.set(cacheKey, {
      uri: localUri,
      size,
      lastAccessed: Date.now(),
    });
    this.currentLocalCacheSize += size;
    
    return localUri;
  }

  private async uploadToFirebase(cacheKey: string, localUri: string, metadata: CacheMetadata): Promise<void> {
    try {
      // Check if user is authenticated before attempting upload
      const auth = getFirebaseAuth();
      if (!auth.currentUser) {
        console.warn('[TTSFirebaseCacheGemini] User not authenticated, skipping Firebase upload');
        return; // Silently skip upload if not authenticated
      }

      // Read file as base64
      const fileString = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Determine content type based on file extension
      const isWav = localUri.endsWith('.wav');
      const contentType = isWav ? 'audio/wav' : 'audio/mpeg';
      
      // Create blob using fetch API (React Native compatible)
      const blob = await fetch(`data:${contentType};base64,${fileString}`).then(r => r.blob());
      
      // Upload to Storage with correct extension
      const extension = isWav ? '.wav' : '.mp3';
      const storageRef = ref(this.storage, `tts-cache/${cacheKey}${extension}`);
      await uploadBytes(storageRef, blob, {
        contentType: contentType,
        customMetadata: {
          voice: metadata.voice,
          model: metadata.model,
          speed: metadata.speed.toString(),
          source: metadata.source,
        },
      });
      
      // Save metadata to Firestore
      await setDoc(doc(this.firestore, 'tts-cache', cacheKey), {
        ...metadata,
        uploadedAt: Date.now(),
      });
      
      console.log('[TTSFirebaseCacheGemini] Uploaded to Firebase:', cacheKey);
    } catch (error) {
      console.error('[TTSFirebaseCacheGemini] Upload failed:', error);
      // Don't throw - just log the error and continue with local cache
      // This way audio playback won't break if Firebase upload fails
    }
  }


  private async cleanupLocalCache() {
    // Clean up cache index if it's too large (>1000 entries)
    if (this.localCacheIndex.size > 1000) {
      console.log('[TTSFirebaseCacheGemini] Cache index too large, verifying entries');
      const staleEntries: string[] = [];
      
      for (const [cacheKey, entry] of this.localCacheIndex.entries()) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(entry.uri);
          if (!fileInfo.exists) {
            staleEntries.push(cacheKey);
          }
        } catch (error) {
          staleEntries.push(cacheKey);
        }
      }
      
      // Remove stale entries
      for (const cacheKey of staleEntries) {
        this.localCacheIndex.delete(cacheKey);
      }
      
      if (staleEntries.length > 0) {
        console.log(`[TTSFirebaseCacheGemini] Removed ${staleEntries.length} stale index entries`);
      }
    }
    
    // Remove least recently used items until under size limit
    const sortedEntries = Array.from(this.localCacheIndex.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    while (this.currentLocalCacheSize > this.maxLocalCacheSize * 0.8 && sortedEntries.length > 0) {
      const [cacheKey, entry] = sortedEntries.shift()!;
      
      try {
        await FileSystem.deleteAsync(entry.uri, { idempotent: true });
        // Delete associated JSON metadata file
        const metadataUri = entry.uri.replace(/\.(mp3|wav)$/, '.json');
        await FileSystem.deleteAsync(metadataUri, { idempotent: true });
        
        this.currentLocalCacheSize -= entry.size;
        this.localCacheIndex.delete(cacheKey);
      } catch (error) {
        console.error('[TTSFirebaseCacheGemini] Failed to delete cache entry:', error);
      }
    }
  }

  async getCacheStats(): Promise<{
    local: {
      entries: number;
      size: number;
      maxSize: number;
    };
    firebase: {
      entries: number;
      size: number;
    };
    totalRequests: number;
    localCacheHits: number;
    localCacheHitRate: string;
    firebaseCacheHits: number;
    firebaseCacheHitRate: string;
    geminiApiCalls: number;
    errors: number;
    deduplicatedRequests: number;
  }> {
    const firebaseStats = await this.getFirebaseCacheSize();
    
    return {
      local: {
        entries: this.localCacheIndex.size,
        size: this.currentLocalCacheSize,
        maxSize: this.maxLocalCacheSize,
      },
      firebase: firebaseStats,
      totalRequests: this.stats.totalRequests,
      localCacheHits: this.stats.localCacheHits,
      localCacheHitRate: this.stats.totalRequests > 0
        ? ((this.stats.localCacheHits / this.stats.totalRequests) * 100).toFixed(1) + '%'
        : '0%',
      firebaseCacheHits: this.stats.firebaseCacheHits,
      firebaseCacheHitRate: this.stats.totalRequests > 0
        ? ((this.stats.firebaseCacheHits / this.stats.totalRequests) * 100).toFixed(1) + '%'
        : '0%',
      geminiApiCalls: this.stats.geminiApiCalls,
      errors: this.stats.errors,
      deduplicatedRequests: this.stats.deduplicatedRequests,
    };
  }

  private async getFirebaseCacheSize() {
    try {
      const listRef = ref(this.storage, 'tts-cache');
      const result = await listAll(listRef);
      
      return {
        entries: result.items.length,
        size: 0, // Size calculation would require fetching metadata for each file
      };
    } catch (error) {
      console.error('[TTSFirebaseCacheGemini] Failed to get Firebase stats:', error);
      return {
        entries: 0,
        size: 0,
      };
    }
  }

  async preloadPersonalizedVisualization(
    steps: Array<{ id: number; content: string }>,
    personalizationContext: PersonalizationContext,
    voices: TTSVoice[] = ['Aoede'],
    options: Omit<TTSOptions, 'voice'> = {},
    onProgress?: (progress: number) => void
  ): Promise<Map<string, Map<number, string>>> {
    const results = new Map<string, Map<number, string>>();
    const totalOperations = steps.length * voices.length;
    let completed = 0;
    
    console.log(`[TTSFirebaseCacheGemini] Starting preload for ${steps.length} steps with ${voices.length} voices`);
    
    for (const voice of voices) {
      const voiceResults = new Map<number, string>();
      
      for (const step of steps) {
        try {
          const uri = await this.synthesizeSpeech(step.content, {
            ...options,
            voice,
          });
          
          voiceResults.set(step.id, uri);
          completed++;
          
          if (onProgress) {
            onProgress(Math.round((completed / totalOperations) * 100));
          }
        } catch (error) {
          console.error(`[TTSFirebaseCacheGemini] Failed to preload step ${step.id} with voice ${voice}:`, error);
        }
      }
      
      results.set(voice, voiceResults);
    }
    
    console.log(`[TTSFirebaseCacheGemini] Preload complete: ${completed}/${totalOperations} successful`);
    return results;
  }

  async clearCache() {
    // Clear local cache
    try {
      await FileSystem.deleteAsync(this.localCacheDir, { idempotent: true });
      await FileSystem.makeDirectoryAsync(this.localCacheDir, { intermediates: true });
      this.localCacheIndex.clear();
      this.currentLocalCacheSize = 0;
      console.log('[TTSFirebaseCacheGemini] Local cache cleared');
    } catch (error) {
      console.error('[TTSFirebaseCacheGemini] Failed to clear local cache:', error);
    }
    
    // Note: Firebase cache is not cleared to preserve shared resources
  }
  
  // Public method to clean up only MP3 files
  async cleanupMP3Files(): Promise<number> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.localCacheDir);
      let deletedCount = 0;
      
      for (const file of files) {
        if (file.endsWith('.mp3')) {
          const filePath = `${this.localCacheDir}${file}`;
          try {
            await FileSystem.deleteAsync(filePath, { idempotent: true });
            
            // Remove from cache index
            const cacheKey = file.replace('.mp3', '');
            if (this.localCacheIndex.has(cacheKey)) {
              const entry = this.localCacheIndex.get(cacheKey);
              if (entry) {
                this.currentLocalCacheSize -= entry.size;
                this.localCacheIndex.delete(cacheKey);
              }
            }
            
            deletedCount++;
            console.log('[TTSFirebaseCacheGemini] Deleted MP3 file:', file);
          } catch (error) {
            console.error('[TTSFirebaseCacheGemini] Failed to delete MP3:', file, error);
          }
        }
      }
      
      if (deletedCount > 0) {
        console.log(`[TTSFirebaseCacheGemini] Cleaned up ${deletedCount} MP3 files`);
      }
      
      return deletedCount;
    } catch (error) {
      console.error('[TTSFirebaseCacheGemini] Error cleaning MP3 files:', error);
      return 0;
    }
  }

  // Cancel all active requests - compatibility method
  cancelAllRequests() {
    // Gemini TTS doesn't maintain a request queue
    // This is a no-op for compatibility with the old API
    console.log('[TTSFirebaseCacheGemini] cancelAllRequests called (no-op)');
  }
}