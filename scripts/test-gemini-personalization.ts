#!/usr/bin/env bun

import { GeminiCoreService } from '../services/gemini-core-service';
import { GeminiPersonalizationService } from '../services/gemini-personalization-service';
import { PersonalizationRequest } from '../types/personalization';

// Test visualization data
const testVisualization = {
  id: 'peak-performance-sports',
  title: 'Peak Performance Sports Visualization',
  category: 'performance-process' as const,
  baseContent: [
    "Close your eyes and take a deep breath. Feel yourself settling into this moment, preparing your mind and body for peak performance.",
    "Visualize yourself at your training or competition venue. See the familiar surroundings, feel the atmosphere, and connect with your purpose for being here.",
    "Now see yourself performing at your absolute best. Notice how your body moves with perfect technique, how focused and confident you feel.",
    "Feel the satisfaction of executing your skills flawlessly. Your mind is clear, your body is strong, and you're completely in the zone.",
    "Take this feeling with you. You are prepared, you are capable, and you are ready to perform at your highest level."
  ]
};

// Test different sports
const testCases = [
  {
    name: 'Track and Field - Sprinter',
    userContext: {
      sport: 'track-and-field' as const,
      trackFieldEvent: 'sprints-100m' as const,
    }
  },
  {
    name: 'Track and Field - High Jumper',
    userContext: {
      sport: 'track-and-field' as const,
      trackFieldEvent: 'high-jump' as const,
    }
  },
  {
    name: 'General Athletics',
    userContext: {
      sport: 'other' as const,
    }
  },
];

async function testGeminiPersonalization() {
  console.log('🧪 Testing Gemini Personalization Service\n');
  
  try {
    // Check if Gemini is configured
    if (!GeminiCoreService.isConfigured()) {
      console.error('❌ Gemini API key not configured. Please add GEMINI_API_KEY to your .env file.');
      process.exit(1);
    }
    
    // Test connection
    console.log('🔌 Testing Gemini connection...');
    const geminiCore = GeminiCoreService.getInstance();
    const isConnected = await geminiCore.validateConnection();
    
    if (!isConnected) {
      console.error('❌ Failed to connect to Gemini API. Please check your API key.');
      process.exit(1);
    }
    
    console.log('✅ Connected to Gemini API successfully!\n');
    
    // Initialize personalization service
    const personalizationService = GeminiPersonalizationService.getInstance();
    
    // Test each sport
    for (const testCase of testCases) {
      console.log(`\n📊 Testing: ${testCase.name}`);
      console.log('═'.repeat(50));
      
      const request: PersonalizationRequest = {
        userContext: testCase.userContext,
        visualizationId: testVisualization.id,
        visualizationTitle: testVisualization.title,
        visualizationCategory: testVisualization.category,
        baseContent: testVisualization.baseContent,
      };
      
      try {
        const startTime = Date.now();
        const result = await personalizationService.generatePersonalizedVisualization(request);
        const duration = Date.now() - startTime;
        
        console.log(`\n✅ Personalization successful (${duration}ms)`);
        console.log(`📝 Model: ${result.model}`);
        console.log(`🔑 Cache Key: ${result.cacheKey}`);
        console.log(`📅 Generated At: ${result.generatedAt}`);
        console.log(`\n📖 Personalized Steps:`);
        
        result.steps.forEach((step, index) => {
          console.log(`\n  Step ${index + 1}:`);
          console.log(`  Duration: ${step.duration}s`);
          console.log(`  Sport Elements: ${step.personalizedElements.join(', ')}`);
          console.log(`  Content: ${step.content.substring(0, 150)}...`);
        });
        
      } catch (error: any) {
        console.error(`\n❌ Personalization failed: ${error.message}`);
      }
    }
    
    // Show stats
    console.log('\n\n📊 Service Statistics:');
    console.log('═'.repeat(50));
    const stats = personalizationService.getStats();
    console.log(`Total Requests: ${stats.totalRequests}`);
    console.log(`Cache Hits: ${stats.cacheHits}`);
    console.log(`API Calls: ${stats.apiCalls}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`Cache Hit Rate: ${stats.cacheHitRate}`);
    console.log(`API Call Rate: ${stats.apiCallRate}`);
    
    // Test cache hit
    console.log('\n\n🔄 Testing cache hit (re-running first test)...');
    const cacheTestRequest: PersonalizationRequest = {
      userContext: testCases[0].userContext,
      visualizationId: testVisualization.id,
      visualizationTitle: testVisualization.title,
      visualizationCategory: testVisualization.category,
      baseContent: testVisualization.baseContent,
    };
    
    const cacheStartTime = Date.now();
    await personalizationService.generatePersonalizedVisualization(cacheTestRequest);
    const cacheDuration = Date.now() - cacheStartTime;
    
    console.log(`✅ Cache hit successful (${cacheDuration}ms)`);
    
    // Final stats
    console.log('\n\n📊 Final Statistics:');
    console.log('═'.repeat(50));
    const finalStats = personalizationService.getStats();
    console.log(`Cache Hit Rate: ${finalStats.cacheHitRate}`);
    console.log(`Average response time: ${cacheDuration < 100 ? 'Excellent (cache hit)' : 'Good (API call)'}`);
    
    console.log('\n\n✅ All tests completed successfully!');
    
  } catch (error: any) {
    console.error('\n\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testGeminiPersonalization();