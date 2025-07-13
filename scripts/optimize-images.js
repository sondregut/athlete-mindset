#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Function to calculate file hash
function getFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// Function to get file size in MB
function getFileSizeInMB(filePath) {
  const stats = fs.statSync(filePath);
  return (stats.size / (1024 * 1024)).toFixed(2);
}

// Directories to scan
const imageDirs = [
  path.join(__dirname, '..', 'assets', 'images'),
  path.join(__dirname, '..', 'assets', 'images', 'brain-health'),
  path.join(__dirname, '..', 'assets')
];

console.log('🔍 Analyzing image assets...\n');

const imageFiles = [];
const hashMap = new Map();

// Scan directories for PNG files
imageDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (file.endsWith('.png') || file.endsWith('.jpg')) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isFile()) {
          const hash = getFileHash(filePath);
          const size = getFileSizeInMB(filePath);
          const fileInfo = {
            path: filePath,
            name: file,
            hash,
            size: parseFloat(size)
          };
          
          imageFiles.push(fileInfo);
          
          if (!hashMap.has(hash)) {
            hashMap.set(hash, []);
          }
          hashMap.get(hash).push(fileInfo);
        }
      }
    });
  }
});

// Report duplicate files
console.log('📊 Duplicate Files Report:');
console.log('========================\n');

let totalDuplicateSize = 0;
hashMap.forEach((files, hash) => {
  if (files.length > 1) {
    console.log(`Hash: ${hash.substring(0, 8)}...`);
    console.log(`Files (${files.length} copies, ${files[0].size}MB each):`);
    files.forEach(file => {
      console.log(`  - ${file.path.replace(path.join(__dirname, '..'), '.')}`);
    });
    totalDuplicateSize += files[0].size * (files.length - 1);
    console.log('');
  }
});

console.log(`Total space wasted on duplicates: ${totalDuplicateSize.toFixed(2)}MB\n`);

// Report large files
console.log('📦 Large Files Report (>500KB):');
console.log('==============================\n');

const largeFiles = imageFiles.filter(file => file.size > 0.5).sort((a, b) => b.size - a.size);
largeFiles.forEach(file => {
  console.log(`${file.size}MB - ${file.path.replace(path.join(__dirname, '..'), '.')}`);
});

console.log('\n🛠️  Optimization Recommendations:');
console.log('================================\n');

console.log('1. Install sharp for image optimization:');
console.log('   npm install --save-dev sharp-cli\n');

console.log('2. Create optimized versions of images:');
console.log('   npx sharp -i ./assets/images/icon.png -o ./assets/images/icon-optimized.png resize 1024 1024');
console.log('   npx sharp -i ./assets/images/splash-icon.png -o ./assets/images/splash-optimized.png resize 1242 2688\n');

console.log('3. For app icons, use proper sizes:');
console.log('   - iOS: 1024x1024 for App Store, will be resized automatically');
console.log('   - Android: 512x512 for adaptive icon');
console.log('   - Web favicon: 256x256\n');

console.log('4. Use Expo\'s image optimization:');
console.log('   expo optimize\n');

console.log('5. Consider using WebP format for better compression:');
console.log('   - 25-35% smaller than PNG');
console.log('   - Supported on iOS 14+ and Android 4.0+\n');

// Create a deduplication script
let dedupeScript = `#!/bin/bash
# Image deduplication script
# WARNING: This will keep only one copy of duplicate images

`;

const processed = new Set();
hashMap.forEach((files, hash) => {
  if (files.length > 1 && !processed.has(hash)) {
    processed.add(hash);
    const keepFile = files[0];
    for (let i = 1; i < files.length; i++) {
      const removeFile = files[i];
      dedupeScript += `# rm "${removeFile.path.replace(path.join(__dirname, '..'), '.')}"\n`;
    }
  }
});

fs.writeFileSync(path.join(__dirname, 'dedupe-images.sh'), dedupeScript, { mode: 0o755 });
console.log('✅ Created dedupe-images.sh script (uncomment lines to execute)\n');