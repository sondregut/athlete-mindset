import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { X, Camera } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useUserStore, sportOptions, experienceLevelOptions, ageRangeOptions, SportType, ExperienceLevel, AgeRange } from '@/store/user-store';
import Button from './Button';
import Card from './Card';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
  const colors = useThemeColors();
  const { profile, updateProfile, isUpdatingProfile } = useUserStore();
  
  const [name, setName] = useState(profile.name);
  const [sport, setSport] = useState<SportType>(profile.sport || 'track-and-field');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(profile.experienceLevel || 'intermediate');
  const [ageRange, setAgeRange] = useState<AgeRange>(profile.ageRange || '18-24');
  const [goals, setGoals] = useState(profile.goals || '');

  const handleSave = async () => {
    await updateProfile({
      name: name.trim(),
      sport,
      experienceLevel,
      ageRange,
      goals: goals.trim(),
    });
    onClose();
  };

  const renderSelector = <T extends string>(
    title: string,
    options: Array<{ value: T; label: string }>,
    value: T,
    onChange: (value: T) => void
  ) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              value === option.value && styles.selectedOption
            ]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[
              styles.optionText,
              value === option.value && styles.selectedOptionText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.mediumGray,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 32,
    },
    profilePictureSection: {
      alignItems: 'center',
      marginBottom: 32,
    },
    profilePicture: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.mediumGray,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    changePictureButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.lightGray,
      borderRadius: 8,
      gap: 8,
    },
    changePictureText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.primary,
    },
    sectionContainer: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    input: {
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.mediumGray,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    optionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    optionButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.mediumGray,
    },
    selectedOption: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    optionText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    selectedOptionText: {
      color: colors.background,
    },
    saveButton: {
      marginTop: 32,
      marginBottom: 16,
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.darkGray} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.contentContainer}>
          {/* Profile Picture */}
          <View style={styles.profilePictureSection}>
            <View style={styles.profilePicture}>
              <Camera size={48} color={colors.darkGray} />
            </View>
            <TouchableOpacity style={styles.changePictureButton}>
              <Camera size={16} color={colors.primary} />
              <Text style={styles.changePictureText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Name */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={colors.darkGray}
            />
          </View>

          {/* Sport */}
          {renderSelector('Primary Sport', sportOptions, sport, setSport)}

          {/* Experience Level */}
          {renderSelector('Experience Level', experienceLevelOptions, experienceLevel, setExperienceLevel)}

          {/* Age Range */}
          {renderSelector('Age Range', ageRangeOptions, ageRange, setAgeRange)}

          {/* Goals */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Goals</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={goals}
              onChangeText={setGoals}
              placeholder="What are your athletic goals?"
              placeholderTextColor={colors.darkGray}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Save Button */}
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={isUpdatingProfile}
            style={styles.saveButton}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}