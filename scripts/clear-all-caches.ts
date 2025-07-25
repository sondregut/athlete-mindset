#!/usr/bin/env bun

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolve } from 'path';

const LOCAL_CACHE_DIRS = [
  'tts-cache/',
  'tts-firebase-cache/',
  'tts-cache-gemini/',
  'personalization-cache/',
];

const ASYNC_STORAGE_KEYS = [
  'tts-cache-index',
  'tts-firebase-cache-index',
  'tts-memory-cache',
  'personalization-cache',
];

async function clearLocalFileCaches() {
  console.log('🗑️  Clearing local file caches...\n');
  
  const baseDir = `${FileSystem.documentDirectory}`;
  console.log(`Base directory: ${baseDir}`);
  
  for (const cacheDir of LOCAL_CACHE_DIRS) {
    const fullPath = `${baseDir}${cacheDir}`;
    
    try {
      const dirInfo = await FileSystem.getInfoAsync(fullPath);
      
      if (dirInfo.exists) {
        // Get size before deletion
        const files = await FileSystem.readDirectoryAsync(fullPath);
        console.log(`📁 ${cacheDir}: ${files.length} files`);
        
        // Delete the directory
        await FileSystem.deleteAsync(fullPath, { idempotent: true });
        console.log(`   ✅ Deleted\n`);
      } else {
        console.log(`📁 ${cacheDir}: Not found (skipped)\n`);
      }
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }
}

async function clearAsyncStorage() {
  console.log('🗑️  Clearing AsyncStorage cache keys...\n');
  
  for (const key of ASYNC_STORAGE_KEYS) {
    try {
      const value = await AsyncStorage.getItem(key);
      
      if (value !== null) {
        await AsyncStorage.removeItem(key);
        console.log(`🔑 ${key}: Cleared`);
      } else {
        console.log(`🔑 ${key}: Not found (skipped)`);
      }
    } catch (error: any) {
      console.error(`   ❌ Error clearing ${key}: ${error.message}`);
    }
  }
}

async function getCacheSummary() {
  console.log('\n📊 Cache Summary Before Clearing:\n');
  
  const baseDir = `${FileSystem.documentDirectory}`;
  let totalFiles = 0;
  let totalSize = 0;
  
  for (const cacheDir of LOCAL_CACHE_DIRS) {
    const fullPath = `${baseDir}${cacheDir}`;
    
    try {
      const dirInfo = await FileSystem.getInfoAsync(fullPath);
      
      if (dirInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(fullPath);
        let dirSize = 0;
        
        for (const file of files) {
          const filePath = `${fullPath}${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          if (fileInfo.exists && 'size' in fileInfo) {
            dirSize += fileInfo.size;
          }
        }
        
        totalFiles += files.length;
        totalSize += dirSize;
        
        console.log(`📁 ${cacheDir}:`);
        console.log(`   Files: ${files.length}`);
        console.log(`   Size: ${(dirSize / 1024 / 1024).toFixed(2)} MB\n`);
      }
    } catch (error) {
      // Skip if error
    }
  }
  
  console.log(`📊 Total: ${totalFiles} files, ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);
}

async function main() {
  console.log('🧹 Local Cache Cleaner');
  console.log('=====================');
  console.log('This will clear all local TTS and personalization caches.\n');
  
  try {
    // Show summary first
    await getCacheSummary();
    
    // Clear file caches
    await clearLocalFileCaches();
    
    // Clear AsyncStorage
    await clearAsyncStorage();
    
    console.log('\n✅ All local caches cleared successfully!');
    console.log('\n💡 Note: This only clears local device caches.');
    console.log('   To clear Firebase cloud cache, run:');
    console.log('   bun run scripts/clear-firebase-cache-client.ts');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});