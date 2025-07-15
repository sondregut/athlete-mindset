import { 
  doc, 
  collection, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
  where, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';
import { getFirebaseFirestore } from '@/config/firebase';
import { MindsetCheckin } from '@/store/mindset-store';
import { firebaseAuth } from './firebase-auth';
import { smartLogger } from '@/utils/smart-logger';

export interface FirebaseMindsetCheckin extends Omit<MindsetCheckin, 'id'> {
  id?: string;
  updatedAt: Date;
  syncStatus?: 'synced' | 'pending' | 'error';
}

class FirebaseMindsetService {
  private getCollectionRef(userId: string) {
    return collection(getFirebaseFirestore(), 'users', userId, 'mindsetCheckins');
  }

  /**
   * Submit a mindset check-in to Firestore
   */
  async submitCheckin(checkin: MindsetCheckin): Promise<void> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const checkinData: FirebaseMindsetCheckin = {
        ...checkin,
        updatedAt: new Date(),
        syncStatus: 'synced',
      };

      // Use date as document ID for easy querying
      const checkinRef = doc(this.getCollectionRef(user.uid), checkin.date);
      await setDoc(checkinRef, checkinData);
    } catch (error) {
      console.error('Failed to submit check-in:', error);
      throw new Error('Failed to save check-in to cloud');
    }
  }

  /**
   * Get a specific check-in by date
   */
  async getCheckin(date: string): Promise<MindsetCheckin | null> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const checkinRef = doc(this.getCollectionRef(user.uid), date);
      const docSnap = await getDoc(checkinRef);
      
      if (!docSnap.exists()) return null;

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as MindsetCheckin;
    } catch (error) {
      console.error('Failed to get check-in:', error);
      throw new Error('Failed to load check-in from cloud');
    }
  }

  /**
   * Get all check-ins for the current user
   */
  async getAllCheckins(): Promise<MindsetCheckin[]> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const q = query(
        this.getCollectionRef(user.uid),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as MindsetCheckin[];
    } catch (error) {
      console.error('Failed to get check-ins:', error);
      throw new Error('Failed to load check-ins from cloud');
    }
  }

  /**
   * Delete a check-in from Firestore
   */
  async deleteCheckin(date: string): Promise<void> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const checkinRef = doc(this.getCollectionRef(user.uid), date);
      await deleteDoc(checkinRef);
    } catch (error) {
      console.error('Failed to delete check-in:', error);
      throw new Error('Failed to delete check-in from cloud');
    }
  }

  /**
   * Get check-ins within a date range
   */
  async getCheckinsByDateRange(startDate: string, endDate: string): Promise<MindsetCheckin[]> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const q = query(
        this.getCollectionRef(user.uid),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as MindsetCheckin[];
    } catch (error) {
      console.error('Failed to get check-ins by date range:', error);
      throw new Error('Failed to load check-ins from cloud');
    }
  }

  /**
   * Listen to real-time check-in updates
   */
  onCheckinsChange(callback: (checkins: MindsetCheckin[]) => void): () => void {
    const user = firebaseAuth.getCurrentUser();
    if (!user) {
      callback([]);
      return () => {};
    }

    const q = query(
      this.getCollectionRef(user.uid),
      orderBy('date', 'desc')
    );
    
    return onSnapshot(
      q,
      (snapshot) => {
        const checkins = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as MindsetCheckin[];
        callback(checkins);
      },
      (error) => {
        if (error.code === 'permission-denied') {
          smartLogger.warn('checkin-permission', '📱 Check-in listener: Using local data (no cloud sync)');
        } else {
          smartLogger.error('checkin-listener', '❌ Check-in listener error:', error);
        }
        callback([]);
      }
    );
  }

  /**
   * Batch upload check-ins (for migration)
   */
  async batchUploadCheckins(checkins: MindsetCheckin[]): Promise<void> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const batch = writeBatch(getFirebaseFirestore());
      const collectionRef = this.getCollectionRef(user.uid);

      checkins.forEach(checkin => {
        const checkinData: FirebaseMindsetCheckin = {
          ...checkin,
          updatedAt: new Date(),
          syncStatus: 'synced',
        };
        const checkinRef = doc(collectionRef, checkin.date);
        batch.set(checkinRef, checkinData);
      });

      await batch.commit();
    } catch (error) {
      console.error('Failed to batch upload check-ins:', error);
      throw new Error('Failed to upload check-ins to cloud');
    }
  }

  /**
   * Get recent check-ins for streak calculation
   */
  async getRecentCheckins(days: number): Promise<MindsetCheckin[]> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const q = query(
        this.getCollectionRef(user.uid),
        where('date', '>=', startDate.toISOString().split('T')[0]),
        where('date', '<=', endDate.toISOString().split('T')[0]),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as MindsetCheckin[];
    } catch (error) {
      console.error('Failed to get recent check-ins:', error);
      throw new Error('Failed to load recent check-ins from cloud');
    }
  }
}

export const firebaseMindset = new FirebaseMindsetService();