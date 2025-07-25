import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput, ScrollView, KeyboardAvoidingView, Platform, Keyboard, Dimensions } from 'react-native';
import { ChevronDown, Search, Check, X } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SportType, TrackFieldEvent, SportCategory, sportOptions, trackFieldEventOptions } from '@/store/user-store';
import { Animated } from 'react-native';

interface SportSelectionWithEventsProps {
  sport?: SportType;
  trackFieldEvent?: TrackFieldEvent;
  onSportChange: (sport: SportType) => void;
  onEventChange?: (event: TrackFieldEvent | undefined) => void;
  disabled?: boolean;
}

export default function SportSelectionWithEvents({
  sport,
  trackFieldEvent,
  onSportChange,
  onEventChange,
  disabled = false
}: SportSelectionWithEventsProps) {
  const colors = useThemeColors();
  const [sportModalVisible, setSportModalVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [sportSearchQuery, setSportSearchQuery] = useState('');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { height: screenHeight } = Dimensions.get('window');

  const selectedSport = sportOptions.find(s => s.value === sport);
  const selectedEvent = trackFieldEventOptions.find(e => e.value === trackFieldEvent);
  
  // Show/hide track field event selection with animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: sport === 'track-and-field' ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [sport]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Filter sports based on search
  const filteredSports = sportOptions.filter(sport =>
    sport.label.toLowerCase().includes(sportSearchQuery.toLowerCase())
  );

  // Group sports by category
  const sportsByCategory = filteredSports.reduce((acc, sport) => {
    const categoryName = getCategoryLabel(sport.category);
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(sport);
    return acc;
  }, {} as Record<string, typeof sportOptions>);

  // Helper function to get category labels
  function getCategoryLabel(category: SportCategory): string {
    const labels: Record<SportCategory, string> = {
      team: 'Team Sports',
      individual: 'Individual Sports',
      combat: 'Combat Sports',
      water: 'Water Sports',
      winter: 'Winter Sports',
      racquet: 'Racquet Sports',
      endurance: 'Endurance Sports',
      other: 'Other'
    };
    return labels[category] || 'Other';
  }

  // Filter events based on search
  const filteredEvents = trackFieldEventOptions.filter(event =>
    event.label.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
    event.category.toLowerCase().includes(eventSearchQuery.toLowerCase())
  );

  // Group events by category
  const eventsByCategory = filteredEvents.reduce((acc, event) => {
    if (!acc[event.category]) {
      acc[event.category] = [];
    }
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, typeof trackFieldEventOptions>);

  const handleSportSelect = (sportValue: SportType) => {
    onSportChange(sportValue);
    setSportModalVisible(false);
    setSportSearchQuery('');
    
    // Clear track field event if switching away from track & field
    if (sportValue !== 'track-and-field' && onEventChange) {
      onEventChange(undefined);
    }
  };

  const handleEventSelect = (event: TrackFieldEvent) => {
    if (onEventChange) {
      onEventChange(event);
    }
    setEventModalVisible(false);
    setEventSearchQuery('');
  };

  const styles = StyleSheet.create({
    container: {
      gap: 12,
    },
    fieldContainer: {
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
    fieldLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    fieldValue: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    valueText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '500',
    },
    placeholderText: {
      fontSize: 16,
      color: colors.darkGray,
    },
    sportIcon: {
      fontSize: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: keyboardHeight > 0 ? screenHeight - keyboardHeight - 100 : '85%',
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
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
      borderColor: colors.border,
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
      paddingTop: 8,
    },
    sportItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
    },
    sportItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    sportItemIcon: {
      fontSize: 24,
      width: 32,
      textAlign: 'center',
    },
    sportItemLabel: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    selectedItem: {
      backgroundColor: `${colors.primary}10`,
    },
    categorySection: {
      marginBottom: 16,
    },
    categoryTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.darkGray,
      textTransform: 'uppercase',
      marginBottom: 8,
      marginTop: 12,
      paddingHorizontal: 20,
      letterSpacing: 0.5,
    },
    eventCategorySection: {
      marginBottom: 24,
      paddingHorizontal: 20,
    },
    eventGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    eventChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.background,
      gap: 6,
    },
    selectedEventChip: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}10`,
    },
    eventChipIcon: {
      fontSize: 16,
    },
    eventChipLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    selectedEventChipLabel: {
      color: colors.primary,
    },
    animatedContainer: {
      overflow: 'hidden',
    },
  });

  return (
    <View style={styles.container}>
      {/* Sport Selection */}
      <TouchableOpacity
        style={styles.fieldContainer}
        onPress={() => setSportModalVisible(true)}
        disabled={disabled}
      >
        <Text style={styles.fieldLabel}>Sport</Text>
        <View style={styles.fieldValue}>
          {selectedSport ? (
            <>
              <Text style={styles.sportIcon}>{selectedSport.icon}</Text>
              <Text style={styles.valueText}>{selectedSport.label}</Text>
            </>
          ) : (
            <Text style={styles.placeholderText}>Select sport</Text>
          )}
          <ChevronDown size={16} color={colors.darkGray} />
        </View>
      </TouchableOpacity>

      {/* Track & Field Event Selection - Only show for track-and-field */}
      {sport === 'track-and-field' && (
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.fieldContainer}
            onPress={() => setEventModalVisible(true)}
            disabled={disabled}
          >
            <Text style={styles.fieldLabel}>Event</Text>
            <View style={styles.fieldValue}>
              {selectedEvent ? (
                <>
                  <Text style={styles.sportIcon}>{selectedEvent.icon}</Text>
                  <Text style={styles.valueText}>{selectedEvent.label}</Text>
                </>
              ) : (
                <Text style={styles.placeholderText}>Select event</Text>
              )}
              <ChevronDown size={16} color={colors.darkGray} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Sport Selection Modal */}
      <Modal
        visible={sportModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSportModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              setSportModalVisible(false);
            }}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Sport</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setSportSearchQuery('');
                    setSportModalVisible(false);
                  }}
                >
                  <X size={24} color={colors.darkGray} />
                </TouchableOpacity>
              </View>

              <View style={styles.searchContainer}>
                <Search size={20} color={colors.darkGray} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search sports..."
                  placeholderTextColor={colors.darkGray}
                  value={sportSearchQuery}
                  onChangeText={setSportSearchQuery}
                  autoFocus
                  returnKeyType="search"
                  blurOnSubmit={false}
                />
              </View>

              <ScrollView 
                style={styles.sportList} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {Object.entries(sportsByCategory).map(([category, sports]) => (
                  <View key={category} style={styles.categorySection}>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    {sports.map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        style={[
                          styles.sportItem,
                          sport === item.value && styles.selectedItem
                        ]}
                        onPress={() => handleSportSelect(item.value)}
                      >
                        <View style={styles.sportItemContent}>
                          <Text style={styles.sportItemIcon}>{item.icon}</Text>
                          <Text style={styles.sportItemLabel}>{item.label}</Text>
                        </View>
                        {sport === item.value && (
                          <Check size={20} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Track & Field Event Selection Modal */}
      <Modal
        visible={eventModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEventModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              setEventModalVisible(false);
            }}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Track & Field Event</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setEventSearchQuery('');
                    setEventModalVisible(false);
                  }}
                >
                  <X size={24} color={colors.darkGray} />
                </TouchableOpacity>
              </View>

              <View style={styles.searchContainer}>
                <Search size={20} color={colors.darkGray} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search events..."
                  placeholderTextColor={colors.darkGray}
                  value={eventSearchQuery}
                  onChangeText={setEventSearchQuery}
                  autoFocus
                  returnKeyType="search"
                  blurOnSubmit={false}
                />
              </View>

              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {Object.entries(eventsByCategory).map(([category, events]) => (
                  <View key={category} style={styles.eventCategorySection}>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    <View style={styles.eventGrid}>
                      {events.map((event) => (
                        <TouchableOpacity
                          key={event.value}
                          style={[
                            styles.eventChip,
                            trackFieldEvent === event.value && styles.selectedEventChip
                          ]}
                          onPress={() => handleEventSelect(event.value)}
                        >
                          <Text style={styles.eventChipIcon}>{event.icon}</Text>
                          <Text style={[
                            styles.eventChipLabel,
                            trackFieldEvent === event.value && styles.selectedEventChipLabel
                          ]}>
                            {event.label}
                          </Text>
                          {trackFieldEvent === event.value && (
                            <Check size={14} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}