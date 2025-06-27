import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Heart, Zap, Target, Edit2, Save, X } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useMindsetStore } from '@/store/mindset-store';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { format } from 'date-fns';

export default function CheckinDetailScreen() {
  const { checkinId } = useLocalSearchParams<{ checkinId: string }>();
  const { checkins, updateCheckin } = useMindsetStore();
  const colors = useThemeColors();
  
  const checkin = checkins.find(c => c.id === checkinId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [mood, setMood] = useState(checkin?.mood || 5);
  const [energy, setEnergy] = useState(checkin?.energy || 5);
  const [motivation, setMotivation] = useState(checkin?.motivation || 5);
  const [selfDescription, setSelfDescription] = useState(checkin?.selfDescription || '');
  const [painDescription, setPainDescription] = useState(checkin?.painDescription || '');
  const [isSaving, setIsSaving] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 32,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      fontSize: 16,
      color: colors.darkGray,
    },
    editingBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.warning,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    editingText: {
      color: colors.background,
      fontWeight: '600',
    },
    card: {
      marginBottom: 16,
    },
    checkinTime: {
      fontSize: 14,
      color: colors.darkGray,
      marginBottom: 16,
      textAlign: 'center',
    },
    ratingSection: {
      marginBottom: 24,
    },
    ratingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    ratingTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
    },
    emojiIndicator: {
      fontSize: 24,
      marginLeft: 'auto',
    },
    scaleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 4,
    },
    scaleButton: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
    },
    selectedScaleButton: {
      borderColor: colors.primary,
      backgroundColor: colors.selectedBackground,
    },
    scaleButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    selectedScaleButtonText: {
      color: colors.primary,
      fontWeight: '700',
    },
    scaleLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    scaleLabelLeft: {
      fontSize: 12,
      color: colors.darkGray,
    },
    scaleLabelRight: {
      fontSize: 12,
      color: colors.darkGray,
    },
    valueDisplay: {
      alignItems: 'center',
    },
    valueText: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.primary,
    },
    valueDescription: {
      fontSize: 14,
      color: colors.darkGray,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    textInputContainer: {
      position: 'relative',
    },
    textInput: {
      backgroundColor: colors.lightGray,
      borderRadius: 8,
      padding: 16,
      paddingBottom: 28,
      fontSize: 16,
      color: colors.text,
      minHeight: 100,
    },
    charCount: {
      position: 'absolute',
      bottom: 8,
      right: 12,
      fontSize: 12,
      color: colors.darkGray,
    },
    description: {
      fontSize: 16,
      color: colors.text,
      fontStyle: 'italic',
      lineHeight: 24,
    },
    painAreas: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    painTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.lightGray,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    painTagText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    painSeverity: {
      fontSize: 12,
      color: colors.darkGray,
      marginLeft: 4,
    },
    overallPain: {
      fontSize: 14,
      color: colors.darkGray,
      marginTop: 12,
    },
    actionButtons: {
      gap: 12,
    },
    saveButton: {
      marginBottom: 0,
    },
    cancelButton: {
      marginBottom: 0,
    },
  });

  useEffect(() => {
    if (checkin) {
      setMood(checkin.mood);
      setEnergy(checkin.energy);
      setMotivation(checkin.motivation);
      setSelfDescription(checkin.selfDescription || '');
      setPainDescription(checkin.painDescription || '');
    }
  }, [checkin]);

  if (!checkin) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Check-in Details" }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Check-in not found</Text>
        </View>
      </View>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCheckin(checkinId, {
        mood,
        energy,
        motivation,
        selfDescription: selfDescription.trim() || undefined,
        painDescription: painDescription.trim() || undefined,
      });
      setIsEditing(false);
      // Navigate back to history tab with check-ins selected
      setTimeout(() => {
        router.replace('/(tabs)/history?defaultView=checkins');
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to update check-in');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setMood(checkin.mood);
    setEnergy(checkin.energy);
    setMotivation(checkin.motivation);
    setSelfDescription(checkin.selfDescription || '');
    setPainDescription(checkin.painDescription || '');
    setIsEditing(false);
  };

  const getMoodEmoji = (value: number) => {
    if (value <= 3) return '😞';
    if (value <= 7) return '😐';
    return '😊';
  };

  const renderRatingScale = (
    title: string,
    icon: React.ReactNode,
    value: number,
    onChange: (value: number) => void,
    leftLabel?: string,
    rightLabel?: string
  ) => {
    return (
      <View style={styles.ratingSection}>
        <View style={styles.ratingHeader}>
          {icon}
          <Text style={styles.ratingTitle}>{title}</Text>
          {title === 'Mood' && <Text style={styles.emojiIndicator}>{getMoodEmoji(value)}</Text>}
        </View>
        
        {isEditing ? (
          <>
            <View style={styles.scaleContainer}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.scaleButton,
                    value === num && styles.selectedScaleButton
                  ]}
                  onPress={() => onChange(num)}
                >
                  <Text style={[
                    styles.scaleButtonText,
                    value === num && styles.selectedScaleButtonText
                  ]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {leftLabel && rightLabel && (
              <View style={styles.scaleLabels}>
                <Text style={styles.scaleLabelLeft}>{leftLabel}</Text>
                <Text style={styles.scaleLabelRight}>{rightLabel}</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.valueDisplay}>
            <Text style={styles.valueText}>{value}/10</Text>
            {leftLabel && rightLabel && (
              <Text style={styles.valueDescription}>
                {value <= 3 ? leftLabel : value >= 8 ? rightLabel : 'Moderate'}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Stack.Screen 
        options={{ 
          title: format(new Date(checkin.date), 'EEEE, MMMM d'),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={isSaving}
            >
              {isEditing ? (
                <Save size={24} color={colors.primary} />
              ) : (
                <Edit2 size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ),
        }} 
      />

      {isEditing && (
        <View style={styles.editingBanner}>
          <Text style={styles.editingText}>Editing Mode</Text>
          <TouchableOpacity onPress={handleCancel}>
            <X size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}

      <Card style={styles.card}>
        <Text style={styles.checkinTime}>
          Checked in at {format(new Date(checkin.createdAt), 'h:mm a')}
        </Text>

        {renderRatingScale(
          'Mood',
          <Heart size={20} color={colors.primary} />,
          mood,
          setMood,
          '😞 Low',
          '😊 Great'
        )}

        {renderRatingScale(
          'Energy',
          <Zap size={20} color={colors.primary} />,
          energy,
          setEnergy,
          'Drained',
          'Energized'
        )}

        {renderRatingScale(
          'Motivation',
          <Target size={20} color={colors.primary} />,
          motivation,
          setMotivation,
          'Not feeling it',
          'Ready to crush it'
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Self Description</Text>
        {isEditing ? (
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              value={selfDescription}
              onChangeText={setSelfDescription}
              placeholder="How would you describe yourself today?"
              placeholderTextColor={colors.darkGray}
              multiline
              numberOfLines={4}
              maxLength={150}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{selfDescription.length}/150</Text>
          </View>
        ) : (
          <Text style={styles.description}>
            {selfDescription || 'No description provided'}
          </Text>
        )}
      </Card>

      {isEditing ? (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Physical Status</Text>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              value={painDescription}
              onChangeText={(text) => {
                if (text.length <= 200) {
                  setPainDescription(text);
                }
              }}
              placeholder="Any pain or discomfort to note?"
              placeholderTextColor={colors.darkGray}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{painDescription.length}/200</Text>
          </View>
        </Card>
      ) : (
        (checkin.painDescription || (checkin.bodyPainAreas && checkin.bodyPainAreas.length > 0)) && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Physical Status</Text>
            {checkin.painDescription ? (
              <Text style={styles.description}>
                {checkin.painDescription}
              </Text>
            ) : (
              // Legacy support for old body pain data
              <View style={styles.painAreas}>
                {checkin.bodyPainAreas?.map((area, index) => (
                  <View key={index} style={styles.painTag}>
                    <Text style={styles.painTagText}>{area.location}</Text>
                    <Text style={styles.painSeverity}>({area.severity})</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )
      )}

      {isEditing && (
        <View style={styles.actionButtons}>
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={isSaving}
            style={styles.saveButton}
          />
          <Button
            title="Cancel"
            onPress={handleCancel}
            variant="outline"
            style={styles.cancelButton}
          />
        </View>
      )}
    </ScrollView>
  );
}