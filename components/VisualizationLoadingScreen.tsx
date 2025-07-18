import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain, Loader } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface VisualizationLoadingScreenProps {
  title: string;
  progress: number;
  currentStep: number;
  totalSteps: number;
  statusMessage: string;
}

const { width, height } = Dimensions.get('window');

export default function VisualizationLoadingScreen({
  title,
  progress,
  currentStep,
  totalSteps,
  statusMessage
}: VisualizationLoadingScreenProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.warmBackground]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Brain size={60} color={colors.primary} />
            <View style={styles.loaderContainer}>
              <Loader size={24} color={colors.secondary} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>
          
          {/* Status Message */}
          <Text style={styles.statusMessage}>{statusMessage}</Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${progress}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              Preparing step {currentStep} of {totalSteps}
            </Text>
          </View>

          {/* Loading Dots */}
          <View style={styles.dotsContainer}>
            {[0, 1, 2].map((index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  { 
                    opacity: (progress / 100) > (index / 3) ? 1 : 0.3,
                    backgroundColor: colors.primary
                  }
                ]}
              />
            ))}
          </View>

          {/* Loading Text */}
          <Text style={styles.loadingText}>
            Preparing your personalized experience...
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderContainer: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  statusMessage: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: 32,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: colors.darkGray,
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  loadingText: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});