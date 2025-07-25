#!/usr/bin/env bun

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getStorage, ref, listAll } from 'firebase/storage';

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
const firestore = getFirestore(app);
const storage = getStorage(app);

interface VoiceStats {
  [voice: string]: number;
}

interface ModelStats {
  [model: string]: number;
}

async function getStorageSummary() {
  console.log('📂 Firebase Storage Summary');
  console.log('===========================\n');

  try {
    const listRef = ref(storage, 'tts-cache');
    const result = await listAll(listRef);

    console.log(`Total files: ${result.items.length}`);
    
    // Sample some files to estimate total size
    console.log('\nSample files:');
    const sampleSize = Math.min(10, result.items.length);
    for (let i = 0; i < sampleSize; i++) {
      console.log(`  - ${result.items[i].name}`);
    }
    
    if (result.items.length > sampleSize) {
      console.log(`  ... and ${result.items.length - sampleSize} more files`);
    }
  } catch (error: any) {
    console.error('❌ Error accessing storage:', error.message);
  }
}

async function getFirestoreSummary() {
  console.log('\n\n📄 Firestore Summary');
  console.log('====================\n');

  try {
    const querySnapshot = await getDocs(collection(firestore, 'tts-cache'));
    
    console.log(`Total documents: ${querySnapshot.size}`);
    
    // Analyze voice and model distribution
    const voiceStats: VoiceStats = {};
    const modelStats: ModelStats = {};
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      
      // Count voices
      if (data.voice) {
        voiceStats[data.voice] = (voiceStats[data.voice] || 0) + 1;
      }
      
      // Count models
      if (data.model) {
        modelStats[data.model] = (modelStats[data.model] || 0) + 1;
      }
    });
    
    // Voice mapping for readable names
    const voiceNames: { [key: string]: string } = {
      '21m00Tcm4TlvDq8ikWAM': 'Rachel (ElevenLabs)',
      'pNInz6obpgDQGcFmaJgB': 'Adam (ElevenLabs)',
      'EXAVITQu4vr4xnSDxMaL': 'Bella (ElevenLabs)',
      'IKne3meq5aSn9XLyUdCD': 'Antoni (ElevenLabs)',
      'ThT5KcBeYPX3keUQqHPh': 'Domi (ElevenLabs)',
      'pqHfZKP75CvOlQylNhV4': 'Bill (ElevenLabs)',
      'nova': 'Nova (OpenAI)',
      'alloy': 'Alloy (OpenAI)',
      'echo': 'Echo (OpenAI)',
      'fable': 'Fable (OpenAI)',
      'onyx': 'Onyx (OpenAI)',
      'shimmer': 'Shimmer (OpenAI)',
    };
    
    console.log('\n📊 Voice Distribution:');
    Object.entries(voiceStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([voice, count]) => {
        const voiceName = voiceNames[voice] || voice;
        console.log(`  ${voiceName}: ${count} files`);
      });
    
    console.log('\n🤖 Model Distribution:');
    Object.entries(modelStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([model, count]) => {
        console.log(`  ${model}: ${count} files`);
      });
      
  } catch (error: any) {
    console.error('❌ Error accessing Firestore:', error.message);
  }
}

async function main() {
  console.log('🔍 Firebase TTS Cache Summary (Gemini AI)');
  console.log('==========================================\n');

  console.log('🔐 Signing in anonymously...');
  try {
    await signInAnonymously(auth);
    console.log('✅ Signed in successfully\n');
  } catch (error: any) {
    console.error('❌ Failed to sign in:', error.message);
    process.exit(1);
  }

  // Get summaries
  await getStorageSummary();
  await getFirestoreSummary();
  
  console.log('\n\n💡 Cache Management:');
  console.log('  bun run scripts/clear-firebase-cache-client.ts --dry-run  # Preview deletion');
  console.log('  bun run scripts/clear-firebase-cache-client.ts           # Delete all cache');
  console.log('\n💡 Gemini TTS Testing:');
  console.log('  bun run scripts/test-gemini-tts.ts                       # Test Gemini voices');
  console.log('  Navigate to /debug-gemini in app                         # Debug screen');
  
  // Sign out
  await auth.signOut();
  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});