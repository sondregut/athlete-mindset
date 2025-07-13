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
  getDownloadURL,
  FirebaseStorage 
} from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { Audio } from 'expo-av';
import { firebaseTTSConfig } from '@/config/firebase-tts-config';
import { getOpenAIApiKey, OPENAI_TTS_ENDPOINT } from '@/config/api-config';

export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
export type TTSModel = 'tts-1' | 'tts-1-hd';

interface TTSOptions {
  voice?: TTSVoice;
  model?: TTSModel;
  speed?: number;
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

  async get(key: string): Promise<string | null> {
    try {
      console.log(`Checking Firebase cache for key: ${key}`);
      
      // Get metadata from Firestore
      const docRef = doc(this.firestore, this.cacheCollection, key);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.log(`Firebase cache miss for key: ${key}`);
        return null;
      }
      
      const metadata = docSnap.data() as CacheMetadata;
      
      // Update access metrics
      await setDoc(docRef, {
        ...metadata,
        accessCount: metadata.accessCount + 1,
        lastAccessed: Date.now(),
      }, { merge: true });
      
      console.log(`Firebase cache hit for key: ${key}`);
      return metadata.storageUrl;
    } catch (error) {
      console.error('Firebase cache get error:', error);
      return null;
    }
  }

  async set(
    key: string,
    audioBlob: Blob,
    metadata: {
      text: string;
      voice: string;
      speed: number;
      model: string;
    }
  ): Promise<string> {
    try {
      console.log(`Uploading to Firebase cache: ${key}`);
      
      // Upload audio to Firebase Storage
      const storageRef = ref(this.storage, `tts-cache/${key}.mp3`);
      const uploadResult = await uploadBytes(storageRef, audioBlob, {
        contentType: 'audio/mpeg',
        customMetadata: {
          voice: metadata.voice,
          speed: metadata.speed.toString(),
          model: metadata.model,
        },
      });
      
      // Get download URL
      const downloadUrl = await getDownloadURL(uploadResult.ref);
      
      // Store metadata in Firestore
      const cacheMetadata: CacheMetadata = {
        key,
        text: metadata.text,
        voice: metadata.voice,
        speed: metadata.speed,
        model: metadata.model,
        fileSize: audioBlob.size,
        storageUrl: downloadUrl,
        createdAt: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now(),
        version: 1,
      };
      
      await setDoc(doc(this.firestore, this.cacheCollection, key), cacheMetadata);
      
      console.log(`Successfully cached in Firebase: ${key} (${(audioBlob.size / 1024).toFixed(1)}KB)`);
      
      // Trigger cleanup if needed
      this.scheduleCleanup();
      
      return downloadUrl;
    } catch (error) {
      console.error('Firebase cache set error:', error);
      throw error;
    }
  }

  async preloadPopular(limit: number = 10): Promise<void> {
    try {
      console.log('Preloading popular TTS content...');
      
      // Query most accessed content
      const q = query(
        collection(this.firestore, this.cacheCollection),
        orderBy('accessCount', 'desc'),
        orderBy('lastAccessed', 'desc'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      const popularKeys = querySnapshot.docs.map(doc => doc.id);
      
      console.log(`Found ${popularKeys.length} popular items to preload`);
      return;
    } catch (error) {
      console.error('Failed to preload popular content:', error);
    }
  }

  private async scheduleCleanup(): Promise<void> {
    // Run cleanup in background
    setTimeout(() => this.cleanup(), 5000);
  }

  private async cleanup(): Promise<void> {
    try {
      console.log('Running Firebase cache cleanup...');
      
      // Get total cache size
      const q = query(collection(this.firestore, this.cacheCollection));
      const querySnapshot = await getDocs(q);
      
      let totalSize = 0;
      const entries: CacheMetadata[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as CacheMetadata;
        totalSize += data.fileSize;
        entries.push(data);
      });
      
      console.log(`Current Firebase cache size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
      
      // If under limit, no cleanup needed
      if (totalSize <= this.maxCloudStorage) {
        return;
      }
      
      // Sort by last accessed (oldest first)
      entries.sort((a, b) => a.lastAccessed - b.lastAccessed);
      
      // Remove oldest entries until under limit
      let removedSize = 0;
      const toRemove: string[] = [];
      
      for (const entry of entries) {
        if (totalSize - removedSize <= this.maxCloudStorage * 0.9) {
          break; // Keep 10% buffer
        }
        
        // Don't remove if accessed in last 24 hours
        if (Date.now() - entry.lastAccessed < 24 * 60 * 60 * 1000) {
          continue;
        }
        
        toRemove.push(entry.key);
        removedSize += entry.fileSize;
      }
      
      // Remove selected entries
      for (const key of toRemove) {
        await this.remove(key);
      }
      
      console.log(`Cleaned up ${toRemove.length} entries (${(removedSize / 1024 / 1024).toFixed(2)}MB)`);
    } catch (error) {
      console.error('Firebase cache cleanup error:', error);
    }
  }

  private async remove(key: string): Promise<void> {
    try {
      // Delete from Storage
      const storageRef = ref(this.storage, `tts-cache/${key}.mp3`);
      await deleteDoc(doc(this.firestore, this.cacheCollection, key));
      
      console.log(`Removed from Firebase cache: ${key}`);
    } catch (error) {
      console.error(`Failed to remove ${key} from Firebase cache:`, error);
    }
  }

  async getStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    averageAccessCount: number;
    oldestEntry: number;
  }> {
    try {
      const q = query(collection(this.firestore, this.cacheCollection));
      const querySnapshot = await getDocs(q);
      
      let totalSize = 0;
      let totalAccessCount = 0;
      let oldestEntry = Date.now();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as CacheMetadata;
        totalSize += data.fileSize;
        totalAccessCount += data.accessCount;
        if (data.createdAt < oldestEntry) {
          oldestEntry = data.createdAt;
        }
      });
      
      return {
        totalEntries: querySnapshot.size,
        totalSize,
        averageAccessCount: querySnapshot.size > 0 ? totalAccessCount / querySnapshot.size : 0,
        oldestEntry,
      };
    } catch (error) {
      console.error('Failed to get Firebase cache stats:', error);
      return {
        totalEntries: 0,
        totalSize: 0,
        averageAccessCount: 0,
        oldestEntry: Date.now(),
      };
    }
  }
}