import React, { lazy, Suspense } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

// Lazy load the body highlighter component
const BodyHighlighter = lazy(() => import('react-native-body-highlighter'));

interface LazyBodyHighlighterProps {
  data: any[];
  onBodyPartPress?: (bodyPart: any) => void;
  colors?: string[];
  scale?: number;
  frontOnly?: boolean;
  backOnly?: boolean;
  side?: 'front' | 'back';
  gender?: 'male' | 'female';
}

export default function LazyBodyHighlighter(props: LazyBodyHighlighterProps) {
  const colors = useThemeColors();

  return (
    <Suspense 
      fallback={
        <View style={[styles.loadingContainer, { backgroundColor: colors.cardBackground }]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      }
    >
      <BodyHighlighter {...props} />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
});