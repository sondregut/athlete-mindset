import { OPENAI_API_KEY } from '@env';

export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
export type TTSModel = 'tts-1' | 'tts-1-hd';

interface TTSOptions {
  voice?: TTSVoice;
  model?: TTSModel;
  speed?: number; // 0.25 to 4.0
}

export class TTSOpenAIService {
  private apiKey: string;
  private requestQueue: Promise<any> = Promise.resolve();
  private lastRequestTime: number = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

  constructor() {
    this.apiKey = OPENAI_API_KEY;
    
    if (!this.apiKey) {
      console.error('OpenAI API key not found in environment variables');
      throw new Error('OpenAI API key is required');
    }
    
    console.log('OpenAI TTS Service initialized with API key:', 
      `${this.apiKey.substring(0, 7)}...${this.apiKey.substring(this.apiKey.length - 4)}`
    );
  }

  async synthesizeSpeech(
    text: string,
    options: TTSOptions = {}
  ): Promise<Blob> {
    const { voice = 'nova', model = 'tts-1', speed = 1.0 } = options;
    
    // Queue request to enforce rate limiting
    const result = await this.requestQueue.then(async () => {
      // Enforce minimum interval between requests
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => 
          setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
        );
      }
      
      this.lastRequestTime = Date.now();
      return this.performSynthesis(text, voice, model, speed);
    });
    
    // Update queue
    this.requestQueue = this.requestQueue.then(() => {}).catch(() => {});
    
    return result;
  }

  private async performSynthesis(
    text: string,
    voice: TTSVoice,
    model: TTSModel,
    speed: number
  ): Promise<Blob> {
    console.log(`Generating TTS for: "${text.substring(0, 50)}..."`);
    console.log('Parameters:', { voice, model, speed });
    
    const requestBody = {
      model,
      input: text,
      voice,
      speed,
      response_format: 'mp3',
    };
    
    let retries = 3;
    let lastError: Error | null = null;
    
    while (retries > 0) {
      try {
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        console.log('OpenAI API Response:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpenAI API Error Response:', errorText);
          
          if (response.status === 401) {
            throw new Error('Invalid API key');
          } else if (response.status === 429) {
            // Rate limited - wait longer before retry
            console.log('Rate limited, waiting before retry...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            retries--;
            continue;
          } else {
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
          }
        }
        
        // Get response as blob
        const audioBlob = await response.blob();
        console.log('Successfully generated audio:', audioBlob.size, 'bytes');
        
        return audioBlob;
      } catch (error: any) {
        console.error('TTS synthesis error:', error);
        lastError = error;
        
        if (error.message === 'Invalid API key') {
          throw error; // Don't retry for auth errors
        }
        
        retries--;
        if (retries > 0) {
          console.log(`Retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    throw lastError || new Error('Failed to generate speech after multiple attempts');
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      
      console.log('OpenAI connection test:', response.status);
      return response.ok;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }
}