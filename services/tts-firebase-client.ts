import { 
  getAuth, 
  signInAnonymously,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  increment,
  Firestore
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadString,
  getDownloadURL,
  FirebaseStorage 
} from 'firebase/storage';
import { TTSFirebaseUploadHelper } from './tts-firebase-upload-helper';
import { FirebaseApp } from 'firebase/app';
import * as FileSystem from 'expo-file-system';

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

/**
 * Client-side Firebase TTS implementation
 * Uses Firebase Client SDK with authentication for Expo Go compatibility
 */
export class TTSFirebaseClient {
  private app: FirebaseApp;
  private auth: ReturnType<typeof getAuth>;
  private db: Firestore;
  private storage: FirebaseStorage;
  private currentUser: User | null = null;
  private authReady: Promise<void>;

  constructor(app: FirebaseApp) {
    this.app = app;
    this.auth = getAuth(app);
    this.db = getFirestore(app);
    this.storage = getStorage(app);

    // Initialize authentication
    this.authReady = this.initializeAuth();
  }

  /**
   * Helper to convert ArrayBuffer to base64 (React Native compatible)
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    try {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      
      // In React Native, btoa might not be available or might have issues with large strings
      if (typeof btoa === 'function') {
        return btoa(binary);
      } else {
        // Fallback: Use Buffer if available (Node.js environment)
        if (typeof Buffer !== 'undefined') {
          return Buffer.from(bytes).toString('base64');
        } else {
          throw new Error('No base64 encoding method available');
        }
      }
    } catch (error: any) {
      console.error('TTS Client: Failed to convert ArrayBuffer to base64:', error.message);
      throw new Error(`Base64 conversion failed: ${error.message}`);
    }
  }

  /**
   * Helper to ensure data is base64 string
   */
  private ensureBase64(data: string | ArrayBuffer): string {
    if (typeof data === 'string') {
      // Already base64
      return data;
    } else if (data instanceof ArrayBuffer) {
      // Convert ArrayBuffer to base64
      console.log('TTS Client: Converting ArrayBuffer to base64');
      return this.arrayBufferToBase64(data);
    } else {
      throw new Error('TTS Client: Unsupported data type for upload');
    }
  }

