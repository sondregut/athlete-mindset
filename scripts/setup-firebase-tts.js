/**
 * Firebase TTS Cache Setup Script
 * Run this once to set up all Firebase resources programmatically
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../service-account-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account key not found!');
  console.log('\nPlease:');
  console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
  console.log('2. Click "Generate new private key"');
  console.log('3. Save as "service-account-key.json" in project root');
  console.log('4. Run this script again');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.firebasestorage.app`
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function setupFirestore() {
  console.log('📦 Setting up Firestore collections...');
  
  try {
    // Create TTS cache collection with a sample document
    const sampleDoc = {
      text: 'Welcome to Athlete Mindset',
      voice: 'nova',
      model: 'tts-1',
      speed: 1.0,
      storageUrl: '',
      fileSize: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      accessCount: 0,
      lastAccessed: admin.firestore.FieldValue.serverTimestamp(),
      hash: 'sample-doc'
    };
    
    await db.collection('tts-cache').doc('sample').set(sampleDoc);
    console.log('✅ Firestore collection created');
    
    // Create metadata collection
    await db.collection('tts-metadata').doc('stats').set({
      totalFiles: 0,
      totalSize: 0,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Metadata collection created');
    
  } catch (error) {
    console.error('❌ Firestore setup failed:', error);
    throw error;
  }
}

async function setupStorage() {
  console.log('📦 Setting up Storage structure...');
  
  try {
    // Create folder structure by uploading a placeholder
    const placeholderContent = 'TTS Cache Initialized';
    const placeholderFile = bucket.file('tts-cache/.placeholder');
    
    await placeholderFile.save(placeholderContent, {
      metadata: {
        contentType: 'text/plain',
      }
    });
    
    console.log('✅ Storage structure created');
  } catch (error) {
    console.error('❌ Storage setup failed:', error);
    throw error;
  }
}

async function applySecurityRules() {
  console.log('🔒 Generating security rules...');
  
  // Firestore Rules
  const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // TTS cache - public read, authenticated write
    match /tts-cache/{document} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.data.keys().hasAll(['text', 'voice', 'model', 'speed', 'hash'])
        && request.resource.data.text is string
        && request.resource.data.text.size() <= 5000
        && request.resource.data.voice in ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
        && request.resource.data.model in ['tts-1', 'tts-1-hd']
        && request.resource.data.speed >= 0.25
        && request.resource.data.speed <= 4.0;
    }
    
    // Metadata - authenticated access only
    match /tts-metadata/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}`;

  // Storage Rules
  const storageRules = `
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // TTS cache files - public read, authenticated write
    match /tts-cache/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.size < 10 * 1024 * 1024  // 10MB max
        && request.resource.contentType == 'audio/mpeg';
    }
  }
}`;

  // Save rules to files
  fs.writeFileSync(path.join(__dirname, '../firestore-tts.rules'), firestoreRules);
  fs.writeFileSync(path.join(__dirname, '../storage-tts.rules'), storageRules);
  
  console.log('✅ Security rules generated');
  console.log('\n📋 To apply security rules:');
  console.log('1. Copy contents of firestore-tts.rules to Firebase Console > Firestore > Rules');
  console.log('2. Copy contents of storage-tts.rules to Firebase Console > Storage > Rules');
}

async function createConfigFile() {
  console.log('⚙️ Creating Firebase config file...');
  
  const firebaseConfig = {
    projectId: serviceAccount.project_id,
    storageBucket: `${serviceAccount.project_id}.appspot.com`,
    messagingSenderId: "YOUR_SENDER_ID", // You'll need to get this from Firebase Console
    appId: "YOUR_APP_ID", // You'll need to get this from Firebase Console
  };
  
  const configContent = `// Firebase Configuration for TTS Cache
export const firebaseTTSConfig = ${JSON.stringify(firebaseConfig, null, 2)};

// Update messagingSenderId and appId from:
// Firebase Console > Project Settings > General > Your apps
`;

  fs.writeFileSync(path.join(__dirname, '../config/firebase-tts-config.ts'), configContent);
  console.log('✅ Config file created (update messagingSenderId and appId)');
}

async function main() {
  console.log('🚀 Firebase TTS Cache Setup\n');
  
  try {
    await setupFirestore();
    await setupStorage();
    await applySecurityRules();
    await createConfigFile();
    
    console.log('\n✅ Setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Apply security rules in Firebase Console (see files above)');
    console.log('2. Update messagingSenderId and appId in config/firebase-tts-config.ts');
    console.log('3. Run: node scripts/verify-firebase-tts.js');
    console.log('4. Integrate the new TTS service in your app');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

main();