import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { CheckCircle, X, Calendar, Heart, Zap, Target } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useMindsetStore, mindsetTags } from '@/store/mindset-store';
import Card from './Card';
import Button from './Button';

interface DailyMindsetCheckinProps {
  compact?: boolean;
}

export default function DailyMindsetCheckin({ compact = false }: DailyMindsetCheckinProps) {
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
  const [gratitude, setGratitude] = useState('');
  const [reflection, setReflection] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [gratitudeY, setGratitudeY] = useState(0);
  const [reflectionY, setReflectionY] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);

  const todaysCheckin = getTodaysCheckin();
  const streak = getCheckinStreak();

  // Initialize form with today's data if it exists
  useEffect(() => {
    if (todaysCheckin) {
      setMood(todaysCheckin.mood);
      setEnergy(todaysCheckin.energy);
      setMotivation(todaysCheckin.motivation);
      setGratitude(todaysCheckin.gratitude || '');
      setReflection(todaysCheckin.reflection || '');
      setSelectedTags(todaysCheckin.tags || []);
    }
  }, [todaysCheckin]);

  const handleSubmit = async () => {
    try {
      await submitCheckin({
        mood,
        energy,
        motivation,
        gratitude: gratitude.trim() || undefined,
        reflection: reflection.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });
      setShowModal(false);
    } catch (error) {
      // Error is handled by the store
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const resetForm = () => {
    setMood(7);
    setEnergy(7);
    setMotivation(7);
    setGratitude('');
    setReflection('');
    setSelectedTags([]);
    clearError();
  };

  const handleOpenModal = () => {
    if (!todaysCheckin) {
      resetForm();
    }
    setShowModal(true);
  };

  const scrollToInput = (yPosition: number) => {
    if (scrollViewRef.current && yPosition > 0) {
      scrollViewRef.current.scrollTo({
        y: yPosition - 150, // Offset to ensure input is visible above keyboard
        animated: true,
      });
    }
  };

  // Render the compact view
  const renderCompactView = () => {
    if (todaysCheckin) {
      return (
        <Card style={styles.compactCard}>
          <View style={styles.compactHeader}>
            <CheckCircle size={24} color={colors.success} />
            <View style={styles.compactInfo}>
              <Text style={styles.compactTitle}>Daily Check-in Complete</Text>
              <Text style={styles.compactSubtitle}>
                {streak} day{streak !== 1 ? 's' : ''} streak
              </Text>
            </View>
            <TouchableOpacity onPress={handleOpenModal} style={styles.compactButton}>
              <Text style={styles.compactButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        </Card>
      );
    }

    return (
      <Card style={styles.compactCard}>
        <View style={styles.compactHeader}>
          <Calendar size={24} color={colors.primary} />
          <View style={styles.compactInfo}>
            <Text style={styles.compactTitle}>Daily Mindset Check-in</Text>
            <Text style={styles.compactSubtitle}>How are you feeling today?</Text>
          </View>
          <Button
            title="Start"
            onPress={handleOpenModal}
            style={styles.compactActionButton}
          />
        </View>
      </Card>
    );
  };

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
          keyboardVerticalOffset={0}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Daily Mindset Check-in</Text>
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
            </View>

            {/* Tags */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How would you describe yourself today?</Text>
              <View style={styles.tagsContainer}>
                {mindsetTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tag,
                      selectedTags.includes(tag) && styles.selectedTag
                    ]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[
                      styles.tagText,
                      selectedTags.includes(tag) && styles.selectedTagText
                    ]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Gratitude */}
            <View 
              style={styles.section}
              onLayout={(event) => {
                setGratitudeY(event.nativeEvent.layout.y);
              }}
            >
              <Text style={styles.sectionTitle}>What are you grateful for today?</Text>
              <TextInput
                style={styles.textInput}
                value={gratitude}
                onChangeText={setGratitude}
                onFocus={() => {
                  setTimeout(() => scrollToInput(gratitudeY), 100);
                }}
                placeholder="Something you appreciate today..."
                placeholderTextColor={colors.darkGray}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Reflection */}
            <View 
              style={styles.section}
              onLayout={(event) => {
                setReflectionY(event.nativeEvent.layout.y);
              }}
            >
              <Text style={styles.sectionTitle}>Any thoughts or reflections?</Text>
              <TextInput
                style={styles.textInput}
                value={reflection}
                onChangeText={setReflection}
                onFocus={() => {
                  setTimeout(() => scrollToInput(reflectionY), 100);
                }}
                placeholder="What's on your mind..."
                placeholderTextColor={colors.darkGray}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
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
  compactActionButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
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
    paddingBottom: 20,
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedTag: {
    borderColor: colors.selectedBorder,
    backgroundColor: colors.selectedBackground,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tagText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  selectedTagText: {
    color: colors.primary,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: 8,
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