import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { User, Edit2, ChevronDown } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useUserStore, sportOptions, SportType, experienceLevelOptions, ageRangeOptions } from '@/store/user-store';
import Card from './Card';

export default function ProfileHeader() {
  const colors = useThemeColors();
  const { profile, updateProfile, isUpdatingProfile } = useUserStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.name);
  const [showSportModal, setShowSportModal] = useState(false);

  const handleSaveName = async () => {
    if (tempName.trim() !== profile.name) {
      await updateProfile({ name: tempName.trim() });
    }
    setIsEditingName(false);
  };

  const handleSelectSport = async (sport: SportType) => {
    setShowSportModal(false);
    if (sport !== profile.sport) {
      await updateProfile({ sport });
    }
  };

  const selectedSport = sportOptions.find(s => s.value === profile.sport);
  const displayName = profile.name || 'Athlete';

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      marginBottom: 16,
    },
    avatarContainer: {
      marginRight: 16,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.mediumGray,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoContainer: {
      flex: 1,
    },
    nameSection: {
      marginBottom: 8,
    },
    nameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    name: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginRight: 8,
    },
    editIcon: {
      opacity: 0.6,
    },
    nameEditContainer: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    nameInput: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      paddingVertical: 4,
    },
    sportContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      paddingVertical: 4,
    },
    sportLabel: {
      fontSize: 16,
      color: colors.darkGray,
      marginRight: 8,
    },
    sportValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    profileDetail: {
      fontSize: 14,
      color: colors.darkGray,
      marginBottom: 4,
    },
    joinDate: {
      fontSize: 14,
      color: colors.darkGray,
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
    sportOption: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.mediumGray,
    },
    selectedSportOption: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    sportOptionText: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
    },
    selectedSportOptionText: {
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
    loadingContainer: {
      opacity: 0.6,
    },
    loadingText: {
      opacity: 0.7,
    },
  });

  return (
    <Card style={styles.container}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <User size={40} color={colors.darkGray} />
        </View>
      </View>

      <View style={styles.infoContainer}>
        {/* Name Section */}
        <View style={styles.nameSection}>
          {isEditingName ? (
            <View style={styles.nameEditContainer}>
              <TextInput
                style={styles.nameInput}
                value={tempName}
                onChangeText={setTempName}
                placeholder="Enter your name"
                placeholderTextColor={colors.darkGray}
                autoFocus
                onBlur={handleSaveName}
                onSubmitEditing={handleSaveName}
              />
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.nameContainer}
              onPress={() => {
                setTempName(profile.name);
                setIsEditingName(true);
              }}
            >
              <Text style={styles.name}>{displayName}</Text>
              <Edit2 size={16} color={colors.darkGray} style={styles.editIcon} />
            </TouchableOpacity>
          )}
        </View>

        {/* Sport Selection */}
        <TouchableOpacity 
          style={[styles.sportContainer, isUpdatingProfile && styles.loadingContainer]}
          onPress={isUpdatingProfile ? undefined : () => setShowSportModal(true)}
          disabled={isUpdatingProfile}
        >
          <Text style={styles.sportLabel}>Sport:</Text>
          <Text style={[styles.sportValue, isUpdatingProfile && styles.loadingText]}>
            {selectedSport?.label || 'Select Sport'}
          </Text>
          {isUpdatingProfile ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <ChevronDown size={16} color={colors.darkGray} />
          )}
        </TouchableOpacity>

        {/* Additional Profile Info */}
        {profile.ageRange && (
          <Text style={styles.profileDetail}>
            Age: {ageRangeOptions.find(a => a.value === profile.ageRange)?.label || profile.ageRange}
          </Text>
        )}
        
        {profile.experienceLevel && (
          <Text style={styles.profileDetail}>
            Level: {experienceLevelOptions.find(e => e.value === profile.experienceLevel)?.label || profile.experienceLevel}
          </Text>
        )}
        
        {/* Join Date */}
        <Text style={styles.joinDate}>
          Member since {new Date(profile.joinDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          })}
        </Text>
      </View>

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
            
            {sportOptions.map((sport) => (
              <TouchableOpacity
                key={sport.value}
                style={[
                  styles.sportOption,
                  sport.value === profile.sport && styles.selectedSportOption
                ]}
                onPress={() => handleSelectSport(sport.value)}
              >
                <Text style={[
                  styles.sportOptionText,
                  sport.value === profile.sport && styles.selectedSportOptionText
                ]}>
                  {sport.label}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSportModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Card>
  );
}