// Type definitions for Cloud Functions

export interface UserContext {
  sport?: string;
  trackFieldEvent?: string;
  experienceLevel?: string;
  userId?: string;
}

export interface PersonalizationRequest {
  visualizationId: string;
  userContext: UserContext;
  forceRegenerate?: boolean;
}

export interface PersonalizedStep {
  content: string;
  duration: number;
  emphasis?: string;
  personalizedElements?: string[];
}

export interface PersonalizedContent {
  steps: PersonalizedStep[];
  generatedAt: string;
  cacheKey: string;
  model: string;
  visualizationId: string;
  userContext: UserContext;
}

export interface TTSRequest {
  text: string;
  voice?: string;
  speed?: number;
  model?: string;
  cacheKey?: string;
}

export interface TTSResponse {
  url: string;
  cacheKey: string;
  duration?: number;
  cached: boolean;
}

export interface PreloadRequest {
  visualizationId: string;
  userContext: UserContext;
  voices?: string[];
}

export interface PreloadResponse {
  visualizationId: string;
  preloadedCount: number;
  urls: Record<string, Record<number, string>>; // voice -> stepId -> url
}

export interface VisualizationTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  steps: Array<{
    id: number;
    content: string;
    duration: number;
  }>;
}

// Sport-specific context for personalization
export interface SportContext {
  equipment: string[];
  environments: string[];
  mentalChallenges: string[];
  movements: string[];
}