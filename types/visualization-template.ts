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
    pattern?: string;
  };
}

export interface PersonalizationInputs {
  [key: string]: string;
}

export interface PersonalizationRequest {
  template_id: string;
  inputs: PersonalizationInputs;
  voice_id: string;
}

export interface PersonalizationResponse {
  status: 'ready' | 'generating' | 'error';
  audioUrl?: string;
  scriptText?: string;
  estimatedTime?: number;
  error?: string;
  cached?: boolean;
}

export interface PersonalizedVisualization {
  templateId: string;
  sport: string;
  voiceId: string;
  scriptText: string;
  audioUrl?: string;
  createdAt: string;
  sportSpecificData?: {
    location: string;
    sounds: string;
    keyAction: string;
  };
}