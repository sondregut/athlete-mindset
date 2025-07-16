import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { FileText, ClipboardCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function LogSessionMenu() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  const handlePreTraining = () => {
    router.push('/log-session');
  };

  const handlePostTraining = () => {
    router.push('/log-session?postOnly=true');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 32,
      textAlign: 'center',
    },
    optionButton: {
      backgroundColor: colors.cardBackground,
      padding: 20,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionIcon: {
      marginRight: 16,
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    optionDescription: {
      fontSize: 14,
      color: colors.darkGray,
      lineHeight: 20,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log Training Session</Text>
      
      <TouchableOpacity style={styles.optionButton} onPress={handlePreTraining}>
        <View style={styles.optionIcon}>
          <FileText size={28} color={colors.primary} />
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>Pre-Training Notes</Text>
          <Text style={styles.optionDescription}>
            Set intentions and mindset cues before starting your session
          </Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.optionButton} onPress={handlePostTraining}>
        <View style={styles.optionIcon}>
          <ClipboardCheck size={28} color={colors.secondary} />
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>Post-Training Notes</Text>
          <Text style={styles.optionDescription}>
            Log reflection and feedback for a completed session
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}