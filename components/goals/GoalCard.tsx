import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Icon, ProgressBar, Button } from 'react-native-paper';
import { format } from 'date-fns';
import { Colors, Layout } from '../../constants';
import { ChildColors, ChildSizes } from '../../constants/childTheme';
import type { LongTermGoal } from '../../lib/types';

interface GoalCardProps {
  goal: LongTermGoal;
  lifetimeStars: number;
  onPress?: () => void;
  onDelete?: () => void;
}

export function GoalCard({ goal, lifetimeStars, onPress, onDelete }: GoalCardProps) {
  const progress = Math.min(lifetimeStars / goal.targetStars, 1);
  const starsRemaining = Math.max(0, goal.targetStars - lifetimeStars);
  const deadlineStr = goal.deadline ? format(goal.deadline.toDate(), 'MMM d, yyyy') : undefined;

  return (
    <Card style={[styles.card, goal.isCompleted && styles.completedCard]} onPress={onPress}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <Icon
            source={goal.isCompleted ? 'trophy' : 'flag-checkered'}
            size={28}
            color={goal.isCompleted ? ChildColors.starGold : ChildColors.starGold}
          />
          <View style={styles.headerInfo}>
            <Text variant="titleMedium" style={styles.name}>
              {goal.name}
            </Text>
            {deadlineStr && (
              <Text variant="bodySmall" style={styles.deadline}>
                Deadline: {deadlineStr}
              </Text>
            )}
          </View>
          {onDelete && !goal.isCompleted && (
            <Button mode="text" compact onPress={onDelete} textColor={ChildColors.accentRed}>
              Delete
            </Button>
          )}
        </View>

        {goal.description ? (
          <Text variant="bodySmall" style={styles.description}>
            {goal.description}
          </Text>
        ) : null}

        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text variant="bodySmall" style={styles.progressText}>
              {lifetimeStars} / {goal.targetStars} stars
            </Text>
            <Text variant="bodySmall" style={styles.progressPercent}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <ProgressBar
            progress={progress}
            color={goal.isCompleted ? ChildColors.starGold : ChildColors.starGold}
            style={styles.progressBar}
          />
          {!goal.isCompleted && starsRemaining > 0 && (
            <Text variant="bodySmall" style={styles.remaining}>
              {starsRemaining} more stars to go!
            </Text>
          )}
        </View>

        <View style={styles.rewardRow}>
          <Icon source="gift" size={16} color={ChildColors.accentGreen} />
          <Text variant="bodySmall" style={styles.rewardText}>
            {goal.rewardDescription}
          </Text>
        </View>

        {goal.isCompleted && (
          <View style={styles.completedBanner}>
            <Icon source="check-decagram" size={20} color={ChildColors.accentGreen} />
            <Text variant="bodyMedium" style={styles.completedText}>
              Goal Achieved!
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: Layout.padding.xs,
    backgroundColor: ChildColors.cardBackground,
    elevation: Layout.elevation.low,
  },
  completedCard: {
    backgroundColor: ChildColors.accentGreenContainer,
  },
  content: {
    gap: Layout.padding.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
  },
  deadline: {
    color: ChildColors.textPrimarySecondary,
  },
  description: {
    color: ChildColors.textPrimarySecondary,
  },
  progressSection: {
    gap: Layout.padding.xs,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    color: ChildColors.textPrimarySecondary,
  },
  progressPercent: {
    color: ChildColors.starGold,
    fontWeight: 'bold',
  },
  progressBar: {
    borderRadius: 4,
    height: 8,
  },
  remaining: {
    color: ChildColors.textPrimarySecondary,
    fontStyle: 'italic',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.sm,
    paddingVertical: Layout.padding.xs,
  },
  rewardText: {
    color: ChildColors.accentGreen,
    flex: 1,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.padding.sm,
    paddingVertical: Layout.padding.sm,
    backgroundColor: ChildColors.accentGreenContainer,
    borderRadius: Layout.radius.sm,
  },
  completedText: {
    color: ChildColors.accentGreen,
    fontWeight: 'bold',
  },
});
