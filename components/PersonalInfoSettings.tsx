import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { User, ChevronDown } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useUserStore, sportOptions, SportType, experienceLevelOptions, ageRangeOptions, ExperienceLevel, AgeRange } from '@/store/user-store';
import Card from './Card';
import Button from './Button';

export default function PersonalInfoSettings() {
  const colors = useThemeColors();
  const { profile, updateProfile, isUpdatingProfile } = useUserStore();
  const [tempName, setTempName] = useState(profile.name);
  const [hasNameChanged, setHasNameChanged] = useState(false);
  const [showSportModal, setShowSportModal] = useState(false);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);

  const handleSaveName = async () => {
    if (tempName.trim() !== profile.name) {
      await updateProfile({ name: tempName.trim() });
      setHasNameChanged(false);
    }
  };

  const handleSelectSport = async (sport: SportType) => {
    setShowSportModal(false);
    if (sport !== profile.sport) {
      await updateProfile({ sport });
    }
  };

  const handleSelectAge = async (ageRange: AgeRange) => {
    setShowAgeModal(false);
    if (ageRange !== profile.ageRange) {
      await updateProfile({ ageRange });
    }
  };

  const handleSelectExperience = async (experienceLevel: ExperienceLevel) => {
    setShowExperienceModal(false);
    if (experienceLevel !== profile.experienceLevel) {
      await updateProfile({ experienceLevel });
    }
  };

  const selectedSport = sportOptions.find(s => s.value === profile.sport);
  const selectedAge = ageRangeOptions.find(a => a.value === profile.ageRange);
  const selectedExperience = experienceLevelOptions.find(e => e.value === profile.experienceLevel);

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    infoCard: {
      padding: 0,
      overflow: 'hidden',
    },
    fieldContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    fieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    fieldLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    fieldValue: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '500',
    },
    placeholderValue: {
      fontSize: 16,
      color: colors.darkGray,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    textInput: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '500',
      textAlign: 'right',
      minWidth: 100,
    },
    selectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    chevron: {
      opacity: 0.5,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 24,
      width: '80%',
      maxHeight: '70%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    modalScrollView: {
      maxHeight: 400,
    },
    optionButton: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.mediumGray,
    },
    selectedOption: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    optionText: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
    },
    selectedOptionText: {
      color: colors.background,
      fontWeight: '600',
    },
    modalCloseButton: {
      marginTop: 16,
      paddingVertical: 12,
      alignItems: 'center',
    },
    modalCloseButtonText: {
      fontSize: 16,
      color: colors.darkGray,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Personal Information</Text>
      
      <Card style={styles.infoCard}>
        {/* Name */}
        <TouchableOpacity style={styles.fieldContainer}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={tempName}
                onChangeText={(text) => {
                  setTempName(text);
                  setHasNameChanged(text.trim() !== profile.name);
                }}
                onBlur={handleSaveName}
                placeholder="Enter name"
                placeholderTextColor={colors.darkGray}
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Sport Selection */}
        <TouchableOpacity 
          style={styles.fieldContainer}
          onPress={() => setShowSportModal(true)}
          disabled={isUpdatingProfile}
        >
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Sport</Text>
            <View style={styles.selectButton}>
              <Text style={selectedSport ? styles.fieldValue : styles.placeholderValue}>
                {selectedSport?.label || 'Select'}
              </Text>
              {isUpdatingProfile ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <ChevronDown size={16} color={colors.darkGray} style={styles.chevron} />
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Age Range */}
        <TouchableOpacity 
          style={styles.fieldContainer}
          onPress={() => setShowAgeModal(true)}
          disabled={isUpdatingProfile}
        >
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Age</Text>
            <View style={styles.selectButton}>
              <Text style={selectedAge ? styles.fieldValue : styles.placeholderValue}>
                {selectedAge?.label || 'Select'}
              </Text>
              <ChevronDown size={16} color={colors.darkGray} style={styles.chevron} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Experience Level */}
        <TouchableOpacity 
          style={[styles.fieldContainer, { borderBottomWidth: 0 }]}
          onPress={() => setShowExperienceModal(true)}
          disabled={isUpdatingProfile}
        >
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Experience</Text>
            <View style={styles.selectButton}>
              <Text style={selectedExperience ? styles.fieldValue : styles.placeholderValue}>
                {selectedExperience?.label || 'Select'}
              </Text>
              <ChevronDown size={16} color={colors.darkGray} style={styles.chevron} />
            </View>
          </View>
        </TouchableOpacity>
      </Card>

      {/* Sport Selection Modal */}
      <Modal
        visible={showSportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Your Primary Sport</Text>
            
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {sportOptions.map((sport) => (
                <TouchableOpacity
                  key={sport.value}
                  style={[
                    styles.optionButton,
                    sport.value === profile.sport && styles.selectedOption
                  ]}
                  onPress={() => handleSelectSport(sport.value)}
                >
                  <Text style={[
                    styles.optionText,
                    sport.value === profile.sport && styles.selectedOptionText
                  ]}>
                    {sport.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSportModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Age Range Modal */}
      <Modal
        visible={showAgeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAgeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Your Age Range</Text>
            
            {ageRangeOptions.map((age) => (
              <TouchableOpacity
                key={age.value}
                style={[
                  styles.optionButton,
                  age.value === profile.ageRange && styles.selectedOption
                ]}
                onPress={() => handleSelectAge(age.value)}
              >
                <Text style={[
                  styles.optionText,
                  age.value === profile.ageRange && styles.selectedOptionText
                ]}>
                  {age.label}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAgeModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Experience Level Modal */}
      <Modal
        visible={showExperienceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowExperienceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Your Experience Level</Text>
            
            {experienceLevelOptions.map((exp) => (
              <TouchableOpacity
                key={exp.value}
                style={[
                  styles.optionButton,
                  exp.value === profile.experienceLevel && styles.selectedOption
                ]}
                onPress={() => handleSelectExperience(exp.value)}
              >
                <Text style={[
                  styles.optionText,
                  exp.value === profile.experienceLevel && styles.selectedOptionText
                ]}>
                  {exp.label}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowExperienceModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}