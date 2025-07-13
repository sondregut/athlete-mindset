import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import Card from './Card';
import { Bell, Globe, Shield, Sparkles } from 'lucide-react-native';
import { useUserStore } from '@/store/user-store';
import { router } from 'expo-router';

export default function ProfilePreferences() {
  const colors = useThemeColors();
  const { preferences, updatePreferences } = useUserStore();

  const preferenceItems = [
    {
      icon: Bell,
      title: 'Push Notifications',
      description: 'Receive reminders and updates',
      key: 'pushNotifications' as const,
    },
    {
      icon: Globe,
      title: 'Public Profile',
      description: 'Allow others to see your progress',
      key: 'publicProfile' as const,
    },
    {
      icon: Shield,
      title: 'Data Privacy',
      description: 'Share anonymized data for research',
      key: 'shareData' as const,
    },
  ];

  const styles = StyleSheet.create({
    container: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    preferenceCard: {
      marginBottom: 12,
      padding: 16,
    },
    preferenceContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    preferenceTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    preferenceDescription: {
      fontSize: 14,
      color: colors.darkGray,
    },
    dataManagement: {
      marginTop: 32,
      paddingTop: 32,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    dataButton: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dataButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    deleteButton: {
      borderColor: colors.error + '50',
      backgroundColor: colors.error + '10',
    },
    deleteButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.error,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Preferences</Text>
      
      {preferenceItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.key} style={styles.preferenceCard}>
            <View style={styles.preferenceContent}>
              <View style={styles.iconContainer}>
                <Icon size={24} color={colors.primary} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.preferenceTitle}>{item.title}</Text>
                <Text style={styles.preferenceDescription}>{item.description}</Text>
              </View>
              <Switch
                value={preferences[item.key] || false}
                onValueChange={(value) => updatePreferences({ [item.key]: value })}
                trackColor={{ false: colors.lightGray, true: colors.primary }}
                thumbColor={preferences[item.key] ? colors.background : colors.darkGray}
              />
            </View>
          </Card>
        );
      })}

      <View style={styles.dataManagement}>
        <TouchableOpacity 
          style={[styles.dataButton, { backgroundColor: `${colors.primary}10`, borderColor: colors.primary }]}
          onPress={() => router.push('/personalization-setup')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Sparkles size={20} color={colors.primary} />
            <Text style={styles.dataButtonText}>Personalization Settings</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dataButton}>
          <Text style={styles.dataButtonText}>Export My Data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.dataButton, styles.deleteButton]}>
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}