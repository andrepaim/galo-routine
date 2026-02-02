import React, { useMemo } from 'react';
import { View, SectionList, StyleSheet } from 'react-native';
import { Text, Card, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { eachDayOfInterval, format, isToday, isBefore, startOfDay } from 'date-fns';
import { Colors, Layout } from '../../constants';
import { useTaskStore, usePeriodStore, useCompletionStore } from '../../lib/stores';
import { getTasksForDate } from '../../lib/utils/recurrence';
import { compareTimeStrings, formatTimeRange } from '../../lib/utils/time';
import { StarDisplay } from '../../components/stars/StarDisplay';
import { EmptyState } from '../../components/ui/EmptyState';
import type { TodayTask } from '../../lib/types';

export default function ChildTasksScreen() {
  const tasks = useTaskStore((s) => s.tasks);
  const activePeriod = usePeriodStore((s) => s.activePeriod);
  const getCompletionForTask = useCompletionStore((s) => s.getCompletionForTask);

  const sections = useMemo(() => {
    if (!activePeriod) return [];

    const start = activePeriod.startDate.toDate();
    const end = activePeriod.endDate.toDate();
    const days = eachDayOfInterval({ start, end });

    return days.map((date) => {
      const dayTasks = getTasksForDate(tasks, date);
      const todayTasks: TodayTask[] = dayTasks
        .map((t) => ({
          ...t,
          id: t.id!,
          completion: getCompletionForTask(t.id!, date),
        }))
        .sort((a, b) => compareTimeStrings(a.startTime, b.startTime));

      return {
        title: format(date, 'EEEE, MMM d'),
        isToday: isToday(date),
        isPast: isBefore(date, startOfDay(new Date())),
        data: todayTasks,
      };
    });
  }, [tasks, activePeriod]);

  if (!activePeriod) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <EmptyState
          icon="calendar-blank"
          title="No Active Period"
          description="Wait for your parent to start a new period."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.id}_${index}`}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, section.isToday && styles.todayHeader]}>
            <Text
              variant="titleSmall"
              style={[styles.sectionTitle, section.isToday && styles.todayTitle]}
            >
              {section.isToday ? 'TODAY' : section.title}
            </Text>
            {section.isToday && (
              <Icon source="star" size={16} color={Colors.primary} />
            )}
          </View>
        )}
        renderItem={({ item, section }) => {
          const timeLabel = formatTimeRange(item.startTime, item.endTime);
          return (
            <Card style={[styles.taskItem, section.isPast && styles.pastItem]}>
              <Card.Title
                title={item.name}
                titleVariant="bodyLarge"
                subtitle={timeLabel}
                subtitleStyle={styles.timeSubtitle}
                left={(props) => (
                  <Icon
                    {...props}
                    source={getCompletionIcon(item.completion?.status)}
                    color={getCompletionColor(item.completion?.status)}
                  />
                )}
                right={() => (
                  <StarDisplay
                    count={item.starValue}
                    maxStars={item.starValue}
                    size={14}
                    showEmpty={false}
                  />
                )}
              />
            </Card>
          );
        }}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

function getCompletionIcon(status?: string): string {
  switch (status) {
    case 'approved': return 'check-circle';
    case 'pending': return 'check-circle-outline';
    case 'rejected': return 'close-circle';
    default: return 'circle-outline';
  }
}

function getCompletionColor(status?: string): string {
  switch (status) {
    case 'approved': return Colors.reward;
    case 'pending': return Colors.pending;
    case 'rejected': return Colors.penalty;
    default: return Colors.textLight;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: Layout.padding.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.xs,
    backgroundColor: Colors.background,
    paddingVertical: Layout.padding.sm,
    paddingHorizontal: Layout.padding.md,
  },
  todayHeader: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: Layout.radius.sm,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  todayTitle: {
    color: Colors.primaryDark,
  },
  taskItem: {
    marginVertical: 2,
    marginHorizontal: Layout.padding.xs,
    backgroundColor: Colors.surface,
  },
  pastItem: {
    opacity: 0.6,
  },
  timeSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
