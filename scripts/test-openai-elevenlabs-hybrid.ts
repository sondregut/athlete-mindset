#!/usr/bin/env node
/**
 * Test script for OpenAI + ElevenLabs hybrid integration
 * Tests the personalization service with actual OpenAI API calls
 */

import { ElevenLabsAIPersonalizationService } from '../services/elevenlabs-ai-personalization';
import { PersonalizationRequest } from '../types/personalization';

console.log('🧪 Testing OpenAI + ElevenLabs Hybrid Integration\n');

// Test data for the 4 target sports
const testSports = [
  {
    name: 'Pole Vault',
    context: {
      sport: 'track-and-field' as const,
      trackFieldEvent: 'pole-vault' as const,
      experienceLevel: 'intermediate' as const,
      primaryFocus: 'performance' as const
    }
  },
  {
    name: 'Soccer',
    context: {
      sport: 'other' as const,
      experienceLevel: 'intermediate' as const,
      primaryFocus: 'performance' as const
    }
  },
  {
    name: 'Distance Running',
    context: {
      sport: 'other' as const,
      experienceLevel: 'intermediate' as const,
      primaryFocus: 'performance' as const
    }
  },
  {
    name: 'Generic',
    context: {
      sport: 'other' as const,
      experienceLevel: 'intermediate' as const,
      primaryFocus: 'performance' as const
    }
  }
];

// Base visualization template
const baseVisualization = {
  id: 'peak-performance-sports',
  title: 'Peak Performance Visualization',
  category: 'performance',
  steps: [
    'Find a comfortable position and close your eyes. Take deep breaths.',
    'Visualize yourself in your performance environment. See the details around you.',
    'See yourself performing at your absolute best. Feel the confidence flowing through your body.',
    'Experience the emotion of success. Let it fill your entire being.',
    'Open your eyes and carry this feeling with you to your next training session.'
  ]
};

async function testPersonalizationForSport(sportInfo: any) {
  console.log(`\n📊 Testing ${sportInfo.name} Personalization`);
  console.log('='.repeat(50));
  
  const service = ElevenLabsAIPersonalizationService.getInstance();
  
  const request: PersonalizationRequest = {
    userContext: sportInfo.context,
    visualizationId: baseVisualization.id,
    visualizationTitle: baseVisualization.title,
    visualizationCategory: baseVisualization.category as any,
    baseContent: baseVisualization.steps,
    tone: 'motivational',
    length: 'medium'
  };
  
  try {
    console.log(`Sport: ${sportInfo.name}`);
    console.log(`Context: ${JSON.stringify(sportInfo.context, null, 2)}`);
    
    const startTime = Date.now();
    const result = await service.generatePersonalizedVisualization(request);
    const endTime = Date.now();
    
    console.log(`\n✅ Generated successfully in ${endTime - startTime}ms`);
    console.log(`Model: ${result.model}`);
    console.log(`Cache Key: ${result.cacheKey}`);
    console.log(`Steps: ${result.steps.length}`);
    console.log(`Generated: ${result.generatedAt}`);
    
    console.log('\n📝 Personalized Content:');
    result.steps.forEach((step, index) => {
      console.log(`\nStep ${index + 1}:`);
      console.log(`  Original: "${baseVisualization.steps[index]}"`);
      console.log(`  Personalized: "${step.content}"`);
      console.log(`  Duration: ${step.duration}s`);
      console.log(`  Personalized Elements: ${step.personalizedElements.join(', ')}`);
      
      const isChanged = step.content !== baseVisualization.steps[index];
      console.log(`  Changed: ${isChanged ? '✅ YES' : '❌ NO'}`);
      
      if (isChanged) {
        const originalWords = baseVisualization.steps[index].split(' ').length;
        const personalizedWords = step.content.split(' ').length;
        const changePercentage = Math.abs(originalWords - personalizedWords) / originalWords * 100;
        console.log(`  Change Level: ${changePercentage.toFixed(1)}% word difference`);
      }
    });
    
    return result;
    
  } catch (error) {
    console.error(`❌ Error testing ${sportInfo.name}:`, error);
    throw error;
  }
}

async function testCachePerformance() {
  console.log('\n🚀 Testing Cache Performance');
  console.log('='.repeat(50));
  
  const service = ElevenLabsAIPersonalizationService.getInstance();
  
  const request: PersonalizationRequest = {
    userContext: { sport: 'track-and-field' as const, trackFieldEvent: 'pole-vault' as const, experienceLevel: 'intermediate' as const, primaryFocus: 'performance' as const },
    visualizationId: baseVisualization.id,
    visualizationTitle: baseVisualization.title,
    visualizationCategory: baseVisualization.category as any,
    baseContent: baseVisualization.steps,
    tone: 'motivational',
    length: 'medium'
  };
  
  // First call - should generate via OpenAI
  console.log('First call (should generate via OpenAI):');
  const start1 = Date.now();
  await service.generatePersonalizedVisualization(request);
  const end1 = Date.now();
  console.log(`  Time: ${end1 - start1}ms`);
  
  // Second call - should use cache
  console.log('\nSecond call (should use cache):');
  const start2 = Date.now();
  await service.generatePersonalizedVisualization(request);
  const end2 = Date.now();
  console.log(`  Time: ${end2 - start2}ms`);
  
  const speedup = Math.round((end1 - start1) / (end2 - start2));
  console.log(`\nCache speedup: ${speedup}x faster`);
  
  // Cache stats
  const stats = service.getCacheStats();
  console.log('\nCache stats:', stats);
}

async function runTests() {
  try {
    // Test each sport
    const results = [];
    for (const sport of testSports) {
      const result = await testPersonalizationForSport(sport);
      results.push({
        sport: sport.name,
        result,
        personalizedSteps: result.steps.filter((step, index) => 
          step.content !== baseVisualization.steps[index]
        ).length
      });
    }
    
    // Test cache performance
    await testCachePerformance();
    
    // Summary
    console.log('\n📈 Test Summary');
    console.log('='.repeat(50));
    results.forEach(result => {
      const personalizationRate = (result.personalizedSteps / result.result.steps.length) * 100;
      console.log(`${result.sport}: ${result.personalizedSteps}/${result.result.steps.length} steps personalized (${personalizationRate.toFixed(0)}%)`);
    });
    
    console.log('\n✅ All tests completed successfully!');
    console.log('🎉 OpenAI + ElevenLabs hybrid integration is working!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(console.error);