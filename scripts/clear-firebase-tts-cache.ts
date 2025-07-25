#!/usr/bin/env bun

import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import readline from 'readline';

// Initialize Firebase Admin SDK
const serviceAccountPath = resolve(__dirname, '../firebase-admin-key.json');
let serviceAccount: any;

try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error('❌ Error: Could not find firebase-admin-key.json');
  console.error('Please create a service account key from Firebase Console:');
  console.error('1. Go to Project Settings > Service Accounts');
  console.error('2. Generate new private key');
  console.error('3. Save as firebase-admin-key.json in the project root');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'athlete-mindset.firebasestorage.app'
});

const storage = admin.storage();
const firestore = admin.firestore();

interface CacheStats {
  filesDeleted: number;
  documentsDeleted: number;
  totalSize: number;
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

async function clearFirebaseStorage(dryRun: boolean = false): Promise<CacheStats> {
  const stats: CacheStats = {
    filesDeleted: 0,
    documentsDeleted: 0,
    totalSize: 0,
    errors: []
  };

  console.log(`\n📂 Clearing Firebase Storage (${dryRun ? 'DRY RUN' : 'LIVE'})...`);

  try {
    const bucket = storage.bucket();
    const [files] = await bucket.getFiles({ prefix: 'tts-cache/' });

    console.log(`Found ${files.length} files in tts-cache/`);

    // Process files in batches
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (file) => {
        try {
          const [metadata] = await file.getMetadata();
          const size = parseInt(metadata.size?.toString() || '0');
          
          console.log(`${dryRun ? '🔍' : '🗑️'} ${file.name} (${(size / 1024).toFixed(2)}KB)`);
          
          if (!dryRun) {
            await file.delete();
          }
          
          stats.filesDeleted++;
          stats.totalSize += size;
        } catch (error: any) {
          stats.errors.push(`Failed to delete ${file.name}: ${error.message}`);
          console.error(`❌ Error deleting ${file.name}:`, error.message);
        }
      }));

      // Rate limiting
      if (i + batchSize < files.length) {
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
    totalSize: 0,
    errors: []
  };

  console.log(`\n📄 Clearing Firestore documents (${dryRun ? 'DRY RUN' : 'LIVE'})...`);

  try {
    const collection = firestore.collection('tts-cache');
    const snapshot = await collection.get();

    console.log(`Found ${snapshot.size} documents in tts-cache collection`);

    // Delete in batches
    const batch = firestore.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log(`${dryRun ? '🔍' : '🗑️'} Document ${doc.id} (voice: ${data.voice}, model: ${data.model})`);

      if (!dryRun) {
        batch.delete(doc.ref);
        batchCount++;

        // Commit batch every 500 operations
        if (batchCount >= 500) {
          await batch.commit();
          batchCount = 0;
        }
      }

      stats.documentsDeleted++;
    }

    // Commit any remaining operations
    if (!dryRun && batchCount > 0) {
      await batch.commit();
    }
  } catch (error: any) {
    stats.errors.push(`Firestore error: ${error.message}`);
    console.error('❌ Error accessing Firestore:', error);
  }

  return stats;
}

async function main() {
  console.log('🧹 Firebase TTS Cache Cleaner');
  console.log('============================');
  console.log('This will delete all cached TTS content from Firebase Storage and Firestore.');
  console.log('This includes both ElevenLabs and Gemini cached audio files.\n');

  // Check for command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipConfirmation = args.includes('--yes');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be deleted\n');
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
  const storageStats = await clearFirebaseStorage(dryRun);

  // Clear Firestore
  const firestoreStats = await clearFirestoreDocuments(dryRun);

  // Summary
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n📊 Summary');
  console.log('==========');
  console.log(`Storage files deleted: ${storageStats.filesDeleted}`);
  console.log(`Total size freed: ${(storageStats.totalSize / 1024 / 1024).toFixed(2)}MB`);
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

  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});