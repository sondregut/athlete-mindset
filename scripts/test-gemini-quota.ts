#!/usr/bin/env bun

/**
 * Test script to check Gemini API key status, quotas, and billing
 * Run with: bun scripts/test-gemini-quota.ts
 */

import { config } from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in environment variables');
  process.exit(1);
}

console.log('🔍 Testing Gemini API Key and Quota Status');
console.log('============================================\n');

async function checkAPIKey() {
  console.log('1️⃣ API Key Configuration:');
  console.log(`   - Key prefix: ${GEMINI_API_KEY!.substring(0, 10)}...`);
  console.log(`   - Key length: ${GEMINI_API_KEY!.length} characters\n`);
}

async function testBasicAPI() {
  console.log('2️⃣ Testing Basic API Access:');
  
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const result = await model.generateContent('Say "API working"');
    const response = await result.response;
    const text = response.text();
    
    console.log('   ✅ Basic API test successful');
    console.log(`   - Response: ${text.substring(0, 50)}...\n`);
  } catch (error: any) {
    console.error('   ❌ Basic API test failed:');
    console.error(`   - Error: ${error.message}`);
    
    if (error.message?.includes('401')) {
      console.error('   - Issue: Invalid API key');
    } else if (error.message?.includes('403')) {
      console.error('   - Issue: API key lacks required permissions');
    }
    console.log('\n');
  }
}

async function testTTSModel() {
  console.log('3️⃣ Testing TTS Model Access:');
  
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-tts' });
    
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: 'Test' }]
      }],
      generationConfig: {
        temperature: 0.7,
      }
    });
    
    console.log('   ✅ TTS model accessible');
  } catch (error: any) {
    console.error('   ❌ TTS model test failed:');
    console.error(`   - Error: ${error.message}`);
    
    if (error.message?.includes('429')) {
      console.error('   - Issue: Quota exceeded');
      
      // Try to parse the error for more details
      try {
        const errorMatch = error.message.match(/\{[\s\S]*\}/);
        if (errorMatch) {
          const errorObj = JSON.parse(errorMatch[0]);
          if (errorObj.error?.details) {
            console.error('   - Quota details:');
            errorObj.error.details.forEach((detail: any) => {
              if (detail.violations) {
                detail.violations.forEach((violation: any) => {
                  console.error(`     • ${violation.quotaMetric}`);
                  console.error(`       ID: ${violation.quotaId}`);
                });
              }
            });
          }
        }
      } catch (parseError) {
        // Ignore parsing errors
      }
    } else if (error.message?.includes('404')) {
      console.error('   - Issue: Model not found or not accessible');
    }
  }
  console.log('\n');
}

async function checkQuotaViaREST() {
  console.log('4️⃣ Checking Quota via REST API:');
  
  try {
    // Note: This endpoint might not be publicly available
    // It's included for completeness but may return 404
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Successfully retrieved model list');
      console.log(`   - Available models: ${data.models?.length || 0}`);
      
      // List TTS models
      const ttsModels = data.models?.filter((m: any) => 
        m.name?.includes('tts') || m.supportedGenerationMethods?.includes('generateAudio')
      );
      
      if (ttsModels?.length > 0) {
        console.log('   - TTS Models:');
        ttsModels.forEach((model: any) => {
          console.log(`     • ${model.name}`);
        });
      }
    } else {
      const errorText = await response.text();
      console.log('   ℹ️  Model list endpoint returned:', response.status);
      
      if (response.status === 429) {
        console.error('   - Quota exceeded at API level');
      }
    }
  } catch (error: any) {
    console.log('   ℹ️  Could not retrieve model list (this is normal)');
  }
  console.log('\n');
}

async function testTTSGeneration() {
  console.log('5️⃣ Testing TTS Audio Generation:');
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: 'Test audio generation' }]
          }],
          generationConfig: {
            response_modalities: ['AUDIO'],
            speech_config: {
              voice_config: {
                prebuilt_voice_config: {
                  voice_name: 'Kore'
                }
              }
            }
          }
        })
      }
    );
    
    if (response.ok) {
      console.log('   ✅ TTS generation successful');
      console.log('   - Audio can be generated with current quota');
    } else {
      const errorText = await response.text();
      console.error('   ❌ TTS generation failed:');
      console.error(`   - Status: ${response.status}`);
      
      try {
        const errorObj = JSON.parse(errorText);
        if (errorObj.error) {
          console.error(`   - Message: ${errorObj.error.message}`);
          
          if (response.status === 429) {
            console.error('\n   📊 Quota Information:');
            console.error('   - You have exceeded your daily quota');
            console.error('   - Quotas reset at midnight Pacific Time');
            console.error('   - Check your usage at: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas');
            
            if (errorObj.error.details) {
              errorObj.error.details.forEach((detail: any) => {
                if (detail.violations) {
                  detail.violations.forEach((violation: any) => {
                    console.error(`\n   - Exceeded quota: ${violation.quotaMetric}`);
                  });
                }
              });
            }
          }
        }
      } catch (parseError) {
        console.error(`   - Raw error: ${errorText.substring(0, 200)}...`);
      }
    }
  } catch (error: any) {
    console.error('   ❌ TTS test error:', error.message);
  }
  console.log('\n');
}

async function checkBillingStatus() {
  console.log('6️⃣ Billing and Plan Information:');
  console.log('   - To check your billing status:');
  console.log('     1. Go to https://console.cloud.google.com/billing');
  console.log('     2. Verify your project has an active billing account');
  console.log('     3. Check https://makersuite.google.com/app/billing');
  console.log('\n   - To check your API quotas:');
  console.log('     1. Visit https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas');
  console.log('     2. Look for "Generate requests per day per project per model"');
  console.log('     3. Check both "Limit" and "Current usage"\n');
}

// Run all checks
async function main() {
  await checkAPIKey();
  await testBasicAPI();
  await testTTSModel();
  await checkQuotaViaREST();
  await testTTSGeneration();
  await checkBillingStatus();
  
  console.log('============================================');
  console.log('✅ Diagnostic complete\n');
  
  console.log('🔧 Troubleshooting Tips:');
  console.log('1. If you see 429 errors, your quota is exhausted');
  console.log('2. If you have a paid plan but still see quota errors:');
  console.log('   - Ensure billing is active on your Google Cloud project');
  console.log('   - Regenerate your API key after enabling billing');
  console.log('   - Wait 15-30 minutes for changes to propagate');
  console.log('3. The free tier has very limited TTS requests per day');
  console.log('4. Consider implementing caching to reduce API calls\n');
}

main().catch(console.error);