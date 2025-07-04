import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { CheckCircle, X, Calendar, Heart, Zap, Target } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useMindsetStore } from '@/store/mindset-store';
import Card from './Card';
import Button from './Button';

interface DailyMindsetCheckinProps {
  compact?: boolean;
}

export default function DailyMindsetCheckin({ compact = false }: DailyMindsetCheckinProps) {
  const colors = useThemeColors();
  const { 
    getTodaysCheckin, 
    submitCheckin, 
    isSubmittingCheckin, 
    error, 
    clearError,
    getCheckinStreak 
  } = useMindsetStore();

  const [showModal, setShowModal] = useState(false);
  const [mood, setMood] = useState(7);
  const [energy, setEnergy] = useState(7);
  const [motivation, setMotivation] = useState(7);
  const [selfDescription, setSelfDescription] = useState('');
  const [descriptionY, setDescriptionY] = useState(0);
  const [isNewCheckin, setIsNewCheckin] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const todaysCheckin = getTodaysCheckin();
  const streak = getCheckinStreak();

  // Initialize form with today's data if it exists
  useEffect(() => {
    if (todaysCheckin) {
      setMood(todaysCheckin.mood);
      setEnergy(todaysCheckin.energy);
      setMotivation(todaysCheckin.motivation);
      setSelfDescription(todaysCheckin.selfDescription || '');
    }
  }, [todaysCheckin]);

  const handleSubmit = async () => {
    try {
      await submitCheckin({
        mood,
        energy,
        motivation,
        selfDescription: selfDescription.trim() || undefined,
      });
      setShowModal(false);
    } catch (error) {
      // Error is handled by the store
    }
  };

  const getMoodEmoji = (value: number) => {
    if (value <= 3) return '😞';
    if (value <= 7) return '😐';
    return '😊';
  };

  const resetForm = () => {
    setMood(7);
    setEnergy(7);
    setMotivation(7);
    setSelfDescription('');
    clearError();
  };

  const handleOpenModal = (startFresh = false) => {
    setIsNewCheckin(startFresh);
    if (!todaysCheckin || startFresh) {
      resetForm();
    }
    setShowModal(true);
  };

  const scrollToInput = (yPosition: number) => {
    if (scrollViewRef.current && yPosition > 0) {
      scrollViewRef.current.scrollTo({
        y: yPosition - 100, // Offset to ensure input is visible above keyboard
        animated: true,
      });
    }
  };

  // Render the compact view
  const renderCompactView = () => {
    if (todaysCheckin) {
      return (
        <TouchableOpacity 
          onPress={() => handleOpenModal(true)} 
          activeOpacity={0.7}
        >
          <Card style={styles.compactCard}>
            <View style={styles.compactHeader}>
              <CheckCircle size={24} color={colors.success} />
              <View style={styles.compactInfo}>
                <Text style={styles.compactTitle}>Daily check-in complete</Text>
                <Text style={styles.compactSubtitle}>
                  {streak} day{streak !== 1 ? 's' : ''} streak
                </Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity 
        onPress={() => handleOpenModal()} 
        activeOpacity={0.7}
      >
        <Card style={styles.compactCard}>
          <View style={styles.compactHeader}>
            <Calendar size={24} color={colors.primary} />
            <View style={styles.compactInfo}>
              <Text style={styles.compactTitle}>Log daily check-in</Text>
              <Text style={styles.compactSubtitle}>How are you feeling today?</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
  compactCard: {
    marginHorizontal: 0,
    marginVertical: 8,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  compactSubtitle: {
    fontSize: 14,
    color: colors.darkGray,
  },
  compactButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
  },
  compactButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContentContainer: {
    paddingBottom: 120, // Extra padding to ensure submit button is visible above keyboard
  },
  errorContainer: {
    backgroundColor: colors.error,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    color: colors.background,
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 12,
    marginTop: -8,
  },
  emojiIndicator: {
    fontSize: 24,
    marginLeft: 'auto',
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 16,
  },
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  scaleButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedScaleButton: {
    borderColor: colors.selectedBorder,
    backgroundColor: colors.selectedBackground,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  scaleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  selectedScaleButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  scaleLabelLeft: {
    fontSize: 20,
  },
  scaleLabelCenter: {
    fontSize: 20,
  },
  scaleLabelRight: {
    fontSize: 20,
  },
  scaleTextLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  scaleTextLabelLeft: {
    fontSize: 12,
    color: colors.darkGray,
    fontWeight: '500',
  },
  scaleTextLabelRight: {
    fontSize: 12,
    color: colors.darkGray,
    fontWeight: '500',
  },
  textInputContainer: {
    position: 'relative',
    marginTop: 8,
  },
  textInput: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 16,
    paddingBottom: 28,
    fontSize: 16,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 12,
    color: colors.darkGray,
  },
  modalActions: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.mediumGray,
  },
  submitButton: {
    marginBottom: 0,
  },
});

  // Always render both the view and the modal
  return (
    <>
      {compact && renderCompactView()}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isNewCheckin && todaysCheckin ? 'Replace Today\'s Check-in' : 'Daily Mindset Check-in'}
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <X size={24} color={colors.darkGray} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.modalContent} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Mood Rating */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Heart size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Mood</Text>
                <Text style={styles.emojiIndicator}>{getMoodEmoji(mood)}</Text>
              </View>
              <Text style={styles.sectionDescription}>How are you feeling overall?</Text>
              <View style={styles.scaleContainer}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.scaleButton,
                      mood === value && styles.selectedScaleButton
                    ]}
                    onPress={() => setMood(value)}
                  >
                    <Text style={[
                      styles.scaleButtonText,
                      mood === value && styles.selectedScaleButtonText
                    ]}>
                      {value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.scaleLabels}>
                <Text style={styles.scaleLabelLeft}>😞</Text>
                <Text style={styles.scaleLabelCenter}>😐</Text>
                <Text style={styles.scaleLabelRight}>😊</Text>
              </View>
            </View>

            {/* Energy Rating */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Zap size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Energy</Text>
              </View>
              <Text style={styles.sectionDescription}>How energized do you feel?</Text>
              <View style={styles.scaleContainer}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.scaleButton,
                      energy === value && styles.selectedScaleButton
                    ]}
                    onPress={() => setEnergy(value)}
                  >
                    <Text style={[
                      styles.scaleButtonText,
                      energy === value && styles.selectedScaleButtonText
                    ]}>
                      {value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.scaleTextLabels}>
                <Text style={styles.scaleTextLabelLeft}>Drained</Text>
                <Text style={styles.scaleTextLabelRight}>Energized</Text>
              </View>
            </View>

            {/* Motivation Rating */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Target size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Motivation</Text>
              </View>
              <Text style={styles.sectionDescription}>How motivated are you for training?</Text>
              <View style={styles.scaleContainer}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.scaleButton,
                      motivation === value && styles.selectedScaleButton
                    ]}
                    onPress={() => setMotivation(value)}
                  >
                    <Text style={[
                      styles.scaleButtonText,
                      motivation === value && styles.selectedScaleButtonText
                    ]}>
                      {value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.scaleTextLabels}>
                <Text style={styles.scaleTextLabelLeft}>Not feeling it</Text>
                <Text style={styles.scaleTextLabelRight}>Ready to crush it</Text>
              </View>
            </View>

            {/* Self Description */}
            <View 
              style={styles.section}
              onLayout={(event) => {
                setDescriptionY(event.nativeEvent.layout.y);
              }}
            >
              <Text style={styles.sectionTitle}>Describe yourself today</Text>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={selfDescription}
                  onChangeText={(text) => {
                    if (text.length <= 150) {
                      setSelfDescription(text);
                    }
                  }}
                  onFocus={() => {
                    setTimeout(() => scrollToInput(descriptionY), 100);
                  }}
                  placeholder="How would you describe yourself today?"
                  placeholderTextColor={colors.darkGray}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  maxLength={150}
                />
                <Text style={styles.charCount}>{selfDescription.length}/150</Text>
              </View>
            </View>

          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              title={todaysCheckin ? "Update Check-in" : "Complete Check-in"}
              onPress={handleSubmit}
              loading={isSubmittingCheckin}
              style={styles.submitButton}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}