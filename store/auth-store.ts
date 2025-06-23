import { create } from 'zustand';
import { firebaseAuth, AuthUser } from '@/services/firebase-auth';
import { initializeFirebase, markFirebaseInitialized } from '@/config/firebase';

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Auth actions
  signInAnonymously: () => Promise<void>;
  createAccount: (email: string, password: string, displayName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  linkAccount: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  
  // State management
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  initialize: () => (() => void);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  signInAnonymously: async () => {
    try {
      set({ isLoading: true, error: null });
      const user = await firebaseAuth.signInAnonymously();
      set({ user, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createAccount: async (email: string, password: string, displayName?: string) => {
    try {
      set({ isLoading: true, error: null });
      const user = await firebaseAuth.createAccount(email, password, displayName);
      set({ user, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const user = await firebaseAuth.signIn(email, password);
      set({ user, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  signInWithGoogle: async (idToken: string) => {
    try {
      set({ isLoading: true, error: null });
      const user = await firebaseAuth.signInWithGoogle(idToken);
      set({ user, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  linkAccount: async (email: string, password: string, displayName?: string) => {
    try {
      set({ isLoading: true, error: null });
      const user = await firebaseAuth.linkWithEmailAndPassword(email, password, displayName);
      set({ user, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      await firebaseAuth.signOut();
      set({ user: null, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteAccount: async () => {
    try {
      set({ isLoading: true, error: null });
      await firebaseAuth.deleteAccount();
      set({ user: null, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      await firebaseAuth.resetPassword(email);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  setUser: (user: AuthUser | null) => set({ user }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),

  initialize: () => {
    // Initialize Firebase first
    initializeFirebase();
    markFirebaseInitialized();
    
    // Set up auth state listener
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      const currentState = get();
      if (!currentState.isInitialized) {
        set({ user, isInitialized: true, isLoading: false });
      } else {
        set({ user });
      }
    });

    // Return cleanup function
    return unsubscribe;
  },
}));