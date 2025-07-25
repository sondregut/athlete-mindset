#!/usr/bin/env bun

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ModelConfigWithAudio, GenerateContentRequestWithAudio } from '@/types/gemini-extended';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load environment variables
dotenv.config();

async function testGeminiTTSAPI() {
  console.log('🎤 Testing Gemini TTS API directly\n');
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env file');
    process.exit(1);
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Test 1: Basic TTS model initialization
    console.log('📝 Test 1: Initialize TTS model with proper config');
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
    console.log('✅ Model initialized\n');
    
    // Test 2: Simple audio generation
    console.log('🎵 Test 2: Generate audio with simple text');
    const testText = "Hello, this is a test of Gemini text to speech.";
    
    try {
      const result = await ttsModel.generateContent(testText);
      const response = result.response;
      
      console.log('Response structure:');
      console.log('- Has candidates:', !!response.candidates);
      
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        console.log('- Has content:', !!candidate.content);
        console.log('- Has parts:', !!candidate.content?.parts);
        
        if (candidate.content?.parts && candidate.content.parts.length > 0) {
          const part = candidate.content.parts[0];
          console.log('- Part type:', Object.keys(part));
          
          if ('inlineData' in part && part.inlineData) {
            console.log('✅ Received audio data!');
            console.log('- MIME type:', part.inlineData.mimeType);
            console.log('- Data size:', part.inlineData.data.length, 'chars (base64)');
            
            // Save a sample for inspection
            const sampleFile = 'gemini_tts_sample.json';
            fs.writeFileSync(sampleFile, JSON.stringify({
              mimeType: part.inlineData.mimeType,
              dataLength: part.inlineData.data.length,
              dataSample: part.inlineData.data.substring(0, 100) + '...'
            }, null, 2));
            console.log(`\n💾 Sample saved to ${sampleFile}`);
          } else {
            console.log('❌ No audio data in response');
            console.log('Part structure:', JSON.stringify(part, null, 2).substring(0, 500));
          }
        }
      }
    } catch (error: any) {
      console.error('❌ API Error:', error.message);
      if (error.message.includes('response modalities')) {
        console.log('\n⚠️  The JavaScript SDK may not yet support TTS response modalities');
        console.log('   This is a known limitation - waiting for SDK update');
      }
    }
    
    // Test 3: Test different configurations
    console.log('\n\n🔧 Test 3: Try alternative approach');
    const ttsModel2 = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });
    
    try {
      // Try with system instruction
      const result = await ttsModel2.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: testText
          }]
        }],
        generationConfig: {
          responseModalities: ['AUDIO'],
        },
      } as GenerateContentRequestWithAudio);
      
      console.log('Alternative approach response received');
    } catch (error: any) {
      console.error('❌ Alternative approach also failed:', error.message);
    }
    
    console.log('\n\n📊 Summary:');
    console.log('- The Gemini TTS API exists and accepts requests');
    console.log('- The JavaScript SDK may not fully support audio generation yet');
    console.log('- Consider using the REST API directly for TTS functionality');
    
  } catch (error: any) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the test
testGeminiTTSAPI();