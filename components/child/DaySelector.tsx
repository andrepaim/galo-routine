import React, { useRef, useEffect } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { eachDayOfInterval, isToday, isSameDay, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChildColors } from '../../constants';

interface DaySelectorProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  periodStart?: Date;
  periodEnd?: Date;
}

const DAY_CARD_WIDTH = 60;
const DAY_CARD_GAP = 8;

export function DaySelector({ selectedDate, onSelectDate, periodStart, periodEnd }: DaySelectorProps) {
  const scrollRef = useRef<ScrollView>(null);

  const today = new Date();
  const rangeStart = periodStart && periodStart > new Date(today.getTime() - 2 * 86400000)
    ? periodStart
    : new Date(today.getTime() - 2 * 86400000);
  const rangeEnd = periodEnd && periodEnd < new Date(today.getTime() + 5 * 86400000)
    ? periodEnd
    : new Date(today.getTime() + 5 * 86400000);

  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  // Auto-scroll to selected date on mount
  useEffect(() => {
    const index = days.findIndex((d) => isSameDay(d, selectedDate));
    if (index >= 0 && scrollRef.current) {
      const offset = Math.max(0, index * (DAY_CARD_WIDTH + DAY_CARD_GAP) - 100);
      scrollRef.current.scrollTo({ x: offset, animated: false });
    }
  }, []);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {days.map((day) => {
        const isSelected = isSameDay(day, selectedDate);
        const isTodayDay = isToday(day);
        const weekday = format(day, 'EEE', { locale: ptBR });
        const dayNum = format(day, 'd');

        return (
          <Pressable
            key={day.toISOString()}
            onPress={() => onSelectDate(day)}
            style={[
              styles.dayCard,
              isTodayDay && isSelected && styles.dayCardTodaySelected,
              isTodayDay && !isSelected && styles.dayCardToday,
              !isTodayDay && isSelected && styles.dayCardSelected,
            ]}
          >
            <Text style={[
              styles.weekday,
              (isSelected || isTodayDay) && styles.weekdayActive,
            ]}>
              {weekday}
            </Text>
            <Text style={[
              styles.dayNum,
              isTodayDay && styles.dayNumToday,
              isSelected && !isTodayDay && styles.dayNumSelected,
            ]}>
              {dayNum}
            </Text>
            {isTodayDay && <View style={styles.todayDot} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: DAY_CARD_GAP,
  },
  dayCard: {
    width: DAY_CARD_WIDTH,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: ChildColors.cardBackground,
    borderWidth: 2,
    borderColor: ChildColors.cardBorder,
  },
  dayCardTodaySelected: {
    backgroundColor: ChildColors.starGold,
    borderColor: ChildColors.starGold,
  },
  dayCardToday: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: ChildColors.starGold,
  },
  dayCardSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: ChildColors.starGold,
  },
  weekday: {
    fontSize: 11,
    fontWeight: '600',
    color: ChildColors.textSecondary,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  weekdayActive: {
    color: ChildColors.galoBlack,
  },
  dayNum: {
    fontSize: 20,
    fontWeight: '800',
    color: ChildColors.textPrimary,
  },
  dayNumToday: {
    color: ChildColors.galoBlack,
  },
  dayNumSelected: {
    color: ChildColors.starGold,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ChildColors.galoBlack,
    marginTop: 4,
  },
});
