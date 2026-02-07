import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { ChildColors } from '../../constants';

interface GaloGoalCounterProps {
  scored: number;       // Goals scored (completed tasks)
  possible: number;     // Total possible goals
  pending?: number;     // Tasks pending approval
  opponentName?: string;
  opponentGoals?: number;
}

const BALL_EMOJI = '⚽';

export function GaloGoalCounter({ 
  scored, 
  possible, 
  pending = 0,
  opponentName,
  opponentGoals = 0,
}: GaloGoalCounterProps) {
  const percentage = possible > 0 ? Math.round((scored / possible) * 100) : 0;
  const isWinning = scored > opponentGoals;
  const isDraw = scored === opponentGoals;

  const ballPulse = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Animate progress bar
    progressWidth.value = withTiming(percentage, { 
      duration: 1000, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    });

    // Pulse if winning
    if (isWinning) {
      ballPulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    }
  }, [scored, possible, percentage, isWinning]);

  const ballAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ballPulse.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const getProgressColor = () => {
    if (percentage >= 80) return ChildColors.statusApproved;
    if (percentage >= 50) return ChildColors.starGold;
    return ChildColors.statusRejected;
  };

  const getMessage = () => {
    if (isWinning) return '🔥 Vencendo!';
    if (isDraw) return '🤝 Empate!';
    if (scored > 0) return '💪 Bora virar!';
    return '⚽ Comece a marcar!';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Animated.Text style={[styles.ballEmoji, ballAnimatedStyle]}>
          {BALL_EMOJI}
        </Animated.Text>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Gols do Dia</Text>
          <Text style={styles.subtitle}>{getMessage()}</Text>
        </View>
        <Animated.Text style={[styles.ballEmoji, ballAnimatedStyle]}>
          {BALL_EMOJI}
        </Animated.Text>
      </View>

      {/* Score display */}
      <View style={styles.scoreRow}>
        <Text style={styles.scoredNumber}>{scored}</Text>
        <Text style={styles.divider}>/</Text>
        <Text style={styles.possibleNumber}>{possible}</Text>
      </View>

      {/* Live match score (if opponent provided) */}
      {opponentName && (
        <View style={styles.matchRow}>
          <Text style={styles.matchLabel}>Você</Text>
          <View style={styles.matchScore}>
            <Text style={[
              styles.matchGoals, 
              isWinning && styles.matchGoalsWinning
            ]}>
              {scored}
            </Text>
            <Text style={styles.matchVs}>x</Text>
            <Text style={styles.matchGoals}>{opponentGoals}</Text>
          </View>
          <Text style={styles.matchLabel}>{opponentName}</Text>
        </View>
      )}

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <Animated.View 
            style={[
              styles.progressFill, 
              progressAnimatedStyle,
              { backgroundColor: getProgressColor() }
            ]} 
          />
        </View>
        <Text style={[styles.percentText, { color: getProgressColor() }]}>
          {percentage}%
        </Text>
      </View>

      {/* Pending indicator */}
      {pending > 0 && (
        <View style={styles.pendingRow}>
          <Text style={styles.pendingText}>
            +{pending} ⚽ aguardando aprovação
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  ballEmoji: {
    fontSize: 32,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: ChildColors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: ChildColors.starGold,
    marginTop: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  scoredNumber: {
    fontSize: 56,
    fontWeight: '900',
    color: ChildColors.starGold,
  },
  divider: {
    fontSize: 32,
    color: ChildColors.textMuted,
    marginHorizontal: 8,
  },
  possibleNumber: {
    fontSize: 32,
    fontWeight: '600',
    color: ChildColors.textSecondary,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: ChildColors.cardBorder,
    borderRadius: 12,
    width: '100%',
  },
  matchLabel: {
    fontSize: 12,
    color: ChildColors.textSecondary,
    width: 80,
  },
  matchScore: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  matchGoals: {
    fontSize: 24,
    fontWeight: '800',
    color: ChildColors.textPrimary,
  },
  matchGoalsWinning: {
    color: ChildColors.statusApproved,
  },
  matchVs: {
    fontSize: 16,
    color: ChildColors.textMuted,
    marginHorizontal: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  progressBg: {
    flex: 1,
    height: 12,
    backgroundColor: ChildColors.cardBorder,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    minWidth: 4,
  },
  percentText: {
    fontSize: 18,
    fontWeight: '800',
    width: 50,
    textAlign: 'right',
  },
  pendingRow: {
    marginTop: 12,
    backgroundColor: 'rgba(184, 150, 11, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pendingText: {
    fontSize: 14,
    color: ChildColors.statusPending,
    fontWeight: '600',
  },
});

export default GaloGoalCounter;
