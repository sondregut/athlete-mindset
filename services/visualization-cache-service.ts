import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export interface VisualizationTemplate {
  id: string;
  name: string;
  description: string;
  script: string;
  placeholders: TemplatePlaceholder[];
}

export interface TemplatePlaceholder {
  key: string;
  prompt: string;
  validation?: {
    maxLength?: number;
    required?: boolean;
  };
}

export interface SimplifiedCacheEntry {
  sport: string;
  templateId: string;
  voiceId?: string;
  scriptText?: string;
  audioUrl?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  sportSpecificData?: {
    location: string;
    sounds: string;
    keyAction: string;
  };
  error?: string;
  createdAt: string;
  expiresAt: string;
}

export interface PersonalizationResponse {
  status: 'ready' | 'generating' | 'error';
  audioUrl?: string;
  scriptText?: string;
  estimatedTime?: number;
  error?: string;
  cached?: boolean;
}

class VisualizationCacheService {
  private static instance: VisualizationCacheService;
  private cachePrefix = '@visualization_cache:';

  private constructor() {}

  static getInstance(): VisualizationCacheService {
    if (!VisualizationCacheService.instance) {
      VisualizationCacheService.instance = new VisualizationCacheService();
    }
    return VisualizationCacheService.instance;
  }

  /**
   * Create a deterministic string representation of an object
   * Ensures consistent cache keys regardless of property order
   */
  private canonicalStringify(obj: any): string {
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj: any = {};
    for (const key of sortedKeys) {
      sortedObj[key] = obj[key];
    }
    return JSON.stringify(sortedObj);
  }

  /**
   * Generate a cache key for script/audio content
   */
  async generateCacheKey(
    templateId: string, 
    inputs: Record<string, string>, 
    voiceId?: string
  ): Promise<string> {
    // Normalize inputs (lowercase, trim)
    const normalizedInputs: Record<string, string> = {};
    for (const [key, value] of Object.entries(inputs)) {
      normalizedInputs[key] = String(value).toLowerCase().trim();
    }

    // Create canonical string and hash it
    const canonicalInputs = this.canonicalStringify(normalizedInputs);
    const inputHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      canonicalInputs,
      { encoding: Crypto.CryptoEncoding.HEX }
    );

    // Use first 16 chars of hash for brevity
    const shortHash = inputHash.substring(0, 16);
    const baseKey = `${templateId}:${shortHash}`;
    
    return voiceId ? `${baseKey}:${voiceId}` : baseKey;
  }

  /**
   * Get a cached entry
   */
  async getCacheEntry(key: string): Promise<SimplifiedCacheEntry | null> {
    try {
      const cached = await AsyncStorage.getItem(this.cachePrefix + key);
      if (!cached) return null;

      const entry: SimplifiedCacheEntry = JSON.parse(cached);
      
      // Check if expired
      if (new Date(entry.expiresAt) < new Date()) {
        await this.removeCacheEntry(key);
        return null;
      }

      return entry;
    } catch (error) {
      console.error('Error getting cache entry:', error);
      return null;
    }
  }

  /**
   * Set a cache entry with TTL
   */
  async setCacheEntry(
    key: string, 
    entry: Omit<SimplifiedCacheEntry, 'expiresAt'>, 
    ttlSeconds: number = 86400 * 30 // 30 days default
  ): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + ttlSeconds);

      const fullEntry: SimplifiedCacheEntry = {
        ...entry,
        expiresAt: expiresAt.toISOString(),
      };

      await AsyncStorage.setItem(
        this.cachePrefix + key,
        JSON.stringify(fullEntry)
      );
    } catch (error) {
      console.error('Error setting cache entry:', error);
    }
  }

  /**
   * Remove a cache entry
   */
  async removeCacheEntry(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.cachePrefix + key);
    } catch (error) {
      console.error('Error removing cache entry:', error);
    }
  }

  /**
   * Get all cache keys (for debugging/management)
   */
  async getAllCacheKeys(): Promise<string[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      return allKeys
        .filter(key => key.startsWith(this.cachePrefix))
        .map(key => key.replace(this.cachePrefix, ''));
    } catch (error) {
      console.error('Error getting cache keys:', error);
      return [];
    }
  }

  /**
   * Clear all visualization cache entries
   */
  async clearAllCache(): Promise<void> {
    try {
      const cacheKeys = await this.getAllCacheKeys();
      const keysToRemove = cacheKeys.map(key => this.cachePrefix + key);
      await AsyncStorage.multiRemove(keysToRemove);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalEntries: number;
    completedEntries: number;
    pendingEntries: number;
    failedEntries: number;
    totalSizeBytes: number;
  }> {
    try {
      const keys = await this.getAllCacheKeys();
      let completed = 0;
      let pending = 0;
      let failed = 0;
      let totalSize = 0;

      for (const key of keys) {
        const entry = await this.getCacheEntry(key);
        if (entry) {
          const entrySize = JSON.stringify(entry).length;
          totalSize += entrySize;

          switch (entry.status) {
            case 'COMPLETED':
              completed++;
              break;
            case 'PENDING':
              pending++;
              break;
            case 'FAILED':
              failed++;
              break;
          }
        }
      }

      return {
        totalEntries: keys.length,
        completedEntries: completed,
        pendingEntries: pending,
        failedEntries: failed,
        totalSizeBytes: totalSize,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        completedEntries: 0,
        pendingEntries: 0,
        failedEntries: 0,
        totalSizeBytes: 0,
      };
    }
  }

  /**
   * Clean expired entries
   */
  async cleanExpiredEntries(): Promise<number> {
    try {
      const keys = await this.getAllCacheKeys();
      let cleaned = 0;

      for (const key of keys) {
        const entry = await this.getCacheEntry(key);
        if (!entry) {
          // Already cleaned by getCacheEntry
          cleaned++;
        }
      }

      return cleaned;
    } catch (error) {
      console.error('Error cleaning expired entries:', error);
      return 0;
    }
  }
}

export const visualizationCacheService = VisualizationCacheService.getInstance();