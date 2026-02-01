import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Card, Text, Icon } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { Colors, Layout } from '../../constants';
import { StarDisplay } from '../stars/StarDisplay';
import type { TodayTask, CompletionStatus } from '../../lib/types';

interface ChildTaskCardProps {
  task: TodayTask;
  onComplete: () => void;
}

export function ChildTaskCard({ task, onComplete }: ChildTaskCardProps) {
  const status = task.completion?.status;
  const isDone = status === 'pending' || status === 'approved';
  const isRejected = status === 'rejected';

  const handlePress = async () => {
    if (isDone) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete();
  };

  return (
    <Pressable onPress={handlePress}>
      <Card style={[styles.card, isDone && styles.done, isRejected && styles.rejected]}>
        <Card.Title
          title={task.name}
          titleVariant="titleLarge"
          titleStyle={[styles.title, isDone && styles.doneText]}
          subtitle={task.description || undefined}
          left={(props) => (
            <Icon
              {...props}
              source={getStatusIcon(status)}
              color={getStatusColor(status)}
              size={36}
            />
          )}
          right={() => (
            <StarDisplay count={task.starValue} maxStars={task.starValue} size={24} showEmpty={false} />
          )}
        />
        {isRejected && task.completion?.rejectionReason && (
          <Card.Content style={styles.rejectionContent}>
            <Text variant="bodySmall" style={styles.rejectionText}>
              {task.completion.rejectionReason}
            </Text>
          </Card.Content>
        )}
      </Card>
    </Pressable>
  );
}

function getStatusIcon(status?: CompletionStatus): string {
  switch (status) {
    case 'approved':
      return 'check-circle';
    case 'pending':
      return 'clock-outline';
    case 'rejected':
      return 'close-circle';
    default:
      return 'circle-outline';
  }
}

function getStatusColor(status?: CompletionStatus): string {
  switch (status) {
    case 'approved':
      return Colors.reward;
    case 'pending':
      return Colors.neutral;
    case 'rejected':
      return Colors.penalty;
    default:
      return Colors.textLight;
  }
}

const styles = StyleSheet.create({
  card: {
    marginVertical: Layout.padding.xs,
    backgroundColor: Colors.surface,
    elevation: 2,
  },
  done: {
    backgroundColor: Colors.rewardContainer,
  },
  rejected: {
    backgroundColor: Colors.penaltyContainer,
  },
  title: {
    fontSize: 18,
  },
  doneText: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  rejectionContent: {
    paddingBottom: Layout.padding.sm,
  },
  rejectionText: {
    color: Colors.penalty,
    fontStyle: 'italic',
  },
});
