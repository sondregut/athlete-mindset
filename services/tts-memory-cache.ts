interface CacheEntry {
  key: string;
  audioUri: string;
  size: number;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export class TTSMemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number = 50 * 1024 * 1024; // 50MB memory cache
  private currentSize: number = 0;

  constructor(maxSizeMB: number = 50) {
    this.maxSize = maxSizeMB * 1024 * 1024;
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Update access metrics
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    console.log(`Memory cache hit for key: ${key}`);
    return entry.audioUri;
  }

  set(key: string, audioUri: string, size: number): void {
    // If key exists, remove old entry first
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!;
      this.currentSize -= oldEntry.size;
      this.cache.delete(key);
    }

    // Evict entries if needed
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      this.evictLRU();
    }

    // Add new entry
    const entry: CacheEntry = {
      key,
      audioUri,
      size,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry);
    this.currentSize += size;
    
    console.log(`Added to memory cache: ${key} (${(size / 1024).toFixed(1)}KB)`);
  }

  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    // Find least recently used entry
    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      const entry = this.cache.get(lruKey)!;
      this.currentSize -= entry.size;
      this.cache.delete(lruKey);
      console.log(`Evicted from memory cache: ${lruKey}`);
    }
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  getStats(): {
    entries: number;
    currentSize: number;
    maxSize: number;
    hitRate: number;
  } {
    const totalAccess = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.accessCount,
      0
    );
    
    return {
      entries: this.cache.size,
      currentSize: this.currentSize,
      maxSize: this.maxSize,
      hitRate: totalAccess > 0 ? this.cache.size / totalAccess : 0,
    };
  }

  getCacheEntries(): CacheEntry[] {
    return Array.from(this.cache.values()).sort(
      (a, b) => b.lastAccessed - a.lastAccessed
    );
  }
}