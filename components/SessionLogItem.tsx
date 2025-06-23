import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { router } from 'expo-router';
import { SessionLog } from '@/types/session';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/session-store';
import SessionTypeIcon from './SessionTypeIcon';
import Card from './Card';

interface SessionLogItemProps {
  log: SessionLog;
  onPress?: () => void;
  showEditButton?: boolean;
}

export default function SessionLogItem({ log, onPress, showEditButton = true }: SessionLogItemProps) {
  const { setCurrentSessionForEdit } = useSessionStore();
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'recently';
    }
  };

  const getStatusText = () => {
    switch (log.status) {
      case 'intention':
        return 'Pre-Training Log';
      case 'active':
        return 'Session In Progress';
      case 'completed':
        return 'Completed Session';
      default:
        return '';
    }
  };

  const getSessionTitle = () => {
    return log.activity || (log.sessionType === 'other' ? log.customSessionType : null) || 
      log.sessionType.charAt(0).toUpperCase() + log.sessionType.slice(1);
  };

  const handleViewDetail = () => {
    router.push(`/session-detail?sessionId=${log.id}`);
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      handleViewDetail();
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <SessionTypeIcon type={log.sessionType} size={20} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
            <Text style={styles.timeText}>{formatTime(log.createdAt)}</Text>
          </View>
        </View>
        
        <Text style={styles.title}>{getSessionTitle()}</Text>
        
        {log.intention && (
          <View style={styles.intentionContainer}>
            <Text style={styles.intentionLabel}>Focus:</Text>
            <Text style={styles.intentionText}>{log.intention}</Text>
          </View>
        )}
        
        {log.status === 'completed' && log.sessionRating && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>
              Rating: {log.sessionRating}/5 • RPE: {log.rpe}/10
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  timeText: {
    fontSize: 12,
    color: colors.darkGray,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.text,
  },
  intentionContainer: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  intentionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkGray,
    marginRight: 4,
  },
  intentionText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  ratingContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  ratingText: {
    fontSize: 14,
    color: colors.darkGray,
  },
});