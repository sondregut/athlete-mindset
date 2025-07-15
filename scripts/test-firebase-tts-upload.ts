#!/usr/bin/env -S bunx tsx

/**
 * Test script to verify Firebase TTS upload functionality
 * Run with: bunx tsx scripts/test-firebase-tts-upload.ts
 */

import { TTSFirebaseCache } from '../services/tts-firebase-cache';

async function testFirebaseTTSUpload() {
  console.log('🚀 Testing Firebase TTS Upload Functionality\n');
  
  try {
    // Get TTS cache instance
    const ttsCache = TTSFirebaseCache.getInstance();
    
    // Test 1: Basic connectivity
    console.log('📡 Test 1: Basic TTS synthesis (should trigger upload)');
    const testText = 'Welcome to the Athlete Mindset Toolkit. This is a test of our Firebase TTS caching system.';
    const audioUri = await ttsCache.synthesizeSpeech(testText, {
      voice: 'nova',
      model: 'eleven_multilingual_v2',
      speed: 1.0
    });
    
    console.log(`✅ Audio generated and cached: ${audioUri}`);
    
    // Test 2: Cache hit (should be instant)
    console.log('\n📡 Test 2: Cache hit test');
    const startTime = Date.now();
    const audioUri2 = await ttsCache.synthesizeSpeech(testText, {
      voice: 'nova',
      model: 'eleven_multilingual_v2',
      speed: 1.0
    });
    const endTime = Date.now();
    
    console.log(`✅ Cache hit in ${endTime - startTime}ms: ${audioUri2}`);
    
    // Test 3: Personalized content
    console.log('\n📡 Test 3: Personalized content test');
    const personalizedText = 'Visualize yourself sprinting down the track with perfect form and explosive power.';
    const personalizedAudio = await ttsCache.synthesizeSpeech(personalizedText, {
      voice: 'nova',
      model: 'eleven_multilingual_v2',
      speed: 1.0,
      isPersonalized: true,
      sport: 'track_field'
    });
    
    console.log(`✅ Personalized audio generated: ${personalizedAudio}`);
    
    // Test 4: Different voice
    console.log('\n📡 Test 4: Different voice test');
    const differentVoiceAudio = await ttsCache.synthesizeSpeech(testText, {
      voice: 'alloy',
      model: 'eleven_multilingual_v2',
      speed: 1.0
    });
    
    console.log(`✅ Different voice audio generated: ${differentVoiceAudio}`);
    
    // Test 5: Cache stats
    console.log('\n📊 Test 5: Cache statistics');
    const stats = await ttsCache.getCacheStats();
    console.log('Cache Stats:', JSON.stringify(stats, null, 2));
    
    // Test 6: Firebase upload test
    console.log('\n📤 Test 6: Firebase upload test');
    await ttsCache.testFirebaseUpload();
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testFirebaseTTSUpload().catch(console.error);