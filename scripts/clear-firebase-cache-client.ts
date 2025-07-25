#!/usr/bin/env bun

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, listAll, deleteObject } from 'firebase/storage';
import readline from 'readline';

// Firebase config (same as in the app)
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

interface CacheStats {
  filesDeleted: number;
  documentsDeleted: number;
  errors: string[];
}

async function promptUser(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(message + ' (y/N): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

async function clearStorageFiles(dryRun: boolean = false): Promise<CacheStats> {
  const stats: CacheStats = {
    filesDeleted: 0,
    documentsDeleted: 0,
    errors: []
  };

  console.log(`\n📂 Clearing Storage files (${dryRun ? 'DRY RUN' : 'LIVE'})...`);

  try {
    const listRef = ref(storage, 'tts-cache');
    const result = await listAll(listRef);

    console.log(`Found ${result.items.length} files in tts-cache/`);

    // Process files in batches
    const batchSize = 5;
    for (let i = 0; i < result.items.length; i += batchSize) {
      const batch = result.items.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (fileRef) => {
        try {
          console.log(`${dryRun ? '🔍' : '🗑️'} ${fileRef.fullPath}`);
          
          if (!dryRun) {
            await deleteObject(fileRef);
          }
          
          stats.filesDeleted++;
        } catch (error: any) {
          stats.errors.push(`Failed to delete ${fileRef.fullPath}: ${error.message}`);
          console.error(`❌ Error deleting ${fileRef.fullPath}:`, error.message);
        }
      }));

      // Rate limiting
      if (i + batchSize < result.items.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (error: any) {
    stats.errors.push(`Storage error: ${error.message}`);
    console.error('❌ Error accessing storage:', error);
  }

  return stats;
}

async function clearFirestoreDocuments(dryRun: boolean = false): Promise<CacheStats> {
  const stats: CacheStats = {
    filesDeleted: 0,
    documentsDeleted: 0,
    errors: []
  };

  console.log(`\n📄 Clearing Firestore documents (${dryRun ? 'DRY RUN' : 'LIVE'})...`);

  try {
    const querySnapshot = await getDocs(collection(firestore, 'tts-cache'));
    
    console.log(`Found ${querySnapshot.size} documents in tts-cache collection`);

    for (const doc of querySnapshot.docs) {
      try {
        const data = doc.data();
        console.log(`${dryRun ? '🔍' : '🗑️'} Document ${doc.id} (voice: ${data.voice}, model: ${data.model})`);

        if (!dryRun) {
          await deleteDoc(doc.ref);
        }

        stats.documentsDeleted++;
      } catch (error: any) {
        stats.errors.push(`Failed to delete document ${doc.id}: ${error.message}`);
        console.error(`❌ Error deleting document ${doc.id}:`, error.message);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error: any) {
    stats.errors.push(`Firestore error: ${error.message}`);
    console.error('❌ Error accessing Firestore:', error);
  }

  return stats;
}

async function main() {
  console.log('🧹 Firebase TTS Cache Cleaner (Client SDK)');
  console.log('==========================================');
  console.log('This will delete all cached TTS content from Firebase Storage and Firestore.');
  console.log('This includes both ElevenLabs and Gemini cached audio files.\n');

  // Check for command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipConfirmation = args.includes('--yes');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be deleted\n');
  }

  console.log('🔐 Signing in anonymously...');
  try {
    await signInAnonymously(auth);
    console.log('✅ Signed in successfully\n');
  } catch (error: any) {
    console.error('❌ Failed to sign in:', error.message);
    console.error('\nNote: Make sure Firebase Authentication is enabled and allows anonymous sign-in.');
    process.exit(1);
  }

  if (!skipConfirmation && !dryRun) {
    const proceed = await promptUser('⚠️  Are you sure you want to delete all TTS cache?');
    if (!proceed) {
      console.log('❌ Operation cancelled');
      process.exit(0);
    }
  }

  const startTime = Date.now();

  // Clear Storage
  const storageStats = await clearStorageFiles(dryRun);

  // Clear Firestore
  const firestoreStats = await clearFirestoreDocuments(dryRun);

  // Summary
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n📊 Summary');
  console.log('==========');
  console.log(`Storage files deleted: ${storageStats.filesDeleted}`);
  console.log(`Firestore documents deleted: ${firestoreStats.documentsDeleted}`);
  console.log(`Total errors: ${storageStats.errors.length + firestoreStats.errors.length}`);
  console.log(`Time taken: ${totalTime}s`);

  if (storageStats.errors.length > 0 || firestoreStats.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    [...storageStats.errors, ...firestoreStats.errors].forEach(error => {
      console.log(`  - ${error}`);
    });
  }

  if (dryRun) {
    console.log('\n💡 This was a dry run. Run without --dry-run to actually delete files.');
  } else {
    console.log('\n✅ Cache clearing complete!');
  }

  // Sign out
  await auth.signOut();
  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});