import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Heart, Activity, AlertCircle } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SessionLog } from '@/types/session';
import { MindsetCheckin } from '@/store/mindset-store';
import SessionLogItem from './SessionLogItem';
import Card from './Card';
import { router } from 'expo-router';
import { format } from 'date-fns';

type ViewType = 'sessions' | 'checkins';

interface SwipeableActivityViewProps {
  sessions: SessionLog[];
  checkins: MindsetCheckin[];
  initialViewType?: ViewType;
}

export default function SwipeableActivityView({ sessions, checkins, initialViewType = 'sessions' }: SwipeableActivityViewProps) {
  const [viewType, setViewType] = useState<ViewType>(initialViewType);
  const colors = useThemeColors();

  const renderCheckinItem = (checkin: MindsetCheckin) => {
    const date = new Date(checkin.date);
    
    const handlePress = () => {
      router.push(`/checkin-detail?checkinId=${checkin.id}`);
    };
    
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
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
            {(checkin.bodyPainAreas && checkin.bodyPainAreas.length > 0) ? (
              <View style={styles.painIndicator}>
                <AlertCircle size={16} color={colors.warning} />
                <Text style={styles.painText}>
                  {checkin.bodyPainAreas.length} pain area{checkin.bodyPainAreas.length > 1 ? 's' : ''} • {checkin.overallPainLevel || 'minor'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Card>
      </TouchableOpacity>
    );
  };

  const tabs: Array<{ type: ViewType; label: string; icon: React.ReactNode }> = [
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
    listContent: {
      padding: 16,
    },
    checkinCard: {
      marginBottom: 12,
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
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 48,
      gap: 16,
    },
    emptyText: {
      fontSize: 16,
      color: colors.darkGray,
      textAlign: 'center',
    },
    painIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 6,
    },
    painText: {
      fontSize: 12,
      color: colors.warning,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.container}>
      {/* Toggle Tabs */}
      <View style={styles.toggleContainer}>
        {tabs.map(({ type, label, icon }) => (
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
      {viewType === 'sessions' ? (
        sessions.length > 0 ? (
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SessionLogItem 
                log={item} 
                onPress={() => router.push(`/session-detail?sessionId=${item.id}`)}
              />
            )}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyState}>
            <Activity size={48} color={colors.darkGray} />
            <Text style={styles.emptyText}>No training sessions logged</Text>
          </View>
        )
      ) : (
        checkins.length > 0 ? (
          <FlatList
            data={checkins}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderCheckinItem(item)}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyState}>
            <Heart size={48} color={colors.darkGray} />
            <Text style={styles.emptyText}>No daily check-ins recorded</Text>
          </View>
        )
      )}
    </View>
  );
}