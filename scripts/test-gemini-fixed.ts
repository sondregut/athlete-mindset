#!/usr/bin/env bun

import { GeminiTTSService } from '../services/gemini-tts-service';
import { GeminiPersonalizationService } from '../services/gemini-personalization-service';
import { TTSFirebaseCacheGemini } from '../services/tts-firebase-cache-gemini';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testGeminiTTS() {
  console.log('\n=== Testing Gemini TTS ===\n');
  
  const ttsService = GeminiTTSService.getInstance();
  const cacheService = TTSFirebaseCacheGemini.getInstance();
  
  // Test text
  const testText = "Welcome to your mindset journey. Focus on your breathing and feel your confidence growing.";
  
  // Test different voices
  const voices = ['Kore', 'Aoede', 'Charon', 'Fenrir', 'Puck'];
  
  for (const voice of voices) {
    console.log(`\nTesting voice: ${voice}`);
    try {
      // Test direct TTS generation
      console.log('- Testing direct generation...');
      const sound = await ttsService.synthesizeAndPlay(testText, {
        voice,
        tone: 'calm',
        speed: 1.0,
        volume: 0.8
      });
      
      if (sound) {
        console.log('✅ Direct TTS generation successful');
        // Clean up
        await sound.unloadAsync();
      } else {
        console.log('❌ Direct TTS generation failed');
      }
      
      // Test cached version
      console.log('- Testing cached generation...');
      const cachedUri = await cacheService.synthesizeSpeech(testText, {
        voice,
        model: 'gemini-2.5-flash-preview-tts',
        speed: 1.0
      });
      
      if (cachedUri) {
        console.log('✅ Cached TTS generation successful');
        console.log(`   Audio URI: ${cachedUri}`);
      } else {
        console.log('❌ Cached TTS generation failed');
      }
      
      // Add delay to respect rate limiting
      await new Promise(resolve => setTimeout(resolve, 7000));
      
    } catch (error) {
      console.error(`❌ Error with voice ${voice}:`, error);
    }
  }
}

async function testGeminiPersonalization() {
  console.log('\n\n=== Testing Gemini Personalization ===\n');
  
  const personalizationService = GeminiPersonalizationService.getInstance();
  
  const testRequest = {
    userContext: {
      sport: 'soccer' as const,
      trackFieldEvent: undefined,
    },
    visualizationId: 'peak-performance-sports',
    visualizationTitle: 'Peak Performance Sports Visualization',
    visualizationCategory: 'performance-process' as const,
    baseContent: [
      'Take a moment to center yourself and focus on your upcoming performance.',
      'Visualize yourself executing your sport with perfect technique and confidence.',
      'Feel the energy flowing through your body as you perform at your peak.'
    ],
  };
  
  try {
    console.log('Testing personalization for soccer...');
    const result = await personalizationService.generatePersonalizedVisualization(testRequest);
    
    console.log('✅ Personalization successful');
    console.log('Generated steps:', result.steps.length);
    console.log('\nFirst personalized step:');
    console.log(result.steps[0].content);
    console.log('\nPersonalized elements:', result.steps[0].personalizedElements);
    
  } catch (error) {
    console.error('❌ Personalization failed:', error);
  }
}

async function main() {
  console.log('Starting Gemini integration tests...');
  console.log('API Key configured:', !!process.env.GEMINI_API_KEY);
  
  try {
    // Test TTS first
    await testGeminiTTS();
    
    // Then test personalization
    await testGeminiPersonalization();
    
    console.log('\n\n=== All tests completed ===');
  } catch (error) {
    console.error('\n\nFatal error:', error);
  }
}

// Run tests
main().catch(console.error);