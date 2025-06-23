import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionLog } from '@/types/session';
import { MindsetCheckin } from '@/store/mindset-store';
import { firebaseSessions } from './firebase-sessions';
import { firebaseMindset } from './firebase-mindset';
import { firebaseAuth } from './firebase-auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/config/firebase';

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: Date | null;
  pendingSessions: number;
  pendingCheckins: number;
  isSyncing: boolean;
  error: string | null;
}

class FirebaseSyncService {
  private syncStatusKey = '@athlete-mindset/sync-status';
  private lastSyncKey = '@athlete-mindset/last-sync';

  /**
   * Ensure user document exists in Firestore
   */
  private async ensureUserDocument(userId: string): Promise<void> {
    try {
      const userRef = doc(getFirebaseFirestore(), 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create initial user document
        await setDoc(userRef, {
          createdAt: new Date(),
          updatedAt: new Date(),
          uid: userId
        });
        console.log('Created user document in Firestore');
      }
    } catch (error) {
      console.error('Failed to ensure user document:', error);
      throw error;
    }
  }

  /**
   * Initialize sync when user authenticates
   */
  async initializeSync(): Promise<void> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) return;

      // Ensure user document exists before syncing
      await this.ensureUserDocument(user.uid);

      // Start initial sync of existing local data
      await this.syncLocalDataToFirebase();
      
      // Import session and mindset stores dynamically to avoid circular dependencies
      const { useSessionStore } = await import('@/store/session-store');
      const { useMindsetStore } = await import('@/store/mindset-store');
      
      // Set up Firebase sync for both stores
      await useSessionStore.getState().syncWithFirebase();
      await useMindsetStore.getState().syncWithFirebase();
    } catch (error) {
      console.error('Failed to initialize sync:', error);
    }
  }

  /**
   * Sync local AsyncStorage data to Firebase (for migration)
   */
  async syncLocalDataToFirebase(): Promise<void> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Get local session data
      const sessionDataStr = await AsyncStorage.getItem('athlete-mindset-storage');
      if (sessionDataStr) {
        const sessionData = JSON.parse(sessionDataStr);
        const localSessions: SessionLog[] = sessionData.state?.logs || [];
        
        if (localSessions.length > 0) {
          console.log(`Syncing ${localSessions.length} sessions to Firebase...`);
          await firebaseSessions.batchUploadSessions(localSessions);
        }
      }

      // Get local mindset data
      const mindsetDataStr = await AsyncStorage.getItem('mindset-checkin-storage');
      if (mindsetDataStr) {
        const mindsetData = JSON.parse(mindsetDataStr);
        const localCheckins: MindsetCheckin[] = mindsetData.state?.checkins || [];
        
        if (localCheckins.length > 0) {
          console.log(`Syncing ${localCheckins.length} check-ins to Firebase...`);
          await firebaseMindset.batchUploadCheckins(localCheckins);
        }
      }

      // Update last sync time
      await AsyncStorage.setItem(this.lastSyncKey, new Date().toISOString());
      
      console.log('Local data sync completed successfully');
    } catch (error) {
      console.error('Failed to sync local data to Firebase:', error);
      throw error;
    }
  }

  /**
   * Sync Firebase data to local storage
   */
  async syncFirebaseDataToLocal(): Promise<void> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Get Firebase sessions
      const sessionsFromFirebase = await firebaseSessions.getAllSessions();
      
      // Get Firebase check-ins
      const checkinsFromFirebase = await firebaseMindset.getAllCheckins();

      // Update local stores
      // Note: This would require updating the store implementations
      // For now, we'll just log the data
      console.log(`Retrieved ${sessionsFromFirebase.length} sessions from Firebase`);
      console.log(`Retrieved ${checkinsFromFirebase.length} check-ins from Firebase`);

      // Update last sync time
      await AsyncStorage.setItem(this.lastSyncKey, new Date().toISOString());
    } catch (error) {
      console.error('Failed to sync Firebase data to local:', error);
      throw error;
    }
  }


  /**
   * Handle offline queue - sync pending changes when online
   */
  async syncPendingChanges(): Promise<void> {
    try {
      // TODO: Implement offline queue management
      // This would handle cases where data was created/modified while offline
      console.log('Syncing pending changes...');
    } catch (error) {
      console.error('Failed to sync pending changes:', error);
      throw error;
    }
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const lastSyncStr = await AsyncStorage.getItem(this.lastSyncKey);
      const lastSyncTime = lastSyncStr ? new Date(lastSyncStr) : null;

      return {
        isOnline: true, // TODO: Implement actual network status check
        lastSyncTime,
        pendingSessions: 0, // TODO: Count pending sessions
        pendingCheckins: 0, // TODO: Count pending check-ins
        isSyncing: false,
        error: null,
      };
    } catch (error) {
      return {
        isOnline: false,
        lastSyncTime: null,
        pendingSessions: 0,
        pendingCheckins: 0,
        isSyncing: false,
        error: 'Failed to get sync status',
      };
    }
  }

  /**
   * Force full sync
   */
  async forceSyncAll(): Promise<void> {
    try {
      console.log('Starting force sync...');
      await this.syncLocalDataToFirebase();
      await this.syncFirebaseDataToLocal();
      console.log('Force sync completed');
    } catch (error) {
      console.error('Force sync failed:', error);
      throw error;
    }
  }

  /**
   * Clear all local sync data (for testing/reset)
   */
  async clearSyncData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.lastSyncKey);
      await AsyncStorage.removeItem(this.syncStatusKey);
      console.log('Sync data cleared');
    } catch (error) {
      console.error('Failed to clear sync data:', error);
    }
  }
}

export const firebaseSync = new FirebaseSyncService();