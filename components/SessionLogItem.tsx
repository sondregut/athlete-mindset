import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { router } from 'expo-router';
import { Clock, Zap, Target, Brain } from 'lucide-react-native';
import { SessionLog } from '@/types/session';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSessionStore } from '@/store/session-store';
import { formatDuration, getRPEColor, getReadinessColor, truncateText } from '@/utils/session-helpers';
import SessionTypeIcon from './SessionTypeIcon';
import Card from './Card';

interface SessionLogItemProps {
  log: SessionLog;
  onPress?: () => void;
  showEditButton?: boolean;
}

export default function SessionLogItem({ log, onPress, showEditButton = true }: SessionLogItemProps) {
  const { setCurrentSessionForEdit } = useSessionStore();
  const colors = useThemeColors();
  
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/session-detail?sessionId=${log.id}`);
    }
  };

  const handleEdit = () => {
    setCurrentSessionForEdit(log.id);
    router.push('/log-session');
  };

  const getRatingStars = (rating: number) => {
    return '⭐'.repeat(rating);
  };

  const getSessionStatusColor = () => {
    if (log.status !== 'completed') return colors.warning;
    return colors.text;
  };

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.lightGray,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerTextContainer: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statusText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    durationText: {
      fontSize: 14,
      color: colors.darkGray,
      fontWeight: '500',
    },
    timeText: {
      fontSize: 12,
      color: colors.darkGray,
      marginTop: 2,
    },
    metricsContainer: {
      flexDirection: 'row',
      marginTop: 8,
      gap: 12,
    },
    metricItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metricValue: {
      fontSize: 13,
      fontWeight: '600',
    },
    metricLabel: {
      fontSize: 11,
      color: colors.darkGray,
    },
    mindsetCuesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
      gap: 6,
    },
    mindsetCue: {
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    mindsetCueText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    bottomSection: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.lightGray,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    ratingText: {
      fontSize: 14,
      color: colors.darkGray,
    },
    positivePreview: {
      fontSize: 12,
      color: colors.darkGray,
      fontStyle: 'italic',
      flex: 1,
      marginRight: 8,
    },
  });

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <SessionTypeIcon type={log.sessionType} size={20} />
          </View>
          <View style={styles.headerTextContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.statusText, { color: getSessionStatusColor() }]}>
                {log.activity || log.sessionType.charAt(0).toUpperCase() + log.sessionType.slice(1)}
                {log.status !== 'completed' && ' (In Progress)'}
              </Text>
              {log.duration && (
                <Text style={styles.durationText}>
                  <Clock size={12} color={colors.darkGray} /> {formatDuration(log.duration)}
                </Text>
              )}
            </View>
            <Text style={styles.timeText}>{formatTime(log.createdAt)}</Text>
          </View>
        </View>
        
        {/* Metrics Row */}
        {log.status === 'completed' && (log.rpe || log.readinessRating) && (
          <View style={styles.metricsContainer}>
            {log.readinessRating && (
              <View style={styles.metricItem}>
                <Target size={14} color={getReadinessColor(log.readinessRating)} />
                <Text style={[styles.metricValue, { color: getReadinessColor(log.readinessRating) }]}>
                  {log.readinessRating}/10
                </Text>
                <Text style={styles.metricLabel}>ready</Text>
              </View>
            )}
            {log.rpe && (
              <View style={styles.metricItem}>
                <Zap size={14} color={getRPEColor(log.rpe)} />
                <Text style={[styles.metricValue, { color: getRPEColor(log.rpe) }]}>
                  {log.rpe}/10
                </Text>
                <Text style={styles.metricLabel}>RPE</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Mindset Cues */}
        {log.mindsetCues && log.mindsetCues.length > 0 && (
          <View style={styles.mindsetCuesContainer}>
            <Brain size={12} color={colors.primary} />
            {log.mindsetCues.slice(0, 3).map((cue, index) => (
              <View key={index} style={styles.mindsetCue}>
                <Text style={styles.mindsetCueText}>{cue}</Text>
              </View>
            ))}
            {log.mindsetCues.length > 3 && (
              <View style={styles.mindsetCue}>
                <Text style={styles.mindsetCueText}>+{log.mindsetCues.length - 3}</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Bottom Section */}
        {log.status === 'completed' && (
          <View style={styles.bottomSection}>
            {/* First Positive Preview */}
            {log.positives && log.positives[0] && (
              <Text style={styles.positivePreview} numberOfLines={1}>
                "{truncateText(log.positives[0], 40)}"
              </Text>
            )}
            
            {/* Session Rating */}
            {log.sessionRating && (
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingText}>{getRatingStars(log.sessionRating)}</Text>
              </View>
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}