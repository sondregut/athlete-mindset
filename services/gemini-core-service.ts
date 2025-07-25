import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { ModelConfigWithAudio } from '@/types/gemini-extended';

// Handle both React Native and Node.js environments
let GEMINI_API_KEY: string | undefined;
try {
  // Try React Native environment
  const env = require('@env');
  GEMINI_API_KEY = env.GEMINI_API_KEY;
} catch {
  // Fall back to Node.js environment
  GEMINI_API_KEY = process.env.GEMINI_API_KEY;
}

export class GeminiCoreService {
  private static instance: GeminiCoreService | null = null;
  private genAI: GoogleGenerativeAI;
  private textModel: GenerativeModel;
  private ttsModel: GenerativeModel | null = null;
  
  private constructor() {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured. Please add GEMINI_API_KEY to your .env file.');
    }
    
    // Initialize Google Generative AI
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Initialize text generation model (Gemini 1.5 Pro)
    this.textModel = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
    
    console.log('[GeminiCore] Service initialized successfully');
  }
  
  static getInstance(): GeminiCoreService {
    if (!this.instance) {
      this.instance = new GeminiCoreService();
    }
    return this.instance;
  }
  
  static isConfigured(): boolean {
    return !!GEMINI_API_KEY;
  }
  
  getTextModel(): GenerativeModel {
    return this.textModel;
  }
  
  // Get TTS model (Gemini 2.5 Flash Preview TTS)
  getTTSModel(voice: string = 'Kore'): GenerativeModel {
    // Create a new model instance for each request to set proper config
    return this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-tts',
      generationConfig: {
        responseModalities: ['AUDIO'], // Specify we want audio output
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice
            }
          }
        }
      },
    } as ModelConfigWithAudio);
  }
  
  // Utility method for JSON generation
  getJSONModel(): GenerativeModel {
    return this.genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });
  }
  
  // Get raw Google Generative AI instance for custom configurations
  getGenAI(): GoogleGenerativeAI {
    return this.genAI;
  }
  
  // Validate API key and test connection
  async validateConnection(): Promise<boolean> {
    try {
      const result = await this.textModel.generateContent('Hello, test connection');
      return !!result.response.text();
    } catch (error: any) {
      console.error('[GeminiCore] Connection validation failed:', error.message);
      return false;
    }
  }
}