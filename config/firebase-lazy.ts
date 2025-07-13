import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';

// Lazy loading wrappers for Firebase services
let firestorePromise: Promise<Firestore> | null = null;
let storagePromise: Promise<FirebaseStorage> | null = null;

export const getFirestoreLazy = async (): Promise<Firestore> => {
  if (!firestorePromise) {
    firestorePromise = import('./firebase').then(module => module.getFirebaseFirestore());
  }
  return firestorePromise;
};

export const getStorageLazy = async (): Promise<FirebaseStorage> => {
  if (!storagePromise) {
    storagePromise = import('./firebase').then(module => module.getFirebaseStorage());
  }
  return storagePromise;
};