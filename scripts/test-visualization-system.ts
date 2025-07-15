#!/usr/bin/env bun
import { ExcelPersonalizationService } from '../services/excel-personalization-service';
import { PersonalizationRequest, UserContext } from '../types/personalization';

console.log('🧪 Testing Excel Visualization System\n');

const service = ExcelPersonalizationService.getInstance();

// Test visualization IDs that should exist
const testVisualizations = [
  'peak-performance-sports',
  'batman-effect',
  'unstoppable-confidence',
  'sample-filled',
  'non-existent-visualization' // Test fallback
];

// Test different sports
const testSports: Array<{ name: string; context: Partial<UserContext> }> = [
  { 
    name: 'Pole Vault', 
    context: { sport: 'track-and-field' as any, trackFieldEvent: 'pole-vault' as any }
  },
  { 
    name: 'Basketball', 
    context: { sport: 'basketball' as any }
  },
  { 
    name: 'Swimming', 
    context: { sport: 'swimming' as any }
  },
  { 
    name: 'Sprinting', 
    context: { sport: 'track-and-field' as any, trackFieldEvent: 'sprints-100m' as any }
  }
];

async function testVisualizationForSport(visualizationId: string, sportInfo: typeof testSports[0]) {
  console.log(`\n📊 Testing ${visualizationId} for ${sportInfo.name}`);
  console.log('=' .repeat(60));
  
  const request: PersonalizationRequest = {
    userContext: {
      ...sportInfo.context,
      experienceLevel: 'intermediate' as any,
      primaryFocus: 'performance' as any,
      goals: 'improve performance'
    },
    visualizationId,
    visualizationTitle: `Test - ${visualizationId}`,
    visualizationCategory: 'performance' as any,
    baseContent: [
      'This is step 1 template content.',
      'This is step 2 template content.',
      'This is step 3 template content.'
    ]
  };

  try {
    const result = await service.generatePersonalizedVisualization(request);
    
    console.log(`✅ Generated successfully`);
    console.log(`   Model: ${result.model}`);
    console.log(`   Cache Key: ${result.cacheKey}`);
    console.log(`   Steps: ${result.steps.length}`);
    
    // Check if personalized content exists
    const hasSportSpecific = service.hasPersonalizationFor(visualizationId, sportInfo.context.sport as string);
    console.log(`   Has sport-specific content: ${hasSportSpecific ? 'YES' : 'NO (using template)'}`);
    
    // Show first step preview
    if (result.steps.length > 0) {
      const preview = result.steps[0].content.substring(0, 100);
      console.log(`   First step preview: "${preview}..."`);
    }
  } catch (error) {
    console.error(`❌ Error: ${error}`);
  }
}

async function runTests() {
  // Test 1: Check available sports for each visualization
  console.log('📋 Available Sports by Visualization');
  console.log('=' .repeat(60));
  
  for (const vizId of testVisualizations) {
    const supportedSports = service.getSupportedSports(vizId);
    console.log(`\n${vizId}:`);
    if (supportedSports.length > 0) {
      supportedSports.forEach(sport => console.log(`  - ${sport}`));
    } else {
      console.log('  - No sport-specific content (template only)');
    }
  }

  // Test 2: Test specific combinations
  console.log('\n\n🏃 Testing Sport-Specific Personalizations');
  
  // Test sample-filled (has sport content)
  await testVisualizationForSport('sample-filled', testSports[0]); // Pole Vault
  await testVisualizationForSport('sample-filled', testSports[3]); // Sprinting
  
  // Test others (should fallback to template)
  await testVisualizationForSport('peak-performance-sports', testSports[0]); // Pole Vault
  await testVisualizationForSport('batman-effect', testSports[1]); // Basketball
  
  // Test non-existent visualization
  await testVisualizationForSport('non-existent-visualization', testSports[2]); // Swimming

  // Show stats
  console.log('\n\n📈 Service Statistics');
  console.log('=' .repeat(60));
  const stats = service.getStats();
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Successful Matches: ${stats.successfulMatches}`);
  console.log(`Fallbacks: ${stats.fallbacks}`);
  console.log(`Hit Rate: ${stats.hitRate.toFixed(1)}%`);
  
  console.log('\n✅ All tests completed!');
}

// Run tests
runTests().catch(console.error);