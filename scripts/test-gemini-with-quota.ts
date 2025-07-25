import { config } from 'dotenv';
import { geminiQuotaManager } from '../services/gemini-quota-manager';
import { GeminiTTSService } from '../services/gemini-tts-service';
import { GeminiCoreService } from '../services/gemini-core-service';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') });

async function testGeminiWithQuota() {
  console.log('\n🔍 Testing Gemini API with Quota Management\n');
  
  try {
    // 1. Check Gemini configuration
    console.log('1️⃣ Checking Gemini Configuration...');
    const isConfigured = GeminiCoreService.isConfigured();
    console.log(`   ✅ Gemini API Key configured: ${isConfigured}`);
    
    if (!isConfigured) {
      console.error('   ❌ GEMINI_API_KEY not found in environment variables');
      return;
    }
    
    // 2. Check quota status
    console.log('\n2️⃣ Checking Quota Status...');
    const quotaStatus = await geminiQuotaManager.getQuotaStatus();
    console.log(`   📊 Daily Usage: ${quotaStatus.used}/${quotaStatus.limit} (${quotaStatus.percentage.toFixed(1)}%)`);
    console.log(`   🔄 Resets at: ${quotaStatus.resetTime.toLocaleString()}`);
    console.log(`   ${quotaStatus.canMakeRequest ? '✅' : '❌'} Can make requests: ${quotaStatus.canMakeRequest}`);
    
    // 3. Check if we can make a request
    console.log('\n3️⃣ Checking Request Eligibility...');
    const canRequest = await geminiQuotaManager.canMakeRequest();
    if (!canRequest.allowed) {
      console.error(`   ❌ Cannot make request: ${canRequest.reason}`);
      if (canRequest.waitTime) {
        console.log(`   ⏰ Wait time: ${canRequest.waitTime}ms`);
      }
      return;
    }
    console.log('   ✅ Request allowed by quota manager');
    
    // 4. Test TTS generation
    console.log('\n4️⃣ Testing TTS Generation...');
    const ttsService = GeminiTTSService.getInstance();
    const testText = 'Testing Gemini text to speech with quota management.';
    
    console.log('   🎯 Generating audio for:', testText);
    console.log('   🎤 Using voice: Kore');
    
    const audioFile = await ttsService.synthesizeToFile(testText, {
      voice: 'Kore',
      speed: 1.0,
      tone: 'professional'
    });
    
    if (audioFile) {
      console.log('   ✅ Audio generated successfully!');
      console.log(`   📁 File saved to: ${audioFile}`);
      
      // Check file size
      const stats = fs.statSync(audioFile);
      console.log(`   📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);
      
      // Clean up the test file
      fs.unlinkSync(audioFile);
      console.log('   🗑️  Test file cleaned up');
    } else {
      console.error('   ❌ Failed to generate audio');
    }
    
    // 5. Check updated quota status
    console.log('\n5️⃣ Checking Updated Quota Status...');
    const updatedQuotaStatus = await geminiQuotaManager.getQuotaStatus();
    console.log(`   📊 Daily Usage: ${updatedQuotaStatus.used}/${updatedQuotaStatus.limit} (${updatedQuotaStatus.percentage.toFixed(1)}%)`);
    console.log(`   ➕ Requests used in this test: ${updatedQuotaStatus.used - quotaStatus.used}`);
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error: any) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
    
    if (error.message?.includes('quota') || error.message?.includes('429')) {
      console.error('\n💡 Quota exceeded. Try these solutions:');
      console.error('   1. Wait for quota reset at midnight Pacific Time');
      console.error('   2. Check your usage at: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas');
      console.error('   3. Consider upgrading to a paid plan');
    }
  }
}

// Run the test
testGeminiWithQuota().catch(console.error);