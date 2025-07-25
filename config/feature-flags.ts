import AsyncStorage from '@react-native-async-storage/async-storage';

// Feature flags for gradual rollout
export interface FeatureFlags {
  // Cloud Functions feature flag
  useCloudFunctions?: boolean;
  // Reserved for future feature flags
}

const DEFAULT_FLAGS: FeatureFlags = {
  // Start with Cloud Functions disabled by default
  useCloudFunctions: false,
};

const STORAGE_KEY = 'app_feature_flags';

class FeatureFlagService {
  private static instance: FeatureFlagService;
  private flags: FeatureFlags = DEFAULT_FLAGS;
  private initialized = false;

  private constructor() {}

  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.flags = { ...DEFAULT_FLAGS, ...JSON.parse(stored) };
      }
      this.initialized = true;
      console.log('[FeatureFlags] Initialized:', this.flags);
    } catch (error) {
      console.error('[FeatureFlags] Failed to load flags:', error);
      this.flags = DEFAULT_FLAGS;
      this.initialized = true;
    }
  }

  getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  getFlag<K extends keyof FeatureFlags>(key: K): FeatureFlags[K] {
    return this.flags[key];
  }
  
  // Legacy method for compatibility
  getLegacyFlag(key: string): boolean {
    // Always return true for legacy Gemini flags since we're fully migrated
    if (key === 'geminiTTSEnabled' || key === 'geminiPersonalizationEnabled' || key === 'useGeminiAPI') {
      return true;
    }
    return false;
  }
  
  // Check if a feature is enabled
  async isEnabled(key: keyof FeatureFlags): Promise<boolean> {
    await this.initialize();
    return this.flags[key] === true;
  }

  async setFlag<K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]): Promise<void> {
    this.flags[key] = value;
    await this.saveFlags();
  }

  async setFlags(flags: Partial<FeatureFlags>): Promise<void> {
    this.flags = { ...this.flags, ...flags };
    await this.saveFlags();
  }

  private async saveFlags(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.flags));
      console.log('[FeatureFlags] Saved:', this.flags);
    } catch (error) {
      console.error('[FeatureFlags] Failed to save flags:', error);
    }
  }

  // Legacy methods for compatibility
  async shouldUseGemini(userId?: string): Promise<boolean> {
    // Always return true since we're fully migrated to Gemini
    return true;
  }

  // Debug method kept for compatibility
  async forceGemini(enabled: boolean): Promise<void> {
    // No-op since we're always using Gemini now
    console.log('[FeatureFlags] forceGemini called but ignored - always using Gemini');
  }
}

export const featureFlags = FeatureFlagService.getInstance();

// Initialize on import
featureFlags.initialize();