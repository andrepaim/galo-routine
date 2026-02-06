import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Icon, Button } from 'react-native-paper';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Layout, getCategoryColor } from '../../constants';
import { ChildColors, ChildSizes } from '../../constants/childTheme';
import { StarDisplay } from '../stars/StarDisplay';
import type { TodayTask } from '../../lib/types';

interface FocusModeCardProps {
  task: TodayTask;
  nextTask?: TodayTask;
  onComplete: () => void;
  onDismiss: () => void;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatCountdown(minutes: number): string {
  if (minutes <= 0) return 'Time\'s up!';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}

export function FocusModeCard({ task, nextTask, onComplete, onDismiss }: FocusModeCardProps) {
  const [minutesLeft, setMinutesLeft] = useState(0);
  const isDone = task.completion?.status === 'approved' || task.completion?.status === 'pending';
  const categoryColor = getCategoryColor(task.category);

  useEffect(() => {
    const update = () => {
      if (!task.endTime) {
        setMinutesLeft(0);
        return;
      }
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const endMinutes = timeToMinutes(task.endTime);
      setMinutesLeft(Math.max(0, endMinutes - currentMinutes));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [task.endTime]);

  const handleComplete = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete();
  };

  return (
    <Animated.View entering={FadeInUp.duration(400)} exiting={FadeOutDown.duration(300)}>
      <Card style={[styles.card, { borderTopColor: categoryColor }]}>
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <Text variant="labelMedium" style={styles.label}>
              CURRENT TASK
            </Text>
            <Button mode="text" compact onPress={onDismiss} textColor={ChildColors.textSecondary}>
              Dismiss
            </Button>
          </View>

          <View style={styles.taskRow}>
            <Icon source={task.icon || 'star-circle'} size={48} color={categoryColor} />
            <View style={styles.taskInfo}>
              <Text variant="headlineSmall" style={styles.taskName}>
                {task.name}
              </Text>
              {task.endTime && (
                <Text variant="bodyMedium" style={styles.countdown}>
                  {formatCountdown(minutesLeft)}
                </Text>
              )}
            </View>
            <StarDisplay count={task.starValue} maxStars={task.starValue} size={20} showEmpty={false} />
          </View>

          {!isDone ? (
            <Button
              mode="contained"
              onPress={handleComplete}
              icon="check"
              style={styles.completeBtn}
            >
              Mark Done
            </Button>
          ) : (
            <View style={styles.doneRow}>
              <Icon source="check-circle" size={20} color={ChildColors.accentGreen} />
              <Text variant="bodyMedium" style={styles.doneText}>
                {task.completion?.status === 'pending' ? 'Waiting for approval' : 'Completed!'}
              </Text>
            </View>
          )}

          {nextTask && (
            <View style={styles.nextTask}>
              <Text variant="labelSmall" style={styles.nextLabel}>
                UP NEXT
              </Text>
              <View style={styles.nextRow}>
                <Icon source={nextTask.icon || 'star-circle'} size={20} color={ChildColors.textSecondary} />
                <Text variant="bodyMedium" style={styles.nextName}>
                  {nextTask.name}
                </Text>
                {nextTask.startTime && (
                  <Text variant="bodySmall" style={styles.nextTime}>
                    {nextTask.startTime}
                  </Text>
                )}
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: Layout.padding.md,
    backgroundColor: ChildColors.cardBackground,
    elevation: Layout.elevation.high,
    borderTopWidth: 4,
    borderTopColor: ChildColors.starGold,
  },
  content: {
    gap: Layout.padding.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: ChildColors.textSecondary,
    letterSpacing: 1,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
  },
  countdown: {
    color: ChildColors.starGold,
    marginTop: 2,
  },
  completeBtn: {
    marginTop: Layout.padding.sm,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.sm,
    justifyContent: 'center',
    paddingVertical: Layout.padding.sm,
  },
  doneText: {
    color: ChildColors.accentGreen,
    fontWeight: 'bold',
  },
  nextTask: {
    borderTopWidth: 1,
    borderTopColor: ChildColors.cardBorder,
    paddingTop: Layout.padding.sm,
  },
  nextLabel: {
    color: ChildColors.textSecondary,
    letterSpacing: 1,
    marginBottom: Layout.padding.xs,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.sm,
  },
  nextName: {
    flex: 1,
    color: ChildColors.textSecondary,
  },
  nextTime: {
    color: ChildColors.textMuted,
  },
});
