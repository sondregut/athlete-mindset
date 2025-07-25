#!/usr/bin/env bun

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ModelConfigWithAudio } from '@/types/gemini-extended';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load environment variables
dotenv.config();

async function testGeminiTTSDirect() {
  console.log('🎤 Testing Gemini TTS with updated model names\n');
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env file');
    process.exit(1);
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Test 1: Try with gemini-2.5-flash-preview-tts model
    console.log('📝 Test 1: Testing gemini-2.5-flash-preview-tts with TTS config');
    try {
      const ttsModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-preview-tts',
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Kore'
              }
            }
          }
        },
      } as ModelConfigWithAudio);
      
      const result = await ttsModel.generateContent("Hello, this is a test of Gemini text to speech.");
      const response = result.response;
      
      console.log('✅ Model accepted the configuration');
      console.log('Response structure:', {
        hasCandidates: !!response.candidates,
        candidatesLength: response.candidates?.length || 0,
      });
      
      if (response.candidates?.[0]?.content?.parts?.[0]) {
        const part = response.candidates[0].content.parts[0];
        console.log('Part keys:', Object.keys(part));
        
        if ('inlineData' in part && part.inlineData) {
          console.log('✅ Audio data received!');
          console.log('MIME type:', part.inlineData.mimeType);
          console.log('Data length:', part.inlineData.data.length);
        } else if ('text' in part) {
          console.log('❌ Received text instead of audio:', part.text?.substring(0, 100));
        }
      }
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      if (error.response) {
        console.error('API Response:', JSON.stringify(error.response, null, 2));
      }
    }
    
    // Test 2: Try with gemini-2.5-pro-preview model
    console.log('\n\n📝 Test 2: Testing gemini-2.5-pro-preview with TTS config');
    try {
      const ttsModel2 = genAI.getGenerativeModel({
        model: 'gemini-2.5-pro-preview',
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede'
              }
            }
          }
        },
      } as ModelConfigWithAudio);
      
      const result = await ttsModel2.generateContent("Testing with pro model.");
      console.log('✅ Pro model accepted the configuration');
      
      const response = result.response;
      if (response.candidates?.[0]?.content?.parts?.[0]) {
        const part = response.candidates[0].content.parts[0];
        if ('inlineData' in part && part.inlineData) {
          console.log('✅ Audio data received from Pro model!');
        } else {
          console.log('❌ No audio data in Pro model response');
        }
      }
    } catch (error: any) {
      console.error('❌ Pro model error:', error.message);
    }
    
    // Test 3: List available models
    console.log('\n\n📝 Test 3: Check model capabilities');
    console.log('Current SDK version:', require('@google/generative-ai/package.json').version);
    console.log('\nKnown Gemini models with potential TTS support:');
    console.log('- gemini-2.5-flash-preview-tts');
    console.log('- gemini-2.5-pro-preview');
    console.log('- gemini-2.5-flash (if available)');
    console.log('- gemini-2.5-pro (if available)');
    
    // Test 4: Try without preview suffix
    console.log('\n\n📝 Test 4: Testing models without -preview suffix');
    const modelsToTest = ['gemini-2.5-flash', 'gemini-2.5-pro'];
    
    for (const modelName of modelsToTest) {
      console.log(`\nTesting ${modelName}...`);
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: 'Kore'
                }
              }
            }
          },
        } as ModelConfigWithAudio);
        
        const result = await model.generateContent("Test");
        console.log(`✅ ${modelName} accepted the configuration`);
      } catch (error: any) {
        console.log(`❌ ${modelName} error: ${error.message.split('\n')[0]}`);
      }
    }
    
    console.log('\n\n📊 Recommendations:');
    console.log('1. The SDK may not fully support audio response modalities yet');
    console.log('2. Consider implementing a REST API fallback for TTS');
    console.log('3. Monitor Google AI SDK updates for native TTS support');
    console.log('4. The model name should be gemini-2.5-flash-preview-tts or gemini-2.5-pro-preview');
    
  } catch (error: any) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the test
testGeminiTTSDirect();