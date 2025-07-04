import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { X } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SessionLog } from '@/types/session';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isFuture,
  isSameMonth,
  getDay,
  addMonths,
  subMonths
} from 'date-fns';
import Card from './Card';

interface MonthlyCalendarViewProps {
  sessions: SessionLog[];
  visible: boolean;
  onClose: () => void;
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  currentMonth: Date;
}

const { width: screenWidth } = Dimensions.get('window');

export default function MonthlyCalendarView({ 
  sessions, 
  visible, 
  onClose, 
  selectedDate,
  onDateSelect,
  currentMonth
}: MonthlyCalendarViewProps) {
  const [displayMonth, setDisplayMonth] = useState(currentMonth);
  const [monthDays, setMonthDays] = useState<(Date | null)[]>([]);
  const colors = useThemeColors();

  useEffect(() => {
    setDisplayMonth(currentMonth);
  }, [currentMonth]);

  useEffect(() => {
    const start = startOfMonth(displayMonth);
    const end = endOfMonth(displayMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Add empty days for the start of the week
    const startDayOfWeek = getDay(start);
    const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Monday as first day
    const emptyDays = Array(adjustedStartDay).fill(null);
    
    setMonthDays([...emptyDays, ...days]);
  }, [displayMonth]);

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

  const navigateMonth = (direction: 'prev' | 'next') => {
    setDisplayMonth(direction === 'prev' ? subMonths(displayMonth, 1) : addMonths(displayMonth, 1));
  };

  const handleDateSelect = (day: Date) => {
    if (!isFuture(day)) {
      onDateSelect?.(day);
      onClose();
    }
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingTop: 120, // Position below the header
    },
    container: {
      width: screenWidth - 32,
      maxWidth: 400,
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    monthNavigation: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    navButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.cardBackground,
    },
    monthText: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.cardBackground,
    },
    weekDaysRow: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    weekDayCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
    },
    weekDayText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.darkGray,
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      padding: 4,
    },
    dayContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: colors.cardBackground,
      position: 'relative',
    },
    selectedDay: {
      backgroundColor: colors.primary,
    },
    todayDay: {
      borderWidth: 2,
      borderColor: colors.primary,
    },
    dayNumber: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    selectedDayText: {
      color: colors.background,
    },
    todayText: {
      color: colors.primary,
    },
    futureText: {
      opacity: 0.4,
    },
    dotsContainer: {
      position: 'absolute',
      bottom: 4,
      flexDirection: 'row',
      gap: 2,
    },
    sessionDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
    },
    sessionCount: {
      position: 'absolute',
      top: 2,
      right: 2,
      backgroundColor: colors.primary,
      width: 16,
      height: 16,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedCount: {
      backgroundColor: colors.background,
    },
    countText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.background,
    },
    selectedCountText: {
      color: colors.primary,
    },
    emptyCell: {
      backgroundColor: 'transparent',
    },
    legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
      gap: 16,
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modal} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.monthNavigation}>
                <TouchableOpacity
                  onPress={() => navigateMonth('prev')}
                  style={styles.navButton}
                >
                  <Text style={{ color: colors.primary, fontSize: 18 }}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.monthText}>
                  {format(displayMonth, 'MMMM yyyy')}
                </Text>
                <TouchableOpacity
                  onPress={() => navigateMonth('next')}
                  style={styles.navButton}
                >
                  <Text style={{ color: colors.primary, fontSize: 18 }}>›</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDaysRow}>
              {weekDays.map((day) => (
                <View key={day} style={styles.weekDayCell}>
                  <Text style={styles.weekDayText}>{day}</Text>
                </View>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {monthDays.map((day, index) => {
                if (!day) {
                  return (
                    <View key={`empty-${index}`} style={styles.dayCell}>
                      <View style={[styles.dayContent, styles.emptyCell]} />
                    </View>
                  );
                }

                const daysSessions = getSessionsForDate(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                const isFutureDate = isFuture(day);
                const isCurrentMonth = isSameMonth(day, displayMonth);

                return (
                  <TouchableOpacity
                    key={day.toISOString()}
                    style={styles.dayCell}
                    onPress={() => handleDateSelect(day)}
                    disabled={isFutureDate}
                  >
                    <View style={[
                      styles.dayContent,
                      isSelected && styles.selectedDay,
                      isTodayDate && styles.todayDay,
                    ]}>
                      <Text style={[
                        styles.dayNumber,
                        isSelected && styles.selectedDayText,
                        isTodayDate && !isSelected && styles.todayText,
                        isFutureDate && styles.futureText,
                        !isCurrentMonth && styles.futureText,
                      ]}>
                        {format(day, 'd')}
                      </Text>

                      {daysSessions.length > 0 && (
                        <>
                          <View style={styles.dotsContainer}>
                            {[...new Set(daysSessions.map(s => s.sessionType))].slice(0, 3).map((type, idx) => (
                              <View
                                key={idx}
                                style={[
                                  styles.sessionDot,
                                  { backgroundColor: getSessionTypeColor(type) }
                                ]}
                              />
                            ))}
                          </View>
                          <View style={[
                            styles.sessionCount,
                            isSelected && styles.selectedCount
                          ]}>
                            <Text style={[
                              styles.countText,
                              isSelected && styles.selectedCountText
                            ]}>
                              {daysSessions.length}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

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
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}