import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Stack } from 'expo-router';
import { useSessionStore } from '@/store/session-store';
import { colors } from '@/constants/colors';
import SessionLogItem from '@/components/SessionLogItem';

export default function ActivityScreen() {
  const { logs } = useSessionStore();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Activity History" }} />
      
      {logs.length > 0 ? (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SessionLogItem log={item} />}
          contentContainerStyle={styles.listContent}
        />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
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