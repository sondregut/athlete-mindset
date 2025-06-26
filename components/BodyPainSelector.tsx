import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Body from 'react-native-body-highlighter';
import { useThemeColors } from '@/hooks/useThemeColors';
import { BodyPainArea } from '@/store/mindset-store';

interface BodyPainSelectorProps {
  selectedAreas: BodyPainArea[];
  onAreasChange: (areas: BodyPainArea[]) => void;
  overallPainLevel: 'none' | 'minor' | 'moderate' | 'significant';
  onOverallPainChange: (level: 'none' | 'minor' | 'moderate' | 'significant') => void;
}

// Map our pain areas to body-highlighter muscle slugs
const bodyPartMapping: Record<string, string> = {
  'head': 'head',
  'neck': 'neck',
  'left-shoulder': 'front-deltoids',
  'right-shoulder': 'front-deltoids',
  'chest': 'chest',
  'upper-back': 'upper-back',
  'mid-back': 'trapezius',
  'lower-back': 'lower-back',
  'abdomen': 'abs',
  'left-hip': 'abductors',
  'right-hip': 'abductors',
  'left-glute': 'gluteal',
  'right-glute': 'gluteal',
  'left-quad': 'quadriceps',
  'right-quad': 'quadriceps',
  'left-hamstring': 'hamstring',
  'right-hamstring': 'hamstring',
  'left-knee': 'quadriceps',
  'right-knee': 'quadriceps',
  'left-calf': 'calves',
  'right-calf': 'calves',
  'left-ankle': 'calves',
  'right-ankle': 'calves',
  'biceps': 'biceps',
  'triceps': 'triceps',
  'forearm': 'forearm',
};

// Available body parts for selection
const availableBodyParts = [
  { id: 'head', label: 'Head', slug: 'head' },
  { id: 'neck', label: 'Neck', slug: 'neck' },
  { id: 'chest', label: 'Chest', slug: 'chest' },
  { id: 'upper-back', label: 'Upper Back', slug: 'upper-back' },
  { id: 'lower-back', label: 'Lower Back', slug: 'lower-back' },
  { id: 'abs', label: 'Abs', slug: 'abs' },
  { id: 'left-shoulder', label: 'Left Shoulder', slug: 'front-deltoids', side: 'left' },
  { id: 'right-shoulder', label: 'Right Shoulder', slug: 'front-deltoids', side: 'right' },
  { id: 'left-biceps', label: 'Left Biceps', slug: 'biceps', side: 'left' },
  { id: 'right-biceps', label: 'Right Biceps', slug: 'biceps', side: 'right' },
  { id: 'left-quad', label: 'Left Quad', slug: 'quadriceps', side: 'left' },
  { id: 'right-quad', label: 'Right Quad', slug: 'quadriceps', side: 'right' },
  { id: 'left-hamstring', label: 'Left Hamstring', slug: 'hamstring', side: 'left' },
  { id: 'right-hamstring', label: 'Right Hamstring', slug: 'hamstring', side: 'right' },
  { id: 'left-calf', label: 'Left Calf', slug: 'calves', side: 'left' },
  { id: 'right-calf', label: 'Right Calf', slug: 'calves', side: 'right' },
];

