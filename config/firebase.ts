import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth,
  initializeAuth,
  debugErrorMap,
  prodErrorMap,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCo5H4l1Gfs5eOpV6gmHKLoB0wDYpNUBzE",
  authDomain: "athlete-mindset.firebaseapp.com",
  projectId: "athlete-mindset",
  storageBucket: "athlete-mindset.firebasestorage.app",
  messagingSenderId: "860569454039",
  appId: "1:860569454039:web:ed1fecf175f630abc07792",
  measurementId: "G-Q3GPE57EYN"
};


// Singleton instances
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let isInitialized = false;

// Initialize Firebase lazily
export const initializeFirebase = () => {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
};

// Get Auth instance with Expo Go workaround
export const getFirebaseAuth = (): Auth => {
  if (!auth) {
    const firebaseApp = initializeFirebase();
    
    // Always use initializeAuth for consistent behavior
    if (Platform.OS === 'web') {
      // Web uses standard initialization
      auth = initializeAuth(firebaseApp, {
        persistence: [browserLocalPersistence, browserSessionPersistence],
        errorMap: __DEV__ ? debugErrorMap : prodErrorMap
      });
    } else {
      // React Native - use in-memory persistence for Expo Go compatibility
      // Note: This means auth state won't persist between app restarts in development
      // For production, use expo-secure-store or implement custom persistence
      auth = initializeAuth(firebaseApp, {
        persistence: inMemoryPersistence,
        errorMap: prodErrorMap
      });
      
      // Log warning about persistence limitation
      console.log('Firebase Auth initialized with in-memory persistence. Auth state will not persist between app restarts.');
    }
  }
  return auth;
};

// Get Firestore instance
export const getFirebaseFirestore = (): Firestore => {
  if (!firestore) {
    const firebaseApp = initializeFirebase();
    firestore = getFirestore(firebaseApp);
  }
  return firestore;
};

// Mark as initialized
export const markFirebaseInitialized = () => {
  isInitialized = true;
};

// Check if initialized
export const isFirebaseInitialized = () => isInitialized;

// Get Firebase App instance
export const getFirebaseApp = (): FirebaseApp => {
  return initializeFirebase();
};

// Get Storage instance
export const getFirebaseStorage = (): FirebaseStorage => {
  if (!storage) {
    const firebaseApp = initializeFirebase();
    storage = getStorage(firebaseApp);
  }
  return storage;
};

// Export default config
export default firebaseConfig;