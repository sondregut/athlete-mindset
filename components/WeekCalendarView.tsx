import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SessionLog } from '@/types/session';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  addWeeks, 
  subWeeks,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isFuture
} from 'date-fns';
import Card from './Card';
import MonthlyCalendarView from './MonthlyCalendarView';

interface WeekCalendarViewProps {
  sessions: SessionLog[];
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
}

export default function WeekCalendarView({ sessions, onDateSelect, selectedDate }: WeekCalendarViewProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [showMonthlyCalendar, setShowMonthlyCalendar] = useState(false);
  const colors = useThemeColors();

  useEffect(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });
    setWeekDays(days);
  }, [currentWeek]);

  const getSessionsForDate = (date: Date) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.createdAt);
      return isSameDay(sessionDate, date);
    });
  };

  const getSessionTypeColor = (sessionType: string) => {
    switch (sessionType) {
      case 'training':
        return colors.primary;
      case 'competition':
        return colors.error;
      case 'recovery':
        return colors.success;
      case 'skill':
        return colors.secondary;
      default:
        return colors.darkGray;
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(direction === 'prev' ? subWeeks(currentWeek, 1) : addWeeks(currentWeek, 1));
  };

  const isCurrentWeek = () => {
    const now = new Date();
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const nowWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    return isSameDay(weekStart, nowWeekStart);
  };

  const styles = StyleSheet.create({
    container: {
      paddingVertical: 16,
      marginHorizontal: 16,
      marginBottom: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    navButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.cardBackground,
    },
    weekInfo: {
      alignItems: 'center',
    },
    monthYear: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      textDecorationLine: 'underline',
      textDecorationStyle: 'dotted',
      textDecorationColor: colors.primary,
    },
    weekRange: {
      fontSize: 14,
      color: colors.darkGray,
      marginTop: 2,
    },
    weekContainer: {
      flexDirection: 'row',
      paddingVertical: 8,
    },
    dayContainer: {
      alignItems: 'center',
      padding: 12,
      marginHorizontal: 4,
      borderRadius: 12,
      backgroundColor: colors.cardBackground,
      minWidth: 64,
      position: 'relative',
    },
    selectedDay: {
      backgroundColor: colors.primary,
    },
    todayContainer: {
      borderWidth: 2,
      borderColor: colors.primary,
    },
    dayName: {
      fontSize: 12,
      color: colors.darkGray,
      fontWeight: '500',
      marginBottom: 4,
    },
    dayNumber: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    todayText: {
      color: colors.primary,
    },
    selectedText: {
      color: colors.background,
    },
    futureText: {
      opacity: 0.4,
    },
    dotsContainer: {
      height: 20,
      justifyContent: 'center',
    },
    dotRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    sessionDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    emptyDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.mediumGray,
      opacity: 0.3,
    },
    moreSessions: {
      fontSize: 10,
      color: colors.darkGray,
      marginLeft: 2,
    },
    badge: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: colors.primary,
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedBadge: {
      backgroundColor: colors.background,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.background,
    },
    selectedBadgeText: {
      color: colors.primary,
    },
    legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 16,
      gap: 20,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontSize: 12,
      color: colors.darkGray,
    },
  });

  return (
    <Card style={styles.container}>
      {/* Week Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigateWeek('prev')}
          style={styles.navButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.weekInfo}
          onPress={() => setShowMonthlyCalendar(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.monthYear}>
            {format(currentWeek, 'MMMM yyyy')}
          </Text>
          <Text style={styles.weekRange}>
            Week {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'w')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => navigateWeek('next')}
          style={styles.navButton}
          activeOpacity={0.7}
        >
          <ChevronRight size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Week Days */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.weekContainer}
      >
          {weekDays.map((day, index) => {
          const daysSessions = getSessionsForDate(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const isFutureDate = isFuture(day);
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayContainer,
                isSelected && styles.selectedDay,
                isTodayDate && styles.todayContainer,
              ]}
              onPress={() => !isFutureDate && onDateSelect?.(day)}
              disabled={isFutureDate}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dayName,
                isSelected && styles.selectedText,
                isFutureDate && styles.futureText,
              ]}>
                {format(day, 'EEE')}
              </Text>
              <Text style={[
                styles.dayNumber,
                isSelected && styles.selectedText,
                isTodayDate && styles.todayText,
                isFutureDate && styles.futureText,
              ]}>
                {format(day, 'd')}
              </Text>
              
              {/* Session Dots */}
              <View style={styles.dotsContainer}>
                {daysSessions.length > 0 ? (
                  <View style={styles.dotRow}>
                    {daysSessions.slice(0, 3).map((session, idx) => (
                      <View 
                        key={idx}
                        style={[
                          styles.sessionDot,
                          { backgroundColor: getSessionTypeColor(session.sessionType) }
                        ]} 
                      />
                    ))}
                    {daysSessions.length > 3 && (
                      <Text style={styles.moreSessions}>+{daysSessions.length - 3}</Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.emptyDot} />
                )}
              </View>
              
              {/* Session Count Badge */}
              {daysSessions.length > 0 && (
                <View style={[
                  styles.badge,
                  isSelected && styles.selectedBadge
                ]}>
                  <Text style={[
                    styles.badgeText,
                    isSelected && styles.selectedBadgeText
                  ]}>
                    {daysSessions.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Training</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text style={styles.legendText}>Competition</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Recovery</Text>
        </View>
      </View>
      
      <MonthlyCalendarView
        sessions={sessions}
        visible={showMonthlyCalendar}
        onClose={() => setShowMonthlyCalendar(false)}
        selectedDate={selectedDate}
        onDateSelect={(date) => {
          onDateSelect?.(date);
          setCurrentWeek(date);
        }}
        currentMonth={currentWeek}
      />
    </Card>
  );
}