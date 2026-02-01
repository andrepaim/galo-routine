import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text, Icon, Chip } from 'react-native-paper';
import { Colors, Layout, DAY_NAMES } from '../../constants';
import { StarDisplay } from '../stars/StarDisplay';
import type { Task } from '../../lib/types';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onLongPress?: () => void;
  showRecurrence?: boolean;
}

export function TaskCard({ task, onPress, onLongPress, showRecurrence = true }: TaskCardProps) {
  const recurrenceLabel = getRecurrenceLabel(task);

  return (
    <Card
      style={[styles.card, !task.isActive && styles.inactive]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Card.Title
        title={task.name}
        titleVariant="titleMedium"
        subtitle={task.description || undefined}
        left={(props) => (
          <Icon
            {...props}
            source={task.icon || 'star-circle'}
            color={task.isActive ? Colors.primary : Colors.disabled}
          />
        )}
        right={() => <StarDisplay count={task.starValue} maxStars={5} size={16} />}
      />
      {showRecurrence && (
        <Card.Content style={styles.recurrence}>
          <Chip icon="calendar" compact textStyle={styles.chipText}>
            {recurrenceLabel}
          </Chip>
          {!task.isActive && (
            <Chip icon="pause-circle" compact textStyle={styles.chipText}>
              Inactive
            </Chip>
          )}
        </Card.Content>
      )}
    </Card>
  );
}

function getRecurrenceLabel(task: Task): string {
  switch (task.recurrence.type) {
    case 'daily':
      return 'Every day';
    case 'specific_days':
      return task.recurrence.days?.map((d) => DAY_NAMES[d]).join(', ') ?? 'No days selected';
    case 'once':
      return 'One time';
    default:
      return '';
  }
}

const styles = StyleSheet.create({
  card: {
    marginVertical: Layout.padding.xs,
    backgroundColor: Colors.surface,
  },
  inactive: {
    opacity: 0.6,
  },
  recurrence: {
    flexDirection: 'row',
    gap: Layout.padding.sm,
    paddingBottom: Layout.padding.sm,
  },
  chipText: {
    fontSize: 12,
  },
});
