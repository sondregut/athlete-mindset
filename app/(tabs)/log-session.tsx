import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Platform, TouchableOpacity, Modal, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/session-store';
import { SessionLog, SessionType } from '@/types/session';
import { mindsetCues } from '@/constants/mindset-cues';
import Button from '@/components/Button';
import Card from '@/components/Card';
import SelectableTag from '@/components/SelectableTag';
import StarRating from '@/components/StarRating';
import SessionTypeIcon from '@/components/SessionTypeIcon';
import RPESlider from '@/components/RPESlider';

// Step 1: Initial Setup
function SetupStep({
  date,
  sessionType,
  customSessionType,
  activity,
  onDateChange,
  onSessionTypeChange,
  onCustomSessionTypeChange,
  onActivityChange,
  onContinue,
  onBack,
}: {
  date: string;
  sessionType: SessionType;
  customSessionType: string;
  activity: string;
  onDateChange: (date: string) => void;
  onSessionTypeChange: (type: SessionType) => void;
  onCustomSessionTypeChange: (value: string) => void;
  onActivityChange: (value: string) => void;
  onContinue: () => void;
  onBack?: () => void;
}) {
  const sessionTypes: { value: SessionType; label: string }[] = [
    { value: 'training', label: 'Training' },
    { value: 'competition', label: 'Competition' },
    { value: 'recovery', label: 'Recovery' },
    { value: 'other', label: 'Other' },
  ];

  const [showDateModal, setShowDateModal] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const getDateOptions = () => {
    const today = new Date();
    const options = [];
    
    // Add past 7 days and future 7 days
    for (let i = -7; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      options.push({
        date: date.toISOString().split('T')[0],
        label: i === 0 ? 'Today' : 
               i === -1 ? 'Yesterday' :
               i === 1 ? 'Tomorrow' :
               date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        isToday: i === 0
      });
    }
    return options;
  };

  const dateOptions = getDateOptions();
  const todayIndex = dateOptions.findIndex(option => option.isToday);

  // Set today as default when opening the modal
  const handleOpenDateModal = () => {
    if (date === new Date().toISOString().split('T')[0]) {
      // If current date is today, keep it
      setShowDateModal(true);
    } else {
      // If current date is not today, auto-select today when opening
      const todayDate = new Date().toISOString().split('T')[0];
      onDateChange(todayDate);
      setShowDateModal(true);
    }
    
    // Immediately position scrollview to show today option (no animation)
    setTimeout(() => {
      if (scrollViewRef.current && todayIndex >= 0) {
        scrollViewRef.current.scrollTo({
          y: todayIndex * 56, // Approximate height of each option
          animated: false, // No animation - appear instantly
        });
      }
    }, 50); // Shorter delay - just enough for modal to render
  };

  return (
    <Card>
      <Text style={styles.stepTitle}>Session Setup</Text>
      
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
        placeholder="e.g., Weightlifting - Lower Body"
        placeholderTextColor={colors.darkGray}
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
}) {
  const toggleCue = (cue: string) => {
    if (selectedCues.includes(cue)) {
      onCuesChange(selectedCues.filter((c) => c !== cue));
    } else {
      onCuesChange([...selectedCues, cue]);
    }
  };

  return (
    <Card>
      <Text style={styles.stepTitle}>Set Your Intention</Text>
      
      <Text style={styles.inputLabel}>Main Focus/Intention</Text>
      <TextInput
        style={styles.input}
        value={intention}
        onChangeText={onIntentionChange}
        placeholder="What's your main focus for this session?"
        placeholderTextColor={colors.darkGray}
        multiline
      />
      
      <Text style={styles.inputLabel}>Mindset Cues</Text>
      <View style={styles.cuesContainer}>
        {mindsetCues.map((cue) => (
          <SelectableTag
            key={cue}
            label={cue}
            selected={selectedCues.includes(cue)}
            onPress={() => toggleCue(cue)}
          />
        ))}
      </View>
      
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
}: {
  sessionData: Partial<SessionLog>;
  elapsedTime: string;
  onFinishSession: () => void;
  onBack?: () => void;
}) {
  const sessionType = sessionData.sessionType || 'training';
  const customSessionType = sessionData.customSessionType || '';
  const activity = sessionData.activity || '';
  const intention = sessionData.intention || '';
  const mindsetCues = sessionData.mindsetCues || [];

  return (
    <Card>
      <Text style={styles.stepTitle}>Session Underway</Text>
      
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
        <Text style={styles.timerValue}>{elapsedTime}</Text>
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
  onPositiveChange,
  onStretchGoalChange,
  onRpeChange,
  onSessionRatingChange,
  onCompleteSession,
  onBack,
}: {
  positives: string[];
  stretchGoal: string;
  rpe: number;
  sessionRating: number;
  onPositiveChange: (index: number, value: string) => void;
  onStretchGoalChange: (value: string) => void;
  onRpeChange: (value: number) => void;
  onSessionRatingChange: (value: number) => void;
  onCompleteSession: () => void;
  onBack?: () => void;
}) {
  return (
    <Card>
      <Text style={styles.stepTitle}>Session Reflection</Text>
      
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
  const params = useLocalSearchParams();
  const isEditMode = !!params.edit;
  
  const [step, setStep] = useState(1);
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
  
  // Step 2 state
  const [intention, setIntention] = useState('');
  const [selectedCues, setSelectedCues] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [readinessRating, setReadinessRating] = useState(7);
  
  // Step 4 state
  const [positives, setPositives] = useState<string[]>(['', '', '']);
  const [stretchGoal, setStretchGoal] = useState('');
  const [rpe, setRpe] = useState(7);
  const [sessionRating, setSessionRating] = useState(3);
  
  // Reset state when screen is focused and no current session
  useFocusEffect(
    React.useCallback(() => {
      if (!currentSession) {
        // Reset all state for a fresh session
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
        setSessionRating(3);
        setStartTime(null);
        
        // Reset step state completely
        setStep(1);
      } else if (currentSession.status === 'active' && currentSession.startTime) {
        // Restart timer if we have an active session when focusing on this screen
        startSessionTimer();
      }
    }, [currentSession, startSessionTimer])
  );

  // Simple scroll sync - only for button navigation
  useEffect(() => {
    if (scrollViewRef.current) {
      const targetX = (step - 1) * screenWidth;
      console.log('🎯 Syncing scroll to step:', step, 'targetX:', targetX);
      scrollViewRef.current.scrollTo({
        x: targetX,
        animated: true
      });
    }
  }, [step, screenWidth]);

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
          // Use the store timer instead of local timer
          startSessionTimer();
        }
      }
    }
    
    // No cleanup needed here since timer is managed in store
  }, [isEditMode, startSessionTimer]);
  
  
  
  const handleFinishSession = () => {
    console.log('📋 Finish session - moving to step 4');
    
    // Stop the global timer
    console.log('⏱️ Stopping session timer');
    stopSessionTimer();
    
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
        stopSessionTimer(); // Stop timer when editing session
        resetCurrentSession();
        router.replace('/');
      }, 150);
    } else {
      // Regular flow: Update current session with final reflection data, then complete it
      updateCurrentSession({
        positives,
        stretchGoal,
        rpe,
        sessionRating,
        status: 'completed',
      });
      
      // Complete the session and navigate back to home
      // Using setTimeout to ensure the state update completes first
      setTimeout(() => {
        stopSessionTimer(); // Stop timer when completing session
        completeCurrentSession();
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
        setSessionRating(3);
        router.replace('/');
      }, 150);
    }
  };

  const navigateToStep = (newStep: number) => {
    console.log('🎬 navigateToStep called with:', newStep);
    
    if (newStep < 1 || newStep > 4) {
      console.log('❌ Invalid step number:', newStep);
      return;
    }
    
    console.log('📊 Navigating from step', step, 'to step', newStep);
    setStep(newStep);
  };

  const handleBack = () => {
    if (step > 1) {
      navigateToStep(step - 1);
    } else {
      // If backing out from the first step and no meaningful data has been entered, reset the session
      const hasData = currentSession && (
        currentSession.activity?.trim() ||
        currentSession.intention?.trim() ||
        currentSession.notes?.trim() ||
        (currentSession.mindsetCues && currentSession.mindsetCues.length > 0) ||
        currentSession.readinessRating !== undefined
      );
      
      if (!hasData) {
        resetCurrentSession();
      }
      
      router.back();
    }
  };

  // Simplified button handlers with direct timer management
  const handleContinueFromSetup = () => {
    console.log('📋 Continue from setup - moving to step 2');
    
    // Update session data
    updateCurrentSession({
      id: currentSession?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date,
      createdAt: new Date().toISOString(),
      sessionType,
      customSessionType: sessionType === 'other' ? customSessionType : undefined,
      activity,
      status: 'intention',
    });
    
    // Navigate to step 2
    navigateToStep(2);
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
    
    // Start the timer
    console.log('⏱️ Starting session timer');
    startSessionTimer();
    
    // Navigate to step 3
    navigateToStep(3);
  };

  // Simple swipe detection using momentum end
  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newStepIndex = Math.round(offsetX / screenWidth);
    const newStep = newStepIndex + 1;
    
    console.log('🏁 Momentum scroll end - offsetX:', offsetX, 'newStep:', newStep, 'currentStep:', step);
    
    // Only update step if it's valid and different
    if (newStep !== step && newStep >= 1 && newStep <= 4) {
      if (canSwipeToStep(newStep)) {
        console.log('✅ Swipe completed to step', newStep);
        setStep(newStep);
      } else {
        console.log('❌ Swipe blocked - bouncing back to step', step);
        // Bounce back to current step
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            x: (step - 1) * screenWidth,
            animated: true
          });
        }
      }
    }
  };
  
  const canSwipeToStep = (targetStep: number): boolean => {
    // Always allow going backwards via swipe
    if (targetStep < step) return true;
    
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
            onDateChange={setDate}
            onSessionTypeChange={setSessionType}
            onCustomSessionTypeChange={setCustomSessionType}
            onActivityChange={setActivity}
            onContinue={handleContinueFromSetup}
            onBack={handleBack}
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
          />
        );
      case 3:
        return (
          <SessionUnderwayStep
            sessionData={currentSession || {}}
            elapsedTime={elapsedTime}
            onFinishSession={handleFinishSession}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <ReflectionStep
            positives={positives}
            stretchGoal={stretchGoal}
            rpe={rpe}
            sessionRating={sessionRating}
            onPositiveChange={handlePositiveChange}
            onStretchGoalChange={setStretchGoal}
            onRpeChange={setRpe}
            onSessionRatingChange={setSessionRating}
            onCompleteSession={handleCompleteSession}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.stepIndicatorContainer}>
        {[1, 2, 3, 4].map((s) => (
          <View 
            key={s} 
            style={[
              styles.stepIndicator, 
              s === step && styles.activeStepIndicator,
              s < step && styles.completedStepIndicator,
            ]}
          />
        ))}
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
        {[1, 2, 3, 4].map((stepNumber) => (
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
    </View>
  );
}

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
});