#!/usr/bin/env bun
/**
 * Test Firebase Storage TTS upload with new permissions
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCo5H4l1Gfs5eOpV6gmHKLoB0wDYpNUBzE",
  authDomain: "athlete-mindset.firebaseapp.com",
  projectId: "athlete-mindset",
  storageBucket: "athlete-mindset.firebasestorage.app",
  messagingSenderId: "860569454039",
  appId: "1:860569454039:web:ed1fecf175f630abc07792",
  measurementId: "G-Q3GPE57EYN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function generateTestAudio() {
  console.log('🎙️ Generating test audio with Gemini...');
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-preview-tts',
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Aoede',
            },
          },
        },
      } as any,
    });

    const result = await model.generateContent('This is a test of Firebase Storage permissions.');
    const response = result.response;
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
      throw new Error('No audio data received from Gemini');
    }

    console.log('✅ Audio generated successfully');
    return Buffer.from(audioData, 'base64');
  } catch (error) {
    console.error('❌ Audio generation failed:', error);
    throw error;
  }
}

async function testFirebaseUpload() {
  console.log('🔐 Signing in anonymously...');
  
  try {
    // Sign in anonymously
    const userCredential = await signInAnonymously(auth);
    console.log('✅ Signed in as:', userCredential.user.uid);

    // Generate test audio
    const audioBuffer = await generateTestAudio();
    
    // Create cache key (normally would be SHA-256 hash)
    const cacheKey = `test-${Date.now()}.wav`;
    
    // Upload to Firebase Storage
    console.log('📤 Uploading to Firebase Storage...');
    const storageRef = ref(storage, `tts-cache/${cacheKey}`);
    
    const metadata = {
      contentType: 'audio/wav',
      customMetadata: {
        text: 'This is a test of Firebase Storage permissions.',
        voice: 'Aoede',
        speed: '1.0',
        model: 'gemini-2.5-flash-preview-tts',
      }
    };
    
    const snapshot = await uploadBytes(storageRef, audioBuffer, metadata);
    console.log('✅ Upload successful:', snapshot.metadata.fullPath);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('🔗 Download URL:', downloadURL);
    
    // Save locally to verify
    const localPath = `./test-upload-${Date.now()}.wav`;
    fs.writeFileSync(localPath, audioBuffer);
    console.log('💾 Saved locally to:', localPath);
    
    return true;
  } catch (error: any) {
    console.error('❌ Upload failed:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    return false;
  }
}

async function main() {
  console.log('🧪 Testing Firebase Storage TTS Upload\n');
  
  // Check environment
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in .env');
    process.exit(1);
  }
  
  const success = await testFirebaseUpload();
  
  if (success) {
    console.log('\n✨ Test completed successfully!');
    console.log('   Storage rules are working correctly.');
    console.log('   Authenticated users can upload TTS cache files.');
  } else {
    console.log('\n❌ Test failed. Check the error messages above.');
  }
  
  // Clean up
  await auth.signOut();
  process.exit(success ? 0 : 1);
}

main().catch(console.error);