#!/usr/bin/env bun

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function listGeminiModels() {
  console.log('📋 Listing available Gemini models via REST API\n');
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env file');
    process.exit(1);
  }
  
  try {
    // Call the ListModels endpoint
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('Available models:');
    console.log('================\n');
    
    if (data.models) {
      // Filter and display models
      const ttsModels: any[] = [];
      const textModels: any[] = [];
      
      data.models.forEach((model: any) => {
        const modelInfo = {
          name: model.name,
          displayName: model.displayName,
          supportedMethods: model.supportedGenerationMethods || [],
          description: model.description?.substring(0, 100) + '...' || 'No description',
        };
        
        // Check if model supports TTS (audio generation)
        if (model.description?.toLowerCase().includes('audio') || 
            model.description?.toLowerCase().includes('speech') ||
            model.description?.toLowerCase().includes('tts') ||
            model.displayName?.toLowerCase().includes('tts')) {
          ttsModels.push(modelInfo);
        } else {
          textModels.push(modelInfo);
        }
      });
      
      if (ttsModels.length > 0) {
        console.log('🎤 Models with potential TTS support:');
        ttsModels.forEach(model => {
          console.log(`\n- ${model.displayName} (${model.name})`);
          console.log(`  Methods: ${model.supportedMethods.join(', ')}`);
          console.log(`  Description: ${model.description}`);
        });
      } else {
        console.log('❌ No models found with explicit TTS support in their description');
      }
      
      console.log('\n\n📝 Other available models:');
      textModels.slice(0, 10).forEach(model => {
        console.log(`\n- ${model.displayName} (${model.name})`);
        console.log(`  Methods: ${model.supportedMethods.join(', ')}`);
      });
      
      console.log(`\n... and ${Math.max(0, textModels.length - 10)} more models`);
      
      // Look for any flash or pro models that might support audio
      console.log('\n\n🔍 Checking for Gemini 2.5 models:');
      data.models.forEach((model: any) => {
        if (model.name.includes('gemini-2.5') || model.name.includes('flash') || model.name.includes('pro')) {
          console.log(`\n- ${model.name}`);
          console.log(`  Display: ${model.displayName}`);
          console.log(`  Methods: ${model.supportedGenerationMethods?.join(', ') || 'Not specified'}`);
          
          // Check if model has any special capabilities
          if (model.generationConfig || model.outputFormats || model.supportedResponseMimeTypes) {
            console.log('  Special capabilities detected!');
            if (model.supportedResponseMimeTypes) {
              console.log(`  Response types: ${model.supportedResponseMimeTypes.join(', ')}`);
            }
          }
        }
      });
      
    } else {
      console.log('No models found in response');
    }
    
    console.log('\n\n💡 To test a specific model for TTS support, try using it with audio response modality configuration.');
    
  } catch (error: any) {
    console.error('❌ Error listing models:', error.message);
  }
}

// Run the script
listGeminiModels();