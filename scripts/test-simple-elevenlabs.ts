import { ElevenLabsAIPersonalizationService } from '../services/elevenlabs-ai-personalization';
import { PersonalizationRequest } from '../types/personalization';

console.log('🧪 Testing ElevenLabs AI Integration (Simple)');

async function testBasicFunctionality() {
  try {
    console.log('Creating service instance...');
    const service = ElevenLabsAIPersonalizationService.getInstance();
    
    console.log('Service created successfully');
    
    // Test cache stats
    const stats = service.getCacheStats();
    console.log('Cache stats:', stats);
    
    console.log('✅ Basic functionality test passed!');
    
  } catch (error) {
    console.error('❌ Basic functionality test failed:', error);
  }
}

testBasicFunctionality();