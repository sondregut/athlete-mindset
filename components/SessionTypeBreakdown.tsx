import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Dumbbell, Trophy, Heart, HelpCircle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/session-store';
import { SessionType } from '@/types/session';
import Card from './Card';

interface TypeBreakdownItemProps {
  type: string;
  count: number;
  total: number;
  icon: React.ReactNode;
  color: string;
}

function TypeBreakdownItem({ type, count, total, icon, color }: TypeBreakdownItemProps) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  const barWidth = `${percentage}%` as any;

  return (
    <View style={styles.breakdownItem}>
      <View style={styles.typeHeader}>
        <View style={styles.typeInfo}>
          <View style={[styles.typeIcon, { backgroundColor: `${color}15` }]}>
            {icon}
          </View>
          <Text style={styles.typeName}>{type}</Text>
        </View>
        <Text style={styles.typeCount}>{count}</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View 
          style={[styles.progressBar, { width: barWidth, backgroundColor: color }]} 
        />
      </View>
      <Text style={styles.percentage}>{percentage}%</Text>
    </View>
  );
}

export default function SessionTypeBreakdown() {
  const { getSessionTypeBreakdown, getTotalSessions, isCalculatingAnalytics } = useSessionStore();
  const [breakdown, setBreakdown] = useState<{ [key: string]: number }>({});
  const [totalSessions, setTotalSessions] = useState(0);

  useEffect(() => {
    const loadBreakdown = async () => {
      try {
        const sessionBreakdown = await getSessionTypeBreakdown();
        setBreakdown(sessionBreakdown);
        setTotalSessions(getTotalSessions());
      } catch (error) {
        console.error('Error loading session breakdown:', error);
      }
    };

    loadBreakdown();
  }, []);

  const getTypeIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('training')) {
      return <Dumbbell size={16} color={colors.sessionTypes.training} />;
    } else if (lowerType.includes('competition')) {
      return <Trophy size={16} color={colors.sessionTypes.competition} />;
    } else if (lowerType.includes('recovery')) {
      return <Heart size={16} color={colors.sessionTypes.recovery} />;
    } else {
      return <HelpCircle size={16} color={colors.sessionTypes.other} />;
    }
  };

  const getTypeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('training')) {
      return colors.sessionTypes.training;
    } else if (lowerType.includes('competition')) {
      return colors.sessionTypes.competition;
    } else if (lowerType.includes('recovery')) {
      return colors.sessionTypes.recovery;
    } else {
      return colors.sessionTypes.other;
    }
  };

  const formatTypeName = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Sort by count descending
  const sortedBreakdown = Object.entries(breakdown)
    .sort(([,a], [,b]) => b - a);

  if (isCalculatingAnalytics) {
    return (
      <Card style={styles.container}>
        <Text style={styles.title}>Session Types</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Calculating breakdown...</Text>
        </View>
      </Card>
    );
  }

  if (totalSessions === 0) {
    return (
      <Card style={styles.container}>
        <Text style={styles.title}>Session Types</Text>
        <Text style={styles.emptyText}>
          Start logging sessions to see your training breakdown!
        </Text>
      </Card>
    );
  }

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Session Types</Text>
      <Text style={styles.subtitle}>
        Breakdown of your {totalSessions} logged sessions
      </Text>
      
      <View style={styles.breakdownList}>
        {sortedBreakdown.map(([type, count]) => (
          <TypeBreakdownItem
            key={type}
            type={formatTypeName(type)}
            count={count}
            total={totalSessions}
            icon={getTypeIcon(type)}
            color={getTypeColor(type)}
          />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  breakdownList: {
    gap: 16,
  },
  breakdownItem: {
    marginBottom: 4,
  },
  typeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  typeCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.lightGray,
    borderRadius: 3,
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  percentage: {
    fontSize: 12,
    color: colors.darkGray,
    textAlign: 'right',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: colors.darkGray,
    marginTop: 16,
  },
});