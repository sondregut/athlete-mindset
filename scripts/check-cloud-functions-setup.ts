#!/usr/bin/env bun
/**
 * Quick diagnostic script to check Cloud Functions setup
 * Run with: bun run scripts/check-cloud-functions-setup.ts
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}!${colors.reset} ${msg}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg: string) => console.log(`\n${colors.blue}=== ${msg} ===${colors.reset}`),
};

async function checkFirebaseCLI() {
  log.header('Firebase CLI Check');
  
  try {
    const { stdout } = await execAsync('firebase --version');
    log.success(`Firebase CLI installed: ${stdout.trim()}`);
    return true;
  } catch (error) {
    log.error('Firebase CLI not installed');
    log.info('Install with: npm install -g firebase-tools');
    return false;
  }
}

async function checkFirebaseAuth() {
  log.header('Firebase Authentication Check');
  
  try {
    const { stdout } = await execAsync('firebase auth:export /dev/stdout --format=json | head -n 1');
    if (stdout.includes('error') || stdout.includes('Error')) {
      throw new Error('Not authenticated');
    }
    log.success('Firebase authentication valid');
    return true;
  } catch (error) {
    log.error('Not authenticated with Firebase');
    log.info('Run: firebase login');
    return false;
  }
}

async function checkProject() {
  log.header('Firebase Project Check');
  
  try {
    const { stdout } = await execAsync('firebase use');
    if (stdout.includes('athlete-mindset')) {
      log.success('Correct project selected: athlete-mindset');
      return true;
    } else {
      log.warning(`Wrong project selected: ${stdout}`);
      log.info('Run: firebase use athlete-mindset');
      return false;
    }
  } catch (error) {
    log.error('No Firebase project selected');
    log.info('Run: firebase use athlete-mindset');
    return false;
  }
}

async function checkFunctionsDirectory() {
  log.header('Functions Directory Check');
  
  const functionsPath = path.join(process.cwd(), 'functions');
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'src/index.ts',
    'src/personalization.ts',
    'src/tts.ts',
    'src/types.ts',
  ];
  
  if (!fs.existsSync(functionsPath)) {
    log.error('Functions directory not found');
    return false;
  }
  
  let allFilesExist = true;
  for (const file of requiredFiles) {
    const filePath = path.join(functionsPath, file);
    if (fs.existsSync(filePath)) {
      log.success(`Found: ${file}`);
    } else {
      log.error(`Missing: ${file}`);
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

async function checkFunctionsBuild() {
  log.header('Functions Build Check');
  
  const libPath = path.join(process.cwd(), 'functions', 'lib');
  
  if (!fs.existsSync(libPath)) {
    log.error('Functions not built (lib directory missing)');
    log.info('Run: cd functions && npm run build');
    return false;
  }
  
  const jsFiles = fs.readdirSync(libPath).filter(f => f.endsWith('.js'));
  if (jsFiles.length > 0) {
    log.success(`Functions built: ${jsFiles.length} JS files found`);
    return true;
  } else {
    log.error('No compiled JS files found');
    log.info('Run: cd functions && npm run build');
    return false;
  }
}

async function checkSecrets() {
  log.header('Secrets Check');
  
  try {
    const { stdout } = await execAsync('firebase functions:secrets:list');
    if (stdout.includes('GEMINI_API_KEY')) {
      log.success('GEMINI_API_KEY secret is set');
      return true;
    } else {
      log.error('GEMINI_API_KEY secret not found');
      log.info('Run: firebase functions:secrets:set GEMINI_API_KEY');
      return false;
    }
  } catch (error) {
    log.warning('Could not check secrets (may need to deploy first)');
    return null;
  }
}

async function checkDeployedFunctions() {
  log.header('Deployed Functions Check');
  
  try {
    const { stdout } = await execAsync('firebase functions:list');
    const expectedFunctions = [
      'personalizeVisualization',
      'generateAudioTTS',
      'preloadVisualization',
      'cleanupOldCache',
    ];
    
    let allDeployed = true;
    for (const func of expectedFunctions) {
      if (stdout.includes(func)) {
        log.success(`Deployed: ${func}`);
      } else {
        log.error(`Not deployed: ${func}`);
        allDeployed = false;
      }
    }
    
    if (!allDeployed) {
      log.info('Run: firebase deploy --only functions');
    }
    
    return allDeployed;
  } catch (error) {
    log.error('Could not list deployed functions');
    log.info('Functions may not be deployed yet');
    return false;
  }
}

async function checkServiceAccount() {
  log.header('Service Account Check');
  
  const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    log.success('Service account file found');
    
    // Check if it's in .gitignore
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
    if (gitignore.includes('firebase-service-account.json')) {
      log.success('Service account file is in .gitignore');
    } else {
      log.warning('Service account file is NOT in .gitignore!');
      log.info('Add "firebase-service-account.json" to .gitignore');
    }
    
    return true;
  } else {
    log.warning('Service account file not found (needed for migration)');
    log.info('Download from Firebase Console > Project Settings > Service Accounts');
    return false;
  }
}

async function checkFirestoreData() {
  log.header('Firestore Data Check');
  
  log.info('Cannot check Firestore data automatically');
  log.info('Please verify in Firebase Console:');
  log.info('1. visualizations collection has documents');
  log.info('2. personalization_templates collection has documents');
  log.info('3. Indexes are created');
}

async function main() {
  console.log(colors.blue + '\n🔍 Cloud Functions Setup Diagnostic\n' + colors.reset);
  
  const checks = [
    { name: 'Firebase CLI', fn: checkFirebaseCLI },
    { name: 'Firebase Auth', fn: checkFirebaseAuth },
    { name: 'Project', fn: checkProject },
    { name: 'Functions Directory', fn: checkFunctionsDirectory },
    { name: 'Functions Build', fn: checkFunctionsBuild },
    { name: 'Secrets', fn: checkSecrets },
    { name: 'Deployed Functions', fn: checkDeployedFunctions },
    { name: 'Service Account', fn: checkServiceAccount },
  ];
  
  const results: Record<string, boolean | null> = {};
  
  for (const check of checks) {
    results[check.name] = await check.fn();
  }
  
  // Always check Firestore data reminder
  await checkFirestoreData();
  
  // Summary
  log.header('Summary');
  
  const passed = Object.values(results).filter(r => r === true).length;
  const failed = Object.values(results).filter(r => r === false).length;
  const warnings = Object.values(results).filter(r => r === null).length;
  
  console.log(`\nPassed: ${colors.green}${passed}${colors.reset}`);
  console.log(`Failed: ${colors.red}${failed}${colors.reset}`);
  console.log(`Warnings: ${colors.yellow}${warnings}${colors.reset}`);
  
  if (failed === 0) {
    console.log(`\n${colors.green}✨ All checks passed! Your Cloud Functions setup looks good.${colors.reset}`);
    console.log('\nNext steps:');
    console.log('1. Run migration: bun run scripts/migrate-visualizations-to-firestore.ts');
    console.log('2. Test in app: Navigate to Cloud Functions Debug screen');
  } else {
    console.log(`\n${colors.red}❌ Some checks failed. Please fix the issues above.${colors.reset}`);
  }
}

main().catch(error => {
  console.error('Diagnostic script failed:', error);
  process.exit(1);
});