#!/usr/bin/env bun
/**
 * Client-side migration script for visualizations
 * This uses the Firebase client SDK, so no service account is needed
 * Run with: bun run scripts/migrate-visualizations-client.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { visualizations } from '../constants/visualizations';
import * as fs from 'fs';
import * as path from 'path';

// Firebase config from your app
const firebaseConfig = {
  apiKey: "AIzaSyCo5H4l1Gfs5eOpV6gmHKLoB0wDYpNUBzE",
  authDomain: "athlete-mindset.firebaseapp.com",
  projectId: "athlete-mindset",
  storageBucket: "athlete-mindset.firebasestorage.app",
  messagingSenderId: "860569454039",
  appId: "1:860569454039:web:ed1fecf175f630abc07792",
  measurementId: "G-Q3GPE57EYN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

async function migrateVisualizations() {
  console.log('Starting visualization migration to Firestore...');
  
  const batch = writeBatch(firestore);
  let count = 0;
  
  for (const visualization of visualizations) {
    const docRef = doc(firestore, 'visualizations', visualization.id);
    
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    batch.set(docRef, firestoreData);
    count++;
    console.log(`Added ${visualization.id} to batch`);
    
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
  console.log('\nLoading personalization templates...');
  
  try {
    const templatesPath = path.join(__dirname, '../data/personalization/templates/visualization-templates.json');
    const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
    
    const batch = writeBatch(firestore);
    let count = 0;
    
    for (const [visualizationId, steps] of Object.entries(templates)) {
      const docRef = doc(firestore, 'personalization_templates', visualizationId);
      
      batch.set(docRef, {
        visualizationId,
        steps: steps as any[],
        createdAt: new Date(),
      });
      
      count++;
      console.log(`Added template for ${visualizationId}`);
    }
    
    await batch.commit();
    console.log(`✅ Successfully uploaded ${count} personalization templates`);
  } catch (error) {
    console.error('Error loading personalization templates:', error);
  }
}

async function main() {
  try {
    await migrateVisualizations();
    await loadPersonalizationTemplates();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Deploy Firestore indexes: firebase deploy --only firestore:indexes');
    console.log('2. Deploy functions: cd functions && npm install && cd .. && firebase deploy --only functions');
    console.log('3. Test with the debug screen in your app');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
main();