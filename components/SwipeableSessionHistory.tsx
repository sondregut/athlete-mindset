import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  ScrollView,
  TouchableOpacity,
  Platform
} from 'react-native';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import { SessionLog } from '@/types/session';
import SessionLogItem from './SessionLogItem';
import Card from './Card';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 32; // Account for padding

interface SwipeableSessionHistoryProps {
  sessions: SessionLog[];
  onSessionPress?: (session: SessionLog) => void;
}

export default function SwipeableSessionHistory({ sessions, onSessionPress }: SwipeableSessionHistoryProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / CARD_WIDTH);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < sessions.length) {
      setCurrentIndex(newIndex);
      // Haptic feedback on page change
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const scrollToIndex = (index: number) => {
    if (scrollViewRef.current && index >= 0 && index < sessions.length) {
      scrollViewRef.current.scrollTo({
        x: index * CARD_WIDTH,
        animated: true,
      });
      setCurrentIndex(index);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < sessions.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  };

  if (sessions.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <Calendar size={48} color={colors.darkGray} />
        <Text style={styles.emptyText}>No sessions to display</Text>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with navigation */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={goToPrevious}
          disabled={currentIndex === 0}
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
        >
          <ChevronLeft size={24} color={currentIndex === 0 ? colors.darkGray : colors.primary} />
        </TouchableOpacity>
        
        <Text style={styles.counter}>
          {currentIndex + 1} of {sessions.length}
        </Text>
        
        <TouchableOpacity 
          onPress={goToNext}
          disabled={currentIndex === sessions.length - 1}
          style={[styles.navButton, currentIndex === sessions.length - 1 && styles.navButtonDisabled]}
        >
          <ChevronRight size={24} color={currentIndex === sessions.length - 1 ? colors.darkGray : colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Swipeable session cards */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH}
        contentContainerStyle={styles.scrollContent}
      >
        {sessions.map((session, index) => (
          <View key={session.id} style={styles.cardWrapper}>
            <SessionLogItem 
              log={session} 
              onPress={() => onSessionPress?.(session)}
              showEditButton={false}
            />
          </View>
        ))}
      </ScrollView>

      {/* Page indicators */}
      <View style={styles.indicators}>
        {sessions.slice(0, 10).map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentIndex && styles.activeIndicator,
            ]}
          />
        ))}
        {sessions.length > 10 && (
          <Text style={styles.moreIndicator}>+{sessions.length - 10}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  counter: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    paddingRight: 16,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.darkGray,
    opacity: 0.3,
  },
  activeIndicator: {
    backgroundColor: colors.primary,
    opacity: 1,
    width: 24,
  },
  moreIndicator: {
    fontSize: 12,
    color: colors.darkGray,
    marginLeft: 4,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
  },
});