#!/usr/bin/env bun
/**
 * Test different Gemini models for TTS capability
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY not found');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName: string, testText: string = "Hello, this is a test.") {
  console.log(`\n🧪 Testing ${modelName}...`);
  
  try {
    // Try with generateContent and AUDIO modality
    console.log('  Trying generateContent with AUDIO modality...');
    const model = genAI.getGenerativeModel({ 
      model: modelName,
    });
    
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: testText }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Aoede',
            },
          },
        },
      },
    });
    
    const audioData = response.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (audioData) {
      console.log(`  ✅ SUCCESS! Audio data received (length: ${audioData.length})`);
      
      // Save the audio
      const outputPath = path.join(__dirname, `test-${modelName.replace(/\//g, '-')}.wav`);
      fs.writeFileSync(outputPath, Buffer.from(audioData, 'base64'));
      console.log(`  📁 Saved to: ${outputPath}`);
      return true;
    } else {
      console.log('  ❌ No audio data in response');
      console.log('  Response structure:', JSON.stringify(response.response, null, 2).substring(0, 200) + '...');
    }
  } catch (error: any) {
    console.log(`  ❌ Error: ${error.message}`);
    if (error.message.includes('quota')) {
      console.log('  💡 This appears to be a quota issue');
    } else if (error.message.includes('not support')) {
      console.log('  💡 This model does not support audio generation');
    }
  }
  
  return false;
}

async function testWithSystemInstruction(modelName: string) {
  console.log(`\n🧪 Testing ${modelName} with system instruction...`);
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: "You are a text-to-speech system. Generate audio for the user's text.",
    });
    
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: "Hello world" }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
      },
    });
    
    const audioData = response.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (audioData) {
      console.log(`  ✅ SUCCESS with system instruction!`);
      return true;
    } else {
      console.log('  ❌ No audio with system instruction');
    }
  } catch (error: any) {
    console.log(`  ❌ Error with system instruction: ${error.message.substring(0, 100)}...`);
  }
  
  return false;
}

async function checkQuotaStatus() {
  console.log('\n📊 Checking API quota status...');
  
  try {
    // Make a simple text generation request to check if API is working
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Say "API is working"');
    const response = result.response.text();
    console.log('✅ API is working. Response:', response.substring(0, 50) + '...');
  } catch (error: any) {
    console.log('❌ API error:', error.message);
  }
}

async function main() {
  console.log('🔍 Gemini TTS Model Testing\n');
  
  // Check if API is working
  await checkQuotaStatus();
  
  // Models to test
  const modelsToTest = [
    'gemini-2.5-flash-preview-tts',
    'gemini-2.5-pro-preview-tts',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ];
  
  console.log('\n=== Testing Models for TTS Support ===');
  
  const workingModels: string[] = [];
  
  for (const model of modelsToTest) {
    const works = await testModel(model);
    if (works) {
      workingModels.push(model);
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Try with system instruction for failed models
  console.log('\n=== Testing with System Instructions ===');
  for (const model of modelsToTest) {
    if (!workingModels.includes(model)) {
      const works = await testWithSystemInstruction(model);
      if (works) {
        workingModels.push(model + ' (with system instruction)');
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n\n📝 Summary:');
  if (workingModels.length > 0) {
    console.log('✅ Working models for TTS:');
    workingModels.forEach(m => console.log(`   - ${m}`));
  } else {
    console.log('❌ No models successfully generated audio');
    console.log('\nPossible reasons:');
    console.log('1. TTS feature not available in your region');
    console.log('2. API key lacks necessary permissions');
    console.log('3. Quota exhausted for all TTS models');
    console.log('4. TTS is only available through specific endpoints');
  }
  
  // Check for audio files created
  const audioFiles = fs.readdirSync(__dirname).filter(f => f.startsWith('test-') && f.endsWith('.wav'));
  if (audioFiles.length > 0) {
    console.log('\n🎵 Audio files created:');
    audioFiles.forEach(f => console.log(`   - ${f}`));
  }
}

main().catch(console.error);