import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Icon, Chip } from 'react-native-paper';
import { Layout, DAY_NAMES } from '../../constants';
import { ChildColors, ChildSizes } from '../../constants/childTheme';
import { StarDisplay } from '../stars/StarDisplay';
import { AnimatedPressable } from '../ui/AnimatedPressable';
import { formatTimeRange } from '../../lib/utils/time';
import type { Task } from '../../lib/types';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onLongPress?: () => void;
  showRecurrence?: boolean;
}

export function TaskCard({ task, onPress, onLongPress, showRecurrence = true }: TaskCardProps) {
  const recurrenceLabel = getRecurrenceLabel(task);
  const timeLabel = formatTimeRange(task.startTime, task.endTime);

  const card = (
    <Card style={[styles.card, !task.isActive && styles.inactive]}>
      <Card.Title
        title={task.name}
        titleVariant="titleMedium"
        titleStyle={styles.title}
        subtitle={task.description || undefined}
        subtitleStyle={styles.subtitle}
        left={(props) => (
          <View style={styles.iconContainer}>
            <Icon
              {...props}
              source={task.icon || 'star-circle'}
              color={task.isActive ? ChildColors.starGold : ChildColors.textMuted}
            />
          </View>
        )}
        right={() => <StarDisplay count={task.goals} maxStars={5} size={16} />}
      />
      {showRecurrence && (
        <Card.Content style={styles.recurrence}>
          <Chip 
            icon="calendar" 
            compact 
            style={styles.chip}
            textStyle={styles.chipText}
          >
            {recurrenceLabel}
          </Chip>
          {timeLabel && (
            <Chip 
              icon="clock-outline" 
              compact 
              style={styles.chip}
              textStyle={styles.chipText}
            >
              {timeLabel}
            </Chip>
          )}
          {!task.isActive && (
            <Chip 
              icon="pause-circle" 
              compact 
              style={styles.chipInactive}
              textStyle={styles.chipText}
            >
              Inativo
            </Chip>
          )}
        </Card.Content>
      )}
    </Card>
  );

  if (onPress || onLongPress) {
    return (
      <AnimatedPressable onPress={onPress} onLongPress={onLongPress} haptic="light">
        {card}
      </AnimatedPressable>
    );
  }

  return card;
}

function getRecurrenceLabel(task: Task): string {
  switch (task.recurrence.type) {
    case 'daily':
      return 'Todo dia';
    case 'specific_days':
      return task.recurrence.days?.map((d) => DAY_NAMES[d]).join(', ') ?? 'Sem dias';
    case 'once':
      return 'Uma vez';
    default:
      return '';
  }
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  inactive: {
    opacity: 0.6,
  },
  title: {
    color: ChildColors.textPrimary,
  },
  subtitle: {
    color: ChildColors.textSecondary,
  },
  iconContainer: {
    backgroundColor: ChildColors.galoDark,
    borderRadius: 20,
    padding: 8,
  },
  recurrence: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 12,
  },
  chip: {
    backgroundColor: ChildColors.galoDark,
    borderColor: ChildColors.cardBorder,
  },
  chipInactive: {
    backgroundColor: ChildColors.accentRed + '30',
    borderColor: ChildColors.accentRed,
  },
  chipText: {
    fontSize: 12,
    color: ChildColors.textSecondary,
  },
});
