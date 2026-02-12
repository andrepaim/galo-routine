import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Text, Icon, Surface } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { ChildColors, ChildSizes } from '../../constants';

// Soccer ball emoji for championship mode
const BALL_EMOJI = '⚽';
import { formatTimeRange } from '../../lib/utils/time';
import type { TodayTask, CompletionStatus } from '../../lib/types';

interface GaloTaskCardProps {
  task: TodayTask;
  onComplete: () => void;
  index?: number;
  disabled?: boolean;
}

export function GaloTaskCard({ task, onComplete, index = 0, disabled = false }: GaloTaskCardProps) {
  const status = task.completion?.status;
  const isDone = status === 'pending' || status === 'approved';
  const isPending = status === 'pending';
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';

  const cardScale = useSharedValue(1);
  const checkScale = useSharedValue(isDone ? 1 : 0);
  const starRotation = useSharedValue(0);

  React.useEffect(() => {
    if (isDone) {
      checkScale.value = withSpring(1, { damping: 8, stiffness: 200 });
    }
  }, [isDone]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const starAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${starRotation.value}deg` }],
  }));

  const handlePress = async () => {
    if (isDone) return;
    
    // Celebration animation sequence!
    // 1. Quick press feedback
    cardScale.value = withSequence(
      withSpring(0.92, { damping: 6, stiffness: 400 }),
      withSpring(1.05, { damping: 6, stiffness: 250 }),
      withSpring(1.0, { damping: 8, stiffness: 200 }),
    );

    // 2. Stars do a happy spin
    starRotation.value = withSequence(
      withTiming(720, { duration: 600 }), // Two full spins!
      withTiming(0, { duration: 0 }),
    );

    // 3. Check mark pops in with overshoot
    checkScale.value = withSpring(1.2, { damping: 4, stiffness: 180 });
    setTimeout(() => {
      checkScale.value = withSpring(1, { damping: 8, stiffness: 200 });
    }, 200);

    // Haptic celebration
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete();
  };

  const timeRange = formatTimeRange(task.startTime, task.endTime);
  
  const getStatusConfig = () => {
    if (isApproved) return { 
      icon: 'check-circle', 
      color: ChildColors.statusApproved,
      bgColor: 'rgba(46, 204, 113, 0.15)',
      borderColor: ChildColors.statusApproved,
    };
    if (isPending) return { 
      icon: 'clock-outline', 
      color: ChildColors.statusPending,
      bgColor: 'rgba(184, 150, 11, 0.15)',
      borderColor: ChildColors.statusPending,
    };
    if (isRejected) return { 
      icon: 'close-circle', 
      color: ChildColors.statusRejected,
      bgColor: 'rgba(230, 57, 70, 0.15)',
      borderColor: ChildColors.statusRejected,
    };
    return { 
      icon: 'circle-outline', 
      color: ChildColors.textMuted,
      bgColor: ChildColors.cardBackground,
      borderColor: ChildColors.cardBorder,
    };
  };

  const statusConfig = getStatusConfig();

  // Category color
  const getCategoryColor = () => {
    const categoryColors: Record<string, string> = {
      hygiene: ChildColors.categoryHygiene,
      school: ChildColors.categorySchool,
      study: ChildColors.categoryStudy,
      chores: ChildColors.categoryChores,
      meals: ChildColors.categoryMeals,
      exercise: ChildColors.categoryExercise,
      extracurricular: ChildColors.categoryExtracurricular,
      rest: ChildColors.categoryRest,
    };
    return categoryColors[task.category || 'other'] || ChildColors.categoryOther;
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <Animated.View style={animatedCardStyle}>
        <Pressable onPress={handlePress} disabled={isDone || disabled}>
          <Surface
            style={[
              styles.card,
              {
                backgroundColor: statusConfig.bgColor,
                borderColor: statusConfig.borderColor,
              },
              disabled && !isDone && { opacity: 0.6 },
            ]}
            elevation={0}
          >
            {/* Category stripe */}
            <View style={[styles.categoryStripe, { backgroundColor: getCategoryColor() }]} />
            
            <View style={styles.content}>
              {/* Left: Status icon */}
              <View style={styles.statusContainer}>
                <Animated.View style={checkAnimatedStyle}>
                  <Icon 
                    source={statusConfig.icon} 
                    size={32} 
                    color={statusConfig.color} 
                  />
                </Animated.View>
              </View>

              {/* Middle: Task info */}
              <View style={styles.info}>
                <Text 
                  style={[
                    styles.taskName, 
                    isDone && styles.taskNameDone
                  ]}
                  numberOfLines={2}
                >
                  {task.name}
                </Text>
                
                {timeRange && (
                  <View style={styles.timeRow}>
                    <Icon source="clock-outline" size={14} color={ChildColors.textSecondary} />
                    <Text style={styles.timeText}>{timeRange}</Text>
                  </View>
                )}
                
                {isPending && (
                  <Text style={styles.pendingText}>
                    ⏳ Aguardando aprovação
                  </Text>
                )}
                
                {isRejected && task.completion?.rejectionReason && (
                  <Text style={styles.rejectedText}>
                    ❌ {task.completion.rejectionReason}
                  </Text>
                )}
              </View>

              {/* Right: Goals */}
              <View style={styles.goalsContainer}>
                <Animated.View style={starAnimatedStyle}>
                  <Text style={styles.ballEmoji}>{BALL_EMOJI}</Text>
                </Animated.View>
                <Text style={styles.goalCount}>+{task.goals}</Text>
              </View>
            </View>
          </Surface>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: ChildSizes.cardRadius,
    marginBottom: ChildSizes.itemGap,
    overflow: 'hidden',
    borderWidth: 2,
  },
  categoryStripe: {
    height: 4,
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  statusContainer: {
    width: 40,
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  taskName: {
    fontSize: 18,
    fontWeight: '700',
    color: ChildColors.textPrimary,
    marginBottom: 4,
  },
  taskNameDone: {
    textDecorationLine: 'line-through',
    color: ChildColors.textSecondary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 13,
    color: ChildColors.textSecondary,
  },
  pendingText: {
    fontSize: 13,
    color: ChildColors.statusPending,
    marginTop: 4,
    fontStyle: 'italic',
  },
  rejectedText: {
    fontSize: 13,
    color: ChildColors.statusRejected,
    marginTop: 4,
  },
  goalsContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  ballEmoji: {
    fontSize: 26,
  },
  goalCount: {
    fontSize: 16,
    fontWeight: '900',
    color: ChildColors.starGold,
    marginTop: 2,
  },
});
