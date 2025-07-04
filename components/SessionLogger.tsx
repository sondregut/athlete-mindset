import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Play, Clock, CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSessionStore } from '@/store/session-store';
import Card from './Card';
import Button from './Button';

interface SessionLoggerProps {
  compact?: boolean;
}

export default function SessionLogger({ compact = false }: SessionLoggerProps) {
  const { currentSession, elapsedTime } = useSessionStore();
  const colors = useThemeColors();

  const handleStartSession = () => {
    router.push('/log-session');
  };

  const handleLogPastSession = () => {
    router.push('/log-session?postOnly=true');
  };

  const handleContinueSession = () => {
    router.push('/log-session');
  };

  const handleQuickPostTraining = () => {
    router.push('/log-session?quickPost=true');
  };

  const getSessionStatusText = () => {
    if (!currentSession) return '';
    
    switch (currentSession.status) {
      case 'intention':
        return 'Pre-Training Setup in Progress';
      case 'active':
        return 'Training Session Active';
      case 'completed':
        return 'Session Ready to Complete';
      default:
        return 'Session in Progress';
    }
  };

  const getSessionTitle = () => {
    if (!currentSession) return '';
    return currentSession.activity || 
           (currentSession.sessionType === 'other' ? currentSession.customSessionType : null) || 
           currentSession.sessionType.charAt(0).toUpperCase() + currentSession.sessionType.slice(1);
  };

  // Render the compact view
  const renderCompactView = () => {
    if (currentSession) {
      return (
        <TouchableOpacity
          onPress={handleContinueSession}
          activeOpacity={0.7}
        >
          <Card style={styles.compactCard}>
            <View style={styles.compactHeader}>
              {currentSession.status === 'active' ? (
                <Clock size={24} color={colors.primary} />
              ) : currentSession.status === 'completed' ? (
                <CheckCircle size={24} color={colors.success} />
              ) : (
                <Play size={24} color={colors.primary} />
              )}
              <View style={styles.compactInfo}>
                <Text style={styles.compactTitle}>{getSessionStatusText()}</Text>
                <Text style={styles.compactSubtitle}>
                  {getSessionTitle()}
                  {currentSession.status === 'active' ? ` • ${elapsedTime}` : ''}
                </Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      );
    }

    return (
      <>
        <TouchableOpacity
          onPress={handleStartSession}
          activeOpacity={0.7}
        >
          <Card style={styles.compactCard}>
            <View style={styles.compactHeader}>
              <Play size={24} color={colors.primary} />
              <View style={styles.compactInfo}>
                <Text style={styles.compactTitle}>Start Training</Text>
                <Text style={styles.compactSubtitle}>Set your intentions and begin session</Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={handleLogPastSession}
          activeOpacity={0.7}
        >
          <Card style={styles.compactCard}>
            <View style={styles.compactHeader}>
              <Clock size={24} color={colors.secondary} />
              <View style={styles.compactInfo}>
                <Text style={styles.compactTitle}>Log Post Session Notes</Text>
                <Text style={styles.compactSubtitle}>Add reflection for completed session</Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      </>
    );
  };

  const styles = StyleSheet.create({
    compactCard: {
      marginHorizontal: 0,
      marginVertical: 8,
    },
    compactHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    compactInfo: {
      flex: 1,
      marginLeft: 12,
    },
    compactTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    compactSubtitle: {
      fontSize: 14,
      color: colors.darkGray,
    },
  });

  if (compact) {
    return renderCompactView();
  }

  // Non-compact view (if needed in the future)
  return renderCompactView();
}