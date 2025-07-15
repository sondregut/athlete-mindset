/**
 * Smart Logger - Prevents console spam by intelligently throttling repetitive logs
 */
export class SmartLogger {
  private logCounts: { [key: string]: number } = {};
  private lastLogTime: { [key: string]: number } = {};
  private readonly SPAM_THRESHOLD = 3;
  private readonly TIME_WINDOW = 5000; // 5 seconds

  log(key: string, message: string, data?: any) {
    const now = Date.now();
    const lastTime = this.lastLogTime[key] || 0;
    
    if (now - lastTime > this.TIME_WINDOW) {
      this.logCounts[key] = 0;
    }
    
    this.logCounts[key] = (this.logCounts[key] || 0) + 1;
    this.lastLogTime[key] = now;
    
    if (this.logCounts[key] <= this.SPAM_THRESHOLD) {
      console.log(message, data);
    } else if (this.logCounts[key] === this.SPAM_THRESHOLD + 1) {
      console.log(`🔇 ${key} - Further similar logs suppressed`);
    }
  }

  warn(key: string, message: string, data?: any) {
    const now = Date.now();
    const lastTime = this.lastLogTime[key] || 0;
    
    if (now - lastTime > this.TIME_WINDOW) {
      this.logCounts[key] = 0;
    }
    
    this.logCounts[key] = (this.logCounts[key] || 0) + 1;
    this.lastLogTime[key] = now;
    
    if (this.logCounts[key] <= this.SPAM_THRESHOLD) {
      console.warn(message, data);
    } else if (this.logCounts[key] === this.SPAM_THRESHOLD + 1) {
      console.warn(`🔇 ${key} - Further similar warnings suppressed`);
    }
  }

  error(key: string, message: string, data?: any) {
    const now = Date.now();
    const lastTime = this.lastLogTime[key] || 0;
    
    if (now - lastTime > this.TIME_WINDOW) {
      this.logCounts[key] = 0;
    }
    
    this.logCounts[key] = (this.logCounts[key] || 0) + 1;
    this.lastLogTime[key] = now;
    
    if (this.logCounts[key] <= this.SPAM_THRESHOLD) {
      console.error(message, data);
    } else if (this.logCounts[key] === this.SPAM_THRESHOLD + 1) {
      console.error(`🔇 ${key} - Further similar errors suppressed`);
    }
  }

  // One-time log for important events
  once(key: string, message: string, data?: any) {
    if (!this.logCounts[key]) {
      this.logCounts[key] = 1;
      console.log(message, data);
    }
  }

  // Reset counters for a specific key
  reset(key: string) {
    delete this.logCounts[key];
    delete this.lastLogTime[key];
  }

  // Get stats for debugging
  getStats() {
    return {
      logCounts: { ...this.logCounts },
      lastLogTime: { ...this.lastLogTime }
    };
  }
}

// Global instance
export const smartLogger = new SmartLogger();

/**
 * Access Stats Manager - Manages TTS access statistics without spam
 */
export class AccessStatsManager {
  private skipCount = 0;
  private lastReportTime = 0;
  private readonly REPORT_INTERVAL = 30000; // 30 seconds

  logSkip(cacheKey: string) {
    this.skipCount++;
    
    const now = Date.now();
    if (now - this.lastReportTime > this.REPORT_INTERVAL) {
      console.log(`📊 TTS: Skipped access stats for ${this.skipCount} local files`);
      this.skipCount = 0;
      this.lastReportTime = now;
    }
  }
  
  logUpdate(cacheKey: string) {
    smartLogger.log('access-stats-update', `✅ TTS: Updated access stats for ${cacheKey}`);
  }

  reset() {
    this.skipCount = 0;
    this.lastReportTime = 0;
  }
}

// Global instance
export const accessStatsManager = new AccessStatsManager();