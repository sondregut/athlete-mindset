import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { formatDistanceToNow, format } from 'date-fns';
import { router } from 'expo-router';
import { Heart, AlertCircle } from 'lucide-react-native';
import { MindsetCheckin } from '@/store/mindset-store';
import { useThemeColors } from '@/hooks/useThemeColors';
import Card from './Card';

interface MindsetCheckinCardProps {
  checkin: MindsetCheckin;
  onPress?: () => void;
}

export default function MindsetCheckinCard({ checkin, onPress }: MindsetCheckinCardProps) {
  const colors = useThemeColors();
  
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      // If it's from today, show time distance
      if (diffInHours < 24 && date.toDateString() === now.toDateString()) {
        return formatDistanceToNow(date, { addSuffix: true });
      }
      // Otherwise show the date
      return format(date, 'MMM d');
    } catch {
      return 'Recently';
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/checkin-detail?checkinId=${checkin.id}`);
    }
  };

  const getAverageScore = () => {
    return ((checkin.mood + checkin.energy + checkin.motivation) / 3).toFixed(1);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return colors.success;
    if (score >= 6) return colors.warning;
    if (score >= 4) return colors.orange;
    return colors.error;
  };

  const avgScore = parseFloat(getAverageScore());

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
      backgroundColor: colors.primary + '15',
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
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    avgScore: {
      fontSize: 16,
      fontWeight: '700',
    },
    timeText: {
      fontSize: 12,
      color: colors.darkGray,
      marginTop: 2,
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 8,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.darkGray,
    },
    statValue: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    descriptionContainer: {
      marginTop: 8,
    },
    description: {
      fontSize: 13,
      color: colors.darkGray,
      fontStyle: 'italic',
      lineHeight: 18,
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
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Heart size={20} color={colors.primary} />
          </View>
          <View style={styles.headerTextContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Daily Check-in</Text>
              <Text style={[styles.avgScore, { color: getScoreColor(avgScore) }]}>
                {getAverageScore()}
              </Text>
            </View>
            <Text style={styles.timeText}>{formatTime(checkin.createdAt || checkin.date)}</Text>
          </View>
        </View>
        
        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Mood:</Text>
            <Text style={styles.statValue}>{checkin.mood}/10</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Energy:</Text>
            <Text style={styles.statValue}>{checkin.energy}/10</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Motivation:</Text>
            <Text style={styles.statValue}>{checkin.motivation}/10</Text>
          </View>
        </View>
        
        {/* Self Description */}
        {checkin.selfDescription && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.description} numberOfLines={2}>
              "{checkin.selfDescription}"
            </Text>
          </View>
        )}
        
        {/* Pain Indicator */}
        {checkin.bodyPainAreas && checkin.bodyPainAreas.length > 0 && (
          <View style={styles.painIndicator}>
            <AlertCircle size={14} color={colors.warning} />
            <Text style={styles.painText}>
              {checkin.bodyPainAreas.length} pain area{checkin.bodyPainAreas.length > 1 ? 's' : ''} • {checkin.overallPainLevel || 'minor'}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}