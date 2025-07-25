#!/usr/bin/env node

const dotenv = require('dotenv');
dotenv.config();

async function testGeminiAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment');
    return;
  }
  
  console.log('✅ API Key found');
  
  // Test the REST API directly
  const model = 'gemini-2.5-flash-preview-tts';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const requestBody = {
    contents: [{
      parts: [{
        text: "Hello, this is a test of Gemini text to speech."
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
    console.log('\nTesting Gemini TTS REST API...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status);
      console.error(errorText);
      return;
    }
    
    const data = await response.json();
    
    if (data.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
      console.log('✅ TTS API call successful!');
      console.log('Audio MIME type:', data.candidates[0].content.parts[0].inlineData.mimeType);
      console.log('Audio data length:', data.candidates[0].content.parts[0].inlineData.data.length);
    } else {
      console.error('❌ No audio data in response');
      console.log('Response structure:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

// Test personalization API
async function testGeminiPersonalization() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
  
  const prompt = `You are personalizing a mental training visualization for an athlete.

ATHLETE PROFILE:
- Sport: Soccer
- Experience: Dedicated athlete seeking mental performance improvement

PERSONALIZATION GUIDELINES:
1. Replace generic references with soccer-specific scenarios
2. Use actual equipment names (cleats, ball, goal, etc.)
3. Reference real movements (dribbling, shooting, passing)
4. Include soccer environments (pitch, stadium)
5. Maintain the emotional journey and timing

Template to personalize:
Step 1: Take a moment to center yourself and focus on your upcoming performance.

Return a JSON object with an array called "steps", where each step contains:
- "content": the personalized script text
- "duration": suggested duration in seconds (integer)
- "sportElements": array of 2-3 specific sport terms you incorporated`;

  try {
    console.log('\n\nTesting Gemini Personalization API...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status);
      console.error(errorText);
      return;
    }
    
    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const parsed = JSON.parse(text);
    
    console.log('✅ Personalization API call successful!');
    console.log('Personalized content:', JSON.stringify(parsed, null, 2));
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

// Run tests
async function main() {
  console.log('Testing Gemini API integration...\n');
  await testGeminiAPI();
  await testGeminiPersonalization();
}

main().catch(console.error);