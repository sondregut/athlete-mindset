import { StorageReference, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';

// Dynamic import to avoid issues when react-native-blob-util is not available
let ReactNativeBlobUtil: any = null;
try {
  ReactNativeBlobUtil = require('react-native-blob-util').default;
} catch (e) {
  console.log('react-native-blob-util not available, falling back to XMLHttpRequest');
}

/**
 * Alternative Firebase Storage upload using react-native-blob-util
 * This provides better blob support for React Native
 */
export class FirebaseStorageBlobUtil {
  /**
   * Check if react-native-blob-util is available
   */
  static isAvailable(): boolean {
    return ReactNativeBlobUtil !== null;
  }

  /**
   * Upload base64 audio data using react-native-blob-util
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
    if (!this.isAvailable()) {
      throw new Error('react-native-blob-util is not available');
    }

    try {
      // Create a temporary file from base64 data
      const tempPath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/temp_audio_${Date.now()}.mp3`;
      await ReactNativeBlobUtil.fs.writeFile(tempPath, base64Data, 'base64');
      
      // Read the file as a blob
      const blob = await ReactNativeBlobUtil.fs.readFile(tempPath, 'base64');
      
      // Convert base64 to Uint8Array for Firebase
      const binary = atob(blob);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      // Upload to Firebase
      await uploadBytes(storageRef, bytes, {
        contentType: metadata?.contentType || 'audio/mpeg',
        cacheControl: metadata?.cacheControl,
        customMetadata: metadata?.customMetadata,
      });
      
      // Clean up temp file
      await ReactNativeBlobUtil.fs.unlink(tempPath).catch(() => {});
      
      // Get download URL
      return await getDownloadURL(storageRef);
    } catch (error: any) {
      console.error('FirebaseStorageBlobUtil upload error:', error);
      throw error;
    }
  }

  /**
   * Alternative method using fetch with blob support
   */
  static async uploadAudioWithFetch(
    storageRef: StorageReference,
    base64Data: string,
    uploadUrl: string,
    metadata?: {
      contentType?: string;
      cacheControl?: string;
    }
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('react-native-blob-util is not available');
    }

    try {
      // Create blob from base64
      const blob = await ReactNativeBlobUtil.base64.decode(base64Data);
      
      // Use react-native-blob-util's fetch implementation
      const response = await ReactNativeBlobUtil.fetch('PUT', uploadUrl, {
        'Content-Type': metadata?.contentType || 'audio/mpeg',
        'Cache-Control': metadata?.cacheControl || 'public, max-age=31536000',
      }, blob);
      
      if (response.respInfo.status >= 200 && response.respInfo.status < 300) {
        return await getDownloadURL(storageRef);
      } else {
        throw new Error(`Upload failed with status: ${response.respInfo.status}`);
      }
    } catch (error: any) {
      console.error('FirebaseStorageBlobUtil fetch upload error:', error);
      throw error;
    }
  }

  /**
   * Upload from Expo FileSystem URI using blob util
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
    if (!this.isAvailable()) {
      throw new Error('react-native-blob-util is not available');
    }

    // Read file as base64 from Expo FileSystem
    const base64Data = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return await this.uploadAudio(storageRef, base64Data, metadata);
  }
}