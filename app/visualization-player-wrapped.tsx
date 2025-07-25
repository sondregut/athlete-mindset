import React from 'react';
import VisualizationPlayerScreen from './visualization-player';
import { VisualizationErrorBoundary } from '@/components/VisualizationErrorBoundary';

export default function VisualizationPlayerWrapped() {
  return (
    <VisualizationErrorBoundary>
      <VisualizationPlayerScreen />
    </VisualizationErrorBoundary>
  );
}