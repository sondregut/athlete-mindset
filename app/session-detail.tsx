import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { MoreVertical, Calendar, Clock, Target, Star, Zap } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSessionStore } from '@/store/session-store';
import Card from '@/components/Card';
import Button from '@/components/Button';
import SessionTypeIcon from '@/components/SessionTypeIcon';
import StarRating from '@/components/StarRating';

export default function SessionDetailScreen() {
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const sessionId = params.sessionId as string;
  const { getSessionById, setCurrentSessionForEdit, deleteSession } = useSessionStore();
  
  const session = getSessionById(sessionId);

  const handleEdit = () => {
    if (session) {
      setCurrentSessionForEdit(session.id);
      router.push('/log-session?edit=true');
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSession(sessionId);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete session. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleMenuPress = () => {
    Alert.alert(
      'Session Options',
      undefined,
      [
        {
          text: 'Edit Session',
          onPress: handleEdit,
        },
        {
          text: 'Delete Session',
          onPress: handleDelete,
          style: 'destructive',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const getSessionTitle = () => {
    if (!session) return '';
    return session.activity || 
           (session.sessionType === 'other' ? session.customSessionType : null) || 
           session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1);
  };

  const getStatusText = () => {
    if (!session) return '';
    switch (session.status) {
      case 'intention':
        return 'Pre-Training Setup';
      case 'active':
        return 'Session In Progress';
      case 'completed':
        return '';
      default:
        return 'Unknown Status';
    }
  };

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
      padding: 24,
    },
    errorText: {
      fontSize: 18,
      color: colors.darkGray,
      marginBottom: 24,
      textAlign: 'center',
    },
    editButton: {
      padding: 8,
      marginRight: 8,
    },
    headerCard: {
      marginBottom: 16,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    headerText: {
      flex: 1,
    },
    sessionTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    statusText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 2,
    },
    timeText: {
      fontSize: 14,
      color: colors.darkGray,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    typeIconContainer: {
      width: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.darkGray,
      marginLeft: 8,
      marginRight: 8,
      minWidth: 60,
    },
    infoValue: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    fieldContainer: {
      marginBottom: 16,
    },
    fieldLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    fieldValue: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tag: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    tagText: {
      color: colors.background,
      fontSize: 14,
      fontWeight: '500',
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingText: {
      fontSize: 14,
      color: colors.darkGray,
      marginLeft: 8,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    listNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      marginRight: 8,
      minWidth: 20,
    },
    listText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
      lineHeight: 24,
    },
    ratingsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 8,
    },
    ratingItem: {
      alignItems: 'center',
    },
    rpeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    rpeValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
      marginLeft: 4,
    },
    editSessionButton: {
      marginTop: 16,
    },
  });

  if (!session) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Session Not Found" }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Session not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Stack.Screen 
        options={{ 
          title: "Session Details",
          headerRight: () => (
            <TouchableOpacity onPress={handleMenuPress} style={styles.editButton}>
              <MoreVertical size={20} color={colors.primary} />
            </TouchableOpacity>
          )
        }} 
      />
      
      {/* Header Card */}
      <Card style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <SessionTypeIcon type={session.sessionType} size={32} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.sessionTitle}>{getSessionTitle()}</Text>
            {getStatusText() !== '' && (
              <Text style={styles.statusText}>{getStatusText()}</Text>
            )}
            <Text style={styles.timeText}>
              {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
            </Text>
          </View>
        </View>
      </Card>

      {/* Session Info */}
      <Card>
        <Text style={styles.sectionTitle}>Session Information</Text>
        
        <View style={styles.infoRow}>
          <Calendar size={16} color={colors.darkGray} />
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>{formatDate(session.date)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.typeIconContainer}>
            <SessionTypeIcon type={session.sessionType} size={16} />
          </View>
          <Text style={styles.infoLabel}>Type:</Text>
          <Text style={styles.infoValue}>
            {session.sessionType === 'other' && session.customSessionType 
              ? session.customSessionType 
              : session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1)}
          </Text>
        </View>
        
        {session.activity && (
          <View style={styles.infoRow}>
            <Target size={16} color={colors.darkGray} />
            <Text style={styles.infoLabel}>Activity:</Text>
            <Text style={styles.infoValue}>{session.activity}</Text>
          </View>
        )}
        
        {session.duration && (
          <View style={styles.infoRow}>
            <Clock size={16} color={colors.darkGray} />
            <Text style={styles.infoLabel}>Duration:</Text>
            <Text style={styles.infoValue}>{formatDuration(session.duration)}</Text>
          </View>
        )}
      </Card>

      {/* Pre-Training Setup */}
      {(session.intention || session.mindsetCues?.length || session.notes || session.readinessRating) && (
        <Card>
          <Text style={styles.sectionTitle}>Pre-Training Setup</Text>
          
          {session.intention && (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Intention:</Text>
              <Text style={styles.fieldValue}>{session.intention}</Text>
            </View>
          )}
          
          {session.mindsetCues && session.mindsetCues.length > 0 && (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Mindset Cues:</Text>
              <View style={styles.tagsContainer}>
                {session.mindsetCues.map((cue, index) => (
                  <View key={`${cue}-${index}`} style={styles.tag}>
                    <Text style={styles.tagText}>{cue}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {session.notes && (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Notes:</Text>
              <Text style={styles.fieldValue}>{session.notes}</Text>
            </View>
          )}
          
          {session.readinessRating && (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Readiness Rating:</Text>
              <View style={styles.ratingContainer}>
                <StarRating rating={session.readinessRating} size={20} readonly />
                <Text style={styles.ratingText}>({session.readinessRating}/10)</Text>
              </View>
            </View>
          )}
        </Card>
      )}

      {/* Post-Training Reflection */}
      {session.status === 'completed' && (
        <Card>
          <Text style={styles.sectionTitle}>Post-Training Reflection</Text>
          
          {session.positives && session.positives.some(p => p.trim()) && (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Three Things That Went Well:</Text>
              {session.positives.map((positive, index) => (
                positive.trim() && (
                  <View key={`positive-${index}-${positive.slice(0, 10)}`} style={styles.listItem}>
                    <Text style={styles.listNumber}>{index + 1}.</Text>
                    <Text style={styles.listText}>{positive}</Text>
                  </View>
                )
              ))}
            </View>
          )}
          
          {session.stretchGoal && (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Stretch Goal for Next Time:</Text>
              <Text style={styles.fieldValue}>{session.stretchGoal}</Text>
            </View>
          )}
          
          <View style={styles.ratingsContainer}>
            {session.rpe && (
              <View style={styles.ratingItem}>
                <Text style={styles.fieldLabel}>RPE:</Text>
                <View style={styles.rpeContainer}>
                  <Zap size={20} color={colors.primary} />
                  <Text style={styles.rpeValue}>{session.rpe}/10</Text>
                </View>
              </View>
            )}
            
            {session.sessionRating && (
              <View style={styles.ratingItem}>
                <Text style={styles.fieldLabel}>Session Rating:</Text>
                <View style={styles.ratingContainer}>
                  <StarRating rating={session.sessionRating} size={20} />
                  <Text style={styles.ratingText}>({session.sessionRating}/5)</Text>
                </View>
              </View>
            )}
          </View>
        </Card>
      )}

      {/* Edit Button */}
      <Button
        title="Edit Session"
        onPress={handleEdit}
        style={styles.editSessionButton}
        variant="outline"
      />
    </ScrollView>
  );
}