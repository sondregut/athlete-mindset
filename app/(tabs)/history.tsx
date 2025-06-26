import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSessionStore } from '@/store/session-store';
import { useThemeColors } from '@/hooks/useThemeColors';
import ActivityHistoryTabs from '@/components/ActivityHistoryTabs';

export default function HistoryScreen() {
  const { logs } = useSessionStore();
  const { defaultView } = useLocalSearchParams<{ defaultView?: string }>();
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    emptyText: {
      fontSize: 16,
      color: colors.darkGray,
      textAlign: 'center',
      lineHeight: 24,
    },
  });

  return (
    <View style={styles.container}>
      {logs.length > 0 ? (
        <ActivityHistoryTabs sessions={logs} defaultView={defaultView} />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No activity logs yet. Start by logging your first session!
          </Text>
        </View>
      )}
    </View>
  );
}