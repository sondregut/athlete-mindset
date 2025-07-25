import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Animated, PanResponder } from 'react-native';
import { Play, Clock } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LogSessionModalContextType {
  showModal: (options?: { isPostOnly?: boolean; isQuickPost?: boolean; isEditMode?: boolean }) => void;
  hideModal: () => void;
  showSelectionPopup: () => void;
}

const LogSessionModalContext = createContext<LogSessionModalContextType | undefined>(undefined);

export function LogSessionModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<{
    visible: boolean;
    isPostOnly?: boolean;
    isQuickPost?: boolean;
    isEditMode?: boolean;
  }>({
    visible: false,
  });
  
  const [selectionPopupVisible, setSelectionPopupVisible] = useState(false);
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(300)).current;
  
  // Create pan responder for swipe-down gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to downward swipes
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down, not up
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If dragged more than 50 pixels or with velocity, close the popup
        if (gestureState.dy > 50 || gestureState.vy > 0.5) {
          hideSelectionPopup();
        } else {
          // Otherwise, snap back to open position
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  const showModal = (options?: { isPostOnly?: boolean; isQuickPost?: boolean; isEditMode?: boolean }) => {
    setSelectionPopupVisible(false);
    setModalState({
      visible: true,
      isPostOnly: options?.isPostOnly,
      isQuickPost: options?.isQuickPost,
      isEditMode: options?.isEditMode,
    });
  };

  const hideModal = () => {
    setModalState({
      visible: false,
    });
  };
  
  const showSelectionPopup = () => {
    setSelectionPopupVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };
  
  const hideSelectionPopup = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectionPopupVisible(false);
    });
  };

  const handleStartTraining = () => {
    showModal();
  };
  
  const handleLogPostNotes = () => {
    showModal({ isPostOnly: true });
  };

  const styles = StyleSheet.create({
    popupOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    popupContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 12,
      paddingHorizontal: 16,
      paddingBottom: insets.bottom + 100, // Account for tab bar height
    },
    popupTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.darkGray,
      textAlign: 'center',
      marginBottom: 16,
      marginTop: 8,
    },
    popupDragHandle: {
      paddingTop: 8,
      paddingBottom: 20,
      alignItems: 'center',
    },
    popupDragIndicator: {
      width: 40,
      height: 4,
      backgroundColor: colors.mediumGray,
      borderRadius: 2,
    },
    popupButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 0,
    },
    popupButtonIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.lightGray,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    popupButtonText: {
      flex: 1,
      fontSize: 17,
      fontWeight: '500',
      color: colors.text,
    },
    popupButtonSubtext: {
      fontSize: 14,
      color: colors.darkGray,
      marginTop: 2,
    },
    popupDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
  });

  return (
    <LogSessionModalContext.Provider value={{ showModal, hideModal, showSelectionPopup }}>
      {children}
      
      {/* Selection Popup */}
      <Modal
        visible={selectionPopupVisible}
        transparent={true}
        animationType="none"
        onRequestClose={hideSelectionPopup}
      >
        <TouchableWithoutFeedback onPress={hideSelectionPopup}>
          <View style={styles.popupOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View 
                style={[
                  styles.popupContent,
                  {
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
                {...panResponder.panHandlers}
              >
                <View style={styles.popupDragHandle}>
                  <View style={styles.popupDragIndicator} />
                </View>
                
                <TouchableOpacity 
                  style={styles.popupButton}
                  onPress={handleStartTraining}
                  activeOpacity={0.7}
                >
                  <View style={styles.popupButtonIcon}>
                    <Play size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.popupButtonText}>Start Training</Text>
                    <Text style={styles.popupButtonSubtext}>Set intentions & track session</Text>
                  </View>
                </TouchableOpacity>
                
                <View style={styles.popupDivider} />
                
                <TouchableOpacity 
                  style={styles.popupButton}
                  onPress={handleLogPostNotes}
                  activeOpacity={0.7}
                >
                  <View style={styles.popupButtonIcon}>
                    <Clock size={24} color={colors.secondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.popupButtonText}>Log Post Notes</Text>
                    <Text style={styles.popupButtonSubtext}>Add reflection to past session</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      <LogSessionModal
        visible={modalState.visible}
        onClose={hideModal}
        isPostOnly={modalState.isPostOnly}
        isQuickPost={modalState.isQuickPost}
        isEditMode={modalState.isEditMode}
      />
    </LogSessionModalContext.Provider>
  );
}

export function useLogSessionModal() {
  const context = useContext(LogSessionModalContext);
  if (!context) {
    throw new Error('useLogSessionModal must be used within LogSessionModalProvider');
  }
  return context;
}

// Import the modal component
import LogSessionModal from '@/components/LogSessionModal';