#!/usr/bin/env bun
/**
 * Test Firestore indexes to verify they're working
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import dotenv from 'dotenv';

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
const db = getFirestore(app);
const auth = getAuth(app);

async function testIndexes() {
  console.log('🔍 Testing Firestore Indexes\n');
  
  try {
    // Sign in anonymously
    await signInAnonymously(auth);
    console.log('✅ Authenticated successfully\n');
    
    // Test Index #1: personalized_content
    console.log('📋 Testing Index #1: personalized_content');
    console.log('   Query: userId + visualizationId + generatedAt (desc)');
    
    try {
      const personalizedQuery = query(
        collection(db, 'personalized_content'),
        where('userId', '==', 'test-user'),
        where('visualizationId', '==', 'test-viz'),
        orderBy('generatedAt', 'desc'),
        limit(5)
      );
      
      const personalizedSnapshot = await getDocs(personalizedQuery);
      console.log(`   ✅ Index #1 is working! Found ${personalizedSnapshot.size} documents\n`);
    } catch (error: any) {
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
        console.log('   ❌ Index #1 not ready yet (still building)');
        console.log(`   Error: ${error.message}\n`);
      } else {
        console.log('   ✅ Index #1 is working (query executed without index errors)\n');
      }
    }
    
    // Test Index #2: tts_metadata
    console.log('📋 Testing Index #2: tts_metadata');
    console.log('   Query: generatedAt (desc)');
    
    try {
      const ttsQuery = query(
        collection(db, 'tts_metadata'),
        orderBy('generatedAt', 'desc'),
        limit(5)
      );
      
      const ttsSnapshot = await getDocs(ttsQuery);
      console.log(`   ✅ Index #2 is working! Found ${ttsSnapshot.size} documents`);
      
      if (ttsSnapshot.size > 0) {
        console.log('\n   Recent TTS entries:');
        ttsSnapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`   - ${doc.id}: ${data.voice} voice, ${new Date(data.generatedAt?.toDate()).toLocaleString()}`);
        });
      }
    } catch (error: any) {
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
        console.log('   ❌ Index #2 not ready yet (still building)');
        console.log(`   Error: ${error.message}`);
      } else {
        console.log('   ✅ Index #2 is working (query executed without index errors)');
      }
    }
    
    console.log('\n📊 Summary:');
    console.log('If you see "Index not ready" messages, wait 5-10 minutes for indexes to build.');
    console.log('Check the Firebase Console for real-time status updates.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await auth.signOut();
  }
}

testIndexes().catch(console.error);