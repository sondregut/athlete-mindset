import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  deleteUser as deleteAuthUser,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc,
  doc,
  query,
  QuerySnapshot
} from 'firebase/firestore';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

// Firebase config (same as in your app)
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
const auth = getAuth(app);
const db = getFirestore(app);

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

// Delete subcollections for a user
async function deleteUserSubcollections(userId: string) {
  const subcollectionNames = ['sessions', 'checkins', 'mindset'];
  
  for (const subcollectionName of subcollectionNames) {
    try {
      console.log(`  📁 Deleting ${subcollectionName} subcollection...`);
      const subcollectionRef = collection(db, 'users', userId, subcollectionName);
      const snapshot = await getDocs(subcollectionRef);
      
      for (const docSnapshot of snapshot.docs) {
        await deleteDoc(doc(db, 'users', userId, subcollectionName, docSnapshot.id));
      }
      
      console.log(`  ✅ Deleted ${snapshot.size} documents from ${subcollectionName}`);
    } catch (error) {
      console.log(`  ⚠️  Could not access ${subcollectionName} subcollection (might not exist)`);
    }
  }
}

// Delete all user data from Firestore
async function deleteAllFirestoreData() {
  console.log('\n🗑️  Deleting all user data from Firestore...');
  
  try {
    // Get all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log(`Found ${usersSnapshot.size} users in Firestore`);
    
    for (const userDoc of usersSnapshot.docs) {
      console.log(`\n👤 Deleting data for user: ${userDoc.id}`);
      
      // Delete subcollections
      await deleteUserSubcollections(userDoc.id);
      
      // Delete the user document
      await deleteDoc(doc(db, 'users', userDoc.id));
      console.log(`✅ Deleted user document: ${userDoc.id}`);
    }
    
    // Delete personalization profiles
    console.log('\n🗑️  Deleting personalization profiles...');
    const profilesRef = collection(db, 'personalization-profiles');
    const profilesSnapshot = await getDocs(profilesRef);
    
    for (const profileDoc of profilesSnapshot.docs) {
      await deleteDoc(doc(db, 'personalization-profiles', profileDoc.id));
    }
    
    console.log(`✅ Deleted ${profilesSnapshot.size} personalization profiles`);
    
  } catch (error) {
    console.error('❌ Error deleting Firestore data:', error);
    throw error;
  }
}

// Main function
async function main() {
  console.log('🔥 Firebase User Deletion Script (Client Version)');
  console.log('================================================');
  console.log('Project: athlete-mindset');
  console.log('\n⚠️  WARNING: This script will delete all user data from Firestore!');
  console.log('\nNOTE: This client version can only delete Firestore data.');
  console.log('To delete Firebase Auth users, you need to:');
  console.log('1. Go to Firebase Console > Authentication > Users');
  console.log('2. Select all users and delete them manually');
  console.log('\nThis script will delete:');
  console.log('- All user documents in Firestore');
  console.log('- All user subcollections (sessions, checkins, mindset)');
  console.log('- All personalization profiles');
  
  const confirmation = await question('\nType "DELETE ALL DATA" to confirm: ');
  
  if (confirmation !== 'DELETE ALL DATA') {
    console.log('\n❌ Deletion cancelled');
    rl.close();
    process.exit(0);
  }
  
  try {
    console.log('\n🚀 Starting deletion process...');
    
    // Note: This version doesn't require authentication since Firestore rules
    // might allow reading user lists (depends on your security rules)
    await deleteAllFirestoreData();
    
    console.log('\n✅ All Firestore user data has been successfully deleted!');
    console.log('\n📊 Summary:');
    console.log('- Firestore user documents: Deleted');
    console.log('- User subcollections: Deleted');
    console.log('- Personalization profiles: Deleted');
    console.log('\n⚠️  Remember to manually delete Firebase Auth users from the console!');
    
  } catch (error) {
    console.error('\n❌ Error during deletion:', error);
    console.log('\nIf you got permission errors, you may need to:');
    console.log('1. Temporarily update Firestore rules to allow deletion');
    console.log('2. Or use the Firebase Console to delete data manually');
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