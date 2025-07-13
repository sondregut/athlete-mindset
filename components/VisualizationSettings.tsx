import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Switch, Platform, Alert } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useVisualizationStore } from '@/store/visualization-store';
import { X, ChevronDown, Volume2, Zap, Mic, FastForward, Trash2 } from 'lucide-react-native';
import { TTSFirebaseCache, TTSVoice, TTSModel } from '@/services/tts-firebase-cache';
import CustomSlider from './CustomSlider';

interface VisualizationSettingsProps {
  visible: boolean;
  onClose: () => void;
  onVoiceChange?: () => void;
}

const voiceOptions: { value: TTSVoice; label: string; description: string }[] = [
  { value: 'alloy', label: 'Alloy', description: 'Neutral and balanced' },
  { value: 'echo', label: 'Echo', description: 'Warm and engaging' },
  { value: 'fable', label: 'Fable', description: 'Expressive and dynamic' },
  { value: 'onyx', label: 'Onyx', description: 'Deep and authoritative' },
  { value: 'nova', label: 'Nova', description: 'Friendly and conversational' },
  { value: 'shimmer', label: 'Shimmer', description: 'Soft and soothing' },
];

const modelOptions: { value: TTSModel; label: string; description: string }[] = [
  { value: 'tts-1', label: 'Standard', description: 'Fast with good quality' },
  { value: 'tts-1-hd', label: 'HD', description: 'Higher quality, slightly slower' },
];

export default function VisualizationSettings({ visible, onClose, onVoiceChange }: VisualizationSettingsProps) {
  const colors = useThemeColors();
  const { preferences, updatePreferences } = useVisualizationStore();
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);

  const handleSpeedChange = (value: number) => {
    // Convert slider value (0-100) to speed range (0.25-4.0)
    const speed = 0.25 + (value / 100) * 3.75;
    updatePreferences({ ttsSpeed: speed });
  };

  const handleVolumeChange = (value: number) => {
    updatePreferences({ volume: value / 100 });
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Audio Cache',
      'This will remove all cached audio files. They will be regenerated when needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              const ttsService = TTSFirebaseCache.getInstance();
              await ttsService.clearLocalCache();
              Alert.alert('Success', 'Audio cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
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
    sliderContainer: {
      marginTop: 12,
    },
    sliderInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    sliderValue: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    sliderLabel: {
      fontSize: 12,
      color: colors.darkGray,
    },
    divider: {
      height: 1,
      backgroundColor: colors.lightGray,
      marginVertical: 20,
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

  const getSpeedPercentage = () => {
    const speed = preferences.ttsSpeed ?? 1.0;
    return Math.round(((speed - 0.25) / 3.75) * 100);
  };

  const getSpeedLabel = () => {
    const speed = preferences.ttsSpeed ?? 1.0;
    if (speed < 0.75) return 'Slow';
    if (speed < 1.25) return 'Normal';
    if (speed < 2.0) return 'Fast';
    return 'Very Fast';
  };

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
                <Text style={styles.sectionTitle}>Text-to-Speech</Text>
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
                              (preferences.ttsVoice ?? 'nova') === voice.value && styles.optionSelected,
                            ]}
                            onPress={() => {
                              const previousVoice = preferences.ttsVoice ?? 'nova';
                              updatePreferences({ ttsVoice: voice.value });
                              setShowVoiceSelector(false);
                              
                              // Call voice change callback if voice actually changed
                              if (previousVoice !== voice.value && onVoiceChange) {
                                onVoiceChange();
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

                  <View style={styles.setting}>
                    <Text style={styles.settingLabel}>Quality</Text>
                    <TouchableOpacity 
                      style={styles.selector}
                      onPress={() => setShowModelSelector(!showModelSelector)}
                    >
                      <Text style={styles.selectorText}>
                        {modelOptions.find(m => m.value === (preferences.ttsModel ?? 'tts-1'))?.label}
                      </Text>
                      <ChevronDown size={16} color={colors.darkGray} />
                    </TouchableOpacity>
                    
                    {showModelSelector && (
                      <View style={styles.optionsList}>
                        {modelOptions.map((model, index) => (
                          <TouchableOpacity
                            key={model.value}
                            style={[
                              styles.option,
                              index === modelOptions.length - 1 && styles.optionLast,
                              (preferences.ttsModel ?? 'tts-1') === model.value && styles.optionSelected,
                            ]}
                            onPress={() => {
                              updatePreferences({ ttsModel: model.value });
                              setShowModelSelector(false);
                            }}
                          >
                            <Text style={styles.optionLabel}>{model.label}</Text>
                            <Text style={styles.optionDescription}>{model.description}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={styles.setting}>
                    <Text style={styles.settingLabel}>Playback Speed</Text>
                    <View style={styles.sliderContainer}>
                      <CustomSlider
                        value={getSpeedPercentage()}
                        onValueChange={handleSpeedChange}
                        minimumValue={0}
                        maximumValue={100}
                        step={5}
                      />
                      <View style={styles.sliderInfo}>
                        <Text style={styles.sliderLabel}>{getSpeedLabel()}</Text>
                        <Text style={styles.sliderValue}>{(preferences.ttsSpeed ?? 1.0).toFixed(2)}x</Text>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>

            <View style={styles.divider} />

            {/* Playback Settings */}
            <View style={styles.section}>
              <View style={styles.sectionTitle}>
                <Volume2 size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Playback</Text>
              </View>

              <View style={styles.setting}>
                <Text style={styles.settingLabel}>Volume</Text>
                <View style={styles.sliderContainer}>
                  <CustomSlider
                    value={preferences.volume * 100}
                    onValueChange={handleVolumeChange}
                    minimumValue={0}
                    maximumValue={100}
                    step={5}
                  />
                  <View style={styles.sliderInfo}>
                    <Text style={styles.sliderLabel}>Audio Volume</Text>
                    <Text style={styles.sliderValue}>{Math.round(preferences.volume * 100)}%</Text>
                  </View>
                </View>
              </View>

              <View style={styles.setting}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Auto-advance Steps</Text>
                  <Switch
                    value={preferences.autoProgress ?? false}
                    onValueChange={(value) => updatePreferences({ autoProgress: value })}
                    trackColor={{ false: colors.lightGray, true: colors.primary }}
                    thumbColor={colors.background}
                  />
                </View>
                <Text style={styles.settingDescription}>
                  Automatically move to next step when audio finishes
                </Text>
              </View>

              <View style={styles.setting}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Preload Next Audio</Text>
                  <Switch
                    value={preferences.preloadNext ?? false}
                    onValueChange={(value) => updatePreferences({ preloadNext: value })}
                    trackColor={{ false: colors.lightGray, true: colors.primary }}
                    thumbColor={colors.background}
                  />
                </View>
                <Text style={styles.settingDescription}>
                  Load next step's audio in advance for smoother playback
                </Text>
              </View>
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