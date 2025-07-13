import { SportType, TrackFieldEvent, ExperienceLevel } from '@/store/user-store';
import { VisualizationCategory } from './visualization';

export interface UserContext {
  sport?: SportType;
  trackFieldEvent?: TrackFieldEvent;
  experienceLevel?: ExperienceLevel;
  primaryFocus?: 'consistency' | 'performance' | 'mindset' | 'recovery';
  goals?: string;
  ageRange?: string;
  recentSessionCount?: number;
  currentStreak?: number;
}

export interface ContextualFactors {
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  timeUntilEvent?: string; // e.g., "2 hours", "1 day", "1 week"
  recentPerformance?: string;
  currentMood?: string;
  weatherConditions?: string;
  location?: 'home' | 'gym' | 'track' | 'competition-venue';
}

export interface PersonalizationRequest {
  userContext: UserContext;
  visualizationId: string;
  visualizationTitle: string;
  visualizationCategory: VisualizationCategory;
  baseContent: string[]; // Array of base visualization steps
  contextualFactors?: ContextualFactors;
  tone?: 'motivational' | 'calming' | 'focused' | 'energizing';
  length?: 'short' | 'medium' | 'long'; // Affects content depth
}

export interface PersonalizedContent {
  steps: PersonalizedStep[];
  generatedAt: string;
  cacheKey: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
}

export interface PersonalizedStep {
  content: string;
  duration?: number; // Suggested duration in seconds
  emphasis?: 'normal' | 'slow' | 'powerful'; // Affects TTS delivery
  personalizedElements: string[]; // Track what was personalized
}

export interface PersonalizationError {
  code: 'API_ERROR' | 'RATE_LIMIT' | 'INVALID_KEY' | 'NETWORK_ERROR' | 'UNKNOWN';
  message: string;
  fallbackAvailable: boolean;
}

export interface PersonalizationCacheEntry {
  key: string;
  content: PersonalizedContent;
  userContext: UserContext;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // Size in bytes
}

export interface PersonalizationStats {
  totalRequests: number;
  cacheHits: number;
  apiCalls: number;
  totalTokensUsed: number;
  averageResponseTime: number;
  errorCount: number;
}