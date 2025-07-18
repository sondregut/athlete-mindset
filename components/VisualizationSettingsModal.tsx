import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Switch, ScrollView } from 'react-native';
import { X, Volume2, VolumeX, Check } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { usePersonalizationStore } from '@/store/personalization-store';
import { ELEVENLABS_VOICES } from '@/config/elevenlabs-config';

interface VisualizationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  selectedVoice?: string;
  onVoiceChange: (voiceId: string) => void;
  audioEnabled: boolean;
  onAudioToggle: (enabled: boolean) => void;
}

const voices = [
  { id: ELEVENLABS_VOICES.christina, name: 'Christina', description: 'Calming yoga instructor' },
  { id: ELEVENLABS_VOICES.mark, name: 'Mark', description: 'Conversational AI' },
  { id: ELEVENLABS_VOICES.benjamin, name: 'Benjamin', description: 'Deep, warm, calming' },
];

export default function VisualizationSettingsModal({ 
  visible, 
  onClose, 
  selectedVoice = ELEVENLABS_VOICES.christina,
  onVoiceChange,
  audioEnabled,
  onAudioToggle
}: VisualizationSettingsModalProps) {
  const { preferences, updatePreferences } = usePersonalizationStore();

  const handleVoiceSelect = (voiceId: string) => {
    onVoiceChange(voiceId);
  };

  const toggleAI = (enabled: boolean) => {
    updatePreferences({ useAIPersonalization: enabled });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Visualization Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Audio Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Audio</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Enable Audio</Text>
                <Text style={styles.settingDescription}>
                  Turn on/off audio narration for visualizations
                </Text>
              </View>
              <Switch
                value={audioEnabled}
                onValueChange={onAudioToggle}
                trackColor={{ false: colors.mediumGray, true: colors.primary }}
                thumbColor={colors.background}
              />
            </View>
          </View>

          {/* Voice Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Voice</Text>
            <Text style={styles.sectionDescription}>
              Choose the voice for your visualization narration
            </Text>
            
            <View style={styles.voicesContainer}>
              {voices.map((voice) => (
                <TouchableOpacity
                  key={voice.id}
                  style={[
                    styles.voiceCard,
                    selectedVoice === voice.id && styles.voiceCardSelected,
                  ]}
                  onPress={() => handleVoiceSelect(voice.id)}
                >
                  <View style={styles.voiceInfo}>
                    <Text style={[
                      styles.voiceName,
                      selectedVoice === voice.id && styles.voiceNameSelected
                    ]}>
                      {voice.name}
                    </Text>
                    <Text style={styles.voiceDescription}>
                      {voice.description}
                    </Text>
                  </View>
                  
                  {selectedVoice === voice.id && (
                    <View style={styles.checkCircle}>
                      <Check size={16} color={colors.background} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Personalization Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personalization</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>AI Personalization</Text>
                <Text style={styles.settingDescription}>
                  Customize visualizations for your specific sport
                </Text>
              </View>
              <Switch
                value={preferences.useAIPersonalization}
                onValueChange={toggleAI}
                trackColor={{ false: colors.mediumGray, true: colors.primary }}
                thumbColor={colors.background}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.darkGray,
  },
  voicesContainer: {
    gap: 12,
  },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  voiceCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}05`,
  },
  voiceInfo: {
    flex: 1,
  },
  voiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  voiceNameSelected: {
    color: colors.primary,
  },
  voiceDescription: {
    fontSize: 14,
    color: colors.darkGray,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});