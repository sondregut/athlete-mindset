import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Platform, TouchableOpacity, Modal, Dimensions, NativeScrollEvent, NativeSyntheticEvent, ActionSheetIOS, Alert } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSessionStore } from '@/store/session-store';
import { SessionLog, SessionType } from '@/types/session';
import { mindsetCues } from '@/constants/mindset-cues';
import { MoreVertical } from 'lucide-react-native';
import Button from '@/components/Button';
import Card from '@/components/Card';
import SelectableTag from '@/components/SelectableTag';
import StarRating from '@/components/StarRating';
import SessionTypeIcon from '@/components/SessionTypeIcon';
import RPESlider from '@/components/RPESlider';
import SessionHistoryModal from '@/components/SessionHistoryModal';

// Helper function to format duration from seconds to HH:MM:SS
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${secs}`;
}

// Step 1: Initial Setup
function SetupStep({
  date,
  sessionType,
  customSessionType,
  activity,
  duration,
  isPostOnly,
  onDateChange,
  onSessionTypeChange,
  onCustomSessionTypeChange,
  onActivityChange,
  onDurationChange,
  onContinue,
  onBack,
  onShowHistory,
  colors,
  styles,
}: {
  date: string;
  sessionType: SessionType;
  customSessionType: string;
  activity: string;
  duration?: number;
  isPostOnly?: boolean;
  onDateChange: (date: string) => void;
  onSessionTypeChange: (type: SessionType) => void;
  onCustomSessionTypeChange: (value: string) => void;
  onActivityChange: (value: string) => void;
  onDurationChange?: (value: number) => void;
  onContinue: () => void;
  onBack?: () => void;
  onShowHistory?: () => void;
  colors: any;
  styles: any;
}) {
  const sessionTypes: { value: SessionType; label: string }[] = [
    { value: 'training', label: 'Training' },
    { value: 'competition', label: 'Competition' },
    { value: 'other', label: 'Other' },
  ];

  const [showDateModal, setShowDateModal] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const getDateOptions = () => {
    const today = new Date();
    const options = [];
    
    // Add today and past 30 days (no future dates)
    for (let i = -30; i <= 0; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      options.push({
        date: date.toISOString().split('T')[0],
        label: i === 0 ? 'Today' : 
               i === -1 ? 'Yesterday' :
               date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        isToday: i === 0
      });
    }
    // Reverse to show most recent dates first (Today at top)
    return options.reverse();
  };

  const dateOptions = getDateOptions();
  const todayIndex = dateOptions.findIndex(option => option.isToday);

  // Set today as default when opening the modal
  const handleOpenDateModal = () => {
    // Always default to today when opening the modal if no date is set
    if (!date || date !== new Date().toISOString().split('T')[0]) {
      const todayDate = new Date().toISOString().split('T')[0];
      onDateChange(todayDate);
    }
    setShowDateModal(true);
    
    // No need to scroll since Today is at the top
  };

  return (
    <Card>
      <Text style={styles.stepTitle}>{isPostOnly ? 'Session Details' : 'Session Setup'}</Text>
      
      <Text style={styles.inputLabel}>Date</Text>
      <TouchableOpacity 
        style={styles.dateButton} 
        onPress={handleOpenDateModal}
      >
        <Text style={styles.dateButtonText}>
          {dateOptions.find(opt => opt.date === date)?.label || new Date(date).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
      
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <ScrollView 
              ref={scrollViewRef}
              style={styles.dateOptionsContainer}
            >
              {dateOptions.map((option) => (
                <TouchableOpacity
                  key={option.date}
                  style={[
                    styles.dateOption,
                    option.date === date && styles.selectedDateOption
                  ]}
                  onPress={() => {
                    onDateChange(option.date);
                    setShowDateModal(false);
                  }}
                >
                  <Text style={[
                    styles.dateOptionText,
                    option.date === date && styles.selectedDateOptionText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDateModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <Text style={styles.inputLabel}>Session Type</Text>
      <View style={styles.sessionTypeContainer}>
        {sessionTypes.map((type) => (
          <SelectableTag
            key={type.value}
            label={type.label}
            selected={sessionType === type.value}
            onPress={() => onSessionTypeChange(type.value)}
          />
        ))}
      </View>
      
      {sessionType === 'other' && (
        <>
          <Text style={styles.inputLabel}>Custom Session Type</Text>
          <TextInput
            style={styles.input}
            value={customSessionType}
            onChangeText={onCustomSessionTypeChange}
            placeholder="Enter custom session type"
            placeholderTextColor={colors.darkGray}
          />
        </>
      )}
      
      <Text style={styles.inputLabel}>Training Activity</Text>
      <TextInput
        style={styles.input}
        value={activity}
        onChangeText={onActivityChange}
        placeholder="e.g., Pole vaulting - long approach"
        placeholderTextColor={colors.darkGray}
      />
      
      {isPostOnly && (
        <>
          <Text style={styles.inputLabel}>Session Duration (minutes)</Text>
          <TextInput
            style={styles.input}
            value={duration ? duration.toString() : ''}
            onChangeText={(text) => {
              const num = parseInt(text, 10);
              if (!isNaN(num) && num >= 0) {
                onDurationChange?.(num);
              } else if (text === '') {
                onDurationChange?.(0);
              }
            }}
            placeholder="e.g., 45"
            placeholderTextColor={colors.darkGray}
            keyboardType="numeric"
          />
        </>
      )}
      
      <View style={styles.buttonContainer}>
        {onBack && (
          <Button
            title="Back"
            onPress={onBack}
            style={[styles.actionButton, styles.backButton] as any}
            variant="outline"
          />
        )}
        <Button
          title="Continue"
          onPress={onContinue}
          style={[styles.actionButton, styles.continueButton] as any}
        />
      </View>
    </Card>
  );
}

// Step 2: Set Intention
function IntentionStep({
  intention,
  selectedCues,
  notes,
  readinessRating,
  onIntentionChange,
  onCuesChange,
  onNotesChange,
  onReadinessChange,
  onStartSession,
  onBack,
  colors,
  styles,
}: {
  intention: string;
  selectedCues: string[];
  notes: string;
  readinessRating: number;
  onIntentionChange: (value: string) => void;
  onCuesChange: (cues: string[]) => void;
  onNotesChange: (value: string) => void;
  onReadinessChange: (value: number) => void;
  onStartSession: () => void;
  onBack?: () => void;
  colors: any;
  styles: any;
}) {
  const [customCue, setCustomCue] = useState('');
  const [showCustomCueInput, setShowCustomCueInput] = useState(false);

  const toggleCue = (cue: string) => {
    if (cue === 'Other') {
      setShowCustomCueInput(!showCustomCueInput);
      if (showCustomCueInput && customCue.trim()) {
        // Remove the custom cue when hiding input
        onCuesChange(selectedCues.filter(c => c !== customCue.trim()));
        setCustomCue('');
      }
    } else {
      if (selectedCues.includes(cue)) {
        onCuesChange(selectedCues.filter((c) => c !== cue));
      } else {
        onCuesChange([...selectedCues, cue]);
      }
    }
  };

  const handleCustomCueSubmit = () => {
    if (customCue.trim() && !selectedCues.includes(customCue.trim())) {
      // Remove any previous custom cue and add the new one
      const filteredCues = selectedCues.filter(c => !mindsetCues.includes(c) || c === 'Other');
      onCuesChange([...filteredCues, customCue.trim()]);
    }
  };

  return (
    <Card>
      <Text style={styles.stepTitle}>Set Your Intention</Text>
      
      <Text style={styles.inputLabel}>Main Focus/Intention</Text>
      <TextInput
        style={[styles.input, styles.intentionInput]}
        value={intention}
        onChangeText={onIntentionChange}
        placeholder="What's your main focus for this session?"
        placeholderTextColor={colors.darkGray}
        multiline
        numberOfLines={2}
        textAlignVertical="top"
      />
      
      <Text style={styles.inputLabel}>Mindset Cues</Text>
      <View style={styles.cuesContainer}>
        {mindsetCues.map((cue) => (
          <SelectableTag
            key={cue}
            label={cue}
            selected={cue === 'Other' ? showCustomCueInput : selectedCues.includes(cue)}
            onPress={() => toggleCue(cue)}
          />
        ))}
      </View>
      
      {showCustomCueInput && (
        <View style={styles.customCueContainer}>
          <TextInput
            style={styles.customCueInput}
            value={customCue}
            onChangeText={setCustomCue}
            onBlur={handleCustomCueSubmit}
            placeholder="Enter your custom mindset cue"
            placeholderTextColor={colors.darkGray}
            returnKeyType="done"
            onSubmitEditing={handleCustomCueSubmit}
          />
        </View>
      )}
      
      <Text style={styles.inputLabel}>Quick Notes (Optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={notes}
        onChangeText={onNotesChange}
        placeholder="Any additional notes for this session..."
        placeholderTextColor={colors.darkGray}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
      
      <RPESlider
        title="Readiness Rating (1-10)"
        value={readinessRating}
        onValueChange={onReadinessChange}
        minimumValue={1}
        maximumValue={10}
        step={1}
      />
      
      <View style={styles.buttonContainer}>
        {onBack && (
          <Button
            title="Back"
            onPress={onBack}
            style={[styles.actionButton, styles.backButton] as any}
            variant="outline"
          />
        )}
        <Button
          title="Start Session"
          onPress={onStartSession}
          style={[styles.actionButton, styles.continueButton] as any}
        />
      </View>
    </Card>
  );
}

// Step 3: Session Underway
function SessionUnderwayStep({
  sessionData,
  elapsedTime,
  onFinishSession,
  onBack,
  onRestartTimer,
  isEditMode,
  colors,
  styles,
}: {
  sessionData: Partial<SessionLog>;
  elapsedTime: string;
  onFinishSession: () => void;
  onBack?: () => void;
  onRestartTimer?: () => void;
  isEditMode?: boolean;
  colors: any;
  styles: any;
}) {
  const sessionType = sessionData.sessionType || 'training';
  const customSessionType = sessionData.customSessionType || '';
  const activity = sessionData.activity || '';
  const intention = sessionData.intention || '';
  const mindsetCues = sessionData.mindsetCues || [];

  const handleSessionOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Restart Timer'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1 && onRestartTimer) {
            onRestartTimer();
          }
        }
      );
    } else {
      Alert.alert(
        'Session Options',
        '',
        [
          {
            text: 'Restart Timer',
            onPress: onRestartTimer,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    }
  };

  return (
    <Card>
      <View style={styles.sessionUnderwayHeader}>
        <Text style={styles.stepTitle}>Session Underway</Text>
        {onRestartTimer && !isEditMode && (
          <TouchableOpacity 
            style={styles.moreButton} 
            onPress={handleSessionOptions}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreVertical size={20} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.sessionInfoContainer}>
        <View style={styles.sessionTypeIconContainer}>
          <SessionTypeIcon type={sessionType} size={32} />
        </View>
        <View style={styles.sessionInfoTextContainer}>
          <Text style={styles.sessionInfoTitle}>{activity}</Text>
          <Text style={styles.sessionInfoSubtitle}>
            {sessionType === 'other' 
              ? customSessionType 
              : sessionType.charAt(0).toUpperCase() + sessionType.slice(1)}
          </Text>
        </View>
      </View>
      
      <View style={styles.intentionSummaryContainer}>
        <Text style={styles.intentionSummaryLabel}>Your Intention:</Text>
        <Text style={styles.intentionSummaryText}>{intention}</Text>
        
        {mindsetCues.length > 0 && (
          <View style={styles.cuesSummaryContainer}>
            <Text style={styles.cuesSummaryLabel}>Mindset Cues:</Text>
            <View style={styles.cuesSummaryList}>
              {mindsetCues.map((cue) => (
                <View key={cue} style={styles.cuesSummaryItem}>
                  <Text style={styles.cuesSummaryText}>{cue}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
      
      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>Session Time</Text>
        <Text style={styles.timerValue}>
          {isEditMode && sessionData.duration 
            ? formatDuration(sessionData.duration)
            : elapsedTime}
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        {onBack && (
          <Button
            title="Back"
            onPress={onBack}
            style={[styles.actionButton, styles.backButton] as any}
            variant="outline"
          />
        )}
        <Button
          title="Finish Session"
          onPress={onFinishSession}
          style={[styles.actionButton, styles.continueButton] as any}
          variant="secondary"
        />
      </View>
    </Card>
  );
}

// Step 4: Reflection
function ReflectionStep({
  positives,
  stretchGoal,
  rpe,
  sessionRating,
  isQuickPost,
  manualDuration,
  activity,
  onPositiveChange,
  onStretchGoalChange,
  onRpeChange,
  onSessionRatingChange,
  onManualDurationChange,
  onActivityChange,
  onCompleteSession,
  onBack,
  colors,
  styles,
}: {
  positives: string[];
  stretchGoal: string;
  rpe: number;
  sessionRating: number;
  isQuickPost?: boolean;
  manualDuration?: string;
  activity?: string;
  onPositiveChange: (index: number, value: string) => void;
  onStretchGoalChange: (value: string) => void;
  onRpeChange: (value: number) => void;
  onSessionRatingChange: (value: number) => void;
  onManualDurationChange?: (value: string) => void;
  onActivityChange?: (value: string) => void;
  onCompleteSession: () => void;
  onBack?: () => void;
  colors: any;
  styles: any;
}) {
  return (
    <Card>
      <Text style={styles.stepTitle}>Session Reflection</Text>
      
      {isQuickPost && (
        <>
          <Text style={styles.inputLabel}>What did you train?</Text>
          <TextInput
            style={styles.input}
            value={activity}
            onChangeText={onActivityChange}
            placeholder="e.g., Morning Run, Gym Session, Practice"
            placeholderTextColor={colors.darkGray}
          />
          
          {onManualDurationChange && (
            <>
              <Text style={styles.inputLabel}>Session Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={manualDuration}
                onChangeText={onManualDurationChange}
                placeholder="How long was your session?"
                placeholderTextColor={colors.darkGray}
                keyboardType="numeric"
              />
            </>
          )}
        </>
      )}
      
      <Text style={styles.inputLabel}>3 Positives from this session</Text>
      {[0, 1, 2].map((index) => (
        <TextInput
          key={index}
          style={[styles.input, styles.textArea]}
          value={positives[index] || ''}
          onChangeText={(text) => onPositiveChange(index, text)}
          placeholder={`Positive ${index + 1}`}
          placeholderTextColor={colors.darkGray}
          multiline={true}
          numberOfLines={3}
          textAlignVertical="top"
        />
      ))}
      
      <Text style={styles.inputLabel}>1 Stretch Goal for next time</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={stretchGoal}
        onChangeText={onStretchGoalChange}
        placeholder="What would make the next session even better?"
        placeholderTextColor={colors.darkGray}
        multiline={true}
        numberOfLines={3}
        textAlignVertical="top"
      />
      
      <RPESlider
        title="Rate of Perceived Exertion (1-10)"
        value={rpe}
        onValueChange={onRpeChange}
        minimumValue={1}
        maximumValue={10}
        step={1}
      />
      
      <Text style={styles.inputLabel}>Overall Session Rating</Text>
      <View style={styles.ratingContainer}>
        <StarRating
          rating={sessionRating}
          onRatingChange={onSessionRatingChange}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        {onBack && (
          <Button
            title="Back"
            onPress={onBack}
            style={[styles.actionButton, styles.backButton] as any}
            variant="outline"
          />
        )}
        <Button
          title="Save & Complete Session"
          onPress={onCompleteSession}
          style={[styles.actionButton, styles.continueButton] as any}
        />
      </View>
    </Card>
  );
}


export default function LogSessionScreen() {
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const isEditMode = !!params.edit;
  const isPostOnly = params.postOnly === 'true';
  const isQuickPost = params.quickPost === 'true';
  
  const [step, setStep] = useState(isPostOnly ? 4 : 1);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  // Scroll state
  const scrollViewRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get('window').width;
  
  const { 
    currentSession, 
    updateCurrentSession, 
    completeCurrentSession, 
    resetCurrentSession, 
    editSession,
    elapsedTime,
    startSessionTimer,
    stopSessionTimer,
    updateElapsedTime
  } = useSessionStore();
  
  // Step 1 state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionType, setSessionType] = useState<SessionType>('training');
  const [customSessionType, setCustomSessionType] = useState('');
  const [activity, setActivity] = useState('');
  const [duration, setDuration] = useState<number>(0);
  
  // Step 2 state
  const [intention, setIntention] = useState('');
  const [selectedCues, setSelectedCues] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [readinessRating, setReadinessRating] = useState(7);
  
  // Step 4 state
  const [positives, setPositives] = useState<string[]>(['', '', '']);
  const [stretchGoal, setStretchGoal] = useState('');
  const [rpe, setRpe] = useState(7);
  const [sessionRating, setSessionRating] = useState(0);
  const [manualDuration, setManualDuration] = useState('');
  
  // Session History Modal state
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const { getRecentLogs } = useSessionStore();
  
  // Reset state when screen is focused and no current session
  useFocusEffect(
    React.useCallback(() => {
      if (!currentSession) {
        // Reset all state for a fresh session
        const currentDate = new Date().toISOString().split('T')[0];
        setDate(currentDate);
        setSessionType('training');
        setCustomSessionType('');
        setActivity('');
        setIntention('');
        setSelectedCues([]);
        setNotes('');
        setReadinessRating(7);
        setPositives(['', '', '']);
        setStretchGoal('');
        setRpe(7);
        setSessionRating(0);
        setStartTime(null);
        setManualDuration('');
        
        if (isQuickPost) {
          // For quick post, create a minimal session and go to reflection
          const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          updateCurrentSession({
            id: sessionId,
            date: currentDate,
            createdAt: new Date().toISOString(),
            sessionType: 'training',
            activity: '',
            status: 'reflection',
            // Set empty defaults for skipped fields
            intention: '',
            mindsetCues: [],
            notes: '',
            readinessRating: 7,
          });
          setStep(4);
        } else {
          // Regular flow starts at step 1
          setStep(1);
        }
      } else if (currentSession.status === 'active' && currentSession.startTime && !isEditMode) {
        // Don't restart timer, just update the elapsed time
        // The timer is already running in the store
        updateElapsedTime();
      }
    }, [currentSession, updateElapsedTime, isEditMode, isQuickPost, updateCurrentSession])
  );

  // Simple scroll sync - only for button navigation
  useEffect(() => {
    if (scrollViewRef.current) {
      let targetX;
      if (isPostOnly) {
        // In post-only mode: step 1 = index 0, step 4 = index 1
        targetX = step === 1 ? 0 : screenWidth;
      } else {
        // Regular mode: step maps directly to index
        targetX = (step - 1) * screenWidth;
      }
      console.log('🎯 Syncing scroll to step:', step, 'targetX:', targetX);
      scrollViewRef.current.scrollTo({
        x: targetX,
        animated: true
      });
    }
  }, [step, screenWidth, isPostOnly]);

  useEffect(() => {
    // Initialize with current session data if available
    if (currentSession) {
      // Step 1 data
      if (currentSession.date) setDate(currentSession.date);
      if (currentSession.sessionType) setSessionType(currentSession.sessionType);
      if (currentSession.customSessionType) setCustomSessionType(currentSession.customSessionType);
      if (currentSession.activity) setActivity(currentSession.activity);
      
      // Step 2 data
      if (currentSession.intention) setIntention(currentSession.intention);
      if (currentSession.mindsetCues) setSelectedCues(currentSession.mindsetCues);
      if (currentSession.notes) setNotes(currentSession.notes);
      if (currentSession.readinessRating) setReadinessRating(currentSession.readinessRating);
      
      // Step 4 data
      if (currentSession.positives) setPositives(currentSession.positives);
      if (currentSession.stretchGoal) setStretchGoal(currentSession.stretchGoal);
      if (currentSession.rpe) setRpe(currentSession.rpe);
      if (currentSession.sessionRating) setSessionRating(currentSession.sessionRating);
      
      // Set the appropriate step based on edit mode or session status
      if (isEditMode) {
        // In edit mode, go to the final step for completed sessions
        setStep(4);
      } else if (currentSession.status === 'intention') {
        setStep(2);
      } else if (currentSession.status === 'active') {
        setStep(3);
        if (currentSession.startTime) {
          const start = new Date(currentSession.startTime);
          setStartTime(start);
          // Don't restart the timer here - it's already running
          // Just update the elapsed time
          updateElapsedTime();
        }
      }
    }
    
    // No cleanup needed here since timer is managed in store
  }, [isEditMode, updateElapsedTime]);
  
  
  
  const handleFinishSession = () => {
    console.log('📋 Finish session - moving to step 4');
    
    // Stop the global timer only if not in edit mode
    if (!isEditMode) {
      console.log('⏱️ Stopping session timer');
      stopSessionTimer();
    }
    
    const endTime = new Date().toISOString();
    const duration = startTime 
      ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) 
      : 0;
    
    console.log('📊 Session duration:', duration, 'seconds');
    
    // Update session data
    updateCurrentSession({
      endTime,
      duration,
      status: 'reflection',
    });
    
    // Navigate to step 4
    console.log('🚀 Navigating to reflection screen');
    navigateToStep(4);
  };
  
  const handleSelectSessionFromHistory = (session: SessionLog) => {
    // Populate form with selected session data
    setDate(session.date);
    setSessionType(session.sessionType);
    setCustomSessionType(session.customSessionType || '');
    setActivity(session.activity || '');
    setIntention(session.intention || '');
    setSelectedCues(session.mindsetCues || []);
    setNotes(session.notes || '');
    setReadinessRating(session.readinessRating || 7);
    
    // Close the modal
    setShowSessionHistory(false);
  };
  
  const handlePositiveChange = (index: number, value: string) => {
    const newPositives = [...positives];
    newPositives[index] = value;
    setPositives(newPositives);
  };
  
  const handleCompleteSession = () => {
    if (isEditMode && currentSession) {
      // In edit mode, update the existing session
      editSession(currentSession.id, {
        date,
        sessionType,
        customSessionType: sessionType === 'other' ? customSessionType : undefined,
        activity,
        intention,
        mindsetCues: selectedCues,
        notes,
        readinessRating,
        positives,
        stretchGoal,
        rpe,
        sessionRating,
        status: 'completed',
      });
      
      // Clear current session and navigate back
      setTimeout(() => {
        // Don't stop timer when editing - it's already stopped for completed sessions
        resetCurrentSession();
        router.replace('/');
      }, 150);
    } else {
      // Regular flow: Update current session with final reflection data, then complete it
      const updateData: any = {
        positives,
        stretchGoal,
        rpe,
        sessionRating,
        status: 'completed',
      };
      
      // For quick post sessions, add activity and manual duration
      if (isQuickPost) {
        updateData.activity = activity;
        
        if (manualDuration) {
          const durationMinutes = parseInt(manualDuration, 10);
          if (!isNaN(durationMinutes)) {
            updateData.duration = durationMinutes * 60; // Convert to seconds
            updateData.endTime = new Date().toISOString();
            // Set a start time based on duration
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - (durationMinutes * 60 * 1000));
            updateData.startTime = startDate.toISOString();
          }
        }
      }
      
      updateCurrentSession(updateData);
      
      // Complete the session and navigate back to home
      // Using setTimeout to ensure the state update completes first
      setTimeout(async () => {
        if (!isQuickPost) {
          stopSessionTimer(); // Stop timer when completing session (not needed for quick post)
        }
        
        // Complete session and check for milestones
        try {
          const milestone = await completeCurrentSession();
          
          // Reset all local state for a fresh start next time
          setStep(1);
          setDate(new Date().toISOString().split('T')[0]);
          setSessionType('training');
          setCustomSessionType('');
          setActivity('');
          setIntention('');
          setSelectedCues([]);
          setNotes('');
          setReadinessRating(7);
          setPositives(['', '', '']);
          setStretchGoal('');
          setRpe(7);
          setSessionRating(0);
          
          // Navigate to home - milestone celebration will be shown there
          router.replace('/');
        } catch (error) {
          console.error('Error completing session:', error);
          // Still navigate home even if there's an error
          router.replace('/');
        }
      }, 150);
    }
  };

  const navigateToStep = (newStep: number) => {
    console.log('🎬 navigateToStep called with:', newStep);
    
    const maxStep = isPostOnly ? 4 : 4;
    if (newStep < 1 || newStep > maxStep) {
      console.log('❌ Invalid step number:', newStep);
      return;
    }
    
    // In post-only mode, we only have steps 1 and 4
    if (isPostOnly && newStep === 2) {
      newStep = 4;
    } else if (isPostOnly && newStep === 3) {
      return; // Skip step 3 in post-only mode
    }
    
    console.log('📊 Navigating from step', step, 'to step', newStep);
    setStep(newStep);
  };

  const handleBack = () => {
    if (isPostOnly && step === 4) {
      // In post-only mode, go from step 4 back to step 1
      navigateToStep(1);
    } else if (step > 1) {
      navigateToStep(step - 1);
    } else {
      // If backing out from the first step, check if any data has been entered
      const hasData = sessionType !== 'training' || // Non-default session type
        customSessionType.trim() !== '' ||
        activity.trim() !== '' ||
        date !== new Date().toISOString().split('T')[0]; // Non-default date
      
      // Reset the session if no meaningful data has been entered
      if (!hasData && currentSession) {
        resetCurrentSession();
      }
      
      router.back();
    }
  };

  // Simplified button handlers with direct timer management
  const handleContinueFromSetup = () => {
    console.log('📋 Continue from setup - moving to step', isPostOnly ? 4 : 2);
    
    // Only create/update session when user has entered meaningful data
    const sessionId = currentSession?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (isPostOnly) {
      // For post-only sessions, calculate end time based on duration
      const sessionDate = new Date(date);
      const endTime = new Date(sessionDate);
      endTime.setMinutes(endTime.getMinutes() + duration);
      
      // Update session data for post-only mode
      updateCurrentSession({
        id: sessionId,
        date,
        createdAt: currentSession?.createdAt || new Date().toISOString(),
        sessionType,
        customSessionType: sessionType === 'other' ? customSessionType : undefined,
        activity,
        status: 'reflection',
        // Set times based on duration
        startTime: sessionDate.toISOString(),
        endTime: endTime.toISOString(),
        duration: duration * 60, // Convert minutes to seconds
        // Set empty defaults for skipped fields
        intention: '',
        mindsetCues: [],
        notes: '',
        readinessRating: 7,
      });
      
      // Navigate directly to reflection step
      navigateToStep(4);
    } else {
      // Regular flow
      updateCurrentSession({
        id: sessionId,
        date,
        createdAt: currentSession?.createdAt || new Date().toISOString(),
        sessionType,
        customSessionType: sessionType === 'other' ? customSessionType : undefined,
        activity,
        status: 'intention',
      });
      
      // Navigate to step 2
      navigateToStep(2);
    }
  };

  const handleStartSession = () => {
    console.log('📋 Start session - moving to step 3');
    
    // Update session data and start timer
    const now = new Date();
    setStartTime(now);
    
    updateCurrentSession({
      intention,
      mindsetCues: selectedCues,
      notes,
      readinessRating,
      startTime: now.toISOString(),
      status: 'active',
    });
    
    // Start the timer only if not in edit mode
    if (!isEditMode) {
      console.log('⏱️ Starting session timer');
      startSessionTimer();
    }
    
    // Navigate to step 3
    navigateToStep(3);
  };

  const handleRestartTimer = () => {
    // Don't allow timer restart in edit mode
    if (isEditMode) {
      console.log('⚠️ Cannot restart timer in edit mode');
      return;
    }
    
    console.log('🔄 Restarting session timer');
    
    // Stop the current timer
    stopSessionTimer();
    
    // Update the start time to now
    const now = new Date();
    setStartTime(now);
    
    // Update the session with new start time
    updateCurrentSession({
      startTime: now.toISOString(),
    });
    
    // Start the timer again
    startSessionTimer();
  };

  // Simple swipe detection using momentum end
  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newStepIndex = Math.round(offsetX / screenWidth);
    let newStep;
    
    if (isPostOnly) {
      // In post-only mode, map index to actual step numbers (1 or 4)
      newStep = newStepIndex === 0 ? 1 : 4;
    } else {
      newStep = newStepIndex + 1;
    }
    
    console.log('🏁 Momentum scroll end - offsetX:', offsetX, 'newStep:', newStep, 'currentStep:', step);
    
    // Only update step if it's valid and different
    const maxStep = isPostOnly ? 4 : 4;
    if (newStep !== step && newStep >= 1 && newStep <= maxStep) {
      if (canSwipeToStep(newStep)) {
        console.log('✅ Swipe completed to step', newStep);
        setStep(newStep);
      } else {
        console.log('❌ Swipe blocked - bouncing back to step', step);
        // Bounce back to current step
        if (scrollViewRef.current) {
          const targetX = isPostOnly ? (step === 1 ? 0 : screenWidth) : (step - 1) * screenWidth;
          scrollViewRef.current.scrollTo({
            x: targetX,
            animated: true
          });
        }
      }
    }
  };
  
  const canSwipeToStep = (targetStep: number): boolean => {
    // Always allow going backwards via swipe
    if (targetStep < step) return true;
    
    if (isPostOnly) {
      // In post-only mode, allow direct swipe between step 1 and 4
      return (step === 1 && targetStep === 4) || (step === 4 && targetStep === 1);
    }
    
    // Block swiping forward from step 3 to step 4 - must use finish button
    if (step === 3 && targetStep === 4) {
      return false;
    }
    
    // Allow swiping forward for adjacent steps only
    return targetStep === step + 1;
  };
  
  
  const renderStepContent = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return (
          <SetupStep
            date={date}
            sessionType={sessionType}
            customSessionType={customSessionType}
            activity={activity}
            duration={duration}
            isPostOnly={isPostOnly}
            onDateChange={setDate}
            onSessionTypeChange={setSessionType}
            onCustomSessionTypeChange={setCustomSessionType}
            onActivityChange={setActivity}
            onDurationChange={setDuration}
            onContinue={handleContinueFromSetup}
            onBack={handleBack}
            onShowHistory={() => setShowSessionHistory(true)}
            colors={colors}
            styles={styles}
          />
        );
      case 2:
        return (
          <IntentionStep
            intention={intention}
            selectedCues={selectedCues}
            notes={notes}
            readinessRating={readinessRating}
            onIntentionChange={setIntention}
            onCuesChange={setSelectedCues}
            onNotesChange={setNotes}
            onReadinessChange={setReadinessRating}
            onStartSession={handleStartSession}
            onBack={handleBack}
            colors={colors}
            styles={styles}
          />
        );
      case 3:
        return (
          <SessionUnderwayStep
            sessionData={currentSession || {}}
            elapsedTime={elapsedTime}
            onFinishSession={handleFinishSession}
            onBack={handleBack}
            onRestartTimer={handleRestartTimer}
            isEditMode={isEditMode}
            colors={colors}
            styles={styles}
          />
        );
      case 4:
        return (
          <ReflectionStep
            positives={positives}
            stretchGoal={stretchGoal}
            rpe={rpe}
            sessionRating={sessionRating}
            isQuickPost={isQuickPost}
            manualDuration={manualDuration}
            activity={activity}
            onPositiveChange={handlePositiveChange}
            onStretchGoalChange={setStretchGoal}
            onRpeChange={setRpe}
            onSessionRatingChange={setSessionRating}
            onManualDurationChange={setManualDuration}
            onActivityChange={setActivity}
            onCompleteSession={handleCompleteSession}
            onBack={handleBack}
            colors={colors}
            styles={styles}
          />
        );
      default:
        return null;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    horizontalScrollView: {
      flex: 1,
    },
    horizontalContentContainer: {
      flexDirection: 'row',
    },
    stepContainer: {
      flex: 1,
      height: '100%',
    },
    verticalScrollView: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 32,
    },
    stepIndicatorContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      height: 44, // Back to standard nav bar height
      paddingHorizontal: 16, // iOS standard horizontal padding
      paddingTop: 8, // Minimal top padding
      paddingBottom: 4, // Minimal bottom padding
      marginBottom: 4, // Minimal space before content
      alignItems: 'center', // Center the dots vertically
    },
    stepIndicator: {
      width: 8, // Slightly smaller dots for cleaner look
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.mediumGray,
      marginHorizontal: 8, // iOS standard 8pt spacing between elements
    },
    activeStepIndicator: {
      backgroundColor: colors.primary,
      width: 10, // Proportional to the smaller base size
      height: 10,
      borderRadius: 5,
    },
    completedStepIndicator: {
      backgroundColor: colors.primary,
      opacity: 0.5,
    },
    stepTitle: {
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 16,
      color: colors.text,
      textAlign: 'center',
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 8,
      marginTop: 16,
      color: colors.text,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.mediumGray,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      marginBottom: 8,
    },
    textArea: {
      minHeight: 80,
      maxHeight: 120,
      textAlignVertical: 'top',
      paddingTop: 12,
    },
    intentionInput: {
      minHeight: 60,
      paddingTop: 12,
    },
    sessionTypeContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    cuesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    customCueContainer: {
      marginBottom: 16,
      marginTop: 8,
    },
    customCueInput: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    actionButton: {
      flex: 1,
    },
    backButton: {
      marginRight: 8,
    },
    continueButton: {
      marginTop: 24,
    },
    sessionInfoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      padding: 16,
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
    },
    sessionTypeIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    sessionInfoTextContainer: {
      flex: 1,
    },
    sessionInfoTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    sessionInfoSubtitle: {
      fontSize: 14,
      color: colors.darkGray,
      marginTop: 4,
    },
    intentionSummaryContainer: {
      marginBottom: 16,
      padding: 16,
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
    },
    intentionSummaryLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    intentionSummaryText: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 22,
    },
    cuesSummaryContainer: {
      marginTop: 12,
    },
    cuesSummaryLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    cuesSummaryList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    cuesSummaryItem: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 6,
      marginBottom: 6,
    },
    cuesSummaryText: {
      color: colors.background,
      fontSize: 12,
      fontWeight: '500',
    },
    timerContainer: {
      alignItems: 'center',
      marginVertical: 24,
    },
    timerLabel: {
      fontSize: 14,
      color: colors.darkGray,
      marginBottom: 4,
    },
    timerValue: {
      fontSize: 36,
      fontWeight: '700',
      color: colors.primary,
      fontVariant: ['tabular-nums'],
    },
    sessionUnderwayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    moreButton: {
      padding: 4,
    },
    ratingContainer: {
      alignItems: 'center',
      marginTop: 8,
    },
    dateButton: {
      backgroundColor: colors.cardBackground,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    dateButtonText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    buttonContainer: {
      flexDirection: 'row',
      marginTop: 24,
      gap: 12,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 20,
      width: '80%',
      maxHeight: '60%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
      textAlign: 'center',
      color: colors.text,
    },
    dateOptionsContainer: {
      maxHeight: 300,
    },
    dateOption: {
      padding: 16,
      borderRadius: 8,
      marginBottom: 8,
      backgroundColor: colors.cardBackground,
      borderWidth: 2,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    selectedDateOption: {
      backgroundColor: colors.selectedBackground,
      borderColor: colors.selectedBorder,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    dateOptionText: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
      fontWeight: '500',
    },
    selectedDateOptionText: {
      color: colors.primary,
      fontWeight: '700',
    },
    modalCloseButton: {
      marginTop: 16,
      padding: 12,
      backgroundColor: colors.mediumGray,
      borderRadius: 8,
    },
    modalCloseButtonText: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
      fontWeight: '500',
    },
    historyButton: {
      marginTop: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.lightGray,
      borderRadius: 8,
      alignItems: 'center',
    },
    historyButtonText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.stepIndicatorContainer}>
        {(isPostOnly ? [1, 2] : [1, 2, 3, 4]).map((s, index) => {
          const actualStep = isPostOnly && s === 2 ? 4 : s;
          return (
            <View 
              key={s} 
              style={[
                styles.stepIndicator, 
                actualStep === step && styles.activeStepIndicator,
                actualStep < step && styles.completedStepIndicator,
              ]}
            />
          );
        })}
      </View>
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.horizontalScrollView}
        contentContainerStyle={styles.horizontalContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {(isPostOnly ? [1, 4] : [1, 2, 3, 4]).map((stepNumber) => (
          <View key={stepNumber} style={[styles.stepContainer, { width: screenWidth }]}>
            <ScrollView 
              style={styles.verticalScrollView} 
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {renderStepContent(stepNumber)}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
      
      <SessionHistoryModal
        isVisible={showSessionHistory}
        onClose={() => setShowSessionHistory(false)}
      />
    </View>
  );
}