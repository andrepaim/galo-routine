import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Card, Text, Icon } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Layout } from '../../constants';
import { StarDisplay } from '../stars/StarDisplay';
import type { TodayTask, CompletionStatus } from '../../lib/types';

interface ChildTaskCardProps {
  task: TodayTask;
  onComplete: () => void;
  index?: number;
}

export function ChildTaskCard({ task, onComplete, index = 0 }: ChildTaskCardProps) {
  const status = task.completion?.status;
  const isDone = status === 'pending' || status === 'approved';
  const isRejected = status === 'rejected';

  const cardScale = useSharedValue(1);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const handlePress = async () => {
    if (isDone) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    cardScale.value = withSequence(
      withSpring(1.05, { damping: 6, stiffness: 300 }),
      withSpring(1.0, { damping: 10, stiffness: 200 }),
    );
    onComplete();
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify()}
      style={animatedCardStyle}
    >
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
    </Animated.View>
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
