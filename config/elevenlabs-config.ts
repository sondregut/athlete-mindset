import Constants from 'expo-constants';
import { ELEVENLABS_API_KEY } from '@env';

// Get ElevenLabs API key from environment or Constants
export const getElevenLabsApiKey = (): string => {
  console.log('[ElevenLabs Config] Starting API key search...');
  
  // Debug: Log what we're getting from each source
  console.log('[ElevenLabs Config] From @env:', ELEVENLABS_API_KEY ? `${ELEVENLABS_API_KEY.substring(0, 10)}...` : 'undefined');
  console.log('[ElevenLabs Config] From expoConfig.extra:', (Constants.expoConfig as any)?.extra?.elevenLabsApiKey ? 'present' : 'undefined');
  
  // Try multiple sources for the API key
  const sources = [
    // From react-native-dotenv
    ELEVENLABS_API_KEY,
    // From expo-constants (app.config.js)
    (Constants.expoConfig as any)?.extra?.elevenLabsApiKey,
    (Constants.manifest as any)?.extra?.elevenLabsApiKey,
    (Constants.manifest2 as any)?.extra?.expoClient?.extra?.elevenLabsApiKey,
  ];

  for (const source of sources) {
    if (source && typeof source === 'string' && source.startsWith('sk_')) {
      console.log('✅ ElevenLabs API key loaded successfully');
      return source;
    }
  }

  console.error('❌ No ElevenLabs API key found!');
  console.error('Make sure ELEVENLABS_API_KEY is set in your .env file');
  return '';
};

// API endpoints
export const ELEVENLABS_TTS_ENDPOINT = 'https://api.elevenlabs.io/v1/text-to-speech';
export const ELEVENLABS_VOICES_ENDPOINT = 'https://api.elevenlabs.io/v1/voices';

// Default model settings
export const ELEVENLABS_DEFAULT_MODEL = 'eleven_multilingual_v2';
export const ELEVENLABS_TURBO_MODEL = 'eleven_turbo_v2';

// Voice settings defaults
export const DEFAULT_VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.5,
  style: 0.5,
  use_speaker_boost: true
};

// Your custom ElevenLabs voice IDs
export const ELEVENLABS_VOICES = {
  christina: '2qfp6zPuviqeCOZIE9RZ', // Christina - Calming Yoga Instructor
  mark: '1SM7GgM6IMuvQlz2BwM3', // Mark - ConvoAI
  benjamin: 'LruHrtVF6PSyGItzMNHS', // Benjamin - Deep, Warm, Calming
  
  // Legacy voices for backward compatibility
  rachel: '21m00Tcm4TlvDq8ikWAM', // Fallback voice
  drew: 'CYw3kZ02Hs0563khs1Fj', // Fallback voice
  bella: 'EXAVITQu4vr4xnSDxMaL', // Fallback voice
};

// Map legacy voice names to ElevenLabs voices
export const VOICE_MAPPING = {
  'nova': ELEVENLABS_VOICES.christina,     // Calming and instructional
  'alloy': ELEVENLABS_VOICES.mark,         // Conversational and balanced
  'echo': ELEVENLABS_VOICES.benjamin,      // Deep and warm
  'fable': ELEVENLABS_VOICES.christina,    // Expressive and calming
  'onyx': ELEVENLABS_VOICES.benjamin,      // Deep and authoritative
  'shimmer': ELEVENLABS_VOICES.christina,  // Soft and soothing
};

// Voice options for user selection
export const VOICE_OPTIONS = [
  {
    id: 'christina',
    name: 'Christina',
    description: 'Calming Yoga Instructor',
    voiceId: ELEVENLABS_VOICES.christina,
    style: 'calm and instructional'
  },
  {
    id: 'mark', 
    name: 'Mark',
    description: 'Conversational AI',
    voiceId: ELEVENLABS_VOICES.mark,
    style: 'conversational and engaging'
  },
  {
    id: 'benjamin',
    name: 'Benjamin', 
    description: 'Deep, Warm, Calming',
    voiceId: ELEVENLABS_VOICES.benjamin,
    style: 'deep and warm'
  }
];