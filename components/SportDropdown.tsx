import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native';
import { ChevronDown, Search, Check } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SportType, sportOptions } from '@/store/user-store';

interface SportDropdownProps {
  value: SportType;
  onChange: (value: SportType) => void;
  placeholder?: string;
}

export default function SportDropdown({ value, onChange, placeholder = 'Select a sport' }: SportDropdownProps) {
  const colors = useThemeColors();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedSport = sportOptions.find(sport => sport.value === value);
  
  const filteredSports = sportOptions.filter(sport =>
    sport.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (sport: SportType) => {
    onChange(sport);
    setModalVisible(false);
    setSearchQuery('');
  };

  const styles = StyleSheet.create({
    container: {
      width: '100%',
    },
    dropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.mediumGray,
    },
    dropdownContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    dropdownIcon: {
      fontSize: 20,
      marginRight: 12,
    },
    dropdownText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    placeholderText: {
      fontSize: 16,
      color: colors.darkGray,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -4,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalHeader: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.mediumGray,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 20,
      marginTop: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.mediumGray,
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    sportList: {
      paddingBottom: 20,
    },
    sportItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
    },
    sportItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    sportIcon: {
      fontSize: 24,
      marginRight: 16,
    },
    sportLabel: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    selectedItem: {
      backgroundColor: colors.selectedBackground,
    },
    checkIcon: {
      marginLeft: 8,
    },
  });

  return (
    <>
      <TouchableOpacity style={styles.dropdownButton} onPress={() => setModalVisible(true)}>
        <View style={styles.dropdownContent}>
          {selectedSport ? (
            <>
              <Text style={styles.dropdownIcon}>{selectedSport.icon}</Text>
              <Text style={styles.dropdownText}>{selectedSport.label}</Text>
            </>
          ) : (
            <Text style={styles.placeholderText}>{placeholder}</Text>
          )}
        </View>
        <ChevronDown size={20} color={colors.darkGray} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
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
              <Text style={styles.modalTitle}>Select Sport</Text>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color={colors.darkGray} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search sports..."
                placeholderTextColor={colors.darkGray}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              data={filteredSports}
              keyExtractor={(item) => item.value}
              style={styles.sportList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.sportItem,
                    value === item.value && styles.selectedItem
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  <View style={styles.sportItemContent}>
                    <Text style={styles.sportIcon}>{item.icon}</Text>
                    <Text style={styles.sportLabel}>{item.label}</Text>
                  </View>
                  {value === item.value && (
                    <Check size={20} color={colors.primary} style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}