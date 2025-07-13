import Constants from 'expo-constants';

// Get OpenAI API key from environment or Constants
export const getOpenAIApiKey = (): string => {
  // Try multiple sources for the API key
  const sources = [
    // From expo-constants (app.config.js)
    Constants.expoConfig?.extra?.openaiApiKey,
    Constants.manifest?.extra?.openaiApiKey,
    Constants.manifest2?.extra?.expoClient?.extra?.openaiApiKey,
  ];

  for (const source of sources) {
    if (source && typeof source === 'string' && source.startsWith('sk-')) {
      console.log('API key loaded from environment');
      return source;
    }
  }

  console.error('No OpenAI API key found!');
  return '';
};

// API endpoints
export const OPENAI_TTS_ENDPOINT = 'https://api.openai.com/v1/audio/speech';
export const OPENAI_MODELS_ENDPOINT = 'https://api.openai.com/v1/models';