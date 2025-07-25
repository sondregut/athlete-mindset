import * as admin from 'firebase-admin';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

// Initialize Firebase Admin SDK
let serviceAccount: any;

try {
  // Try to load service account from environment variable
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    serviceAccount = JSON.parse(serviceAccountJson);
  } else {
    // Fallback to file (you'll need to download this from Firebase Console)
    serviceAccount = require('../firebase-service-account.json');
  }
} catch (error) {
  console.error('❌ Could not load Firebase service account credentials');
  console.error('Please ensure you have either:');
  console.error('1. FIREBASE_SERVICE_ACCOUNT_KEY environment variable set, or');
  console.error('2. firebase-service-account.json file in the project root');
  console.error('\nTo get the service account key:');
  console.error('1. Go to Firebase Console > Project Settings > Service Accounts');
  console.error('2. Click "Generate new private key"');
  console.error('3. Save the file as firebase-service-account.json in the project root');
  process.exit(1);
}

// Initialize admin app
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'athlete-mindset',
});

const auth = admin.auth();
const db = admin.firestore();

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

// Delete all subcollections of a document
async function deleteSubcollections(docRef: admin.firestore.DocumentReference) {
  const subcollections = await docRef.listCollections();
  
  for (const subcollection of subcollections) {
    console.log(`  📁 Deleting subcollection: ${subcollection.id}`);
    const docs = await subcollection.get();
    
    // Delete all documents in subcollection
    const batch = db.batch();
    let batchCount = 0;
    
    for (const doc of docs.docs) {
      batch.delete(doc.ref);
      batchCount++;
      
      // Firestore batch limit is 500
      if (batchCount === 500) {
        await batch.commit();
        batchCount = 0;
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
    }
  }
}

// Delete all users from Firestore
async function deleteFirestoreUsers() {
  console.log('\n🗑️  Deleting Firestore user data...');
  
  try {
    const usersCollection = db.collection('users');
    const usersSnapshot = await usersCollection.get();
    
    console.log(`Found ${usersSnapshot.size} users in Firestore`);
    
    for (const userDoc of usersSnapshot.docs) {
      console.log(`\n👤 Deleting user: ${userDoc.id}`);
      
      // First delete all subcollections
      await deleteSubcollections(userDoc.ref);
      
      // Then delete the user document
      await userDoc.ref.delete();
      console.log(`✅ Deleted user document: ${userDoc.id}`);
    }
    
    // Also delete any personalization profiles
    console.log('\n🗑️  Deleting personalization profiles...');
    const profilesCollection = db.collection('personalization-profiles');
    const profilesSnapshot = await profilesCollection.get();
    
    const profileBatch = db.batch();
    profilesSnapshot.docs.forEach(doc => {
      profileBatch.delete(doc.ref);
    });
    
    if (profilesSnapshot.size > 0) {
      await profileBatch.commit();
      console.log(`✅ Deleted ${profilesSnapshot.size} personalization profiles`);
    }
    
  } catch (error) {
    console.error('❌ Error deleting Firestore data:', error);
    throw error;
  }
}

// Delete all users from Firebase Auth
async function deleteAuthUsers() {
  console.log('\n🔐 Deleting Firebase Auth users...');
  
  try {
    let pageToken: string | undefined;
    let totalDeleted = 0;
    
    do {
      // List users in batches
      const listResult = await auth.listUsers(1000, pageToken);
      
      // Delete each user
      for (const user of listResult.users) {
        try {
          await auth.deleteUser(user.uid);
          console.log(`✅ Deleted auth user: ${user.email || user.uid}`);
          totalDeleted++;
        } catch (error) {
          console.error(`❌ Failed to delete user ${user.uid}:`, error);
        }
      }
      
      pageToken = listResult.pageToken;
    } while (pageToken);
    
    console.log(`\n✅ Deleted ${totalDeleted} authentication users`);
    
  } catch (error) {
    console.error('❌ Error deleting auth users:', error);
    throw error;
  }
}

// Main function
async function main() {
  console.log('🔥 Firebase User Deletion Script');
  console.log('================================');
  console.log(`Project: ${serviceAccount.project_id}`);
  console.log('\n⚠️  WARNING: This will permanently delete ALL users and their data!');
  console.log('This includes:');
  console.log('- All user authentication records');
  console.log('- All user documents in Firestore');
  console.log('- All user subcollections (sessions, checkins, mindset, etc.)');
  console.log('- All personalization profiles');
  
  const confirmation = await question('\nType "DELETE ALL USERS" to confirm: ');
  
  if (confirmation !== 'DELETE ALL USERS') {
    console.log('\n❌ Deletion cancelled');
    rl.close();
    process.exit(0);
  }
  
  const finalConfirmation = await question('\nAre you ABSOLUTELY sure? Type "yes" to proceed: ');
  
  if (finalConfirmation.toLowerCase() !== 'yes') {
    console.log('\n❌ Deletion cancelled');
    rl.close();
    process.exit(0);
  }
  
  try {
    console.log('\n🚀 Starting deletion process...');
    
    // Delete Firestore data first
    await deleteFirestoreUsers();
    
    // Then delete Auth users
    await deleteAuthUsers();
    
    console.log('\n✅ All users have been successfully deleted!');
    console.log('\n📊 Summary:');
    console.log('- Firestore user documents: Deleted');
    console.log('- User subcollections: Deleted');
    console.log('- Personalization profiles: Deleted');
    console.log('- Firebase Auth users: Deleted');
    
  } catch (error) {
    console.error('\n❌ Error during deletion:', error);
  }
  
  rl.close();
  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});