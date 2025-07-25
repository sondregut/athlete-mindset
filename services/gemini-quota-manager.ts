import AsyncStorage from '@react-native-async-storage/async-storage';

interface QuotaData {
  dailyRequests: number;
  lastRequestTime: number;
  quotaResetTime: number;
  lastQuotaError?: number;
}

const STORAGE_KEY = '@gemini_quota_data';

// Gemini API Limits:
// - Free tier: 1,500 requests/day, 10 rpm
// - Paid tier: 2,000,000 requests/day, 2,000 rpm
// To enable paid tier limits, add GEMINI_PAID_TIER=true to your .env file
let DAILY_LIMIT = 1500; // Default to free tier
let MIN_REQUEST_INTERVAL = 6000; // Default to 6 seconds (10 rpm)

// Check if we're in paid tier (will be set from app config)
try {
  const Constants = require('expo-constants').default;
  const isPaidTier = Constants.expoConfig?.extra?.geminiPaidTier === true;
  if (isPaidTier) {
    DAILY_LIMIT = 2000000; // 2 million requests per day
    MIN_REQUEST_INTERVAL = 30; // 30ms between requests (2000 rpm)
    console.log('[GeminiQuotaManager] Running in PAID TIER mode');
  }
} catch (e) {
  // Default to free tier if expo-constants not available
}

const QUOTA_WARNING_THRESHOLD = 0.8; // Warn at 80% usage

