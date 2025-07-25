import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generatePersonalizedVisualization } from './personalization';
import { generateTTS, preloadVisualizationAudio } from './tts';
import { PersonalizationRequest, TTSRequest, PreloadRequest } from './types';

// Initialize Firebase Admin
admin.initializeApp();

// Export Cloud Functions with proper security and configuration
export const personalizeVisualization = functions
  .runWith({
    secrets: ['GEMINI_API_KEY'],
    timeoutSeconds: 300,
    memory: '1GB',
  })
  .https.onCall(async (data: PersonalizationRequest, context) => {
    // Verify user is authenticated (optional for now)
    // if (!context.auth) {
    //   throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    // }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      return await generatePersonalizedVisualization(genAI, data);
    } catch (error) {
      console.error('Personalization error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to generate personalized content');
    }
  });

export const generateAudioTTS = functions
  .runWith({
    secrets: ['GEMINI_API_KEY'],
    timeoutSeconds: 540,
    memory: '2GB',
  })
  .https.onCall(async (data: TTSRequest, context) => {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      return await generateTTS(genAI, data);
    } catch (error) {
      console.error('TTS generation error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to generate audio');
    }
  });

export const preloadVisualization = functions
  .runWith({
    secrets: ['GEMINI_API_KEY'],
    timeoutSeconds: 540,
    memory: '2GB',
  })
  .https.onCall(async (data: PreloadRequest, context) => {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      return await preloadVisualizationAudio(genAI, data);
    } catch (error) {
      console.error('Preload error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to preload visualization');
    }
  });

// Cache is preserved forever for optimal performance
// No cleanup functions - personalized content and TTS audio remain cached indefinitely