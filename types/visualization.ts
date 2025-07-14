export type VisualizationCategory = 'performance-process' | 'identity-shifting' | 'emotional-healing' | 'goal-achievement';

export const CATEGORY_INFO = {
  'performance-process': {
    title: 'Performance & Process Enhancement',
    description: 'Improve execution of specific tasks, skills, or routines',
    icon: 'target',
    color: '#FF6B6B',
  },
  'identity-shifting': {
    title: 'Internal State & Identity Shifting', 
    description: 'Build confidence, self-belief, and personal power',
    icon: 'user',
    color: '#4ECDC4',
  },
  'emotional-healing': {
    title: 'Emotional Healing & Regulation',
    description: 'Process and manage difficult emotions or challenges',
    icon: 'heart',
    color: '#45B7D1',
  },
  'goal-achievement': {
    title: 'Outcome & Goal Achievement',
    description: 'Create clear visions of future achievements',
    icon: 'trophy',
    color: '#F7B801',
  },
};

export interface VisualizationStep {
  id: number;
  content: string;
  duration?: number; // suggested duration in seconds
  audioFile?: string; // optional pre-recorded audio file path
  audioUrl?: string; // optional remote audio URL
}

export interface Visualization {
  id: string;
  title: string;
  description: string;
  duration: number; // total duration in minutes
  category: VisualizationCategory;
  steps: VisualizationStep[];
  personalizedSteps?: VisualizationStep[]; // Optional personalized version
  backgroundAudio?: string; // optional background music/sounds
  lastPersonalized?: string; // ISO date string
}

export interface VisualizationSession {
  id: string;
  visualizationId: string;
  startedAt: string;
  completedAt?: string;
  currentStep: number;
  completed: boolean;
  duration: number; // actual duration in seconds
}

export interface VisualizationPreferences {
  audioEnabled: boolean;
  backgroundAudioEnabled: boolean;
  volume: number; // 0-1
  autoProgress: boolean; // auto advance to next step
  // TTS Settings
  ttsEnabled: boolean;
  ttsVoice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  ttsSpeed: number; // 0.25 to 4.0
  ttsModel: 'tts-1' | 'tts-1-hd';
  autoPlayTTS: boolean;
  preloadNext: boolean; // Preload next step's audio
}

export interface VisualizationStats {
  visualizationId: string;
  completionCount: number;
  totalDuration: number; // in seconds
  lastCompletedAt?: string;
  averageDuration: number;
}

export interface VisualizationFavorite {
  visualizationId: string;
  addedAt: string; // ISO date string
}