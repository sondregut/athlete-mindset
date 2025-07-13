import React, { lazy, Suspense } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

// Lazy load the actual player component
const VisualizationPlayer = lazy(() => import('./VisualizationPlayer'));

interface LazyVisualizationPlayerProps {
  visualizationId: string;
  onComplete?: () => void;
  onExit?: () => void;
}

export default function LazyVisualizationPlayer(props: LazyVisualizationPlayerProps) {
  const colors = useThemeColors();

  return (
    <Suspense 
      fallback={
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      }
    >
      <VisualizationPlayer {...props} />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});