import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

/**
 * Environment detection service for Firebase SDK selection
 * Determines whether to use Client SDK (Expo Go) or Admin SDK (Dev builds)
 */

export interface EnvironmentInfo {
  isExpoGo: boolean;
  hasServiceAccount: boolean;
  useClientSDK: boolean;
  executionEnvironment: string;
  appOwnership: string | null;
}

class EnvironmentDetectionService {
  private static instance: EnvironmentDetectionService;
  private cachedInfo: EnvironmentInfo | null = null;

  private constructor() {}

  static getInstance(): EnvironmentDetectionService {
    if (!EnvironmentDetectionService.instance) {
      EnvironmentDetectionService.instance = new EnvironmentDetectionService();
    }
    return EnvironmentDetectionService.instance;
  }

  /**
   * Check if running in Expo Go
   */
  isExpoGo(): boolean {
    return Constants.executionEnvironment === 'storeClient';
  }

  /**
   * Check if service account file exists (for admin SDK)
   */
  async hasServiceAccountKey(): Promise<boolean> {
    try {
      // In Expo Go, we can't access service account files
      if (this.isExpoGo()) {
        return false;
      }

      // Check if service account file exists
      const serviceAccountPath = `${FileSystem.documentDirectory}../../../service-account-key.json`;
      const fileInfo = await FileSystem.getInfoAsync(serviceAccountPath);
      return fileInfo.exists;
    } catch (error) {
      console.log('Service account check failed:', error);
      return false;
    }
  }

  /**
   * Get complete environment information
   */
  async getEnvironmentInfo(): Promise<EnvironmentInfo> {
    if (this.cachedInfo) {
      return this.cachedInfo;
    }

    const isExpoGo = this.isExpoGo();
    const hasServiceAccount = await this.hasServiceAccountKey();
    
    this.cachedInfo = {
      isExpoGo,
      hasServiceAccount,
      useClientSDK: isExpoGo || !hasServiceAccount,
      executionEnvironment: Constants.executionEnvironment || 'unknown',
      appOwnership: Constants.appOwnership || null,
    };

    console.log('Environment Detection:', this.cachedInfo);
    return this.cachedInfo;
  }

  /**
   * Determine if we should use client SDK
   */
  async shouldUseClientSDK(): Promise<boolean> {
    const info = await this.getEnvironmentInfo();
    return info.useClientSDK;
  }

  /**
   * Clear cached environment info (useful for testing)
   */
  clearCache(): void {
    this.cachedInfo = null;
  }
}

export const environmentDetection = EnvironmentDetectionService.getInstance();