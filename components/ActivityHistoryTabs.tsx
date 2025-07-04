import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar, List, CalendarDays, Heart, Activity } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SessionLog } from '@/types/session';
import { startOfWeek, endOfWeek, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { useMindsetStore, MindsetCheckin } from '@/store/mindset-store';
import SessionLogItem from './SessionLogItem';
import Card from './Card';
import { router } from 'expo-router';
import { format } from 'date-fns';

type ViewMode = 'all' | 'week' | 'month';
type ViewType = 'sessions' | 'checkins';

interface ActivityHistoryTabsProps {
  sessions: SessionLog[];
  defaultView?: string;
}

export default function ActivityHistoryTabs({ sessions, defaultView }: ActivityHistoryTabsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [viewType, setViewType] = useState<ViewType>(defaultView === 'checkins' ? 'checkins' : 'sessions');
  const { checkins } = useMindsetStore();
  const colors = useThemeColors();

  const getWeeklySessions = () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    
    return sessions.filter(session => {
      const sessionDate = new Date(session.createdAt);
      return isWithinInterval(sessionDate, { start: weekStart, end: weekEnd });
    });
  };

  const getMonthlySessions = () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    return sessions.filter(session => {
      const sessionDate = new Date(session.createdAt);
      return isWithinInterval(sessionDate, { start: monthStart, end: monthEnd });
    });
  };


  const getFilteredSessions = () => {
    switch (viewMode) {
      case 'week':
        return getWeeklySessions();
      case 'month':
        return getMonthlySessions();
      default:
        return sessions;
    }
  };

  const getFilteredCheckins = () => {
    switch (viewMode) {
      case 'week':
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
        return checkins.filter(checkin => {
          const checkinDate = new Date(checkin.date);
          return isWithinInterval(checkinDate, { start: weekStart, end: weekEnd });
        });
      case 'month':
        const monthStart = startOfMonth(new Date());
        const monthEnd = endOfMonth(new Date());
        return checkins.filter(checkin => {
          const checkinDate = new Date(checkin.date);
          return isWithinInterval(checkinDate, { start: monthStart, end: monthEnd });
        });
      default:
        return checkins;
    }
  };

  const renderCheckinItem = (checkin: MindsetCheckin) => {
    const date = new Date(checkin.date);
    
    const handlePress = () => {
      router.push(`/checkin-detail?checkinId=${checkin.id}`);
    };
    
    return (
      <TouchableOpacity key={checkin.id} onPress={handlePress} activeOpacity={0.7} style={styles.checkinItem}>
        <Card style={styles.checkinCard}>
          <View style={styles.checkinHeader}>
          <View style={styles.checkinDate}>
            <Text style={styles.checkinDateText}>{format(date, 'EEE')}</Text>
            <Text style={styles.checkinDateNumber}>{format(date, 'd')}</Text>
          </View>
          <View style={styles.checkinContent}>
            <Text style={styles.checkinTitle}>Daily Check-in</Text>
            <View style={styles.checkinStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Mood</Text>
                <Text style={styles.statValue}>{checkin.mood}/10</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Energy</Text>
                <Text style={styles.statValue}>{checkin.energy}/10</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Motivation</Text>
                <Text style={styles.statValue}>{checkin.motivation}/10</Text>
              </View>
            </View>
            {checkin.selfDescription && (
              <Text style={styles.description} numberOfLines={2}>
                "{checkin.selfDescription}"
              </Text>
            )}
          </View>
        </View>
      </Card>
      </TouchableOpacity>
    );
  };

  const tabs: Array<{ mode: ViewMode; label: string; icon: React.ReactNode }> = [
    {
      mode: 'all',
      label: 'All',
      icon: <List size={20} color={viewMode === 'all' ? colors.primary : colors.darkGray} />,
    },
    {
      mode: 'week',
      label: 'This Week',
      icon: <CalendarDays size={20} color={viewMode === 'week' ? colors.primary : colors.darkGray} />,
    },
    {
      mode: 'month',
      label: 'This Month',
      icon: <Calendar size={20} color={viewMode === 'month' ? colors.primary : colors.darkGray} />,
    },
  ];

  const viewTypeTabs: Array<{ type: ViewType; label: string; icon: React.ReactNode }> = [
    {
      type: 'sessions',
      label: 'Training Sessions',
      icon: <Activity size={20} color={viewType === 'sessions' ? colors.primary : colors.darkGray} />,
    },
    {
      type: 'checkins',
      label: 'Daily Check-ins',
      icon: <Heart size={20} color={viewType === 'checkins' ? colors.primary : colors.darkGray} />,
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
      paddingHorizontal: 16,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      gap: 8,
    },
    activeTab: {
      // Removed underline
    },
    tabLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.darkGray,
    },
    activeTabLabel: {
      color: colors.primary,
      fontWeight: '600',
    },
    toggleContainer: {
      flexDirection: 'row',
      backgroundColor: colors.lightGray,
      borderRadius: 12,
      padding: 4,
      marginHorizontal: 16,
      marginVertical: 12,
    },
    toggleButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 8,
    },
    activeToggle: {
      backgroundColor: colors.background,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    toggleText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.darkGray,
    },
    activeToggleText: {
      color: colors.primary,
      fontWeight: '600',
    },
    contentContainer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    sessionItem: {
      marginBottom: 12,
    },
    checkinItem: {
      marginBottom: 12,
    },
    checkinCard: {
      // Card inherits styles
    },
    checkinHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkinDate: {
      width: 60,
      height: 60,
      borderRadius: 12,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    checkinDateText: {
      fontSize: 12,
      color: colors.background,
      fontWeight: '500',
    },
    checkinDateNumber: {
      fontSize: 20,
      color: colors.background,
      fontWeight: '700',
    },
    checkinContent: {
      flex: 1,
    },
    checkinTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    checkinStats: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    statItem: {
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 12,
      color: colors.darkGray,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    statDivider: {
      width: 1,
      height: 30,
      backgroundColor: colors.lightGray,
      marginHorizontal: 16,
    },
    description: {
      fontSize: 14,
      color: colors.darkGray,
      fontStyle: 'italic',
      marginTop: 4,
    },
    emptyState: {
      padding: 48,
      alignItems: 'center',
      gap: 16,
    },
    emptyText: {
      fontSize: 16,
      color: colors.darkGray,
      textAlign: 'center',
    },
  });

  const filteredSessions = getFilteredSessions();
  const filteredCheckins = getFilteredCheckins();

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {tabs.map(({ mode, label, icon }) => (
            <TouchableOpacity
              key={mode}
              style={[styles.tab, viewMode === mode && styles.activeTab]}
              onPress={() => setViewMode(mode)}
              activeOpacity={0.7}
            >
              {icon}
              <Text style={[styles.tabLabel, viewMode === mode && styles.activeTabLabel]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Toggle Tabs */}
        <View style={styles.toggleContainer}>
          {viewTypeTabs.map(({ type, label, icon }) => (
            <TouchableOpacity
              key={type}
              style={[styles.toggleButton, viewType === type && styles.activeToggle]}
              onPress={() => setViewType(type)}
              activeOpacity={0.7}
            >
              {icon}
              <Text style={[styles.toggleText, viewType === type && styles.activeToggleText]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {viewType === 'sessions' ? (
            filteredSessions.length > 0 ? (
              filteredSessions.map((session) => (
                <View key={session.id} style={styles.sessionItem}>
                  <SessionLogItem 
                    log={session} 
                    onPress={() => router.push(`/session-detail?sessionId=${session.id}`)}
                  />
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Activity size={48} color={colors.darkGray} />
                <Text style={styles.emptyText}>No training sessions logged</Text>
              </View>
            )
          ) : (
            filteredCheckins.length > 0 ? (
              filteredCheckins.map((checkin) => renderCheckinItem(checkin))
            ) : (
              <View style={styles.emptyState}>
                <Heart size={48} color={colors.darkGray} />
                <Text style={styles.emptyText}>No daily check-ins recorded</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}