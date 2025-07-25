#!/usr/bin/env bun
/**
 * Check available Gemini models and their capabilities
 */

import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

async function listModels() {
  console.log('🔍 Fetching available Gemini models...\n');
  
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: {
        'x-goog-api-key': apiKey,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const models = data.models || [];
    
    console.log(`Found ${models.length} models:\n`);
    
    // Filter and display TTS-capable models
    const ttsModels = models.filter((m: any) => 
      m.supportedGenerationMethods?.includes('generateContent') &&
      (m.name.includes('tts') || m.name.includes('flash'))
    );
    
    console.log('Models that might support TTS:');
    ttsModels.forEach((model: any) => {
      console.log(`\n📦 ${model.name}`);
      console.log(`   Display: ${model.displayName}`);
      console.log(`   Description: ${model.description || 'N/A'}`);
      console.log(`   Methods: ${model.supportedGenerationMethods?.join(', ')}`);
    });
    
    // Check for specific TTS endpoint
    console.log('\n\nChecking for synthesizeSpeech support:');
    
    const speechModels = models.filter((m: any) => 
      m.supportedGenerationMethods?.includes('synthesizeSpeech')
    );
    
    if (speechModels.length > 0) {
      console.log('✅ Models with synthesizeSpeech support:');
      speechModels.forEach((model: any) => {
        console.log(`   - ${model.name} (${model.displayName})`);
      });
    } else {
      console.log('❌ No models found with synthesizeSpeech support');
      console.log('   This might mean TTS is not available or uses a different endpoint');
    }
    
  } catch (error) {
    console.error('Error fetching models:', error);
  }
}

async function testSpecificModels() {
  console.log('\n\n🧪 Testing specific model endpoints...\n');
  
  const modelsToTest = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
  ];
  
  for (const model of modelsToTest) {
    console.log(`Testing ${model}:`);
    
    // Test synthesizeSpeech endpoint
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:synthesizeSpeech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          text: { text: "Test" },
          voice: { languageCode: 'en-US', name: 'Aoede' },
          audioConfig: {
            audioEncoding: 'LINEAR16',
            speakingRate: 1.0,
            sampleRateHertz: 24000,
          },
        }),
      });
      
      if (response.status === 404) {
        console.log(`   ❌ synthesizeSpeech not supported`);
      } else if (response.ok) {
        console.log(`   ✅ synthesizeSpeech supported!`);
      } else {
        console.log(`   ⚠️  Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

async function main() {
  await listModels();
  await testSpecificModels();
  
  console.log('\n\n📝 Note: If no models support synthesizeSpeech, you may need to:');
  console.log('1. Use a different TTS service (Google Cloud TTS, ElevenLabs, etc.)');
  console.log('2. Check if Gemini TTS is available in your region');
  console.log('3. Verify your API key has the necessary permissions');
}

main();