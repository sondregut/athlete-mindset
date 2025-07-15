import { 
  collection, 
  onSnapshot, 
  doc, 
  getDoc, 
  updateDoc, 
  increment, 
  serverTimestamp,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { getFirebaseFirestore } from '@/config/firebase';
import { smartLogger } from '@/utils/smart-logger';

/**
 * Safe Firestore Manager - Handles permission errors gracefully
 */
export class SafeFirestoreManager {
  private activeListeners: Map<string, Unsubscribe> = new Map();
  private fallbackCallbacks: Map<string, () => void> = new Map();

  /**
   * Setup safe Firestore listeners with graceful error handling
   */
  setupSafeListeners(userId: string) {
    smartLogger.log('firestore-setup', `🔥 Setting up Firestore listeners for: ${userId}`);
    
    this.cleanupListeners();
    
    // Setup sessions listener
    this.setupSessionsListener(userId);
    
    // Setup checkins listener
    this.setupCheckinsListener(userId);
    
    return () => this.cleanupListeners();
  }

  private setupSessionsListener(userId: string) {
    try {
      const unsubscribe = onSnapshot(
        collection(getFirebaseFirestore(), 'users', userId, 'sessions'),
        (snapshot: QuerySnapshot) => {
          smartLogger.log('sessions-sync', `📊 Sessions synced: ${snapshot.size} documents`);
          this.handleSessionsUpdate(snapshot);
        },
        (error: any) => {
          this.handleSessionsError(error);
        }
      );
      
      this.activeListeners.set('sessions', unsubscribe);
    } catch (error) {
      smartLogger.error('sessions-listener-setup', '⚠️ Failed to setup sessions listener - using local data', error);
      this.handleSessionsError(error);
    }
  }

  private setupCheckinsListener(userId: string) {
    try {
      const unsubscribe = onSnapshot(
        collection(getFirebaseFirestore(), 'users', userId, 'checkins'),
        (snapshot: QuerySnapshot) => {
          smartLogger.log('checkins-sync', `✅ Check-ins synced: ${snapshot.size} documents`);
          this.handleCheckinsUpdate(snapshot);
        },
        (error: any) => {
          this.handleCheckinsError(error);
        }
      );
      
      this.activeListeners.set('checkins', unsubscribe);
    } catch (error) {
      smartLogger.error('checkins-listener-setup', '⚠️ Failed to setup check-ins listener - using local data', error);
      this.handleCheckinsError(error);
    }
  }

  private handleSessionsUpdate(snapshot: QuerySnapshot) {
    // Handle sessions update - implement your logic here
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // You can emit events or call callbacks here
    smartLogger.log('sessions-update', `📊 Updated ${sessions.length} sessions`);
  }

  private handleCheckinsUpdate(snapshot: QuerySnapshot) {
    // Handle check-ins update - implement your logic here
    const checkins = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // You can emit events or call callbacks here
    smartLogger.log('checkins-update', `✅ Updated ${checkins.length} check-ins`);
  }

  private handleSessionsError(error: any) {
    if (error.code === 'permission-denied') {
      smartLogger.warn('sessions-permission', '📱 Using local sessions data (no cloud sync)');
      this.loadLocalSessions();
    } else {
      smartLogger.error('sessions-error', '❌ Sessions listener error:', error);
    }
  }

  private handleCheckinsError(error: any) {
    if (error.code === 'permission-denied') {
      smartLogger.warn('checkins-permission', '📱 Using local check-ins data (no cloud sync)');
      this.loadLocalCheckins();
    } else {
      smartLogger.error('checkins-error', '❌ Check-ins listener error:', error);
    }
  }

  private loadLocalSessions() {
    // Load from AsyncStorage or local state
    const fallback = this.fallbackCallbacks.get('sessions');
    if (fallback) {
      fallback();
    }
  }

  private loadLocalCheckins() {
    // Load from AsyncStorage or local state
    const fallback = this.fallbackCallbacks.get('checkins');
    if (fallback) {
      fallback();
    }
  }

  /**
   * Register fallback callbacks for when Firestore fails
   */
  registerFallback(type: 'sessions' | 'checkins', callback: () => void) {
    this.fallbackCallbacks.set(type, callback);
  }

  /**
   * Safe document update with error handling
   */
  async safeUpdateDoc(docPath: string, data: any): Promise<boolean> {
    try {
      const docRef = doc(getFirebaseFirestore(), docPath);
      await updateDoc(docRef, data);
      return true;
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        smartLogger.warn('doc-update-permission', `⚠️ No permission to update ${docPath} - continuing with local data`);
      } else {
        smartLogger.error('doc-update-error', `❌ Failed to update ${docPath}:`, error);
      }
      return false;
    }
  }

  /**
   * Safe document get with error handling
   */
  async safeGetDoc(docPath: string): Promise<DocumentSnapshot | null> {
    try {
      const docRef = doc(getFirebaseFirestore(), docPath);
      const docSnap = await getDoc(docRef);
      return docSnap;
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        smartLogger.warn('doc-get-permission', `⚠️ No permission to read ${docPath} - using local data`);
      } else {
        smartLogger.error('doc-get-error', `❌ Failed to read ${docPath}:`, error);
      }
      return null;
    }
  }

  /**
   * Safe access stats update for TTS cache
   */
  async safeUpdateAccessStats(cacheKey: string): Promise<void> {
    try {
      const docRef = doc(getFirebaseFirestore(), 'tts-cache', cacheKey);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          accessCount: increment(1),
          lastAccessed: serverTimestamp()
        });
        smartLogger.log('access-stats-update', `✅ TTS: Updated access stats for ${cacheKey}`);
      } else {
        // Document doesn't exist, which is normal for local-only files
        smartLogger.log('access-stats-skip', `ℹ️ TTS: Skipping access stats for local-only file`);
      }
    } catch (error: any) {
      // Silent fail - access stats are not critical
      smartLogger.log('access-stats-error', `⚠️ TTS: Access stats update failed for ${cacheKey} - not critical`);
    }
  }

  /**
   * Cleanup all listeners
   */
  cleanupListeners() {
    this.activeListeners.forEach((unsubscribe, key) => {
      try {
        unsubscribe();
        smartLogger.log('listener-cleanup', `🧹 Cleaned up ${key} listener`);
      } catch (error) {
        smartLogger.error('listener-cleanup-error', `❌ Failed to cleanup ${key} listener:`, error);
      }
    });
    
    this.activeListeners.clear();
    this.fallbackCallbacks.clear();
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      activeListeners: Array.from(this.activeListeners.keys()),
      fallbackCallbacks: Array.from(this.fallbackCallbacks.keys())
    };
  }
}

// Global instance
export const safeFirestore = new SafeFirestoreManager();