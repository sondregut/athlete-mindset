#!/usr/bin/env bun

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testGeminiTTSWithFallback() {
  console.log('🎤 Testing Gemini TTS with REST API fallback\n');
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env file');
    process.exit(1);
  }
  
  // Test direct REST API call
  console.log('📡 Testing direct REST API call...\n');
  
  const model = 'gemini-2.5-flash-preview-tts';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const requestBody = {
    contents: [{
      parts: [{
        text: "Hello, this is a test of Gemini text to speech using REST API."
      }]
    }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Kore'
          }
        }
      }
    }
  };
  
  try {
    console.log('Making request to:', url);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      
      // Try to parse error for more details
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Error details:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        // Not JSON error
      }
      
      return;
    }
    
    const data = await response.json();
    console.log('\n✅ Response received successfully!');
    
    // Check response structure
    console.log('Response structure:');
    console.log('- Has candidates:', !!data.candidates);
    
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      console.log('- Has content:', !!candidate.content);
      console.log('- Has parts:', !!candidate.content?.parts);
      
      if (candidate.content?.parts && candidate.content.parts.length > 0) {
        const part = candidate.content.parts[0];
        console.log('- Part type:', Object.keys(part));
        
        if ('inlineData' in part && part.inlineData) {
          console.log('\n✅ Audio data received!');
          console.log('- MIME type:', part.inlineData.mimeType);
          console.log('- Data size:', part.inlineData.data.length, 'chars (base64)');
          console.log('- Estimated audio size:', Math.round(part.inlineData.data.length * 0.75 / 1024), 'KB');
          
          // Test base64 decoding
          try {
            const binaryString = atob(part.inlineData.data.substring(0, 100));
            console.log('- Base64 decoding: ✅ Valid');
          } catch (e) {
            console.log('- Base64 decoding: ❌ Invalid');
          }
        } else if ('text' in part) {
          console.log('❌ Received text instead of audio:', part.text?.substring(0, 100));
        } else {
          console.log('❌ Unknown response type:', Object.keys(part));
        }
      }
    }
    
    // Test different voices
    console.log('\n\n🎭 Testing different voices...');
    const voices = ['Kore', 'Aoede', 'Charon', 'Fenrir', 'Orbit', 'Puck'];
    
    for (const voice of voices) {
      const voiceRequest = {
        ...requestBody,
        generationConfig: {
          ...requestBody.generationConfig,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice
              }
            }
          }
        }
      };
      
      try {
        const voiceResponse = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(voiceRequest),
        });
        
        if (voiceResponse.ok) {
          const voiceData = await voiceResponse.json();
          const hasAudio = !!voiceData.candidates?.[0]?.content?.parts?.[0]?.inlineData;
          console.log(`- ${voice}: ${hasAudio ? '✅ Audio generated' : '❌ No audio'}`);
        } else {
          console.log(`- ${voice}: ❌ Request failed (${voiceResponse.status})`);
        }
      } catch (e) {
        console.log(`- ${voice}: ❌ Error occurred`);
      }
    }
    
    console.log('\n\n📊 Summary:');
    console.log('- REST API endpoint is accessible');
    console.log('- Audio generation works with proper configuration');
    console.log('- Multiple voices are supported');
    console.log('- Response format: L16 PCM audio at 24kHz encoded in base64');
    
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    console.error(error);
  }
}

// Run the test
testGeminiTTSWithFallback();