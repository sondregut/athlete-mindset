import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as crypto from 'crypto';
import { TTSRequest, TTSResponse, PreloadRequest, PreloadResponse } from './types';
import { generatePersonalizedVisualization } from './personalization';

// Lazy initialization to avoid initialization issues
const getFirestore = () => admin.firestore();
const getStorage = () => admin.storage().bucket();

// Gemini voice options
const GEMINI_VOICES = ['Aoede', 'Charon', 'Fenrir', 'Kore', 'Puck', 'Saga'];

export async function generateTTS(
  genAI: GoogleGenerativeAI,
  request: TTSRequest
): Promise<TTSResponse> {
  const { text, voice = 'Kore', speed = 1.0, model = 'gemini-2.5-flash-preview-tts' } = request;
  
  // Generate cache key
  const cacheKey = request.cacheKey || generateTTSCacheKey(text, voice, speed, model);
  
  // Check if audio already exists in Storage
  const existingUrl = await checkStorageCache(cacheKey);
  if (existingUrl) {
    console.log(`TTS cache hit for ${cacheKey}`);
    return {
      url: existingUrl,
      cacheKey,
      cached: true,
    };
  }
  
  // Generate audio using Gemini
  try {
    console.log(`Generating TTS for cache key: ${cacheKey}`);
    const audioBuffer = await generateWithGemini(genAI, text, voice, speed);
    
    // Upload to Cloud Storage
    const fileName = `tts-cache/${cacheKey}.wav`;
    const file = getStorage().file(fileName);
    
    await file.save(audioBuffer, {
      metadata: {
        contentType: 'audio/wav',
        metadata: {
          voice,
          speed: speed.toString(),
          model,
          generatedAt: new Date().toISOString(),
        },
      },
    });
    
    // Make file publicly readable
    await file.makePublic();
    
    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${getStorage().name}/${fileName}`;
    
    // Save metadata to Firestore
    await getFirestore().collection('tts_metadata').doc(cacheKey).set({
      text: text.substring(0, 200), // Store partial text for debugging
      voice,
      speed,
      model,
      fileName,
      publicUrl,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      size: audioBuffer.length,
    });
    
    return {
      url: publicUrl,
      cacheKey,
      cached: false,
    };
  } catch (error) {
    console.error('TTS generation error:', error);
    throw new Error('Failed to generate audio');
  }
}

async function generateWithGemini(
  genAI: GoogleGenerativeAI,
  text: string,
  voice: string,
  speed: number
): Promise<Buffer> {
  // Validate voice
  if (!GEMINI_VOICES.includes(voice)) {
    console.warn(`Invalid voice ${voice}, defaulting to Kore`);
    voice = 'Kore';
  }
  
  try {
    // Generate audio using Gemini TTS API
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-preview-tts',
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice,
            },
          },
        },
      } as any, // Type assertion for preview API
    });
    
    const response = await model.generateContent(text);
    
    const audioData = response.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!audioData) {
      throw new Error('No audio data received from Gemini TTS');
    }
    
    // Convert base64 to buffer - Gemini returns WAV format directly
    const audioBuffer = Buffer.from(audioData, 'base64');
    
    return audioBuffer;
  } catch (error) {
    console.error('Gemini TTS generation failed:', error);
    throw error;
  }
}

// Gemini TTS returns audio directly in WAV format

export async function preloadVisualizationAudio(
  genAI: GoogleGenerativeAI,
  request: PreloadRequest
): Promise<PreloadResponse> {
  const { visualizationId, userContext, voices = ['Kore'] } = request;
  
  // First, get personalized content
  const personalizedContent = await generatePersonalizedVisualization(genAI, {
    visualizationId,
    userContext,
  });
  
  const urls: Record<string, Record<number, string>> = {};
  let preloadedCount = 0;
  
  // Generate audio for each step and voice combination
  for (const voice of voices) {
    urls[voice] = {};
    
    for (let i = 0; i < personalizedContent.steps.length; i++) {
      const step = personalizedContent.steps[i];
      try {
        const ttsResult = await generateTTS(genAI, {
          text: step.content,
          voice,
          speed: 1.0,
        });
        
        urls[voice][i] = ttsResult.url;
        preloadedCount++;
      } catch (error) {
        console.error(`Failed to preload step ${i} with voice ${voice}:`, error);
      }
    }
  }
  
  return {
    visualizationId,
    preloadedCount,
    urls,
  };
}

// Helper functions
function generateTTSCacheKey(text: string, voice: string, speed: number, model: string): string {
  const keyString = `${text}|${voice}|${model}|${speed}`;
  return crypto.createHash('sha256').update(keyString).digest('hex').substring(0, 16);
}

async function checkStorageCache(cacheKey: string): Promise<string | null> {
  try {
    // Check Firestore metadata first
    const doc = await getFirestore().collection('tts_metadata').doc(cacheKey).get();
    if (doc.exists) {
      const data = doc.data();
      if (data?.publicUrl) {
        // Verify file still exists
        const file = getStorage().file(data.fileName);
        const [exists] = await file.exists();
        if (exists) {
          return data.publicUrl;
        }
      }
    }
  } catch (error) {
    console.error('Storage cache check error:', error);
  }
  return null;
}