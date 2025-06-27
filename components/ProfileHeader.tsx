import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { User, Edit3 } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useUserStore, sportOptions } from '@/store/user-store';
import Card from './Card';

interface ProfileHeaderProps {
  onEditPress: () => void;
}

export default function ProfileHeader({ onEditPress }: ProfileHeaderProps) {
  const colors = useThemeColors();
  const { profile } = useUserStore();

  const selectedSport = sportOptions.find(s => s.value === profile.sport);
  const displayName = profile.name || 'Athlete';

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      marginBottom: 16,
      position: 'relative',
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
    name: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
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
    editButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      padding: 8,
      backgroundColor: colors.lightGray,
      borderRadius: 8,
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
        <Text style={styles.name}>{displayName}</Text>
        {selectedSport && (
          <Text style={styles.sport}>{selectedSport.label}</Text>
        )}
        <Text style={styles.joinDate}>
          Member since {new Date(profile.joinDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          })}
        </Text>
      </View>

      <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
        <Edit3 size={20} color={colors.primary} />
      </TouchableOpacity>
    </Card>
  );
}