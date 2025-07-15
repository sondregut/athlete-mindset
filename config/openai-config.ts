import Constants from 'expo-constants';

// This is for OpenAI personalization service only (not TTS)
// TTS is handled by ElevenLabs

// Get OpenAI API key from environment or Constants
export const getOpenAIApiKey = (): string => {
  // Try multiple sources for the API key
  const sources = [
    // From expo-constants (app.config.js)
    (Constants.expoConfig as any)?.extra?.openaiApiKey,
    (Constants.manifest as any)?.extra?.openaiApiKey,
    (Constants.manifest2 as any)?.extra?.expoClient?.extra?.openaiApiKey,
  ];

  for (const source of sources) {
    if (source && typeof source === 'string' && source.startsWith('sk-')) {
      console.log('OpenAI API key loaded for personalization');
      return source;
    }
  }

  console.error('No OpenAI API key found for personalization!');
  return '';
};

// API endpoints for OpenAI (personalization only)
export const OPENAI_CHAT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
export const OPENAI_MODELS_ENDPOINT = 'https://api.openai.com/v1/models';