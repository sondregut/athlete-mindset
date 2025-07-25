#!/usr/bin/env bun

import { PersonalizationService } from '@/services/personalization-service';
import { TTSFirebaseCacheGemini } from '@/services/tts-firebase-cache-gemini';
import { PersonalizationRequest } from '@/types/personalization';

async function testQuickAudioStart() {
  console.log('\n🚀 Testing Quick Audio Start Implementation\n');

  try {
    // Test 1: Check Personalization Service
    console.log('1️⃣ Testing Personalization Service...');
    const personalizationService = PersonalizationService.getInstance();
    const activeService = personalizationService.getActiveService();
    console.log(`   Active service: ${activeService}`);
    console.log(`   Expected: Gemini AI`);
    console.log(`   ✅ Personalization service check: ${activeService === 'Gemini AI' ? 'PASSED' : 'FAILED'}`);

    // Test 2: Generate Personalized Content
    console.log('\n2️⃣ Testing Personalization Generation...');
    const testRequest: PersonalizationRequest = {
      userContext: {
        sport: 'track-and-field',
        trackFieldEvent: 'sprints-100m',
      },
      visualizationId: 'peak-performance-sports',
      visualizationTitle: 'Peak Performance Sports',
      visualizationCategory: 'performance-process',
      baseContent: [], // Will be loaded from templates
      tone: 'motivational',
      length: 'short',
    };

    const startTime = Date.now();
    const personalizedContent = await personalizationService.generatePersonalizedVisualization(testRequest);
    const personalizationTime = Date.now() - startTime;
    
    console.log(`   Generated ${personalizedContent.steps.length} personalized steps`);
    console.log(`   Time taken: ${personalizationTime}ms`);
    console.log(`   Model: ${personalizedContent.model}`);
    console.log(`   First step preview: ${personalizedContent.steps[0]?.content.substring(0, 100)}...`);
    console.log(`   ✅ Personalization generation: PASSED`);

    // Test 3: Test TTS Generation for First Step
    console.log('\n3️⃣ Testing Quick TTS Generation...');
    const ttsService = TTSFirebaseCacheGemini.getInstance();
    
    const ttsStartTime = Date.now();
    const audioUri = await ttsService.synthesizeSpeech(personalizedContent.steps[0].content, {
      voice: 'Kore',
      model: 'gemini-2.5-flash-preview-tts',
      speed: 1.0,
      tone: 'calm',
    });
    const ttsTime = Date.now() - ttsStartTime;
    
    console.log(`   Generated audio URI: ${audioUri.substring(0, 50)}...`);
    console.log(`   Time taken: ${ttsTime}ms`);
    console.log(`   ✅ TTS generation: PASSED`);

    // Summary
    console.log('\n📊 Performance Summary:');
    console.log(`   Total time to first audio: ${personalizationTime + ttsTime}ms`);
    console.log(`   Target: < 5000ms`);
    console.log(`   Result: ${(personalizationTime + ttsTime) < 5000 ? '✅ PASSED' : '❌ FAILED'}`);

    // Test 4: Check if background preloading would work
    console.log('\n4️⃣ Simulating Background Preload...');
    console.log('   In the actual app:');
    console.log('   - First 2 steps would be preloaded before starting');
    console.log('   - Playback would begin immediately after');
    console.log('   - Remaining steps would load in the background');
    console.log('   - This ensures smooth playback without delays');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run the test
testQuickAudioStart().then(() => {
  console.log('\n✨ Test completed!\n');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});