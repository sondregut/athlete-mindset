import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import { X, Calendar, Activity, Clock, TrendingUp } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/session-store';
import { SessionLog } from '@/types/session';
import SessionLogItem from './SessionLogItem';
import { router } from 'expo-router';

interface SessionHistoryModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function SessionHistoryModal({ isVisible, onClose }: SessionHistoryModalProps) {
  const { logs, getTotalSessions, getWeeklyLogs } = useSessionStore();

  const stats = [
    {
      icon: Activity,
      label: 'Total Sessions',
      value: getTotalSessions().toString(),
    },
    {
      icon: TrendingUp,
      label: 'Avg. RPE',
      value: logs.length > 0 ? (logs.reduce((acc, s) => acc + (s.rpe || 0), 0) / logs.length).toFixed(1) : '0.0',
    },
    {
      icon: Calendar,
      label: 'This Week',
      value: getWeeklyLogs().toString(),
    },
    {
      icon: Clock,
      label: 'Total Time',
      value: `${Math.floor(logs.reduce((acc: number, s: SessionLog) => acc + (s.duration || 0), 0) / 60)}h`,
    },
  ];

  const handleSessionPress = (session: SessionLog) => {
    onClose();
    router.push({
      pathname: '/session-detail',
      params: { sessionId: session.id },
    });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Session History</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Stats Overview */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <View key={index} style={styles.statCard}>
                  <Icon size={20} color={colors.primary} />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Session List */}
          <FlatList
            data={logs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSessionPress(item)}>
                <SessionLogItem log={item} />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No sessions logged yet</Text>
                <Text style={styles.emptySubtext}>Start tracking your training to see your history</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.background,
    marginTop: 100,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
  },
  statCard: {
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 90,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.darkGray,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
  },
});