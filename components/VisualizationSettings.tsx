import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Switch, Platform, Alert } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useVisualizationStore } from '@/store/visualization-store';
import { X, ChevronDown, Mic, Trash2 } from 'lucide-react-native';
import { TTSFirebaseCache } from '@/services/tts-firebase-cache';

export type TTSVoice = string; // Voice IDs are strings
import { ELEVENLABS_VOICES } from '@/config/elevenlabs-config';

interface VisualizationSettingsProps {
  visible: boolean;
  onClose: () => void;
  onVoiceChange?: () => void | Promise<void>;
}

const voiceOptions: { value: TTSVoice; label: string; description: string }[] = [
  { value: ELEVENLABS_VOICES.rachel, label: 'Rachel', description: 'Calm and conversational' },
  { value: ELEVENLABS_VOICES.drew, label: 'Drew', description: 'Deep and confident' },
  { value: ELEVENLABS_VOICES.paul, label: 'Paul', description: 'News presenter style' },
  { value: ELEVENLABS_VOICES.domi, label: 'Domi', description: 'Strong and confident' },
  { value: ELEVENLABS_VOICES.bella, label: 'Bella', description: 'Soft and young' },
  { value: ELEVENLABS_VOICES.antoni, label: 'Antoni', description: 'Well-rounded voice' },
];


export default function VisualizationSettings({ visible, onClose, onVoiceChange }: VisualizationSettingsProps) {
  const colors = useThemeColors();
  const { preferences, updatePreferences } = useVisualizationStore();
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);

  const handleClearCache = async () => {
    try {
      const ttsService = TTSFirebaseCache.getInstance();
      await ttsService.clearLocalCache();
      Alert.alert(
        'Cache Cleared',
        'Local audio cache has been cleared. Audio will be regenerated as needed.',
        [
          { text: 'OK', style: 'cancel' }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to clear cache. Please try again.',
        [
          { text: 'OK', style: 'cancel' }
        ]
      );
    }
  };

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      padding: 20,
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    setting: {
      marginBottom: 20,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    settingLabel: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    settingDescription: {
      fontSize: 14,
      color: colors.darkGray,
      marginTop: 4,
    },
    selector: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.lightGray,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 8,
    },
    selectorText: {
      fontSize: 14,
      color: colors.text,
    },
    optionsList: {
      marginTop: 12,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      overflow: 'hidden',
    },
    option: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
    },
    optionLast: {
      borderBottomWidth: 0,
    },
    optionSelected: {
      backgroundColor: colors.selectedBackground,
    },
    optionLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    optionDescription: {
      fontSize: 14,
      color: colors.darkGray,
    },
    clearCacheButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardBackground,
      padding: 16,
      borderRadius: 12,
      gap: 8,
      marginTop: 20,
    },
    clearCacheText: {
      fontSize: 16,
      color: colors.error,
      fontWeight: '500',
    },
  });


  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Audio Settings</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.darkGray} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* TTS Settings */}
            <View style={styles.section}>
              <View style={styles.sectionTitle}>
                <Mic size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Audio Settings</Text>
              </View>

              <View style={styles.setting}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Enable Narration</Text>
                  <Switch
                    value={preferences.ttsEnabled ?? true}
                    onValueChange={(value) => updatePreferences({ ttsEnabled: value })}
                    trackColor={{ false: colors.lightGray, true: colors.primary }}
                    thumbColor={colors.background}
                  />
                </View>
                <Text style={styles.settingDescription}>
                  AI-generated voice narration for each step
                </Text>
              </View>

              {(preferences.ttsEnabled ?? true) && (
                <>
                  <View style={styles.setting}>
                    <View style={styles.settingRow}>
                      <Text style={styles.settingLabel}>Auto-play Audio</Text>
                      <Switch
                        value={preferences.autoPlayTTS ?? true}
                        onValueChange={(value) => updatePreferences({ autoPlayTTS: value })}
                        trackColor={{ false: colors.lightGray, true: colors.primary }}
                        thumbColor={colors.background}
                      />
                    </View>
                    <Text style={styles.settingDescription}>
                      Automatically play audio when navigating steps
                    </Text>
                  </View>

                  <View style={styles.setting}>
                    <Text style={styles.settingLabel}>Voice</Text>
                    <TouchableOpacity 
                      style={styles.selector}
                      onPress={() => setShowVoiceSelector(!showVoiceSelector)}
                    >
                      <Text style={styles.selectorText}>
                        {voiceOptions.find(v => v.value === (preferences.ttsVoice ?? 'nova'))?.label}
                      </Text>
                      <ChevronDown size={16} color={colors.darkGray} />
                    </TouchableOpacity>
                    
                    {showVoiceSelector && (
                      <View style={styles.optionsList}>
                        {voiceOptions.map((voice, index) => (
                          <TouchableOpacity
                            key={voice.value}
                            style={[
                              styles.option,
                              index === voiceOptions.length - 1 && styles.optionLast,
                              (preferences.ttsVoice ?? ELEVENLABS_VOICES.rachel) === voice.value && styles.optionSelected,
                            ]}
                            onPress={async () => {
                              const previousVoice = preferences.ttsVoice ?? ELEVENLABS_VOICES.rachel;
                              updatePreferences({ ttsVoice: voice.value });
                              setShowVoiceSelector(false);
                              
                              // Call voice change callback if voice actually changed
                              if (previousVoice !== voice.value && onVoiceChange) {
                                await onVoiceChange();
                              }
                            }}
                          >
                            <Text style={styles.optionLabel}>{voice.label}</Text>
                            <Text style={styles.optionDescription}>{voice.description}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>

            {/* Cache Management */}
            <TouchableOpacity style={styles.clearCacheButton} onPress={handleClearCache}>
              <Trash2 size={20} color={colors.error} />
              <Text style={styles.clearCacheText}>Clear Audio Cache</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}