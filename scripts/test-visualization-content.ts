#!/usr/bin/env bun

/**
 * Test script to verify visualization content is properly loaded and accessible
 */

import { getVisualizationById, getAllVisualizations } from '../constants/visualizations';
import { TTSFirebaseCacheGemini } from '../services/tts-firebase-cache-gemini';

async function testVisualizationContent() {
  console.log('🔍 Testing Visualization Content Loading...\n');

  // Test 1: Check if all visualizations have content
  console.log('📋 Test 1: Checking all visualizations have steps...');
  const allVisualizations = getAllVisualizations();
  
  let hasEmptySteps = false;
  for (const viz of allVisualizations) {
    if (!viz.steps || viz.steps.length === 0) {
      console.error(`❌ ${viz.id} has no steps!`);
      hasEmptySteps = true;
    } else {
      console.log(`✅ ${viz.id}: ${viz.steps.length} steps loaded`);
    }
  }

  if (hasEmptySteps) {
    console.error('\n⚠️  Some visualizations have no content!');
  } else {
    console.log('\n✅ All visualizations have content loaded!');
  }

  // Test 2: Test specific visualization content
  console.log('\n📋 Test 2: Testing specific visualization (batman-effect)...');
  const batmanViz = getVisualizationById('batman-effect');
  
  if (!batmanViz) {
    console.error('❌ Could not find batman-effect visualization');
    return;
  }

  console.log(`\nVisualization: ${batmanViz.title}`);
  console.log(`Description: ${batmanViz.description}`);
  console.log(`Duration: ${batmanViz.duration} minutes`);
  console.log(`Steps: ${batmanViz.steps.length}\n`);

  // Display first 3 steps
  console.log('First 3 steps content:');
  for (let i = 0; i < Math.min(3, batmanViz.steps.length); i++) {
    const step = batmanViz.steps[i];
    console.log(`\nStep ${i + 1}:`);
    console.log(`Content: "${step.content.substring(0, 100)}..."`);
    console.log(`Duration: ${step.duration} seconds`);
  }

  // Test 3: Verify TTS can handle the content
  console.log('\n📋 Test 3: Testing TTS compatibility...');
  const ttsService = TTSFirebaseCacheGemini.getInstance();
  
  try {
    const testStep = batmanViz.steps[0];
    console.log(`\nGenerating TTS cache key for first step...`);
    
    // Just test that we can generate a cache key (not actually synthesize)
    const cacheKey = await ttsService.getCacheKey(testStep.content, {
      voice: 'A', // Default voice
      model: 'gemini-2.5-flash-preview-tts',
      speed: 1.0
    });
    
    console.log(`✅ TTS cache key generated: ${cacheKey.substring(0, 20)}...`);
    console.log('✅ Content is compatible with TTS system');
  } catch (error) {
    console.error('❌ TTS compatibility error:', error);
  }

  // Test 4: Check template loading
  console.log('\n📋 Test 4: Checking template source...');
  try {
    const templates = require('../data/personalization/templates/visualization-templates.json');
    const batmanTemplates = templates['batman-effect'];
    
    if (batmanTemplates) {
      console.log(`✅ Found ${batmanTemplates.length} templates for batman-effect`);
      console.log('✅ Templates are being loaded from JSON file');
    } else {
      console.log('⚠️  No templates found for batman-effect in JSON file');
    }
  } catch (error) {
    console.error('❌ Could not load template file:', error);
  }

  console.log('\n✨ Test complete!');
}

// Run the test
testVisualizationContent().catch(console.error);