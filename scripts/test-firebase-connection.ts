#!/usr/bin/env bun

import * as admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Check for service account file
const serviceAccountPath = resolve(__dirname, '../firebase-admin-key.json');

if (!existsSync(serviceAccountPath)) {
  console.error('❌ Error: firebase-admin-key.json not found');
  console.error('\nTo get your service account key:');
  console.error('1. Go to Firebase Console: https://console.firebase.google.com');
  console.error('2. Select your project (athlete-mindset)');
  console.error('3. Go to Project Settings (gear icon) > Service Accounts');
  console.error('4. Click "Generate new private key"');
  console.error('5. Save the file as "firebase-admin-key.json" in the project root');
  console.error('\nNote: This file is gitignored and should NEVER be committed!');
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'athlete-mindset.firebasestorage.app'
  });

  const storage = admin.storage();
  const firestore = admin.firestore();

  console.log('✅ Successfully connected to Firebase!');
  console.log('\nTesting access to resources...');

  // Test Storage access
  const bucket = storage.bucket();
  const [files] = await bucket.getFiles({ prefix: 'tts-cache/', maxResults: 5 });
  console.log(`\n📂 Storage: Found ${files.length} files in tts-cache/ (showing max 5)`);
  files.forEach(file => {
    console.log(`  - ${file.name}`);
  });

  // Test Firestore access
  const snapshot = await firestore.collection('tts-cache').limit(5).get();
  console.log(`\n📄 Firestore: Found ${snapshot.size} documents in tts-cache collection (showing max 5)`);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`  - ${doc.id} (voice: ${data.voice}, model: ${data.model})`);
  });

  console.log('\n✅ All tests passed! Ready to run the cache clearing script.');
  console.log('\nTo clear the cache, run:');
  console.log('  bun run scripts/clear-firebase-tts-cache.ts --dry-run  # Preview what will be deleted');
  console.log('  bun run scripts/clear-firebase-tts-cache.ts           # Actually delete everything');

} catch (error: any) {
  console.error('❌ Error connecting to Firebase:', error.message);
  if (error.code === 'auth/invalid-credential') {
    console.error('\nThe service account key appears to be invalid.');
    console.error('Please make sure you downloaded the correct key for the "athlete-mindset" project.');
  }
  process.exit(1);
}