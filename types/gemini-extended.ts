// Extended types for Gemini API features not yet in the official SDK types

import { GenerationConfig } from '@google/generative-ai';

// Extend the GenerationConfig interface to include audio-specific properties
export interface GenerationConfigWithAudio extends GenerationConfig {
  responseModalities?: string[];
  speechConfig?: {
    voiceConfig?: {
      prebuiltVoiceConfig?: {
        voiceName: string;
      };
    };
  };
}

// For getGenerativeModel config
export interface ModelConfigWithAudio {
  model: string;
  generationConfig?: GenerationConfigWithAudio;
  safetySettings?: any[];
}

// For generateContent request
export interface GenerateContentRequestWithAudio {
  contents: any[];
  generationConfig?: GenerationConfigWithAudio;
}