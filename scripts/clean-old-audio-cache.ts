#!/usr/bin/env bun

import * as FileSystem from 'expo-file-system';
import { getStorage, ref, listAll, deleteObject } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

async function cleanLocalCache() {
  console.log('\n=== Cleaning Local Cache ===\n');
  
  const cacheDir = `${FileSystem.documentDirectory}tts-cache-gemini/`;
  
  try {
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);
    if (!dirInfo.exists) {
      console.log('Local cache directory does not exist');
      return;
    }
    
    const files = await FileSystem.readDirectoryAsync(cacheDir);
    let mp3Count = 0;
    let wavCount = 0;
    let deletedCount = 0;
    
    for (const file of files) {
      if (file.endsWith('.mp3')) {
        mp3Count++;
        // Delete old MP3 files
        try {
          await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete ${file}:`, error);
        }
      } else if (file.endsWith('.wav')) {
        wavCount++;
      }
    }
    
    console.log(`Found ${mp3Count} old MP3 files`);
    console.log(`Found ${wavCount} WAV files`);
    console.log(`Deleted ${deletedCount} old MP3 files`);
    
  } catch (error) {
    console.error('Error cleaning local cache:', error);
  }
}

async function cleanFirebaseCache() {
  console.log('\n=== Cleaning Firebase Cache ===\n');
  
  try {
    const cacheRef = ref(storage, 'tts-cache/');
    const result = await listAll(cacheRef);
    
    let mp3Count = 0;
    let wavCount = 0;
    
    for (const item of result.items) {
      if (item.name.endsWith('.mp3')) {
        mp3Count++;
      } else if (item.name.endsWith('.wav')) {
        wavCount++;
      }
    }
    
    console.log(`Found ${mp3Count} MP3 files in Firebase`);
    console.log(`Found ${wavCount} WAV files in Firebase`);
    console.log('\nNote: Firebase files are shared across users, so we keep them for backward compatibility');
    
  } catch (error) {
    console.error('Error accessing Firebase cache:', error);
  }
}

async function main() {
  console.log('Audio Cache Cleanup Utility');
  console.log('==========================');
  
  // Note: This script is for reference - actual cache cleaning should be done on device
  console.log('\nThis script shows what needs to be cleaned.');
  console.log('In production, the app will handle cache cleanup automatically.');
  
  await cleanLocalCache();
  await cleanFirebaseCache();
  
  console.log('\n✅ Cache analysis complete');
}

main().catch(console.error);