  /**
   * Initialize anonymous authentication
   */
  private async initializeAuth(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.log('TTS Client: Auth timeout - proceeding anyway');
        resolve();
      }, 5000); // 5 second timeout

      const unsubscribe = onAuthStateChanged(this.auth, async (user) => {
        clearTimeout(timeout);
        
        if (user) {
          this.currentUser = user;
          console.log('TTS Client: Authenticated as', user.uid);
          unsubscribe();
          resolve();
        } else {
          // Sign in anonymously
          try {
            console.log('TTS Client: Signing in anonymously...');
            const result = await signInAnonymously(this.auth);
            this.currentUser = result.user;
            console.log('TTS Client: Anonymous auth successful:', result.user.uid);
            unsubscribe();
            resolve();
          } catch (error: any) {
            console.error('TTS Client: Auth failed:', error.message);
            if (error.code === 'auth/network-request-failed') {
              console.log('TTS Client: Network error - continuing without auth');
              unsubscribe();
              resolve(); // Don't reject on network errors
            } else {
              unsubscribe();
              reject(error);
            }
          }
        }
      }, (error) => {
        clearTimeout(timeout);
        console.error('TTS Client: Auth state change error:', error);
        unsubscribe();
        resolve(); // Continue anyway
      });
    });
  }

  /**
   * Wait for authentication to be ready
   */
  async isReady(): Promise<void> {
    await this.authReady;
  }

  /**
   * Ensure user is authenticated before operations
   */
  private async ensureAuth(): Promise<void> {
    await this.authReady;
    if (!this.currentUser) {
      throw new Error('TTS Client: Not authenticated');
    }
  }

  /**
   * Get cached audio URL from Firestore
   */
  async getFromFirebase(cacheKey: string): Promise<string | null> {
    try {
      await this.ensureAuth();
      
      console.log(`TTS Client: Looking up cache key ${cacheKey} in Firestore`);
      const docRef = doc(this.db, 'tts-cache', cacheKey);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as CacheEntry;
        console.log('✅ TTS Client: Found in Firestore cache');
        
        // Update access stats (non-blocking)
        this.updateAccessStats(cacheKey).catch(error => {
          // Error is already handled inside updateAccessStats, no need to log again
        });
        
        return data.storageUrl;
      } else {
        console.log('TTS Client: Not found in Firestore cache');
      }
    } catch (error: any) {
      console.error('TTS Client: Firestore lookup error:', error.message);
      if (error.code === 'permission-denied') {
        console.log('⚠️ TTS Client: Firestore read permission denied - please update security rules to allow anonymous read');
        console.log('⚠️ Required rule: allow read: if true; (for tts-cache collection)');
      }
    }

    return null;
  }

  /**
   * Upload audio to Firebase Storage and save metadata
   * Uses base64 encoding for React Native/Expo Go compatibility
   */
  async uploadToFirebase(
    cacheKey: string,
    audioData: string | ArrayBuffer,
    metadata: {
      text: string;
      voice: string;
      model: string;
      speed: number;
      fileSize: number;
    }
  ): Promise<string> {
    try {
      await this.ensureAuth();
      
      // Convert to base64 if needed
      const base64Data = this.ensureBase64(audioData);
      
      // Upload to Firebase Storage using React Native compatible method
      const storageRef = ref(this.storage, `tts-cache/${cacheKey}.mp3`);
      
      console.log(`TTS Client: Uploading ${cacheKey} to Firebase Storage (${base64Data.length} chars)`);
      
      // Use the new upload helper that handles all React Native compatibility issues
      let downloadUrl: string;
      try {
        downloadUrl = await TTSFirebaseUploadHelper.uploadTTSAudio(
          storageRef,
          base64Data,
          metadata
        );
        console.log(`✅ TTS Client: Successfully uploaded ${cacheKey}`);
      } catch (uploadError: any) {
        console.error(`TTS Client: Upload failed for ${cacheKey}:`, uploadError.message);
        throw uploadError;
      }
      
      // Save metadata to Firestore
      await this.saveMetadataToFirestore(cacheKey, {
        ...metadata,
        storageUrl: downloadUrl,
        hash: cacheKey
      });
      
      console.log(`✅ TTS Client: Successfully uploaded ${cacheKey}`);
      return downloadUrl;
      
    } catch (error: any) {
      console.error(`TTS Client: Upload failed for ${cacheKey}:`, error.message);
      
      // Return a local URL as fallback
      return `local://tts-cache/${cacheKey}.mp3`;
    }
  }

  /**
   * Save TTS metadata to Firestore
   */
  private async saveMetadataToFirestore(cacheKey: string, metadata: {
    text: string;
    voice: string;
    model: string;
    speed: number;
    storageUrl: string;
    fileSize: number;
    hash: string;
  }): Promise<void> {
    try {
      const docRef = doc(this.db, 'tts-cache', cacheKey);
      await setDoc(docRef, {
        text: metadata.text,
        voice: metadata.voice,
        model: metadata.model,
        speed: metadata.speed,
        storageUrl: metadata.storageUrl,
        fileSize: metadata.fileSize,
        hash: metadata.hash,
        createdAt: serverTimestamp(),
        accessCount: 0,
        lastAccessed: serverTimestamp()
      });
      
      console.log(`✅ TTS Client: Metadata saved for ${cacheKey}`);
    } catch (error: any) {
      console.error(`TTS Client: Failed to save metadata for ${cacheKey}:`, error.message);
      throw error;
    }
  }

  /**
   * Update access statistics for a cache entry
   */
  private async updateAccessStats(cacheKey: string): Promise<void> {
    try {
      const docRef = doc(this.db, 'tts-cache', cacheKey);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          accessCount: increment(1),
          lastAccessed: serverTimestamp()
        });
        console.log(`✅ TTS Client: Updated access stats for ${cacheKey}`);
      } else {
        console.log(`ℹ️ TTS Client: Document ${cacheKey} not in Firebase, skipping access stats`);
      }
    } catch (error: any) {
      console.log(`⚠️ TTS Client: Access stats update failed for ${cacheKey}: ${error.message}`);
    }
  }

  /**
   * Convert base64 audio to local file URI
   */
  async saveBase64ToFile(base64: string, filename: string): Promise<string> {
    const fileUri = `${FileSystem.cacheDirectory}tts-client/${filename}`;
    
    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(`${FileSystem.cacheDirectory}tts-client/`);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(`${FileSystem.cacheDirectory}tts-client/`, { 
        intermediates: true 
      });
    }

    // Write base64 to file
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return fileUri;
  }

  /**
   * Download audio from URL to local file
   */
  async downloadToLocal(url: string, filename: string): Promise<string> {
    const fileUri = `${FileSystem.cacheDirectory}tts-client/${filename}`;
    
    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(`${FileSystem.cacheDirectory}tts-client/`);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(`${FileSystem.cacheDirectory}tts-client/`, { 
        intermediates: true 
      });
    }

    // Download file
    const downloadResult = await FileSystem.downloadAsync(url, fileUri);
    
    if (downloadResult.status === 200) {
      return downloadResult.uri;
    } else {
      throw new Error(`Download failed: ${downloadResult.status}`);
    }
  }

  /**
   * Check if authenticated and ready
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.authReady;
      return this.currentUser !== null;
    } catch {
      return false;
    }
  }
}