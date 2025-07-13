#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeImage(inputPath, outputPath, options = {}) {
  try {
    const image = sharp(inputPath);
    
    if (options.width && options.height) {
      image.resize(options.width, options.height, {
        fit: 'contain',
        background: { r: 74, g: 111, b: 255, alpha: 1 }
      });
    }
    
    await image
      .png({ 
        quality: 85,
        compressionLevel: 9,
        palette: true
      })
      .toFile(outputPath);
      
    const inputSize = fs.statSync(inputPath).size;
    const outputSize = fs.statSync(outputPath).size;
    const reduction = ((inputSize - outputSize) / inputSize * 100).toFixed(1);
    
    console.log(`✓ ${path.basename(inputPath)}: ${(inputSize/1024/1024).toFixed(2)}MB → ${(outputSize/1024/1024).toFixed(2)}MB (-${reduction}%)`);
  } catch (error) {
    console.error(`✗ Failed to optimize ${inputPath}:`, error.message);
  }
}

async function main() {
  console.log('🎨 Starting image compression...\n');
  
  // Create temp directory for processing
  const tempDir = path.join(__dirname, '..', 'assets', 'images', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Process main icons
  console.log('📱 Processing app icons...');
  
  // Icon should be 1024x1024 for iOS
  await optimizeImage(
    path.join(__dirname, '..', 'assets', 'images', 'icon.png'),
    path.join(tempDir, 'icon.png'),
    { width: 1024, height: 1024 }
  );
  
  // Splash should be larger
  await optimizeImage(
    path.join(__dirname, '..', 'assets', 'images', 'splash-icon.png'),
    path.join(tempDir, 'splash-icon.png'),
    { width: 1242, height: 2688 }
  );
  
  // Process brain health images
  console.log('\n🧠 Processing brain health images...');
  const brainDir = path.join(__dirname, '..', 'assets', 'images', 'brain-health');
  const brainFiles = fs.readdirSync(brainDir).filter(f => f.endsWith('.png'));
  
  for (const file of brainFiles) {
    await optimizeImage(
      path.join(brainDir, file),
      path.join(tempDir, `brain-${file}`),
      {}
    );
  }
  
  console.log('\n📋 Creating optimized versions...');
  
  // Move optimized files back
  const optimizedIcon = path.join(tempDir, 'icon.png');
  if (fs.existsSync(optimizedIcon)) {
    // Use the same optimized icon for all variants
    fs.copyFileSync(optimizedIcon, path.join(__dirname, '..', 'assets', 'images', 'icon.png'));
    fs.copyFileSync(optimizedIcon, path.join(__dirname, '..', 'assets', 'images', 'adaptive-icon.png'));
    fs.copyFileSync(optimizedIcon, path.join(__dirname, '..', 'assets', 'images', 'favicon.png'));
    fs.copyFileSync(optimizedIcon, path.join(__dirname, '..', 'assets', 'icon.png'));
  }
  
  // Move splash
  const optimizedSplash = path.join(tempDir, 'splash-icon.png');
  if (fs.existsSync(optimizedSplash)) {
    fs.copyFileSync(optimizedSplash, path.join(__dirname, '..', 'assets', 'images', 'splash-icon.png'));
  }
  
  // Move brain images
  for (const file of brainFiles) {
    const optimizedBrain = path.join(tempDir, `brain-${file}`);
    if (fs.existsSync(optimizedBrain)) {
      fs.copyFileSync(optimizedBrain, path.join(brainDir, file));
    }
  }
  
  // Clean up temp directory
  fs.rmSync(tempDir, { recursive: true });
  
  console.log('\n✅ Image compression complete!');
  console.log('💡 Run "bunx rork start --clear" to see the changes');
}

main().catch(console.error);