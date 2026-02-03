import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Icon, Card, Button } from 'react-native-paper';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Layout, getCategoryColor } from '../../constants';
import { StarDisplay } from '../stars/StarDisplay';
import { formatTimeDisplay } from '../../lib/utils/time';
import type { TodayTask } from '../../lib/types';

interface TimelineViewProps {
  tasks: TodayTask[];
  onTaskPress: (task: TodayTask) => void;
  onComplete: (task: TodayTask) => void;
}

function getCurrentTimePosition(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function TimelineView({ tasks, onTaskPress, onComplete }: TimelineViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [currentMinutes, setCurrentMinutes] = useState(getCurrentTimePosition());

  const scheduledTasks = tasks
    .filter((t) => t.startTime)
    .sort((a, b) => timeToMinutes(a.startTime!) - timeToMinutes(b.startTime!));
  const anytimeTasks = tasks.filter((t) => !t.startTime);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentMinutes(getCurrentTimePosition()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to current time
  useEffect(() => {
    const timeout = setTimeout(() => {
      const scrollY = Math.max(0, (currentMinutes - 60) * 1.2);
      scrollRef.current?.scrollTo({ y: scrollY, animated: true });
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  const isTaskCurrent = (task: TodayTask): boolean => {
    if (!task.startTime) return false;
    const start = timeToMinutes(task.startTime);
    const end = task.endTime ? timeToMinutes(task.endTime) : start + 30;
    return currentMinutes >= start && currentMinutes < end;
  };

  const PIXELS_PER_MINUTE = 1.2;
  const TIMELINE_START = 6 * 60; // 6 AM
  const TIMELINE_END = 22 * 60; // 10 PM

  return (
    <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={styles.content}>
      {/* Timeline */}
      <View style={styles.timeline}>
        {/* Hour markers */}
        {Array.from({ length: 17 }, (_, i) => i + 6).map((hour) => (
          <View
            key={hour}
            style={[styles.hourMarker, { top: (hour * 60 - TIMELINE_START) * PIXELS_PER_MINUTE }]}
          >
            <Text variant="bodySmall" style={styles.hourLabel}>
              {formatTimeDisplay(`${String(hour).padStart(2, '0')}:00`)}
            </Text>
            <View style={styles.hourLine} />
          </View>
        ))}

        {/* Current time indicator */}
        <View
          style={[
            styles.currentTimeIndicator,
            { top: (currentMinutes - TIMELINE_START) * PIXELS_PER_MINUTE },
          ]}
        >
          <View style={styles.currentTimeDot} />
          <View style={styles.currentTimeLine} />
        </View>

        {/* Task blocks */}
        {scheduledTasks.map((task, index) => {
          const start = timeToMinutes(task.startTime!);
          const end = task.endTime ? timeToMinutes(task.endTime) : start + 30;
          const duration = end - start;
          const isCurrent = isTaskCurrent(task);
          const isDone = task.completion?.status === 'approved' || task.completion?.status === 'pending';
          const categoryColor = getCategoryColor(task.category);

          return (
            <Animated.View
              key={task.id}
              entering={FadeInDown.delay(index * 60).duration(300)}
              style={[
                styles.taskBlock,
                {
                  top: (start - TIMELINE_START) * PIXELS_PER_MINUTE,
                  height: Math.max(duration * PIXELS_PER_MINUTE, 36),
                  borderLeftColor: categoryColor,
                },
                isCurrent && styles.currentTask,
                isDone && styles.completedTask,
              ]}
            >
              <Pressable
                style={styles.taskBlockInner}
                onPress={() => onTaskPress(task)}
              >
                <View style={styles.taskBlockHeader}>
                  <Text
                    variant="bodyMedium"
                    style={[styles.taskBlockName, isDone && styles.completedText]}
                    numberOfLines={1}
                  >
                    {task.name}
                  </Text>
                  <StarDisplay count={task.starValue} maxStars={task.starValue} size={14} showEmpty={false} />
                </View>
                <Text variant="bodySmall" style={styles.taskBlockTime}>
                  {formatTimeDisplay(task.startTime!)}
                  {task.endTime ? ` - ${formatTimeDisplay(task.endTime)}` : ''}
                </Text>
                {isDone && (
                  <Icon source="check-circle" size={16} color={Colors.reward} />
                )}
              </Pressable>
            </Animated.View>
          );
        })}

        {/* Spacer for timeline height */}
        <View style={{ height: (TIMELINE_END - TIMELINE_START) * PIXELS_PER_MINUTE + 40 }} />
      </View>

      {/* Anytime tasks */}
      {anytimeTasks.length > 0 && (
        <Animated.View entering={FadeInUp.delay(400).duration(400)}>
          <Text variant="titleMedium" style={styles.anytimeTitle}>
            Anytime Tasks
          </Text>
          {anytimeTasks.map((task, index) => {
            const isDone = task.completion?.status === 'approved' || task.completion?.status === 'pending';
            return (
              <Card
                key={task.id}
                style={[styles.anytimeCard, isDone && styles.completedTask]}
                onPress={() => isDone ? onTaskPress(task) : onComplete(task)}
              >
                <Card.Content style={styles.anytimeContent}>
                  <Icon
                    source={isDone ? 'check-circle' : 'circle-outline'}
                    size={24}
                    color={isDone ? Colors.reward : Colors.textLight}
                  />
                  <Text
                    variant="bodyMedium"
                    style={[styles.anytimeName, isDone && styles.completedText]}
                  >
                    {task.name}
                  </Text>
                  <StarDisplay count={task.starValue} maxStars={task.starValue} size={16} showEmpty={false} />
                </Card.Content>
              </Card>
            );
          })}
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: Layout.padding.xl * 2,
  },
  timeline: {
    position: 'relative',
    marginLeft: 70,
    marginRight: Layout.padding.md,
  },
  hourMarker: {
    position: 'absolute',
    left: -70,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hourLabel: {
    width: 62,
    textAlign: 'right',
    color: Colors.textSecondary,
    fontSize: 11,
    paddingRight: Layout.padding.sm,
  },
  hourLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  currentTimeIndicator: {
    position: 'absolute',
    left: -12,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  currentTimeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.penalty,
  },
  currentTimeLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.penalty,
  },
  taskBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    elevation: Layout.elevation.low,
    overflow: 'hidden',
  },
  currentTask: {
    borderWidth: 2,
    borderColor: Colors.secondary,
    elevation: Layout.elevation.medium,
  },
  completedTask: {
    opacity: 0.6,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  taskBlockInner: {
    padding: Layout.padding.sm,
    flex: 1,
    justifyContent: 'center',
  },
  taskBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskBlockName: {
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    marginRight: Layout.padding.sm,
  },
  taskBlockTime: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  anytimeTitle: {
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Layout.padding.lg,
    marginBottom: Layout.padding.sm,
    paddingHorizontal: Layout.padding.md,
  },
  anytimeCard: {
    marginHorizontal: Layout.padding.md,
    marginVertical: Layout.padding.xs,
    backgroundColor: Colors.surface,
  },
  anytimeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
  },
  anytimeName: {
    flex: 1,
    color: Colors.text,
  },
});
