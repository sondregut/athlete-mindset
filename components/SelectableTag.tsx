import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

interface SelectableTagProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export default function SelectableTag({ label, selected, onPress }: SelectableTagProps) {
  const colors = useThemeColors();
  
  const styles = StyleSheet.create({
    tag: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.cardBackground,
      marginRight: 8,
      marginBottom: 8,
      borderWidth: 2,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    selectedTag: {
      backgroundColor: colors.selectedBackground,
      borderColor: colors.selectedBorder,
      borderWidth: 2,
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
  });

  return (
    <TouchableOpacity
      style={[styles.tag, selected && styles.selectedTag]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.tagText, selected && styles.selectedTagText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}