export default function BodyPainSelector({ 
  selectedAreas, 
  onAreasChange,
  overallPainLevel,
  onOverallPainChange 
}: BodyPainSelectorProps) {
  const colors = useThemeColors();
  const [currentView, setCurrentView] = useState<'front' | 'back'>('front');

  const handleBodyPartPress = (partId: string) => {
    const existingArea = selectedAreas.find(area => area.location === partId);
    
    if (existingArea) {
      // Remove if already selected
      onAreasChange(selectedAreas.filter(area => area.location !== partId));
    } else {
      // Add with severity based on overall pain level
      const severity = overallPainLevel === 'none' ? 'minor' : overallPainLevel;
      onAreasChange([...selectedAreas, { location: partId, severity }]);
    }
  };

  const getIntensityForSeverity = (severity: 'minor' | 'moderate' | 'significant') => {
    switch (severity) {
      case 'minor': return 1;
      case 'moderate': return 1.5;
      case 'significant': return 2;
      default: return 1;
    }
  };

  const getColorForSeverity = (severity: 'minor' | 'moderate' | 'significant') => {
    switch (severity) {
      case 'minor': return '#FFC107';
      case 'moderate': return '#FFB74D';
      case 'significant': return '#F44336';
      default: return colors.warning;
    }
  };

  // Convert selected areas to body-highlighter format
  const bodyData = selectedAreas
    .map(area => {
      const bodyPart = availableBodyParts.find(part => part.id === area.location);
      if (!bodyPart) return null;
      
      return {
        slug: bodyPart.slug,
        intensity: getIntensityForSeverity(area.severity),
        side: bodyPart.side as 'left' | 'right' | undefined,
      };
    })
    .filter((item): item is { slug: string; intensity: number; side: 'left' | 'right' | undefined } => item !== null);

  const painLevels: Array<{ level: 'none' | 'minor' | 'moderate' | 'significant'; label: string; color: string }> = [
    { level: 'none', label: 'None', color: colors.success },
    { level: 'minor', label: 'Minor', color: colors.warning },
    { level: 'moderate', label: 'Moderate', color: colors.orange },
    { level: 'significant', label: 'Significant', color: colors.error },
  ];

  const styles = StyleSheet.create({
    container: {
      marginTop: 24,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 14,
      color: colors.darkGray,
      marginBottom: 12,
    },
    overallPainContainer: {
      marginBottom: 24,
    },
    painLevelButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    painLevelButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.cardBackground,
      minHeight: 48, // Minimum tap target size
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    selectedPainLevel: {
      backgroundColor: colors.background,
    },
    painLevelIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 8,
    },
    painLevelText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    selectedPainLevelText: {
      fontWeight: '600',
    },
    bodyContainer: {
      alignItems: 'center',
    },
    viewToggle: {
      flexDirection: 'row',
      backgroundColor: colors.lightGray,
      borderRadius: 8,
      padding: 4,
      marginBottom: 16,
    },
    viewButton: {
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 6,
      minWidth: 80,
      alignItems: 'center',
    },
    activeViewButton: {
      backgroundColor: colors.background,
    },
    viewButtonText: {
      fontSize: 14,
      color: colors.darkGray,
      fontWeight: '500',
    },
    activeViewButtonText: {
      color: colors.primary,
      fontWeight: '600',
    },
    bodyDiagram: {
      height: 350,
      justifyContent: 'center',
      alignItems: 'center',
    },
    quickSelectContainer: {
      marginTop: 16,
      width: '100%',
    },
    quickSelectTitle: {
      fontSize: 14,
      color: colors.darkGray,
      marginBottom: 8,
      textAlign: 'center',
    },
    quickSelectScroll: {
      maxHeight: 80,
    },
    quickSelectButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 8,
    },
    quickSelectButton: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.cardBackground,
      minHeight: 44, // Minimum tap target size
    },
    selectedQuickButton: {
      backgroundColor: colors.selectedBackground,
    },
    quickSelectText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    selectedQuickText: {
      fontWeight: '600',
    },
    summary: {
      marginTop: 16,
    },
    summaryTitle: {
      fontSize: 14,
      color: colors.darkGray,
      marginBottom: 8,
    },
    summaryItems: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    summaryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 2,
      backgroundColor: colors.cardBackground,
      gap: 6,
    },
    summaryDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    summaryItemText: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '500',
    },
    removeButton: {
      marginLeft: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      minWidth: 30,
      minHeight: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeButtonText: {
      fontSize: 20,
      color: colors.darkGray,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Physical Status</Text>
      
      {/* Overall Pain Level */}
      <View style={styles.overallPainContainer}>
        <Text style={styles.subtitle}>Overall Pain Level</Text>
        <View style={styles.painLevelButtons}>
          {painLevels.map(({ level, label, color }) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.painLevelButton,
                overallPainLevel === level && [styles.selectedPainLevel, { borderColor: color }]
              ]}
              onPress={() => onOverallPainChange(level)}
              activeOpacity={0.7}
            >
              <View style={[styles.painLevelIndicator, { backgroundColor: color }]} />
              <Text style={[
                styles.painLevelText,
                overallPainLevel === level && styles.selectedPainLevelText
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Body Diagram */}
      <View style={styles.bodyContainer}>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewButton, currentView === 'front' && styles.activeViewButton]}
            onPress={() => setCurrentView('front')}
          >
            <Text style={[styles.viewButtonText, currentView === 'front' && styles.activeViewButtonText]}>
              Front
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, currentView === 'back' && styles.activeViewButton]}
            onPress={() => setCurrentView('back')}
          >
            <Text style={[styles.viewButtonText, currentView === 'back' && styles.activeViewButtonText]}>
              Back
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bodyDiagram}>
          <Body
            data={bodyData.filter(item => item !== null) as any}
            gender="male"
            side={currentView}
            scale={1.0}
          />
        </View>

        {/* Quick Select Body Parts */}
        <View style={styles.quickSelectContainer}>
          <Text style={styles.quickSelectTitle}>Tap buttons below to select pain areas:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickSelectScroll}>
            <View style={styles.quickSelectButtons}>
              {availableBodyParts
                .filter(part => {
                  // Filter parts based on current view
                  if (currentView === 'front') {
                    return !['upper-back', 'lower-back'].includes(part.id);
                  } else {
                    return !['chest', 'abs'].includes(part.id);
                  }
                })
                .map(part => {
                  const isSelected = selectedAreas.some(area => area.location === part.id);
                  const selectedArea = selectedAreas.find(area => area.location === part.id);
                  
                  return (
                    <TouchableOpacity
                      key={part.id}
                      style={[
                        styles.quickSelectButton,
                        isSelected && [
                          styles.selectedQuickButton,
                          { borderColor: selectedArea ? getColorForSeverity(selectedArea.severity) : colors.primary }
                        ]
                      ]}
                      onPress={() => handleBodyPartPress(part.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.quickSelectText,
                        isSelected && styles.selectedQuickText
                      ]}>
                        {part.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Selected Areas Summary */}
      {selectedAreas.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Selected areas ({selectedAreas.length}):</Text>
          <View style={styles.summaryItems}>
            {selectedAreas.map((area, index) => {
              const bodyPart = availableBodyParts.find(part => part.id === area.location);
              return (
                <View 
                  key={index} 
                  style={[
                    styles.summaryItem, 
                    { borderColor: getColorForSeverity(area.severity) }
                  ]}
                >
                  <View 
                    style={[
                      styles.summaryDot, 
                      { backgroundColor: getColorForSeverity(area.severity) }
                    ]} 
                  />
                  <Text style={styles.summaryItemText}>
                    {bodyPart?.label || area.location}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleBodyPartPress(area.location)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}