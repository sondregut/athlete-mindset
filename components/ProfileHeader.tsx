import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { User, Settings } from 'lucide-react-native';
import { router } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useUserStore, sportOptions, experienceLevelOptions, ageRangeOptions } from '@/store/user-store';
import Card from './Card';

interface ProfileHeaderProps {
  onEditPress: () => void;
  onSettingsPress: () => void;
}

export default function ProfileHeader({ onEditPress, onSettingsPress }: ProfileHeaderProps) {
  const colors = useThemeColors();
  const { profile } = useUserStore();

  const selectedSport = sportOptions.find(s => s.value === profile.sport);
  const displayName = profile.name || 'Athlete';

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      paddingRight: 60, // Extra padding to prevent overlap with settings button
    },
    settingsButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.lightGray,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
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
    name: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    sportText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    profileDetail: {
      fontSize: 14,
      color: colors.darkGray,
      marginBottom: 4,
    },
    sport: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 2,
    },
    joinDate: {
      fontSize: 14,
      color: colors.darkGray,
    },
  });

  return (
    <Card style={styles.container}>
      <TouchableOpacity 
        style={styles.settingsButton}
        onPress={onSettingsPress}
        activeOpacity={0.7}
      >
        <Settings size={20} color={colors.darkGray} />
      </TouchableOpacity>

      <View style={styles.headerContent}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <User size={40} color={colors.darkGray} />
          </View>
        </View>

        <View style={styles.infoContainer}>
          {/* Name Section */}
          <View style={styles.nameSection}>
            <Text style={styles.name}>{displayName}</Text>
          </View>

          {/* Sport */}
          {selectedSport && (
            <Text style={styles.sportText}>{selectedSport.label}</Text>
          )}

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
        </View>
      </View>
    </Card>
  );
}