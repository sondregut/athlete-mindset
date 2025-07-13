import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { X, Volume2, Play, Loader2 } from 'lucide-react-native';
import { TTSVoice } from '@/services/tts-firebase-cache';
import { TTSFirebaseCache } from '@/services/tts-firebase-cache';

interface VoiceSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  currentVoice: TTSVoice;
  onVoiceSelect: (voice: TTSVoice) => void;
}

const voiceOptions: { value: TTSVoice; label: string; description: string; personality: string }[] = [
  { value: 'nova', label: 'Nova', description: 'Friendly and conversational', personality: 'Warm, approachable' },
  { value: 'alloy', label: 'Alloy', description: 'Neutral and balanced', personality: 'Professional, clear' },
  { value: 'echo', label: 'Echo', description: 'Warm and engaging', personality: 'Smooth, confident' },
  { value: 'fable', label: 'Fable', description: 'Expressive and dynamic', personality: 'Energetic, inspiring' },
  { value: 'onyx', label: 'Onyx', description: 'Deep and authoritative', personality: 'Strong, commanding' },
  { value: 'shimmer', label: 'Shimmer', description: 'Soft and soothing', personality: 'Gentle, calming' },
];

const sampleText = "Take a deep breath and feel your confidence growing stronger with each moment.";

export default function VoiceSelectionModal({ 
  visible, 
  onClose, 
  currentVoice, 
  onVoiceSelect 
}: VoiceSelectionModalProps) {
  const colors = useThemeColors();
  const [previewingVoice, setPreviewingVoice] = useState<TTSVoice | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice>(currentVoice);
  
  const ttsService = TTSFirebaseCache.getInstance();

  const handlePreviewVoice = async (voice: TTSVoice) => {
    if (previewingVoice === voice) {
      // Stop preview
      await ttsService.stopCurrentAudio();
      setPreviewingVoice(null);
      return;
    }

    try {
      setPreviewingVoice(voice);
      
      // Stop any currently playing audio
      await ttsService.stopCurrentAudio();
      
      // Generate and play preview
      const audioUri = await ttsService.synthesizeSpeech(sampleText, {
        voice,
        model: 'tts-1',
        speed: 1.0,
      });
      
      await ttsService.playAudio(audioUri, { volume: 0.8 });
      
      // Auto-stop preview after audio finishes
      setTimeout(() => {
        setPreviewingVoice(null);
      }, 5000); // Approximate duration
      
    } catch (error) {
      console.error('Voice preview failed:', error);
      setPreviewingVoice(null);
      Alert.alert('Preview Failed', 'Unable to preview this voice. Please try again.');
    }
  };

  const handleConfirm = () => {
    if (selectedVoice !== currentVoice) {
      onVoiceSelect(selectedVoice);
    }
    onClose();
  };

  const handleCancel = () => {
    setSelectedVoice(currentVoice);
    if (previewingVoice) {
      ttsService.stopCurrentAudio().catch(() => {});
      setPreviewingVoice(null);
    }
    onClose();
  };

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: colors.background,
      borderRadius: 20,
      width: '90%',
      maxHeight: '80%',
      maxWidth: 400,
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
      padding: 16,
    },
    subtitle: {
      fontSize: 14,
      color: colors.darkGray,
      marginBottom: 20,
      textAlign: 'center',
    },
    voiceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      marginBottom: 12,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.lightGray,
    },
    voiceItemSelected: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}10`,
    },
    voiceIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.lightGray,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    voiceIconSelected: {
      backgroundColor: colors.primary,
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
    voiceDescription: {
      fontSize: 14,
      color: colors.darkGray,
      marginBottom: 2,
    },
    voicePersonality: {
      fontSize: 12,
      color: colors.primary,
      fontStyle: 'italic',
    },
    previewButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.lightGray,
      marginLeft: 8,
    },
    previewButtonActive: {
      backgroundColor: colors.primary,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: colors.lightGray,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 8,
    },
    cancelButton: {
      backgroundColor: colors.lightGray,
    },
    confirmButton: {
      backgroundColor: colors.primary,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.darkGray,
    },
    confirmButtonText: {
      color: colors.background,
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.modal}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Voice</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
              <X size={24} color={colors.darkGray} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>
              Choose a voice for your visualization. Tap the play button to preview.
            </Text>

            {voiceOptions.map((voice) => (
              <TouchableOpacity
                key={voice.value}
                style={[
                  styles.voiceItem,
                  selectedVoice === voice.value && styles.voiceItemSelected,
                ]}
                onPress={() => setSelectedVoice(voice.value)}
              >
                <View style={[
                  styles.voiceIcon,
                  selectedVoice === voice.value && styles.voiceIconSelected,
                ]}>
                  <Volume2 
                    size={20} 
                    color={selectedVoice === voice.value ? colors.background : colors.primary} 
                  />
                </View>
                
                <View style={styles.voiceInfo}>
                  <Text style={styles.voiceName}>{voice.label}</Text>
                  <Text style={styles.voiceDescription}>{voice.description}</Text>
                  <Text style={styles.voicePersonality}>{voice.personality}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.previewButton,
                    previewingVoice === voice.value && styles.previewButtonActive,
                  ]}
                  onPress={() => handlePreviewVoice(voice.value)}
                >
                  {previewingVoice === voice.value ? (
                    <Loader2 size={20} color={colors.background} />
                  ) : (
                    <Play size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={[styles.actionButtonText, styles.confirmButtonText]}>
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}