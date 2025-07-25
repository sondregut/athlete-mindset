#!/usr/bin/env bun
/**
 * Migration script to upload visualization templates to Firestore
 * Run with: bun run scripts/migrate-visualizations-to-firestore.ts
 */

import admin from 'firebase-admin';
import { visualizations } from '../constants/visualizations';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../service-account-key.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Firebase service account file not found at:', serviceAccountPath);
  console.error('Please download it from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'athlete-mindset.firebasestorage.app',
  });
}

const firestore = admin.firestore();

async function migrateVisualizations() {
  console.log('Starting visualization migration to Firestore...');
  
  const batch = firestore.batch();
  let count = 0;
  
  for (const visualization of visualizations) {
    const docRef = firestore.collection('visualizations').doc(visualization.id);
    
    // Prepare data for Firestore
    const firestoreData = {
      id: visualization.id,
      title: visualization.title,
      description: visualization.description,
      duration: visualization.duration,
      category: visualization.category,
      backgroundAudio: visualization.backgroundAudio || null,
      steps: visualization.steps.map(step => ({
        id: step.id,
        content: step.content,
        duration: step.duration,
      })),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    batch.set(docRef, firestoreData);
    count++;
    
    // Firestore has a limit of 500 operations per batch
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`Committed batch of ${count} visualizations`);
    }
  }
  
  // Commit any remaining operations
  if (count % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`✅ Successfully migrated ${count} visualizations to Firestore`);
}

async function loadPersonalizationTemplates() {
  console.log('\\nLoading personalization templates...');
  
  try {
    const templatesPath = path.join(__dirname, '../data/personalization/templates/visualization-templates.json');
    const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
    
    const batch = firestore.batch();
    let count = 0;
    
    for (const [visualizationId, steps] of Object.entries(templates)) {
      const docRef = firestore.collection('personalization_templates').doc(visualizationId);
      
      batch.set(docRef, {
        visualizationId,
        steps: steps as any[],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      count++;
    }
    
    await batch.commit();
    console.log(`✅ Successfully uploaded ${count} personalization templates`);
  } catch (error) {
    console.error('Error loading personalization templates:', error);
  }
}

async function createIndexes() {
  console.log('\\nCreating Firestore indexes...');
  
  // Note: Complex indexes need to be created via Firebase Console or firebase.json
  // This is just documenting what indexes are needed
  
  const indexesNeeded = [
    {
      collection: 'personalized_content',
      fields: [
        { field: 'userId', order: 'ASCENDING' },
        { field: 'visualizationId', order: 'ASCENDING' },
        { field: 'generatedAt', order: 'DESCENDING' },
      ],
    },
    {
      collection: 'tts_metadata',
      fields: [
        { field: 'generatedAt', order: 'DESCENDING' },
      ],
    },
  ];
  
  console.log('Please create the following indexes in Firebase Console:');
  indexesNeeded.forEach((index, i) => {
    console.log(`\\n${i + 1}. Collection: ${index.collection}`);
    console.log('   Fields:');
    index.fields.forEach(field => {
      console.log(`   - ${field.field} (${field.order})`);
    });
  });
}

async function main() {
  try {
    await migrateVisualizations();
    await loadPersonalizationTemplates();
    await createIndexes();
    
    console.log('\\n✅ Migration completed successfully!');
    console.log('\\nNext steps:');
    console.log('1. Set up GEMINI_API_KEY secret: firebase functions:secrets:set GEMINI_API_KEY');
    console.log('2. Deploy functions: cd functions && npm install && cd .. && firebase deploy --only functions');
    console.log('3. Update client app to use Cloud Functions');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
main();