#!/usr/bin/env bun
/**
 * Test script to verify Gemini API key works for both text generation and TTS
 * Run with: bun run scripts/test-gemini-api-key.ts
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}!${colors.reset} ${msg}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg: string) => console.log(`\n${colors.blue}=== ${msg} ===${colors.reset}`),
};

async function checkApiKey() {
  log.header('Checking Gemini API Key');
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    log.error('GEMINI_API_KEY not found in environment variables');
    log.info('Make sure you have a .env file with GEMINI_API_KEY=your-key-here');
    return null;
  }
  
  log.success(`API key found (length: ${apiKey.length})`);
  log.info(`Key starts with: ${apiKey.substring(0, 10)}...`);
  
  return apiKey;
}

async function testTextGeneration(genAI: GoogleGenerativeAI) {
  log.header('Testing Text Generation (Personalization)');
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const prompt = `Generate a personalized greeting for an athlete who plays Track and Field.
Return a JSON object with a "greeting" field containing a 1-2 sentence motivational message.`;
    
    log.info('Sending test prompt to Gemini...');
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    log.success('Text generation successful!');
    log.info('Response: ' + response.substring(0, 100) + '...');
    
    // Try to parse as JSON
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        log.success('JSON parsing successful');
        log.info('Greeting: ' + parsed.greeting);
      }
    } catch (e) {
      log.warning('Response is not valid JSON (this is okay for this test)');
    }
    
    return true;
  } catch (error: any) {
    log.error('Text generation failed: ' + error.message);
    if (error.message.includes('API_KEY_INVALID')) {
      log.error('The API key appears to be invalid');
    }
    return false;
  }
}

async function testTTSGeneration(genAI: GoogleGenerativeAI) {
  log.header('Testing Text-to-Speech Generation');
  
  try {
    // Test with SDK approach first
    log.info('Testing Gemini TTS with SDK...');
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-tts' });
    
    const text = "Hello athlete! This is a test of Gemini text to speech.";
    const voice = "Kore";
    
    try {
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice,
              },
            },
          },
        },
      });
      
      const audioData = response.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (audioData) {
        log.success('TTS generation with SDK successful!');
        log.info(`Audio data received (base64 length: ${audioData.length})`);
        
        // Save the audio file from SDK response
        const outputPath = path.join(__dirname, 'test-audio-sdk.wav');
        const audioBuffer = Buffer.from(audioData, 'base64');
        fs.writeFileSync(outputPath, audioBuffer);
        log.success(`Test audio saved to: ${outputPath}`);
        
        return { method: 'sdk', success: true };
      } else {
        log.warning('No audio data in SDK response');
      }
    } catch (sdkError: any) {
      log.warning('SDK method failed: ' + sdkError.message);
    }
    
    // Test with REST API as fallback
    log.info('Testing Gemini TTS with REST API...');
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice,
              },
            },
          },
        },
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      log.error(`REST API failed: ${response.status} - ${errorText}`);
      return { method: 'rest', success: false };
    }
    
    const data = await response.json();
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (audioData) {
      log.success('TTS generation with REST API successful!');
      log.info(`Audio data received (base64 length: ${audioData.length})`);
      
      // Save a sample file
      const outputPath = path.join(__dirname, 'test-audio.wav');
      const audioBuffer = Buffer.from(audioData, 'base64');
      
      // Gemini returns audio in WAV format already
      fs.writeFileSync(outputPath, audioBuffer);
      log.success(`Test audio saved to: ${outputPath}`);
      
      return { method: 'rest', success: true };
    } else {
      log.error('No audio content in REST response');
      return { method: 'rest', success: false };
    }
    
  } catch (error: any) {
    log.error('TTS generation failed: ' + error.message);
    return { method: 'unknown', success: false };
  }
}

function convertToWav(pcmData: Buffer, sampleRate: number): Buffer {
  const dataSize = pcmData.length;
  const buffer = Buffer.alloc(44 + dataSize);
  
  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  
  // Copy PCM data
  pcmData.copy(buffer, 44);
  
  return buffer;
}

async function testAvailableVoices(apiKey: string) {
  log.header('Testing Available Voices');
  
  const voices = ['Aoede', 'Charon', 'Fenrir', 'Kore', 'Puck', 'Saga'];
  log.info(`Testing ${voices.length} Gemini voices...`);
  
  for (const voice of voices) {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: "Test" }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice,
                },
              },
            },
          },
        }),
      });
      
      if (response.ok) {
        log.success(`Voice "${voice}" is available`);
      } else {
        log.warning(`Voice "${voice}" may not be available (${response.status})`);
      }
    } catch (error) {
      log.error(`Failed to test voice "${voice}"`);
    }
  }
}

async function main() {
  console.log(colors.blue + '\n🔍 Gemini API Key Test\n' + colors.reset);
  
  // Check API key
  const apiKey = await checkApiKey();
  if (!apiKey) {
    process.exit(1);
  }
  
  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Test text generation
  const textGenSuccess = await testTextGeneration(genAI);
  
  // Test TTS generation
  const ttsResult = await testTTSGeneration(genAI);
  
  // Test available voices
  if (ttsResult.success) {
    await testAvailableVoices(apiKey);
  }
  
  // Summary
  log.header('Summary');
  
  if (textGenSuccess && ttsResult.success) {
    console.log(`\n${colors.green}✨ All tests passed!${colors.reset}`);
    console.log('\nYour Gemini API key is properly configured for:');
    console.log('- Text generation (personalization)');
    console.log(`- Text-to-speech (using ${ttsResult.method} method)`);
    console.log('\nYou can now:');
    console.log('1. Set this key as a Firebase secret: firebase functions:secrets:set GEMINI_API_KEY');
    console.log('2. Deploy your Cloud Functions');
  } else {
    console.log(`\n${colors.red}❌ Some tests failed${colors.reset}`);
    if (!textGenSuccess) {
      console.log('\n- Text generation is not working');
      console.log('  Check if your API key has access to Gemini 1.5 Pro');
    }
    if (!ttsResult.success) {
      console.log('\n- Text-to-speech is not working');
      console.log('  Check if your API key has access to Gemini TTS features');
    }
    console.log('\nTroubleshooting:');
    console.log('1. Verify your API key at: https://aistudio.google.com/app/apikey');
    console.log('2. Make sure the key has all necessary permissions');
    console.log('3. Check if there are any quota limits');
  }
}

main().catch(error => {
  console.error('Test script failed:', error);
  process.exit(1);
});