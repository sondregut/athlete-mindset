/**
 * Firebase TTS Cache Verification Script
 * Run this to verify your Firebase setup is working correctly
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../service-account-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account key not found!');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.firebasestorage.app`
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function verifyFirestore() {
  console.log('🔍 Verifying Firestore...');
  
  try {
    // Check if collection exists
    const snapshot = await db.collection('tts-cache').limit(1).get();
    console.log(`✅ Firestore connected - ${snapshot.size} documents found`);
    
    // Test write
    const testDoc = {
      text: 'Test verification',
      voice: 'nova',
      model: 'tts-1',
      speed: 1.0,
      storageUrl: '',
      fileSize: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      accessCount: 0,
      lastAccessed: admin.firestore.FieldValue.serverTimestamp(),
      hash: crypto.randomBytes(16).toString('hex')
    };
    
    await db.collection('tts-cache').doc('test-verify').set(testDoc);
    console.log('✅ Firestore write test passed');
    
    // Clean up
    await db.collection('tts-cache').doc('test-verify').delete();
    
  } catch (error) {
    console.error('❌ Firestore verification failed:', error);
    return false;
  }
  
  return true;
}

async function verifyStorage() {
  console.log('🔍 Verifying Storage...');
  
  try {
    // Test upload
    const testContent = 'Test audio file content';
    const testFile = bucket.file('tts-cache/test-verify.mp3');
    
    await testFile.save(testContent, {
      metadata: {
        contentType: 'audio/mpeg',
      }
    });
    console.log('✅ Storage write test passed');
    
    // Test read
    const [exists] = await testFile.exists();
    if (exists) {
      console.log('✅ Storage read test passed');
    }
    
    // Test public URL
    await testFile.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${testFile.name}`;
    console.log(`✅ Public URL generated: ${publicUrl}`);
    
    // Clean up
    await testFile.delete();
    
  } catch (error) {
    console.error('❌ Storage verification failed:', error);
    return false;
  }
  
  return true;
}

async function checkConfiguration() {
  console.log('🔍 Checking configuration...');
  
  const configPath = path.join(__dirname, '../config/firebase-tts-config.ts');
  if (!fs.existsSync(configPath)) {
    console.error('❌ Config file not found');
    return false;
  }
  
  const configContent = fs.readFileSync(configPath, 'utf8');
  if (configContent.includes('YOUR_SENDER_ID') || configContent.includes('YOUR_APP_ID')) {
    console.warn('⚠️ Config file needs to be updated with actual values');
    console.log('   Get these from: Firebase Console > Project Settings > General > Your apps');
    return false;
  }
  
  console.log('✅ Configuration file exists');
  return true;
}

async function testEndToEnd() {
  console.log('🔍 Running end-to-end test...');
  
  try {
    // Generate test data
    const testText = 'Hello from Firebase TTS cache';
    const testHash = crypto.createHash('sha256').update(testText).digest('hex').substring(0, 16);
    
    // Create Firestore document
    const docRef = db.collection('tts-cache').doc(testHash);
    await docRef.set({
      text: testText,
      voice: 'nova',
      model: 'tts-1',
      speed: 1.0,
      storageUrl: '',
      fileSize: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      accessCount: 1,
      lastAccessed: admin.firestore.FieldValue.serverTimestamp(),
      hash: testHash
    });
    
    // Upload to Storage
    const audioFile = bucket.file(`tts-cache/${testHash}.mp3`);
    const fakeAudioData = Buffer.from('fake audio data for testing');
    await audioFile.save(fakeAudioData, {
      metadata: {
        contentType: 'audio/mpeg',
      }
    });
    
    // Make public and get URL
    await audioFile.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${audioFile.name}`;
    
    // Update Firestore with URL
    await docRef.update({
      storageUrl: publicUrl,
      fileSize: fakeAudioData.length
    });
    
    // Verify retrieval
    const doc = await docRef.get();
    if (doc.exists && doc.data().storageUrl === publicUrl) {
      console.log('✅ End-to-end test passed');
      
      // Clean up
      await docRef.delete();
      await audioFile.delete();
      
      return true;
    }
    
  } catch (error) {
    console.error('❌ End-to-end test failed:', error);
    return false;
  }
  
  return false;
}

async function main() {
  console.log('🚀 Firebase TTS Cache Verification\n');
  
  let allPassed = true;
  
  allPassed = await verifyFirestore() && allPassed;
  allPassed = await verifyStorage() && allPassed;
  allPassed = await checkConfiguration() && allPassed;
  
  if (allPassed) {
    allPassed = await testEndToEnd() && allPassed;
  }
  
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ All verifications passed! Your Firebase TTS cache is ready.');
  } else {
    console.log('❌ Some verifications failed. Please fix the issues above.');
    process.exit(1);
  }
}

main();