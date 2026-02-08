import React, { useMemo } from 'react';
import { View, SectionList, StyleSheet } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { eachDayOfInterval, format, isToday, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChildColors, ChildSizes, STAR_EMOJI } from '../../constants/childTheme';
import { useTaskStore, usePeriodStore, useCompletionStore } from '../../lib/stores';
import { getTasksForDate } from '../../lib/utils/recurrence';
import { compareTimeStrings, formatTimeRange } from '../../lib/utils/time';
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
        title: format(date, "EEEE, d 'de' MMMM", { locale: ptBR }),
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
          title="Sem Período Ativo"
          description="Aguarde seus pais iniciarem um novo período."
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
            <Text style={[styles.sectionTitle, section.isToday && styles.todayTitle]}>
              {section.isToday ? 'HOJE' : section.title.toUpperCase()}
            </Text>
            {section.isToday && (
              <Text style={styles.starIcon}>{STAR_EMOJI}</Text>
            )}
          </View>
        )}
        renderItem={({ item, section }) => {
          const timeLabel = formatTimeRange(item.startTime, item.endTime);
          const status = item.completion?.status;
          return (
            <View style={[styles.taskCard, section.isPast && styles.pastItem]}>
              <View style={styles.taskLeft}>
                <View style={[styles.statusIcon, { backgroundColor: getStatusBgColor(status) }]}>
                  <Icon
                    source={getCompletionIcon(status)}
                    size={20}
                    color={getStatusIconColor(status)}
                  />
                </View>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskName}>{item.name}</Text>
                  <Text style={styles.taskTime}>{timeLabel}</Text>
                </View>
              </View>
              <View style={styles.starBadge}>
                <Text style={styles.goalValue}>+{item.goals}</Text>
              </View>
            </View>
          );
        }}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma tarefa encontrada</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function getCompletionIcon(status?: string): string {
  switch (status) {
    case 'approved': return 'check-circle';
    case 'pending': return 'clock-outline';
    case 'rejected': return 'close-circle';
    default: return 'circle-outline';
  }
}

function getStatusBgColor(status?: string): string {
  switch (status) {
    case 'approved': return ChildColors.accentGreen;
    case 'pending': return ChildColors.pendingGold;
    case 'rejected': return ChildColors.accentRed;
    default: return ChildColors.cardBackgroundLight;
  }
}

function getStatusIconColor(status?: string): string {
  switch (status) {
    case 'approved': 
    case 'pending':
    case 'rejected':
      return ChildColors.galoWhite;
    default: 
      return ChildColors.textMuted;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
  list: {
    padding: 12,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ChildColors.galoDark,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  todayHeader: {
    backgroundColor: ChildColors.starGold,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: ChildColors.textSecondary,
    letterSpacing: 1,
  },
  todayTitle: {
    color: ChildColors.galoBlack,
  },
  starIcon: {
    fontSize: 16,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  pastItem: {
    opacity: 0.5,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: ChildColors.textPrimary,
  },
  taskTime: {
    fontSize: 13,
    color: ChildColors.textSecondary,
    marginTop: 2,
  },
  starBadge: {
    backgroundColor: ChildColors.starGold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  goalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: ChildColors.galoBlack,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: ChildColors.textMuted,
    fontSize: 16,
  },
});
