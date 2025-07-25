import { GeminiPersonalizationService } from './gemini-personalization-service';
import {
  PersonalizationRequest,
  PersonalizedContent,
} from '@/types/personalization';

export class PersonalizationService {
  private static instance: PersonalizationService | null = null;
  private geminiService: GeminiPersonalizationService;

  private constructor() {
    this.geminiService = GeminiPersonalizationService.getInstance();
  }

  static getInstance(): PersonalizationService {
    if (!this.instance) {
      this.instance = new PersonalizationService();
    }
    return this.instance;
  }

  async generatePersonalizedVisualization(
    request: PersonalizationRequest
  ): Promise<PersonalizedContent> {
    console.log('[PersonalizationService] Using Gemini AI personalization');
    
    try {
      return await this.geminiService.generatePersonalizedVisualization(request);
    } catch (error: any) {
      console.error('[PersonalizationService] Personalization failed:', error.message);
      throw error;
    }
  }

  getStats() {
    return {
      service: 'Gemini AI',
      ...this.geminiService.getStats(),
    };
  }

  async clearCache() {
    await this.geminiService.clearCache();
    console.log('[PersonalizationService] Cache cleared');
  }

  // Get the current active service name
  getActiveService(): string {
    return 'Gemini AI';
  }

  // Check if personalization is available
  isAvailable(): boolean {
    // Gemini-based system is always available
    return true;
  }
}