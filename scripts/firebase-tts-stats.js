/**
 * Display Firebase TTS cache statistics
 * Run this to see current cache usage and performance metrics
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

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

async function getStats() {
  console.log('📊 Firebase TTS Cache Statistics\n');
  
  try {
    // Get all cache entries
    const snapshot = await db.collection('tts-cache').get();
    
    let totalSize = 0;
    let totalAccess = 0;
    let voices = {};
    let models = {};
    let oldestEntry = null;
    let newestEntry = null;
    let mostAccessed = null;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Calculate totals
      totalSize += data.fileSize || 0;
      totalAccess += data.accessCount || 0;
      
      // Track voices
      voices[data.voice] = (voices[data.voice] || 0) + 1;
      
      // Track models
      models[data.model] = (models[data.model] || 0) + 1;
      
      // Find oldest/newest
      if (!oldestEntry || data.createdAt < oldestEntry.createdAt) {
        oldestEntry = { id: doc.id, ...data };
      }
      if (!newestEntry || data.createdAt > newestEntry.createdAt) {
        newestEntry = { id: doc.id, ...data };
      }
      
      // Find most accessed
      if (!mostAccessed || data.accessCount > mostAccessed.accessCount) {
        mostAccessed = { id: doc.id, ...data };
      }
    });
    
    // Display results
    console.log('📈 Overall Statistics:');
    console.log(`   Total entries: ${snapshot.size}`);
    console.log(`   Total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Average size: ${snapshot.size > 0 ? ((totalSize / snapshot.size) / 1024).toFixed(1) : 0}KB`);
    console.log(`   Total accesses: ${totalAccess}`);
    console.log(`   Average accesses: ${snapshot.size > 0 ? (totalAccess / snapshot.size).toFixed(1) : 0}`);
    
    console.log('\n🎙️  Voice Distribution:');
    Object.entries(voices).sort((a, b) => b[1] - a[1]).forEach(([voice, count]) => {
      console.log(`   ${voice}: ${count} (${((count / snapshot.size) * 100).toFixed(1)}%)`);
    });
    
    console.log('\n🤖 Model Distribution:');
    Object.entries(models).sort((a, b) => b[1] - a[1]).forEach(([model, count]) => {
      console.log(`   ${model}: ${count} (${((count / snapshot.size) * 100).toFixed(1)}%)`);
    });
    
    if (oldestEntry) {
      const ageInDays = (Date.now() - oldestEntry.createdAt._seconds * 1000) / (1000 * 60 * 60 * 24);
      console.log('\n📅 Oldest Entry:');
      console.log(`   Text: "${oldestEntry.text.substring(0, 50)}..."`);
      console.log(`   Age: ${ageInDays.toFixed(1)} days`);
      console.log(`   Accesses: ${oldestEntry.accessCount}`);
    }
    
    if (newestEntry) {
      const ageInHours = (Date.now() - newestEntry.createdAt._seconds * 1000) / (1000 * 60 * 60);
      console.log('\n🆕 Newest Entry:');
      console.log(`   Text: "${newestEntry.text.substring(0, 50)}..."`);
      console.log(`   Age: ${ageInHours < 24 ? `${ageInHours.toFixed(1)} hours` : `${(ageInHours / 24).toFixed(1)} days`}`);
      console.log(`   Accesses: ${newestEntry.accessCount}`);
    }
    
    if (mostAccessed) {
      console.log('\n🔥 Most Accessed:');
      console.log(`   Text: "${mostAccessed.text.substring(0, 50)}..."`);
      console.log(`   Accesses: ${mostAccessed.accessCount}`);
      console.log(`   Voice: ${mostAccessed.voice}`);
    }
    
    // Get metadata stats
    const statsDoc = await db.collection('tts-metadata').doc('stats').get();
    if (statsDoc.exists) {
      const stats = statsDoc.data();
      console.log('\n📊 Metadata Stats:');
      console.log(`   Last updated: ${new Date(stats.lastUpdated._seconds * 1000).toLocaleString()}`);
      if (stats.lastMigration) {
        console.log(`   Last migration: ${new Date(stats.lastMigration._seconds * 1000).toLocaleString()}`);
      }
      if (stats.lastBatchGeneration) {
        console.log(`   Last batch gen: ${new Date(stats.lastBatchGeneration._seconds * 1000).toLocaleString()}`);
      }
    }
    
    // Calculate cache hit rate estimate
    console.log('\n💰 Cost Savings Estimate:');
    const estimatedApiCalls = snapshot.size; // Minimum API calls saved
    const estimatedSavings = estimatedApiCalls * 0.015; // $0.015 per 1K chars estimate
    console.log(`   Minimum API calls saved: ${totalAccess - snapshot.size}`);
    console.log(`   Estimated savings: $${estimatedSavings.toFixed(2)}`);
    console.log(`   Cache hit rate: ${snapshot.size > 0 ? (((totalAccess - snapshot.size) / totalAccess) * 100).toFixed(1) : 0}%`);
    
  } catch (error) {
    console.error('❌ Failed to get stats:', error);
  }
}

async function getRecentActivity(limit = 10) {
  console.log(`\n\n🕒 Recent Activity (Last ${limit} accessed):\n`);
  
  try {
    const snapshot = await db.collection('tts-cache')
      .orderBy('lastAccessed', 'desc')
      .limit(limit)
      .get();
    
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      const ageInHours = (Date.now() - data.lastAccessed._seconds * 1000) / (1000 * 60 * 60);
      
      console.log(`${index + 1}. "${data.text.substring(0, 40)}..."`);
      console.log(`   Voice: ${data.voice} | Accesses: ${data.accessCount} | Last: ${ageInHours < 1 ? `${(ageInHours * 60).toFixed(0)} min ago` : `${ageInHours.toFixed(1)} hours ago`}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to get recent activity:', error);
  }
}

async function main() {
  console.log('🚀 Firebase TTS Cache Analysis\n');
  console.log('=' + '='.repeat(49) + '\n');
  
  await getStats();
  await getRecentActivity();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Analysis complete!');
}

main().catch(console.error);