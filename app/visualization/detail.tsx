import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/Card';
import { useOnboardingStore } from '@/store/onboarding-store';

export default function VisualizationDetailScreen() {
  const { id } = useLocalSearchParams();
  const { selectedVoice } = useOnboardingStore();
  
  // Mock data - in production this would come from your visualization data
  const visualization = {
    id: 'performance-excellence',
    title: 'Performance Excellence Visualization',
    subtitle: 'Mentally rehearse perfect execution for any skill or task',
    duration: 6,
    steps: 8,
    completed: 2,
    avgDuration: 0,
    daysAgo: 0,
    icon: '🧠',
    voiceOptions: ['Alloy', 'Rachel', 'Drew', 'Paul', 'Domi', 'Bella', 'Antoni'],
    steps_preview: [
      "Find a comfortable space and close your eyes. Move your body to release tension, ta...",
      "Create the setting: Place yourself in the environment where you'll be performing th...",
      "Mentally practice yourself performing the task in the exact way you want to. For exam...",
    ]
  };

  const handleStartVisualization = () => {
    router.push({
      pathname: '/visualization/player',
      params: { id: visualization.id }
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: visualization.title,
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: '#FEF3E7' },
          headerTintColor: '#111827',
        }}
      />
      
      <ScrollView style={styles.container}>
        {/* Header with icon */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{visualization.icon}</Text>
          </View>
          <Text style={styles.title}>{visualization.title}</Text>
          <Text style={styles.subtitle}>{visualization.subtitle}</Text>
        </View>

        {/* Progress Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Your Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{visualization.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{visualization.avgDuration}m</Text>
              <Text style={styles.statLabel}>Avg Duration</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{visualization.daysAgo}d</Text>
              <Text style={styles.statLabel}>Days Ago</Text>
            </View>
          </View>
        </Card>

        {/* Overview Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Overview</Text>
          <View style={styles.overviewItem}>
            <Ionicons name="time-outline" size={20} color="#6B7280" />
            <Text style={styles.overviewText}>Duration: {visualization.duration} minutes</Text>
          </View>
          <View style={styles.overviewItem}>
            <Ionicons name="footsteps-outline" size={20} color="#6B7280" />
            <Text style={styles.overviewText}>{visualization.steps} guided steps</Text>
          </View>
        </Card>

        {/* Voice Settings Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Voice Settings</Text>
          <TouchableOpacity style={styles.voiceSelector}>
            <View style={styles.voiceRow}>
              <Ionicons name="mic-outline" size={20} color="#3B82F6" />
              <View style={styles.voiceInfo}>
                <Text style={styles.voiceLabel}>Narration Voice</Text>
                <Text style={styles.voiceValue}>{selectedVoice || 'Alloy'}</Text>
              </View>
            </View>
            <Ionicons name="volume-high-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
        </Card>

        {/* What You'll Experience Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>What You'll Experience</Text>
          {visualization.steps_preview.map((step, index) => (
            <View key={index} style={styles.stepPreview}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
          <Text style={styles.moreSteps}>...and {visualization.steps - 3} more steps</Text>
        </Card>

        {/* Start Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartVisualization}
        >
          <Ionicons name="play" size={24} color="white" style={styles.playIcon} />
          <Text style={styles.startButtonText}>Start Visualization</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF3E7',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFBF5',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  overviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewText: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 12,
  },
  voiceSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceInfo: {
    marginLeft: 12,
  },
  voiceLabel: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  voiceValue: {
    fontSize: 16,
    color: '#3B82F6',
    marginTop: 2,
  },
  stepPreview: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  moreSteps: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  playIcon: {
    marginRight: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
});