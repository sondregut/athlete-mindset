// Firebase configuration for TTS caching
// These values are from your Firebase project: athlete-mindset

export const firebaseTTSConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCo5H4l1Gfs5eOpV6gmHKLoB0wDYpNUBzE",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "athlete-mindset.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "athlete-mindset",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "athlete-mindset.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "860569454039",
  appId: process.env.FIREBASE_APP_ID || "1:860569454039:web:ed1fecf175f630abc07792"
  // Note: measurementId is not needed for TTS caching
};
