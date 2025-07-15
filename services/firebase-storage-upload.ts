import { StorageReference, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';
import { FirebaseStorageBlobUtil } from './firebase-storage-blob-util';
import { FirebaseStorageRestAPI } from './firebase-storage-rest-api';

// Platform detection
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

/**
 * React Native compatible Firebase Storage upload utility
 * Handles the blob creation issue in React Native by using XMLHttpRequest
 */
export class FirebaseStorageUploader {
  /**
   * Upload base64 audio data to Firebase Storage
   * Uses XMLHttpRequest for React Native compatibility
   */
  static async uploadAudio(
    storageRef: StorageReference,
    base64Data: string,
    metadata?: {
      contentType?: string;
      cacheControl?: string;
      customMetadata?: Record<string, string>;
    }
  ): Promise<string> {
    if (!isReactNative) {
      // For web/Node.js, use the standard Firebase SDK method
      const blob = base64ToBlob(base64Data, metadata?.contentType || 'audio/mpeg');
      await uploadBytes(storageRef, blob, metadata);
      return await getDownloadURL(storageRef);
    }

    // For React Native, try blob util first, then XMLHttpRequest
    if (FirebaseStorageBlobUtil.isAvailable()) {
      console.log('Using react-native-blob-util for upload');
      try {
        return await FirebaseStorageBlobUtil.uploadAudio(storageRef, base64Data, metadata);
      } catch (error: any) {
        console.warn('Blob util upload failed, falling back to XMLHttpRequest:', error.message);
      }
    }
    
    // Try XMLHttpRequest
    try {
      console.log('Using XMLHttpRequest for upload');
      return await this.uploadWithXHR(storageRef, base64Data, metadata);
    } catch (xhrError: any) {
      console.warn('XMLHttpRequest upload failed:', xhrError.message);
      
      // Final fallback: REST API
      console.log('Using REST API for upload');
      return await FirebaseStorageRestAPI.uploadAudio(storageRef, base64Data, metadata);
    }
  }

  /**
   * Upload using XMLHttpRequest (React Native compatible)
   * Note: This is a simplified implementation that may require proper authentication
   */
  private static async uploadWithXHR(
    storageRef: StorageReference,
    base64Data: string,
    metadata?: {
      contentType?: string;
      cacheControl?: string;
      customMetadata?: Record<string, string>;
    }
  ): Promise<string> {
    // For XMLHttpRequest, we need to use a different approach
    // This is a placeholder - in practice, you'd need proper authentication
    throw new Error('XMLHttpRequest upload not fully implemented - use REST API or blob util instead');
  }


  /**
   * Alternative: Upload from a local file URI (Expo FileSystem)
   */
  static async uploadFromFileUri(
    storageRef: StorageReference,
    fileUri: string,
    metadata?: {
      contentType?: string;
      cacheControl?: string;
      customMetadata?: Record<string, string>;
    }
  ): Promise<string> {
    // Read file as base64
    const base64Data = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return await this.uploadAudio(storageRef, base64Data, metadata);
  }

  /**
   * Upload with retry logic
   */
  static async uploadWithRetry(
    storageRef: StorageReference,
    base64Data: string,
    metadata?: any,
    maxRetries: number = 3
  ): Promise<string> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff: wait 1s, 2s, 4s...
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        }
        
        return await this.uploadAudio(storageRef, base64Data, metadata);
      } catch (error: any) {
        console.log(`Upload attempt ${attempt + 1} failed:`, error.message);
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.message?.includes('status: 4')) {
          throw error;
        }
      }
    }
    
    throw lastError || new Error('Upload failed after all retries');
  }
}

/**
 * Convert base64 string to Blob (for web environments)
 */
function base64ToBlob(base64: string, contentType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: contentType });
}