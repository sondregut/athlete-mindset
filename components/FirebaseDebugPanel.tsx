import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Database, Upload, Download, User, Trash2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { firebaseSync } from '@/services/firebase-sync';
import Card from './Card';
import Button from './Button';

export default function FirebaseDebugPanel() {
  const { user, signOut } = useAuthStore();
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadSyncStatus();
    const interval = setInterval(loadSyncStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await firebaseSync.getSyncStatus();
      setSyncStatus(status);
      setIsOnline(status.isOnline);
    } catch (error) {
      console.error('Failed to get sync status:', error);
      setIsOnline(false);
    }
  };

  const handleForceSync = async () => {
    try {
      await firebaseSync.forceSyncAll();
      loadSyncStatus();
      console.log('Force sync completed');
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  };

  const handleClearSyncData = async () => {
    try {
      await firebaseSync.clearSyncData();
      loadSyncStatus();
      console.log('Sync data cleared');
    } catch (error) {
      console.error('Failed to clear sync data:', error);
    }
  };

  if (!__DEV__) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Database size={20} color={colors.primary} />
          <Text style={styles.title}>Firebase Debug Panel</Text>
        </View>
        <View style={[styles.statusIndicator, isOnline ? styles.online : styles.offline]}>
          <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authentication</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>User ID:</Text>
          <Text style={styles.value}>{user?.uid?.slice(-8) || 'None'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Type:</Text>
          <Text style={styles.value}>{user?.isAnonymous ? 'Anonymous' : 'Registered'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email || 'None'}</Text>
        </View>
      </View>

      {syncStatus && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync Status</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Online:</Text>
            <Text style={styles.value}>{syncStatus.isOnline ? 'Yes' : 'No'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Last Sync:</Text>
            <Text style={styles.value}>
              {syncStatus.lastSyncTime 
                ? new Date(syncStatus.lastSyncTime).toLocaleTimeString()
                : 'Never'
              }
            </Text>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <Button
          title="Force Sync"
          onPress={handleForceSync}
          style={styles.actionButton}
          variant="outline"
        />
        <Button
          title="Clear Sync"
          onPress={handleClearSyncData}
          style={styles.actionButton}
          variant="outline"
        />
        <Button
          title="Sign Out"
          onPress={signOut}
          style={styles.actionButton}
          variant="outline"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary + '30',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: colors.darkGray,
  },
  value: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 80,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  online: {
    backgroundColor: '#22c55e20',
  },
  offline: {
    backgroundColor: '#ef444420',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
});