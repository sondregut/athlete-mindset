import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, List, CalendarDays } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SessionLog } from '@/types/session';
import SwipeableActivityView from './SwipeableActivityView';
import WeekCalendarView from './WeekCalendarView';
import { startOfWeek, endOfWeek, isWithinInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { useMindsetStore } from '@/store/mindset-store';

type ViewMode = 'all' | 'week' | 'month';

interface ActivityHistoryTabsProps {
  sessions: SessionLog[];
  defaultView?: string;
}

export default function ActivityHistoryTabs({ sessions, defaultView }: ActivityHistoryTabsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
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
    let filtered = sessions;
    
    // Filter by selected date if any
    if (selectedDate) {
      filtered = filtered.filter(session => 
        isSameDay(new Date(session.createdAt), selectedDate)
      );
    }
    
    // Then filter by view mode
    switch (viewMode) {
      case 'week':
        return getWeeklySessions().filter(session => 
          !selectedDate || isSameDay(new Date(session.createdAt), selectedDate)
        );
      case 'month':
        return getMonthlySessions().filter(session => 
          !selectedDate || isSameDay(new Date(session.createdAt), selectedDate)
        );
      default:
        return filtered;
    }
  };

  const getFilteredCheckins = () => {
    let filtered = checkins;
    
    // Filter by selected date if any
    if (selectedDate) {
      filtered = filtered.filter(checkin => 
        isSameDay(new Date(checkin.date), selectedDate)
      );
    }
    
    // Then filter by view mode
    switch (viewMode) {
      case 'week':
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
        return filtered.filter(checkin => {
          const checkinDate = new Date(checkin.date);
          return isWithinInterval(checkinDate, { start: weekStart, end: weekEnd });
        });
      case 'month':
        const monthStart = startOfMonth(new Date());
        const monthEnd = endOfMonth(new Date());
        return filtered.filter(checkin => {
          const checkinDate = new Date(checkin.date);
          return isWithinInterval(checkinDate, { start: monthStart, end: monthEnd });
        });
      default:
        return filtered;
    }
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
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
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
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
  });

  return (
    <View style={styles.container}>
      {/* Week Calendar */}
      <WeekCalendarView 
        sessions={sessions}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />
      
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

      {/* Content */}
      <SwipeableActivityView 
        sessions={getFilteredSessions()}
        checkins={getFilteredCheckins()}
        initialViewType={defaultView === 'checkins' ? 'checkins' : 'sessions'}
      />
    </View>
  );
}