import Constants from 'expo-constants';

// Get ElevenLabs API key from environment or Constants
export const getElevenLabsApiKey = (): string => {
  // Try multiple sources for the API key
  const sources = [
    // From expo-constants (app.config.js)
    (Constants.expoConfig as any)?.extra?.elevenLabsApiKey,
    (Constants.manifest as any)?.extra?.elevenLabsApiKey,
    (Constants.manifest2 as any)?.extra?.expoClient?.extra?.elevenLabsApiKey,
  ];

  for (const source of sources) {
    if (source && typeof source === 'string' && source.startsWith('sk_')) {
      console.log('ElevenLabs API key loaded from environment');
      return source;
    }
  }

  console.error('No ElevenLabs API key found!');
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

// Common ElevenLabs voice IDs (you'll need to get actual voice IDs from your account)
export const ELEVENLABS_VOICES = {
  // These are example IDs - replace with actual voice IDs from your ElevenLabs account
  rachel: '21m00Tcm4TlvDq8ikWAM', // Example: Rachel - calm, conversational
  drew: 'CYw3kZ02Hs0563khs1Fj', // Example: Drew - deep, confident
  clyde: '2EiwWnXFnvU5JabPnv8n', // Example: Clyde - war veteran
  paul: '5Q0t7uMcjvnagumLfvZi', // Example: Paul - news presenter
  domi: 'AZnzlk1XvdvUeBnXmlld', // Example: Domi - strong, confident
  dave: 'CcHKVEHiGdXiFxqxvPPp', // Example: Dave - conversational, friendly
  fin: 'D38z5RcWu1voky8WS1ja', // Example: Fin - old American male
  bella: 'EXAVITQu4vr4xnSDxMaL', // Example: Bella - soft, young
  antoni: 'ErXwobaYiN019PkySvjV', // Example: Antoni - well-rounded
  thomas: 'GBv7mTt0atIp3Br8iCZE', // Example: Thomas - calm, narrative
};

// Map legacy voice names to ElevenLabs voices
export const VOICE_MAPPING = {
  'nova': ELEVENLABS_VOICES.rachel,     // Friendly and conversational
  'alloy': ELEVENLABS_VOICES.drew,      // Neutral and balanced
  'echo': ELEVENLABS_VOICES.paul,       // Warm and engaging
  'fable': ELEVENLABS_VOICES.domi,      // Expressive and dynamic
  'onyx': ELEVENLABS_VOICES.dave,       // Deep and authoritative
  'shimmer': ELEVENLABS_VOICES.bella,   // Soft and soothing
};