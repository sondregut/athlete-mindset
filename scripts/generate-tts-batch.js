/**
 * Batch generate common TTS phrases to pre-populate Firebase cache
 * Run this to pre-generate audio for common app phrases
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const fetch = require('node-fetch');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../service-account-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account key not found!');
  console.log('   Place your service account key at: service-account-key.json');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.firebasestorage.app`
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// OpenAI Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable not set!');
  process.exit(1);
}

// Common phrases to pre-generate
const COMMON_PHRASES = [
  // Visualization intros
  "Welcome to your mental training session. Find a comfortable position and close your eyes.",
  "Take a deep breath and let's begin your visualization journey.",
  "Picture yourself at your peak performance.",
  
  // Breathing exercises
  "Breathe in slowly through your nose for 4 counts.",
  "Hold your breath for 4 counts.",
  "Exhale slowly through your mouth for 4 counts.",
  "Repeat this breathing pattern 3 more times.",
  
  // Performance visualization
  "Visualize yourself executing your skills with perfect form.",
  "Feel the confidence flowing through your body.",
  "See yourself succeeding in your next competition.",
  "Imagine the crowd cheering as you achieve your goal.",
  
  // Recovery and relaxation
  "Allow your muscles to relax completely.",
  "Feel the tension leaving your body.",
  "You are calm, focused, and ready.",
  
  // Session endings
  "When you're ready, slowly open your eyes.",
  "Take this feeling of confidence with you.",
  "Your mental training session is complete.",
  
  // Common app prompts
  "How are you feeling today?",
  "Rate your energy level from 1 to 10.",
  "What are your intentions for today's training?",
  "Reflect on three positive moments from your session.",
  "What areas would you like to improve?",
];

async function generateHash(text, voice = 'nova', model = 'tts-1', speed = 1.0) {
  const keyString = `${text}-${voice}-${model}-${speed}`;
  const hash = crypto.createHash('sha256').update(keyString).digest('hex');
  return hash.substring(0, 16);
}

async function generateTTS(text, voice = 'nova', model = 'tts-1', speed = 1.0) {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: text,
      voice,
      speed,
      response_format: 'mp3'
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  return await response.buffer();
}

async function uploadToFirebase(audioBuffer, metadata) {
  const hash = await generateHash(metadata.text, metadata.voice, metadata.model, metadata.speed);
  
  // Check if already exists
  const docRef = db.collection('tts-cache').doc(hash);
  const doc = await docRef.get();
  
  if (doc.exists) {
    console.log(`⏭️  Already cached: "${metadata.text.substring(0, 50)}..."`);
    return null;
  }
  
  // Upload to Storage
  const storageFile = bucket.file(`tts-cache/${hash}.mp3`);
  await storageFile.save(audioBuffer, {
    metadata: {
      contentType: 'audio/mpeg',
      metadata: {
        voice: metadata.voice,
        model: metadata.model,
        speed: metadata.speed.toString()
      }
    }
  });
  
  // Make public
  await storageFile.makePublic();
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storageFile.name}`;
  
  // Save to Firestore
  await docRef.set({
    text: metadata.text,
    voice: metadata.voice,
    model: metadata.model,
    speed: metadata.speed,
    storageUrl: publicUrl,
    fileSize: audioBuffer.length,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    accessCount: 0,
    lastAccessed: admin.firestore.FieldValue.serverTimestamp(),
    hash: hash,
    preGenerated: true
  });
  
  return {
    hash,
    size: audioBuffer.length,
    url: publicUrl
  };
}

async function processBatch(phrases, voice = 'nova') {
  console.log(`\n🎙️  Generating ${phrases.length} phrases with voice: ${voice}\n`);
  
  let successCount = 0;
  let skipCount = 0;
  let totalSize = 0;
  
  for (let i = 0; i < phrases.length; i++) {
    const phrase = phrases[i];
    console.log(`[${i + 1}/${phrases.length}] Processing: "${phrase.substring(0, 50)}..."`);
    
    try {
      // Generate audio
      const audioBuffer = await generateTTS(phrase, voice);
      
      // Upload to Firebase
      const result = await uploadToFirebase(audioBuffer, {
        text: phrase,
        voice: voice,
        model: 'tts-1',
        speed: 1.0
      });
      
      if (result) {
        successCount++;
        totalSize += result.size;
        console.log(`   ✅ Uploaded (${(result.size / 1024).toFixed(1)}KB)`);
      } else {
        skipCount++;
      }
      
      // Rate limit: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
    }
  }
  
  return { successCount, skipCount, totalSize };
}

async function main() {
  console.log('🚀 Firebase TTS Batch Generation\n');
  
  const args = process.argv.slice(2);
  const voice = args[0] || 'nova';
  const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  
  if (!validVoices.includes(voice)) {
    console.error(`❌ Invalid voice: ${voice}`);
    console.log(`   Valid voices: ${validVoices.join(', ')}`);
    console.log(`   Usage: node generate-tts-batch.js [voice]`);
    process.exit(1);
  }
  
  // Process phrases
  const stats = await processBatch(COMMON_PHRASES, voice);
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Batch Generation Complete\n');
  console.log(`✅ Generated: ${stats.successCount} phrases`);
  console.log(`⏭️  Skipped: ${stats.skipCount} phrases (already cached)`);
  console.log(`💾 Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB`);
  
  // Update stats
  const statsDoc = await db.collection('tts-metadata').doc('stats').get();
  const currentStats = statsDoc.exists ? statsDoc.data() : { totalFiles: 0, totalSize: 0 };
  
  await db.collection('tts-metadata').doc('stats').set({
    totalFiles: currentStats.totalFiles + stats.successCount,
    totalSize: currentStats.totalSize + stats.totalSize,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    lastBatchGeneration: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log('\n✨ Pre-generation complete! Common phrases are now cached.');
}

// Check for node-fetch
try {
  require.resolve('node-fetch');
} catch (e) {
  console.error('❌ node-fetch is required. Run: npm install node-fetch');
  process.exit(1);
}

main().catch(console.error);