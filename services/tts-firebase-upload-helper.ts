import { StorageReference } from 'firebase/storage';
import { FirebaseStorageUploader } from './firebase-storage-upload';

/**
 * Helper service for uploading TTS audio to Firebase Storage
 * Provides a simple interface that handles all the complexity of React Native uploads
 */
export class TTSFirebaseUploadHelper {
  /**
   * Upload TTS audio to Firebase Storage with automatic fallbacks
   * 
   * @param storageRef - Firebase Storage reference
   * @param audioData - Base64 encoded audio data
   * @param metadata - Upload metadata
   * @returns Download URL of the uploaded file
   */
  static async uploadTTSAudio(
    storageRef: StorageReference,
    audioData: string | ArrayBuffer,
    metadata: {
      text: string;
      voice: string;
      model: string;
      speed: number;
      fileSize: number;
    }
  ): Promise<string> {
    // Ensure we have base64 string data
    let base64Data: string;
    
    if (typeof audioData === 'string') {
      base64Data = audioData;
    } else if (audioData instanceof ArrayBuffer) {
      // Convert ArrayBuffer to base64
      base64Data = this.arrayBufferToBase64(audioData);
    } else {
      throw new Error('Invalid audio data type - must be string or ArrayBuffer');
    }
    
    // Prepare upload metadata
    const uploadMetadata = {
      contentType: 'audio/mpeg',
      cacheControl: 'public, max-age=31536000', // 1 year cache
      customMetadata: {
        voice: metadata.voice,
        model: metadata.model,
        speed: metadata.speed.toString(),
        originalSize: metadata.fileSize.toString(),
        textHash: this.hashText(metadata.text).substring(0, 16), // Store partial hash for debugging
        uploadedAt: new Date().toISOString(),
        uploadMethod: 'unknown', // Will be updated by the uploader
      }
    };
    
    try {
      // Use the main uploader with retry logic
      const downloadUrl = await FirebaseStorageUploader.uploadWithRetry(
        storageRef,
        base64Data,
        uploadMetadata,
        3 // max retries
      );
      
      console.log(`✅ TTS audio uploaded successfully: ${storageRef.fullPath}`);
      return downloadUrl;
      
    } catch (error: any) {
      // Log detailed error for debugging
      console.error('TTS Firebase upload failed:', {
        path: storageRef.fullPath,
        error: error.message,
        dataLength: base64Data.length,
        metadata: uploadMetadata.customMetadata
      });
      
      // Re-throw with more context
      throw new Error(`Failed to upload TTS audio to Firebase: ${error.message}`);
    }
  }
  
  /**
   * Convert ArrayBuffer to base64 string
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  
  /**
   * Simple hash function for text (for debugging/tracking)
   */
  private static hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
  
  /**
   * Check if upload is likely to succeed (pre-flight check)
   */
  static canUpload(): boolean {
    // Check if we're in a React Native environment
    const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
    
    if (!isReactNative) {
      // Web environment - standard upload should work
      return true;
    }
    
    // In React Native, check if we have blob util available
    try {
      const ReactNativeBlobUtil = require('react-native-blob-util').default;
      return ReactNativeBlobUtil !== null;
    } catch {
      // Blob util not available, but REST API should still work
      return true;
    }
  }
}