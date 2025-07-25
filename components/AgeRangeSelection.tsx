import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { AgeRange, ageRangeOptions } from '@/store/user-store';

interface AgeRangeSelectionProps {
  value?: AgeRange;
  onChange: (ageRange: AgeRange) => void;
  disabled?: boolean;
  label?: string;
  required?: boolean;
}

export default function AgeRangeSelection({
  value,
  onChange,
  disabled = false,
  label = 'Age Range',
  required = false
}: AgeRangeSelectionProps) {
  const colors = useThemeColors();
  const [modalVisible, setModalVisible] = useState(false);
  
  const selectedAge = ageRangeOptions.find(a => a.value === value);

  const handleSelect = (ageRange: AgeRange) => {
    onChange(ageRange);
    setModalVisible(false);
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    selector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectorText: {
      fontSize: 16,
      color: value ? colors.primary : colors.darkGray,
      fontWeight: value ? '500' : '400',
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
      width: '85%',
      maxHeight: '70%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    optionsList: {
      maxHeight: 400,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedOption: {
      backgroundColor: `${colors.primary}10`,
      borderColor: colors.primary,
    },
    optionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    optionIcon: {
      fontSize: 24,
      width: 32,
      textAlign: 'center',
    },
    optionLabel: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    selectedOptionLabel: {
      color: colors.primary,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {required && '*'}
        </Text>
      )}
      
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={styles.selectorText}>
          {selectedAge ? selectedAge.label : 'Select age range'}
        </Text>
        <ChevronDown size={20} color={colors.darkGray} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Age Range</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <X size={24} color={colors.darkGray} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {ageRangeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionItem,
                    value === option.value && styles.selectedOption
                  ]}
                  onPress={() => handleSelect(option.value)}
                >
                  <View style={styles.optionContent}>
                    <Text style={styles.optionIcon}>{option.icon}</Text>
                    <Text style={[
                      styles.optionLabel,
                      value === option.value && styles.selectedOptionLabel
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}