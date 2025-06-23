import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  TouchableOpacity, 
  Modal, 
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { 
  Bell, 
  Clock, 
  Calendar, 
  Target, 
  Trophy, 
  Heart,
  Plus,
  Settings as SettingsIcon,
  ChevronRight,
  X
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useNotificationStore } from '@/store/notification-store';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import Card from './Card';
import Button from './Button';
import ErrorMessage from './ErrorMessage';

interface SettingItemProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

function SettingItem({ title, subtitle, icon, value, onValueChange, disabled = false }: SettingItemProps) {
  return (
    <View style={[styles.settingItem, disabled && styles.disabledItem]}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          {icon}
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, disabled && styles.disabledText]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, disabled && styles.disabledText]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.mediumGray, true: `${colors.primary}80` }}
        thumbColor={value ? colors.primary : colors.lightGray}
        ios_backgroundColor={colors.mediumGray}
      />
    </View>
  );
}

interface TimePickerProps {
  time: string;
  onTimeChange: (time: string) => void;
  title: string;
}

function TimePicker({ time, onTimeChange, title }: TimePickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [tempTime, setTempTime] = useState(time);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  const [selectedHour, selectedMinute] = tempTime.split(':');

  const handleSave = () => {
    onTimeChange(tempTime);
    setShowModal(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.timePickerButton} onPress={() => setShowModal(true)}>
        <View style={styles.timePickerContent}>
          <Text style={styles.timePickerLabel}>{title}</Text>
          <View style={styles.timePickerValue}>
            <Clock size={16} color={colors.primary} />
            <Text style={styles.timePickerTime}>{time}</Text>
            <ChevronRight size={16} color={colors.darkGray} />
          </View>
        </View>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.timePickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color={colors.darkGray} />
              </TouchableOpacity>
            </View>

            <View style={styles.timePickers}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Hour</Text>
                <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                  {hours.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timeOption,
                        selectedHour === hour && styles.selectedTimeOption
                      ]}
                      onPress={() => setTempTime(`${hour}:${selectedMinute}`)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        selectedHour === hour && styles.selectedTimeOptionText
                      ]}>
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Minute</Text>
                <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                  {minutes.map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.timeOption,
                        selectedMinute === minute && styles.selectedTimeOption
                      ]}
                      onPress={() => setTempTime(`${selectedHour}:${minute}`)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        selectedMinute === minute && styles.selectedTimeOptionText
                      ]}>
                        {minute}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Save Time"
                onPress={handleSave}
                style={styles.saveButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function NotificationSettings() {
  const {
    settings,
    permissionStatus,
    error,
    isRequestingPermission,
    isUpdatingSettings,
    requestPermission,
    updateSettings,
    checkPermissionStatus,
    clearError,
    rescheduleAllNotifications
  } = useNotificationStore();

  const { executeWithErrorHandling } = useErrorHandler();
  const [showCustomReminders, setShowCustomReminders] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const handlePermissionRequest = async () => {
    const granted = await executeWithErrorHandling(async () => {
      return await requestPermission();
    }, {
      fallbackMessage: 'Failed to request notification permission'
    });

    if (granted) {
      Alert.alert(
        'Notifications Enabled',
        'You can now receive training reminders and motivational messages!'
      );
    } else {
      Alert.alert(
        'Permission Denied',
        'You can enable notifications later in your device settings.',
        [
          { text: 'OK' },
          {
            text: 'Open Settings',
            onPress: () => {
              // On iOS, this would open settings
              if (Platform.OS === 'ios') {
                // Linking.openURL('app-settings:');
              }
            }
          }
        ]
      );
    }
  };

  const handleSettingChange = async (key: keyof typeof settings, value: any) => {
    await executeWithErrorHandling(async () => {
      await updateSettings({ [key]: value });
    }, {
      fallbackMessage: `Failed to update ${key} setting`
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  if (permissionStatus === 'denied') {
    return (
      <Card style={styles.container}>
        <View style={styles.permissionDenied}>
          <View style={styles.permissionIcon}>
            <Bell size={48} color={colors.darkGray} />
          </View>
          <Text style={styles.permissionTitle}>Notifications Disabled</Text>
          <Text style={styles.permissionMessage}>
            Enable notifications in your device settings to receive training reminders and stay on track with your goals.
          </Text>
          <Button
            title="Open Settings"
            onPress={() => {
              // Implementation would open device settings
              Alert.alert('Settings', 'Please enable notifications in your device settings.');
            }}
            variant="outline"
            style={styles.settingsButton}
          />
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <ErrorMessage
          message={error}
          onDismiss={clearError}
          variant="error"
        />
      )}

      {permissionStatus === 'undetermined' && (
        <Card style={styles.permissionCard}>
          <View style={styles.permissionContent}>
            <View style={styles.permissionIconContainer}>
              <Bell size={32} color={colors.primary} />
            </View>
            <Text style={styles.permissionCardTitle}>Enable Notifications</Text>
            <Text style={styles.permissionCardMessage}>
              Get timely reminders for your training sessions and stay motivated with progress updates.
            </Text>
            <Button
              title="Enable Notifications"
              onPress={handlePermissionRequest}
              loading={isRequestingPermission}
              style={styles.enableButton}
            />
          </View>
        </Card>
      )}

      {permissionStatus === 'granted' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Main Toggle */}
          <Card style={styles.settingsCard}>
            <SettingItem
              title="Notifications"
              subtitle="Receive training reminders and motivational messages"
              icon={<Bell size={20} color={settings.enabled ? colors.primary : colors.darkGray} />}
              value={settings.enabled}
              onValueChange={(value) => handleSettingChange('enabled', value)}
            />
          </Card>

          {/* Daily Reminders */}
          <Card style={styles.settingsCard}>
            <SettingItem
              title="Daily Training Reminder"
              subtitle="Get reminded to log your training session"
              icon={<Calendar size={20} color={colors.secondary} />}
              value={settings.dailyReminder}
              onValueChange={(value) => handleSettingChange('dailyReminder', value)}
              disabled={!settings.enabled}
            />
            
            {settings.dailyReminder && settings.enabled && (
              <View style={styles.timePickerContainer}>
                <TimePicker
                  time={settings.dailyReminderTime}
                  onTimeChange={(time) => handleSettingChange('dailyReminderTime', time)}
                  title="Reminder Time"
                />
                <Text style={styles.timeDisplayText}>
                  Daily reminder at {formatTime(settings.dailyReminderTime)}
                </Text>
              </View>
            )}
          </Card>

          {/* Goal & Progress Reminders */}
          <Card style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>Goals & Progress</Text>
            
            <SettingItem
              title="Weekly Goal Check-in"
              subtitle="Sunday reminder to review your weekly progress"
              icon={<Target size={20} color={colors.success} />}
              value={settings.weeklyGoalReminder}
              onValueChange={(value) => handleSettingChange('weeklyGoalReminder', value)}
              disabled={!settings.enabled}
            />
            
            <SettingItem
              title="Streak Motivation"
              subtitle="Encouraging messages to maintain your training streak"
              icon={<Trophy size={20} color='#FFD700' />}
              value={settings.streakMotivation}
              onValueChange={(value) => handleSettingChange('streakMotivation', value)}
              disabled={!settings.enabled}
            />
          </Card>

          {/* Session Reminders */}
          <Card style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>Session Management</Text>
            
            <SettingItem
              title="Session Completion Celebration"
              subtitle="Congratulatory messages when you complete sessions"
              icon={<Heart size={20} color='#E91E63' />}
              value={settings.sessionCompletionCelebration}
              onValueChange={(value) => handleSettingChange('sessionCompletionCelebration', value)}
              disabled={!settings.enabled}
            />
            
            <SettingItem
              title="Missed Session Reminder"
              subtitle="Gentle reminders if you haven't logged recently"
              icon={<Clock size={20} color='#FF9800' />}
              value={settings.missedSessionReminder}
              onValueChange={(value) => handleSettingChange('missedSessionReminder', value)}
              disabled={!settings.enabled}
            />
          </Card>

          {/* Custom Reminders Section */}
          <Card style={styles.settingsCard}>
            <View style={styles.customReminderHeader}>
              <Text style={styles.sectionTitle}>Custom Reminders</Text>
              <TouchableOpacity
                style={[
                  styles.addReminderButton,
                  (!settings.enabled) && styles.disabledButton
                ]}
                onPress={() => setShowCustomReminders(true)}
                disabled={!settings.enabled}
              >
                <Plus size={16} color={settings.enabled ? colors.primary : colors.darkGray} />
              </TouchableOpacity>
            </View>
            
            {settings.customReminders.length === 0 ? (
              <Text style={styles.noRemindersText}>
                No custom reminders set. Tap + to add one.
              </Text>
            ) : (
              <View style={styles.customRemindersList}>
                {settings.customReminders.map((reminder) => (
                  <View key={reminder.id} style={styles.customReminderItem}>
                    <View style={styles.customReminderContent}>
                      <Text style={styles.customReminderTitle}>{reminder.title}</Text>
                      <Text style={styles.customReminderTime}>
                        {formatTime(reminder.time)} • {reminder.daysOfWeek.length} days/week
                      </Text>
                    </View>
                    <Switch
                      value={reminder.enabled}
                      onValueChange={(value) => {
                        // This would update the specific custom reminder
                        console.log('Toggle custom reminder:', reminder.id, value);
                      }}
                      disabled={!settings.enabled}
                      trackColor={{ false: colors.mediumGray, true: `${colors.primary}80` }}
                      thumbColor={reminder.enabled ? colors.primary : colors.lightGray}
                    />
                  </View>
                ))}
              </View>
            )}
          </Card>

          {/* Actions */}
          <Card style={styles.actionsCard}>
            <Button
              title="Reschedule All Notifications"
              onPress={async () => {
                await executeWithErrorHandling(async () => {
                  await rescheduleAllNotifications();
                });
              }}
              variant="outline"
              loading={isUpdatingSettings}
              disabled={!settings.enabled}
            />
          </Card>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionCard: {
    padding: 24,
    marginBottom: 16,
  },
  permissionContent: {
    alignItems: 'center',
  },
  permissionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  permissionCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionCardMessage: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  enableButton: {
    minWidth: 200,
  },
  permissionDenied: {
    alignItems: 'center',
    padding: 32,
  },
  permissionIcon: {
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  permissionMessage: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  settingsButton: {
    minWidth: 150,
  },
  settingsCard: {
    padding: 0,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: colors.darkGray,
    lineHeight: 18,
  },
  disabledItem: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.darkGray,
  },
  timePickerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  timePickerButton: {
    marginTop: 8,
  },
  timePickerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  timePickerValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timePickerTime: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  timeDisplayText: {
    fontSize: 12,
    color: colors.darkGray,
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerModal: {
    backgroundColor: colors.background,
    borderRadius: 16,
    width: '85%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  timePickers: {
    flexDirection: 'row',
    padding: 20,
  },
  timeColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  timeColumnLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  timeScroll: {
    height: 200,
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedTimeOption: {
    backgroundColor: colors.primary,
  },
  timeOptionText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  selectedTimeOptionText: {
    color: colors.background,
    fontWeight: '600',
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  saveButton: {
    marginBottom: 0,
  },
  customReminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  addReminderButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: colors.lightGray,
  },
  noRemindersText: {
    fontSize: 14,
    color: colors.darkGray,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  customRemindersList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  customReminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  customReminderContent: {
    flex: 1,
  },
  customReminderTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  customReminderTime: {
    fontSize: 12,
    color: colors.darkGray,
  },
  actionsCard: {
    padding: 20,
    marginBottom: 20,
  },
});