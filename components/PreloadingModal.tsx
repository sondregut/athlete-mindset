import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, ActivityIndicator, Dimensions } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { X } from 'lucide-react-native';

interface PreloadingModalProps {
  visible: boolean;
  progress: number;
  onCancel: () => void;
}

const { width } = Dimensions.get('window');

export default function PreloadingModal({ visible, progress, onCancel }: PreloadingModalProps) {
  const colors = useThemeColors();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 32,
      width: width * 0.85,
      maxWidth: 320,
      alignItems: 'center',
    },
    closeButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      padding: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 24,
      textAlign: 'center',
    },
    progressContainer: {
      width: 120,
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    progressCircle: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 8,
      borderColor: colors.lightGray,
    },
    progressFill: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 8,
      borderColor: colors.primary,
      borderTopColor: 'transparent',
      borderRightColor: 'transparent',
      transform: [{ rotate: '45deg' }],
    },
    progressText: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.primary,
    },
    statusText: {
      fontSize: 16,
      color: colors.darkGray,
      textAlign: 'center',
      marginBottom: 24,
    },
    cancelButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.darkGray,
    },
    cancelButtonText: {
      fontSize: 16,
      color: colors.darkGray,
      fontWeight: '500',
    },
  });

  // Calculate rotation for progress circle
  const rotation = (progress / 100) * 360;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
            <X size={20} color={colors.darkGray} />
          </TouchableOpacity>

          <Text style={styles.title}>Preparing Visualization</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressCircle} />
            <Animated.View 
              style={[
                styles.progressFill,
                {
                  transform: [
                    { rotate: `${rotation}deg` },
                  ],
                },
              ]} 
            />
            <Text style={styles.progressText}>{progress}%</Text>
          </View>

          <Text style={styles.statusText}>
            Loading audio narration...{'\n'}
            This may take a moment
          </Text>

          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}