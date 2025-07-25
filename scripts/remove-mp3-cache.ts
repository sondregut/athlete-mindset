#!/usr/bin/env bun

import { getStorage, ref, listAll, deleteObject } from 'firebase/storage';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
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
const firestore = getFirestore(app);

async function removeMP3FilesFromFirebaseStorage() {
  console.log('\n=== Removing MP3 Files from Firebase Storage ===\n');
  
  try {
    const cacheRef = ref(storage, 'tts-cache/');
    const result = await listAll(cacheRef);
    
    let mp3Count = 0;
    let deletedCount = 0;
    const errors: string[] = [];
    
    // Count MP3 files
    const mp3Files = result.items.filter(item => item.name.endsWith('.mp3'));
    mp3Count = mp3Files.length;
    
    console.log(`Found ${mp3Count} MP3 files to delete`);
    
    if (mp3Count === 0) {
      console.log('No MP3 files found in Firebase Storage');
      return;
    }
    
    // Delete MP3 files
    for (const item of mp3Files) {
      try {
        console.log(`Deleting: ${item.name}`);
        await deleteObject(item);
        deletedCount++;
      } catch (error: any) {
        console.error(`Failed to delete ${item.name}:`, error.message);
        errors.push(item.name);
      }
    }
    
    console.log(`\n✅ Successfully deleted ${deletedCount} MP3 files`);
    if (errors.length > 0) {
      console.log(`❌ Failed to delete ${errors.length} files:`, errors);
    }
    
  } catch (error) {
    console.error('Error accessing Firebase Storage:', error);
  }
}

async function removeMP3MetadataFromFirestore() {
  console.log('\n=== Removing MP3 Metadata from Firestore ===\n');
  
  try {
    const cacheCollection = collection(firestore, 'tts-cache');
    const snapshot = await getDocs(cacheCollection);
    
    let totalDocs = 0;
    let mp3Docs = 0;
    let deletedDocs = 0;
    
    for (const docSnapshot of snapshot.docs) {
      totalDocs++;
      const data = docSnapshot.data();
      
      // Check if this is MP3-related metadata
      if (data.model === 'eleven_multilingual_v2' || 
          data.source === 'elevenlabs' ||
          !data.source) { // Old entries might not have source field
        mp3Docs++;
        
        try {
          console.log(`Deleting metadata: ${docSnapshot.id}`);
          await deleteDoc(doc(firestore, 'tts-cache', docSnapshot.id));
          deletedDocs++;
        } catch (error: any) {
          console.error(`Failed to delete doc ${docSnapshot.id}:`, error.message);
        }
      }
    }
    
    console.log(`\nTotal documents: ${totalDocs}`);
    console.log(`MP3-related documents: ${mp3Docs}`);
    console.log(`✅ Successfully deleted ${deletedDocs} metadata entries`);
    
  } catch (error) {
    console.error('Error accessing Firestore:', error);
  }
}

async function cleanupLocalCache() {
  console.log('\n=== Local Cache Cleanup Instructions ===\n');
  
  console.log('To clean local cache on devices:');
  console.log('1. Add this cleanup code to your app initialization:');
  console.log(`
// In app initialization or cache service
const cleanupOldMP3Files = async () => {
  const cacheDir = \`\${FileSystem.documentDirectory}tts-cache-gemini/\`;
  
  try {
    const files = await FileSystem.readDirectoryAsync(cacheDir);
    for (const file of files) {
      if (file.endsWith('.mp3')) {
        await FileSystem.deleteAsync(\`\${cacheDir}\${file}\`, { idempotent: true });
        console.log('Deleted old MP3 file:', file);
      }
    }
  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
};
`);
  
  console.log('\n2. Or users can reinstall the app to clear all cache');
}

async function main() {
  console.log('MP3 Cache Removal Tool');
  console.log('======================');
  console.log('This will remove all old MP3 files from Firebase');
  console.log('WAV files (new format) will be preserved\n');
  
  // Confirm before proceeding
  console.log('Starting cleanup in 3 seconds...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await removeMP3FilesFromFirebaseStorage();
  await removeMP3MetadataFromFirestore();
  await cleanupLocalCache();
  
  console.log('\n✅ MP3 cache cleanup complete!');
  console.log('\nNote: The app will now generate new WAV files as needed.');
}

main().catch(console.error);