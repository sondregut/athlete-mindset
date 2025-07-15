import { Audio } from 'expo-av';
import { getElevenLabsApiKey, ELEVENLABS_TTS_ENDPOINT, ELEVENLABS_DEFAULT_MODEL, DEFAULT_VOICE_SETTINGS, VOICE_MAPPING } from '@/config/elevenlabs-config';
import { smartLogger } from '@/utils/smart-logger';

export class SimpleElevenLabsTTS {
  private static instance: SimpleElevenLabsTTS;
  private apiKey: string;
  private currentSound: Audio.Sound | null = null;

  private constructor() {
    this.apiKey = getElevenLabsApiKey();
  }

  static getInstance(): SimpleElevenLabsTTS {
    if (!SimpleElevenLabsTTS.instance) {
      SimpleElevenLabsTTS.instance = new SimpleElevenLabsTTS();
    }
    return SimpleElevenLabsTTS.instance;
  }

  async synthesizeAndPlay(text: string, options: {
    voice?: string;
    model?: string;
    speed?: number;
    volume?: number;
  } = {}): Promise<Audio.Sound | null> {
    try {
      // Stop any currently playing audio
      await this.stopCurrentAudio();

      const { 
        voice = '21m00Tcm4TlvDq8ikWAM', // Rachel voice default
        model = 'eleven_multilingual_v2',
        speed = 1.0,
        volume = 0.8
      } = options;

      // Map old OpenAI voices or invalid models to ElevenLabs
      let voiceId = voice;
      
      // Handle OpenAI voice names
      if (voice in VOICE_MAPPING) {
        voiceId = VOICE_MAPPING[voice as keyof typeof VOICE_MAPPING];
      }
      
      // Ensure we have a valid ElevenLabs voice ID
      if (!voiceId || voiceId.length < 10) {
        voiceId = '21m00Tcm4TlvDq8ikWAM'; // Default to Rachel
      }

      smartLogger.log('tts-request', `Synthesizing text (${text.length} chars) with voice ${voiceId}`);

      // Call ElevenLabs API
      const response = await fetch(`${ELEVENLABS_TTS_ENDPOINT}/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: model || ELEVENLABS_DEFAULT_MODEL,
          voice_settings: {
            ...DEFAULT_VOICE_SETTINGS,
            stability: speed > 1 ? 0.3 : speed < 1 ? 0.7 : 0.5,
          }
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
      }

      // Get audio data as blob
      const audioBlob = await response.blob();
      
      // Convert blob to base64
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      // Create audio URI from base64
      const audioUri = `data:audio/mpeg;base64,${base64Audio}`;

      // Create and play audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { 
          shouldPlay: true,
          volume: volume,
        }
      );

      this.currentSound = sound;
      smartLogger.log('tts-success', 'Audio playback started');
      
      return sound;
    } catch (error) {
      smartLogger.log('tts-error', `TTS failed: ${error}`);
      console.error('TTS Error:', error);
      return null;
    }
  }

  async stopCurrentAudio(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch (error) {
        // Ignore errors when stopping
      }
      this.currentSound = null;
    }
  }

  async pauseCurrentAudio(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.pauseAsync();
      } catch (error) {
        console.error('Error pausing audio:', error);
      }
    }
  }

  async resumeCurrentAudio(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.playAsync();
      } catch (error) {
        console.error('Error resuming audio:', error);
      }
    }
  }

  getCurrentSound(): Audio.Sound | null {
    return this.currentSound;
  }
}