class GeminiQuotaManager {
  private static instance: GeminiQuotaManager;
  private quotaData: QuotaData | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): GeminiQuotaManager {
    if (!GeminiQuotaManager.instance) {
      GeminiQuotaManager.instance = new GeminiQuotaManager();
    }
    return GeminiQuotaManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.quotaData = JSON.parse(stored);
        // Check if we need to reset for a new day
        if (this.isNewDay()) {
          await this.resetDailyQuota();
        }
      } else {
        await this.resetDailyQuota();
      }
      this.initialized = true;
    } catch (error) {
      console.error('[GeminiQuotaManager] Failed to initialize:', error);
      // Initialize with defaults on error
      this.quotaData = {
        dailyRequests: 0,
        lastRequestTime: 0,
        quotaResetTime: this.getNextResetTime(),
      };
      this.initialized = true;
    }
  }

  private isNewDay(): boolean {
    if (!this.quotaData) return true;
    return Date.now() >= this.quotaData.quotaResetTime;
  }

  private getNextResetTime(): number {
    // Reset at midnight Pacific Time
    const now = new Date();
    
    // Get current time in Pacific timezone
    const pacificTimeStr = now.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Parse the Pacific time
    const pacific = new Date(pacificTimeStr);
    
    // Set to next midnight (00:00:00 the next day)
    pacific.setDate(pacific.getDate() + 1);
    pacific.setHours(0, 0, 0, 0);
    
    // Convert back to UTC timestamp
    return pacific.getTime();
  }

  private async resetDailyQuota(): Promise<void> {
    this.quotaData = {
      dailyRequests: 0,
      lastRequestTime: 0,
      quotaResetTime: this.getNextResetTime(),
    };
    await this.saveQuota();
    console.log('[GeminiQuotaManager] Daily quota reset');
  }

  private async saveQuota(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.quotaData));
    } catch (error) {
      console.error('[GeminiQuotaManager] Failed to save quota:', error);
    }
  }

  async canMakeRequest(): Promise<{ allowed: boolean; reason?: string; waitTime?: number }> {
    await this.initialize();

    if (!this.quotaData) {
      return { allowed: false, reason: 'Quota manager not initialized' };
    }

    // Check if we need to reset for a new day
    if (this.isNewDay()) {
      await this.resetDailyQuota();
    }

    // Check daily limit
    if (this.quotaData.dailyRequests >= DAILY_LIMIT) {
      const msUntilReset = this.quotaData.quotaResetTime - Date.now();
      let resetTimeStr = 'unknown time';
      
      if (msUntilReset > 0) {
        const hoursUntilReset = Math.ceil(msUntilReset / (1000 * 60 * 60));
        const minutesUntilReset = Math.ceil(msUntilReset / (1000 * 60));
        
        if (hoursUntilReset > 1) {
          resetTimeStr = `${hoursUntilReset} hours`;
        } else if (minutesUntilReset > 1) {
          resetTimeStr = `${minutesUntilReset} minutes`;
        } else {
          resetTimeStr = 'less than a minute';
        }
      } else {
        // Reset time has passed, should reset on next check
        resetTimeStr = 'any moment (reset pending)';
      }
      
      return { 
        allowed: false, 
        reason: `Daily quota exceeded (${DAILY_LIMIT.toLocaleString()} requests). Resets in ${resetTimeStr}.` 
      };
    }

    // Check if we had a recent quota error
    if (this.quotaData.lastQuotaError && Date.now() - this.quotaData.lastQuotaError < 60000) {
      return { 
        allowed: false, 
        reason: 'Recent quota error detected. Waiting before retry.' 
      };
    }

    // Check rate limiting
    const timeSinceLastRequest = Date.now() - this.quotaData.lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      return { 
        allowed: false, 
        reason: 'Rate limit: too many requests', 
        waitTime 
      };
    }

    // Warn if approaching limit
    if (this.quotaData.dailyRequests >= DAILY_LIMIT * QUOTA_WARNING_THRESHOLD) {
      console.warn(`[GeminiQuotaManager] Approaching daily limit: ${this.quotaData.dailyRequests}/${DAILY_LIMIT}`);
    }

    return { allowed: true };
  }

  async recordRequest(): Promise<void> {
    await this.initialize();

    if (!this.quotaData) return;

    this.quotaData.dailyRequests++;
    this.quotaData.lastRequestTime = Date.now();
    await this.saveQuota();

    console.log(`[GeminiQuotaManager] Request recorded: ${this.quotaData.dailyRequests}/${DAILY_LIMIT}`);
  }

  async recordQuotaError(): Promise<void> {
    await this.initialize();

    if (!this.quotaData) return;

    this.quotaData.lastQuotaError = Date.now();
    // Set to max to prevent further requests today
    this.quotaData.dailyRequests = DAILY_LIMIT;
    await this.saveQuota();

    console.error('[GeminiQuotaManager] Quota error recorded - blocking further requests');
  }

  async getQuotaStatus(): Promise<{
    used: number;
    limit: number;
    percentage: number;
    resetTime: Date;
    canMakeRequest: boolean;
  }> {
    await this.initialize();

    const quotaData = this.quotaData || {
      dailyRequests: 0,
      lastRequestTime: 0,
      quotaResetTime: this.getNextResetTime(),
    };

    const canMakeRequest = await this.canMakeRequest();

    return {
      used: quotaData.dailyRequests,
      limit: DAILY_LIMIT,
      percentage: (quotaData.dailyRequests / DAILY_LIMIT) * 100,
      resetTime: new Date(quotaData.quotaResetTime),
      canMakeRequest: canMakeRequest.allowed,
    };
  }

  async resetQuota(): Promise<void> {
    await this.resetDailyQuota();
    console.log('[GeminiQuotaManager] Quota manually reset');
  }

  getTierInfo(): {
    tier: 'free' | 'paid';
    dailyLimit: number;
    rateLimit: number;
    rateLimitUnit: string;
  } {
    const isPaid = DAILY_LIMIT > 1500;
    return {
      tier: isPaid ? 'paid' : 'free',
      dailyLimit: DAILY_LIMIT,
      rateLimit: isPaid ? 2000 : 10,
      rateLimitUnit: isPaid ? 'per minute' : 'per minute',
    };
  }
}

export const geminiQuotaManager = GeminiQuotaManager.getInstance();