import { getAuth } from 'firebase/auth';
import { StorageReference } from 'firebase/storage';

/**
 * Firebase Storage REST API implementation
 * Uses direct HTTP requests to bypass SDK blob issues in React Native
 */
export class FirebaseStorageRestAPI {
  private static readonly BASE_URL = 'https://firebasestorage.googleapis.com/v0';
  
  /**
   * Upload audio using Firebase Storage REST API
   * This method completely bypasses the Firebase SDK to avoid blob issues
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
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User must be authenticated to upload');
    }
    
    // Get the ID token for authentication
    const idToken = await user.getIdToken();
    
    // Construct the upload URL
    const bucket = storageRef.bucket;
    const fullPath = encodeURIComponent(storageRef.fullPath);
    const uploadUrl = `${this.BASE_URL}/b/${bucket}/o?uploadType=media&name=${fullPath}`;
    
    // Convert base64 to binary
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    try {
      // Upload the file
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': metadata?.contentType || 'audio/mpeg',
          'Content-Length': bytes.length.toString(),
          ...(metadata?.cacheControl && { 'Cache-Control': metadata.cacheControl }),
        },
        body: bytes,
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
      }
      
      const uploadResult = await uploadResponse.json();
      console.log('REST API upload response:', uploadResult);
      
      // Update metadata if custom metadata is provided
      if (metadata?.customMetadata && Object.keys(metadata.customMetadata).length > 0) {
        await this.updateMetadata(
          bucket,
          storageRef.fullPath,
          idToken,
          metadata.customMetadata
        );
      }
      
      // Get the download URL - try multiple methods
      let downloadUrl: string;
      
      // Method 1: If downloadTokens is provided in the response
      if (uploadResult.downloadTokens) {
        downloadUrl = `${this.BASE_URL}/b/${bucket}/o/${fullPath}?alt=media&token=${uploadResult.downloadTokens}`;
      } 
      // Method 2: Use the mediaLink if provided
      else if (uploadResult.mediaLink) {
        downloadUrl = uploadResult.mediaLink;
      }
      // Method 3: Construct a public URL (requires proper storage rules)
      else {
        // Generate a simple public URL - this requires the file to be publicly readable
        downloadUrl = `${this.BASE_URL}/b/${bucket}/o/${fullPath}?alt=media`;
        console.warn('No download token available, using public URL format');
      }
      
      console.log('REST API constructed download URL:', downloadUrl);
      return downloadUrl;
    } catch (error: any) {
      console.error('REST API upload error:', error);
      throw error;
    }
  }
  
  /**
   * Update file metadata
   */
  private static async updateMetadata(
    bucket: string,
    fullPath: string,
    idToken: string,
    customMetadata: Record<string, string>
  ): Promise<void> {
    const metadataUrl = `${this.BASE_URL}/b/${bucket}/o/${encodeURIComponent(fullPath)}`;
    
    try {
      await fetch(metadataUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: customMetadata,
        }),
      });
    } catch (error) {
      console.warn('Failed to update metadata:', error);
      // Non-critical error, don't throw
    }
  }
  
  /**
   * Alternative: Use Firebase upload token for resumable uploads
   */
  static async uploadResumable(
    storageRef: StorageReference,
    base64Data: string,
    metadata?: any,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User must be authenticated to upload');
    }
    
    const idToken = await user.getIdToken();
    const bucket = storageRef.bucket;
    const fullPath = storageRef.fullPath;
    
    // Convert base64 to binary
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    // Initiate resumable upload
    const initiateUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=resumable&name=${encodeURIComponent(fullPath)}`;
    
    const initiateResponse = await fetch(initiateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': metadata?.contentType || 'audio/mpeg',
        'X-Upload-Content-Length': bytes.length.toString(),
      },
      body: JSON.stringify({
        contentType: metadata?.contentType || 'audio/mpeg',
        cacheControl: metadata?.cacheControl,
        metadata: metadata?.customMetadata,
      }),
    });
    
    if (!initiateResponse.ok) {
      throw new Error(`Failed to initiate upload: ${initiateResponse.status}`);
    }
    
    // Get the resumable upload URL
    const uploadUrl = initiateResponse.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('No upload URL returned');
    }
    
    // Upload the actual data
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': metadata?.contentType || 'audio/mpeg',
      },
      body: bytes,
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }
    
    const result = await uploadResponse.json();
    
    // Return the download URL
    return `${this.BASE_URL}/b/${bucket}/o/${encodeURIComponent(fullPath)}?alt=media&token=${result.downloadTokens}`;
  }
}