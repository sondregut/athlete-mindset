import { PersonalizationCacheEntry, PersonalizedContent, UserContext } from '@/types/personalization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export class PersonalizationCache {
  private memoryCache: Map<string, PersonalizationCacheEntry> = new Map();
  private maxMemorySize: number;
  private currentMemorySize: number = 0;
  private maxAge: number; // Maximum age in milliseconds
  private storageKey = 'personalization-cache-metadata';

  constructor(maxMemorySizeMB: number = 20, maxAgeHours: number = 24) { // 24 hours default
    this.maxMemorySize = maxMemorySizeMB * 1024 * 1024; // Convert to bytes
    this.maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
    this.loadFromStorage();
  }

  async generateCacheKey(
    userContext: UserContext,
    visualizationId: string,
    contextualFactors?: any
  ): Promise<string> {
    // Create a deterministic key based on user context and visualization
    const keyData = {
      sport: userContext.sport,
      trackFieldEvent: userContext.trackFieldEvent,
      experienceLevel: userContext.experienceLevel,
      primaryFocus: userContext.primaryFocus,
      visualizationId,
      // Only include significant contextual factors
      timeUntilEvent: contextualFactors?.timeUntilEvent,
      mood: contextualFactors?.currentMood,
    };
    
    const keyString = JSON.stringify(keyData, Object.keys(keyData).sort());
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      keyString
    );
    
    return `pers_${hash.substring(0, 16)}`;
  }

  async get(key: string): Promise<PersonalizedContent | null> {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      // Try to load from storage
      return this.loadFromStorageByKey(key);
    }
    
    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.remove(key);
      return null;
    }
    
    // Update access metrics
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    
    // Move to end (LRU)
    this.memoryCache.delete(key);
    this.memoryCache.set(key, entry);
    
    console.log(`[PersonalizationCache] Hit for key: ${key}`);
    return entry.content;
  }

  async set(
    key: string,
    content: PersonalizedContent,
    userContext: UserContext
  ): Promise<void> {
    const size = JSON.stringify(content).length;
    
    // Remove old entry if exists
    if (this.memoryCache.has(key)) {
      this.remove(key);
    }
    
    // Evict entries if needed
    while (this.currentMemorySize + size > this.maxMemorySize && this.memoryCache.size > 0) {
      this.evictLRU();
    }
    
    // Create new entry
    const entry: PersonalizationCacheEntry = {
      key,
      content,
      userContext,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      size,
    };
    
    // Add to memory cache
    this.memoryCache.set(key, entry);
    this.currentMemorySize += size;
    
    // Persist to storage
    await this.saveToStorage(key, entry);
    
    console.log(`[PersonalizationCache] Stored content for key: ${key} (${size} bytes)`);
  }

  private remove(key: string): void {
    const entry = this.memoryCache.get(key);
    if (entry) {
      this.currentMemorySize -= entry.size;
      this.memoryCache.delete(key);
      this.removeFromStorage(key);
    }
  }

  private evictLRU(): void {
    let oldest: PersonalizationCacheEntry | null = null;
    let oldestKey: string | null = null;
    
    for (const [key, entry] of this.memoryCache) {
      if (!oldest || entry.lastAccessed < oldest.lastAccessed) {
        oldest = entry;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      console.log(`[PersonalizationCache] Evicting LRU entry: ${oldestKey}`);
      this.remove(oldestKey);
    }
  }

  private async saveToStorage(key: string, entry: PersonalizationCacheEntry): Promise<void> {
    try {
      // Save individual entry
      await AsyncStorage.setItem(
        `personalization_${key}`,
        JSON.stringify(entry)
      );
      
      // Update metadata
      const metadata = await this.loadMetadata();
      metadata[key] = {
        timestamp: entry.timestamp,
        size: entry.size,
      };
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(metadata));
    } catch (error) {
      console.error('[PersonalizationCache] Error saving to storage:', error);
    }
  }

  private async loadFromStorageByKey(key: string): Promise<PersonalizedContent | null> {
    try {
      const data = await AsyncStorage.getItem(`personalization_${key}`);
      if (!data) return null;
      
      const entry: PersonalizationCacheEntry = JSON.parse(data);
      
      // Check if expired
      if (Date.now() - entry.timestamp > this.maxAge) {
        await this.removeFromStorage(key);
        return null;
      }
      
      // Add to memory cache if there's space
      if (this.currentMemorySize + entry.size <= this.maxMemorySize) {
        this.memoryCache.set(key, entry);
        this.currentMemorySize += entry.size;
      }
      
      return entry.content;
    } catch (error) {
      console.error('[PersonalizationCache] Error loading from storage:', error);
      return null;
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const metadata = await this.loadMetadata();
      const now = Date.now();
      
      // Load most recent entries into memory
      const entries = Object.entries(metadata)
        .filter(([_, data]) => now - data.timestamp < this.maxAge)
        .sort((a, b) => b[1].timestamp - a[1].timestamp);
      
      for (const [key, _] of entries) {
        if (this.currentMemorySize >= this.maxMemorySize) break;
        await this.loadFromStorageByKey(key);
      }
      
      console.log(`[PersonalizationCache] Loaded ${this.memoryCache.size} entries from storage`);
    } catch (error) {
      console.error('[PersonalizationCache] Error loading from storage:', error);
    }
  }

  private async loadMetadata(): Promise<Record<string, any>> {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private async removeFromStorage(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`personalization_${key}`);
      
      const metadata = await this.loadMetadata();
      delete metadata[key];
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(metadata));
    } catch (error) {
      console.error('[PersonalizationCache] Error removing from storage:', error);
    }
  }

  async clearCache(): Promise<void> {
    // Clear memory
    this.memoryCache.clear();
    this.currentMemorySize = 0;
    
    // Clear storage
    try {
      const metadata = await this.loadMetadata();
      const keys = Object.keys(metadata);
      
      await Promise.all([
        ...keys.map(key => AsyncStorage.removeItem(`personalization_${key}`)),
        AsyncStorage.removeItem(this.storageKey),
      ]);
      
      console.log(`[PersonalizationCache] Cleared ${keys.length} entries`);
    } catch (error) {
      console.error('[PersonalizationCache] Error clearing storage:', error);
    }
  }

  getStats() {
    const entries = Array.from(this.memoryCache.values());
    const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    
    return {
      entriesInMemory: this.memoryCache.size,
      memoryUsage: this.currentMemorySize,
      memoryUsagePercent: (this.currentMemorySize / this.maxMemorySize) * 100,
      totalAccesses,
      averageAccessCount: entries.length > 0 ? totalAccesses / entries.length : 0,
    };
  }
}