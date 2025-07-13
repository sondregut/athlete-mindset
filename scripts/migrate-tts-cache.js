/**
 * Migrate existing TTS cache to Firebase
 * Run this to upload your existing local cache to Firebase Storage
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

// Paths to check for existing cache
const possibleCachePaths = [
  path.join(process.env.HOME, 'Library/Developer/CoreSimulator/Devices'),
  path.join(process.env.HOME, '.expo'),
  '/tmp/tts-cache',
  './tts-cache-backup'
];

async function findCacheFiles() {
  console.log('🔍 Searching for existing TTS cache files...');
  
  const cacheFiles = [];
  
  for (const basePath of possibleCachePaths) {
    if (fs.existsSync(basePath)) {
      console.log(`Checking: ${basePath}`);
      // Recursively search for .mp3 files
      const searchDir = (dir) => {
        try {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && !file.startsWith('.')) {
              searchDir(fullPath);
            } else if (file.endsWith('.mp3') && file.includes('tts')) {
              cacheFiles.push(fullPath);
            }
          }
        } catch (error) {
          // Skip directories we can't read
        }
      };
      
      searchDir(basePath);
    }
  }
  
  console.log(`Found ${cacheFiles.length} cache files`);
  return cacheFiles;
}

async function extractMetadataFromFile(filePath) {
  // Try to extract metadata from filename or path
  const filename = path.basename(filePath);
  const hash = filename.replace('.mp3', '');
  
  // Default metadata
  return {
    hash: hash.substring(0, 16),
    text: 'Migrated audio file',
    voice: 'nova',
    model: 'tts-1',
    speed: 1.0,
    fileSize: fs.statSync(filePath).size
  };
}

async function migrateFile(filePath, metadata) {
  try {
    console.log(`Migrating: ${path.basename(filePath)}`);
    
    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Upload to Storage
    const storageFile = bucket.file(`tts-cache/${metadata.hash}.mp3`);
    await storageFile.save(fileBuffer, {
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
    await db.collection('tts-cache').doc(metadata.hash).set({
      ...metadata,
      storageUrl: publicUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastAccessed: admin.firestore.FieldValue.serverTimestamp(),
      accessCount: 1,
      migrated: true
    });
    
    return true;
  } catch (error) {
    console.error(`Failed to migrate ${filePath}:`, error);
    return false;
  }
}

async function createMigrationReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    totalFiles: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    totalSize: results.reduce((sum, r) => sum + (r.metadata?.fileSize || 0), 0),
    files: results
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'migration-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📄 Migration report saved to: migration-report.json');
}

async function main() {
  console.log('🚀 TTS Cache Migration to Firebase\n');
  
  // Find cache files
  const cacheFiles = await findCacheFiles();
  
  if (cacheFiles.length === 0) {
    console.log('No cache files found to migrate.');
    console.log('\nIf you have a backup, place MP3 files in ./tts-cache-backup/');
    return;
  }
  
  console.log(`\nFound ${cacheFiles.length} files to migrate`);
  console.log('Starting migration...\n');
  
  const results = [];
  let successCount = 0;
  
  // Process in batches
  const batchSize = 5;
  for (let i = 0; i < cacheFiles.length; i += batchSize) {
    const batch = cacheFiles.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(async (filePath) => {
        const metadata = await extractMetadataFromFile(filePath);
        const success = await migrateFile(filePath, metadata);
        
        if (success) successCount++;
        
        return {
          filePath,
          metadata,
          success
        };
      })
    );
    
    results.push(...batchResults);
    
    console.log(`Progress: ${Math.min(i + batchSize, cacheFiles.length)}/${cacheFiles.length}`);
  }
  
  // Create report
  await createMigrationReport(results);
  
  console.log('\n✅ Migration complete!');
  console.log(`Successfully migrated: ${successCount}/${cacheFiles.length} files`);
  
  // Update metadata stats
  const stats = await db.collection('tts-metadata').doc('stats').get();
  const currentStats = stats.exists ? stats.data() : { totalFiles: 0, totalSize: 0 };
  
  await db.collection('tts-metadata').doc('stats').set({
    totalFiles: currentStats.totalFiles + successCount,
    totalSize: currentStats.totalSize + results.reduce((sum, r) => sum + (r.metadata?.fileSize || 0), 0),
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    lastMigration: admin.firestore.FieldValue.serverTimestamp()
  });
}

main().catch(console.error);