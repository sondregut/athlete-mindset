import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { Heart, Zap, Target, Calendar, MessageSquare, Sparkles } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useMindsetStore } from '@/store/mindset-store';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function MindsetDetailScreen() {
  const params = useLocalSearchParams();
  const checkinId = params.checkinId as string;
  const { getCheckinById, deleteCheckin } = useMindsetStore();
  
  const checkin = getCheckinById(checkinId);
  
  if (!checkin) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Check-in Not Found" }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Check-in not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const handleDelete = async () => {
    await deleteCheckin(checkin.id);
    router.back();
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
  };

  const getMoodColor = (mood: number) => {
    if (mood >= 8) return '#4CAF50';
    if (mood >= 6) return '#FF9800';
    if (mood >= 4) return '#FF5722';
    return '#9E9E9E';
  };

  const getMoodText = (mood: number) => {
    if (mood >= 9) return 'Excellent';
    if (mood >= 7) return 'Good';
    if (mood >= 5) return 'Moderate';
    if (mood >= 3) return 'Low';
    return 'Very Low';
  };

  const getEnergyText = (energy: number) => {
    if (energy >= 9) return 'Very High';
    if (energy >= 7) return 'High';
    if (energy >= 5) return 'Moderate';
    if (energy >= 3) return 'Low';
    return 'Very Low';
  };

  const getMotivationText = (motivation: number) => {
    if (motivation >= 9) return 'Very High';
    if (motivation >= 7) return 'High';
    if (motivation >= 5) return 'Moderate';
    if (motivation >= 3) return 'Low';
    return 'Very Low';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Stack.Screen 
        options={{ 
          title: "Mindset Check-in",
        }} 
      />
      
      {/* Header Card */}
      <Card style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={[styles.iconContainer, { backgroundColor: getMoodColor(checkin.mood) + '20' }]}>
            <Heart size={32} color={getMoodColor(checkin.mood)} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.dateTitle}>{formatDate(checkin.date)}</Text>
            <Text style={styles.timeText}>
              {formatDistanceToNow(new Date(checkin.createdAt), { addSuffix: true })}
            </Text>
          </View>
        </View>
      </Card>

      {/* Metrics Card */}
      <Card>
        <Text style={styles.sectionTitle}>Mental State Metrics</Text>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <View style={styles.metricHeader}>
              <Heart size={24} color={getMoodColor(checkin.mood)} />
              <Text style={styles.metricLabel}>Mood</Text>
            </View>
            <Text style={styles.metricValue}>{checkin.mood}/10</Text>
            <Text style={[styles.metricStatus, { color: getMoodColor(checkin.mood) }]}>
              {getMoodText(checkin.mood)}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <View style={styles.metricHeader}>
              <Zap size={24} color={colors.primary} />
              <Text style={styles.metricLabel}>Energy</Text>
            </View>
            <Text style={styles.metricValue}>{checkin.energy}/10</Text>
            <Text style={styles.metricStatus}>{getEnergyText(checkin.energy)}</Text>
          </View>

          <View style={styles.metricItem}>
            <View style={styles.metricHeader}>
              <Target size={24} color={colors.secondary} />
              <Text style={styles.metricLabel}>Motivation</Text>
            </View>
            <Text style={styles.metricValue}>{checkin.motivation}/10</Text>
            <Text style={styles.metricStatus}>{getMotivationText(checkin.motivation)}</Text>
          </View>
        </View>
      </Card>

      {/* Tags */}
      {checkin.tags && checkin.tags.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>How I Felt</Text>
          <View style={styles.tagsContainer}>
            {checkin.tags.map((tag, index) => (
              <View key={`${tag}-${index}`} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Gratitude */}
      {checkin.gratitude && (
        <Card>
          <View style={styles.fieldHeader}>
            <Sparkles size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Grateful For</Text>
          </View>
          <Text style={styles.fieldValue}>{checkin.gratitude}</Text>
        </Card>
      )}

      {/* Reflection */}
      {checkin.reflection && (
        <Card>
          <View style={styles.fieldHeader}>
            <MessageSquare size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Reflection</Text>
          </View>
          <Text style={styles.fieldValue}>{checkin.reflection}</Text>
        </Card>
      )}

      {/* Delete Button */}
      <Button
        title="Delete Check-in"
        onPress={handleDelete}
        style={styles.deleteButton}
        variant="outline"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: colors.darkGray,
    marginBottom: 24,
    textAlign: 'center',
  },
  headerCard: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: colors.darkGray,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: colors.darkGray,
    marginTop: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  metricStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '500',
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  fieldValue: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  deleteButton: {
    marginTop: 16,
    borderColor: colors.error,
  },
});