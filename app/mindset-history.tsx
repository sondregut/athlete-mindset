import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Stack, router } from 'expo-router';
import { Calendar, Heart, Zap, Target, ChevronDown, X, Clock, Play, CheckCircle } from 'lucide-react-native';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { colors } from '@/constants/colors';
import { useMindsetStore, MindsetCheckin } from '@/store/mindset-store';
import { useSessionStore } from '@/store/session-store';
import { SessionLog } from '@/types/session';
import Card from '@/components/Card';
import Button from '@/components/Button';
import SessionLogItem from '@/components/SessionLogItem';

type HistoryTab = 'sessions' | 'mindset';

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<HistoryTab>('sessions');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Mindset store
  const { checkins } = useMindsetStore();
  
  // Session store
  const { logs: sessionLogs } = useSessionStore();

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const renderTabNavigation = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'sessions' && styles.activeTab]}
        onPress={() => setActiveTab('sessions')}
      >
        <Text style={[styles.tabText, activeTab === 'sessions' && styles.activeTabText]}>
          Session History
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'mindset' && styles.activeTab]}
        onPress={() => setActiveTab('mindset')}
      >
        <Text style={[styles.tabText, activeTab === 'mindset' && styles.activeTabText]}>
          Mindset History
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderMonthNavigator = () => (
    <Card style={styles.monthNavigator}>
      <TouchableOpacity 
        style={styles.navButton} 
        onPress={() => navigateMonth('prev')}
      >
        <ChevronDown size={20} color={colors.primary} style={{ transform: [{ rotate: '90deg' }] }} />
      </TouchableOpacity>
      
      <Text style={styles.monthTitle}>
        {format(selectedMonth, 'MMMM yyyy')}
      </Text>
      
      <TouchableOpacity 
        style={styles.navButton} 
        onPress={() => navigateMonth('next')}
      >
        <ChevronDown size={20} color={colors.primary} style={{ transform: [{ rotate: '-90deg' }] }} />
      </TouchableOpacity>
    </Card>
  );

  const renderSessionHistory = () => {
    // Group sessions by month
    const sessionsByMonth = useMemo(() => {
      const grouped: { [key: string]: SessionLog[] } = {};
      
      sessionLogs.forEach(session => {
        const monthKey = format(parseISO(session.createdAt), 'yyyy-MM');
        if (!grouped[monthKey]) {
          grouped[monthKey] = [];
        }
        grouped[monthKey].push(session);
      });
      
      return grouped;
    }, [sessionLogs]);

    // Get calendar data for selected month
    const calendarData = useMemo(() => {
      const start = startOfMonth(selectedMonth);
      const end = endOfMonth(selectedMonth);
      const days = eachDayOfInterval({ start, end });
      
      const monthKey = format(selectedMonth, 'yyyy-MM');
      const monthSessions = sessionsByMonth[monthKey] || [];
      
      return days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const sessions = monthSessions.filter(s => s.createdAt.startsWith(dateStr));
        return { date: day, sessions };
      });
    }, [selectedMonth, sessionsByMonth]);

    const getSessionIcon = (session: SessionLog) => {
      switch (session.status) {
        case 'completed':
        case 'reflection':
          return <CheckCircle size={12} color={colors.success} />;
        case 'active':
          return <Clock size={12} color={colors.primary} />;
        default:
          return <Play size={12} color={colors.darkGray} />;
      }
    };

    return (
      <>
        {/* Calendar Grid */}
        <Card style={styles.calendarCard}>
          <View style={styles.weekDays}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>
          
          <View style={styles.calendarGrid}>
            {/* Add empty cells for days before month starts */}
            {Array.from({ length: calendarData[0]?.date.getDay() || 0 }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.calendarDay} />
            ))}
            
            {/* Render calendar days */}
            {calendarData.map(({ date, sessions }) => (
              <TouchableOpacity
                key={date.toISOString()}
                style={[
                  styles.calendarDay,
                  sessions.length > 0 && styles.hasSession,
                ]}
                onPress={() => sessions.length > 0 && router.push(`/session-detail?sessionId=${sessions[0].id}`)}
                disabled={sessions.length === 0}
              >
                <Text style={[
                  styles.dayNumber,
                  sessions.length > 0 && styles.hasSessionText
                ]}>
                  {format(date, 'd')}
                </Text>
                {sessions.length > 0 && (
                  <View style={styles.sessionIndicators}>
                    {sessions.slice(0, 2).map((session, idx) => (
                      <View key={session.id} style={styles.sessionDot}>
                        {getSessionIcon(session)}
                      </View>
                    ))}
                    {sessions.length > 2 && (
                      <Text style={styles.moreSessionsText}>+{sessions.length - 2}</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Monthly Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Monthly Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {(sessionsByMonth[format(selectedMonth, 'yyyy-MM')] || []).length}
              </Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {(() => {
                  const monthSessions = sessionsByMonth[format(selectedMonth, 'yyyy-MM')] || [];
                  const completedSessions = monthSessions.filter(s => s.status === 'completed' || s.status === 'reflection');
                  return completedSessions.length;
                })()}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {(() => {
                  const monthSessions = sessionsByMonth[format(selectedMonth, 'yyyy-MM')] || [];
                  if (monthSessions.length === 0) return '0';
                  const withReadiness = monthSessions.filter(s => s.readinessRating !== undefined);
                  if (withReadiness.length === 0) return '0';
                  const avg = withReadiness.reduce((sum, s) => sum + (s.readinessRating || 0), 0) / withReadiness.length;
                  return avg.toFixed(1);
                })()}
              </Text>
              <Text style={styles.statLabel}>Avg Readiness</Text>
            </View>
          </View>
        </Card>

        {/* Recent Sessions List */}
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        {sessionLogs.slice(0, 10).map(session => (
          <SessionLogItem key={session.id} log={session} />
        ))}
      </>
    );
  };

  const renderMindsetHistory = () => {
    // Group checkins by month
    const checkinsByMonth = useMemo(() => {
      const grouped: { [key: string]: MindsetCheckin[] } = {};
      
      checkins.forEach(checkin => {
        const monthKey = format(parseISO(checkin.date), 'yyyy-MM');
        if (!grouped[monthKey]) {
          grouped[monthKey] = [];
        }
        grouped[monthKey].push(checkin);
      });
      
      return grouped;
    }, [checkins]);

    // Get calendar data for selected month
    const calendarData = useMemo(() => {
      const start = startOfMonth(selectedMonth);
      const end = endOfMonth(selectedMonth);
      const days = eachDayOfInterval({ start, end });
      
      const monthKey = format(selectedMonth, 'yyyy-MM');
      const monthCheckins = checkinsByMonth[monthKey] || [];
      
      return days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const checkin = monthCheckins.find(c => c.date === dateStr);
        return { date: day, checkin };
      });
    }, [selectedMonth, checkinsByMonth]);

    const getMoodColor = (mood: number) => {
      if (mood >= 8) return '#4CAF50';
      if (mood >= 6) return '#FF9800';
      if (mood >= 4) return '#FF5722';
      return '#9E9E9E';
    };

    return (
      <>
        {/* Calendar Grid */}
        <Card style={styles.calendarCard}>
          <View style={styles.weekDays}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>
          
          <View style={styles.calendarGrid}>
            {/* Add empty cells for days before month starts */}
            {Array.from({ length: calendarData[0]?.date.getDay() || 0 }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.calendarDay} />
            ))}
            
            {/* Render calendar days */}
            {calendarData.map(({ date, checkin }) => (
              <TouchableOpacity
                key={date.toISOString()}
                style={[
                  styles.calendarDay,
                  checkin && styles.hasCheckin,
                  checkin && { borderColor: getMoodColor(checkin.mood) }
                ]}
                onPress={() => checkin && router.push(`/mindset-detail?checkinId=${checkin.id}`)}
                disabled={!checkin}
              >
                <Text style={[
                  styles.dayNumber,
                  checkin && styles.hasCheckinText
                ]}>
                  {format(date, 'd')}
                </Text>
                {checkin && (
                  <View style={[styles.moodIndicator, { backgroundColor: getMoodColor(checkin.mood) }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Monthly Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Monthly Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {(checkinsByMonth[format(selectedMonth, 'yyyy-MM')] || []).length}
              </Text>
              <Text style={styles.statLabel}>Check-ins</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {(() => {
                  const monthCheckins = checkinsByMonth[format(selectedMonth, 'yyyy-MM')] || [];
                  if (monthCheckins.length === 0) return '0';
                  const avg = monthCheckins.reduce((sum, c) => sum + c.mood, 0) / monthCheckins.length;
                  return avg.toFixed(1);
                })()}
              </Text>
              <Text style={styles.statLabel}>Avg Mood</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {(() => {
                  const monthCheckins = checkinsByMonth[format(selectedMonth, 'yyyy-MM')] || [];
                  if (monthCheckins.length === 0) return '0';
                  const avg = monthCheckins.reduce((sum, c) => sum + c.energy, 0) / monthCheckins.length;
                  return avg.toFixed(1);
                })()}
              </Text>
              <Text style={styles.statLabel}>Avg Energy</Text>
            </View>
          </View>
        </Card>

        {/* Recent Check-ins List */}
        <Text style={styles.sectionTitle}>Recent Check-ins</Text>
        {checkins.slice(0, 10).map(checkin => (
          <TouchableOpacity
            key={checkin.id}
            onPress={() => router.push(`/mindset-detail?checkinId=${checkin.id}`)}
          >
            <Card style={styles.checkinItem}>
              <View style={styles.checkinHeader}>
                <Text style={styles.checkinDate}>
                  {format(parseISO(checkin.date), 'EEEE, MMMM d')}
                </Text>
                <View style={styles.checkinScores}>
                  <View style={styles.scoreItem}>
                    <Heart size={14} color={getMoodColor(checkin.mood)} />
                    <Text style={styles.scoreText}>{checkin.mood}</Text>
                  </View>
                  <View style={styles.scoreItem}>
                    <Zap size={14} color={colors.primary} />
                    <Text style={styles.scoreText}>{checkin.energy}</Text>
                  </View>
                  <View style={styles.scoreItem}>
                    <Target size={14} color={colors.secondary} />
                    <Text style={styles.scoreText}>{checkin.motivation}</Text>
                  </View>
                </View>
              </View>
              {checkin.tags && checkin.tags.length > 0 && (
                <View style={styles.checkinTags}>
                  {checkin.tags.slice(0, 3).map(tag => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                  {checkin.tags.length > 3 && (
                    <Text style={styles.moreTags}>+{checkin.tags.length - 3} more</Text>
                  )}
                </View>
              )}
            </Card>
          </TouchableOpacity>
        ))}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'History',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            fontWeight: '600',
          },
        }} 
      />
      
      {renderTabNavigation()}
      
      <ScrollView style={styles.content}>
        {renderMonthNavigator()}
        {activeTab === 'sessions' ? renderSessionHistory() : renderMindsetHistory()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkGray,
  },
  activeTabText: {
    color: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  monthNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  calendarCard: {
    marginBottom: 16,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.darkGray,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hasCheckin: {
    borderWidth: 2,
    borderRadius: 8,
  },
  hasSession: {
    borderWidth: 2,
    borderRadius: 8,
    borderColor: colors.primary,
  },
  dayNumber: {
    fontSize: 14,
    color: colors.darkGray,
  },
  hasCheckinText: {
    fontWeight: '600',
    color: colors.text,
  },
  hasSessionText: {
    fontWeight: '600',
    color: colors.text,
  },
  moodIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  sessionIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  sessionDot: {
    marginHorizontal: 1,
  },
  moreSessionsText: {
    fontSize: 8,
    color: colors.darkGray,
    marginLeft: 2,
  },
  summaryCard: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.darkGray,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.mediumGray,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  checkinItem: {
    marginBottom: 12,
  },
  checkinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkinDate: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  checkinScores: {
    flexDirection: 'row',
    gap: 12,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  checkinTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: colors.darkGray,
  },
  moreTags: {
    fontSize: 12,
    color: colors.darkGray,
    fontStyle: 'italic',
  },
});