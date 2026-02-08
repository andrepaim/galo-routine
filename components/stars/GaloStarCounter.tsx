import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { ChildColors, STAR_EMOJI } from '../../constants';

interface GaloStarCounterProps {
  earned: number;
  budget: number;
  pending?: number;
}

export function GaloStarCounter({ earned, budget, pending = 0 }: GaloStarCounterProps) {
  const percentage = budget > 0 ? Math.round((earned / budget) * 100) : 0;
  const isGreat = percentage >= 80;
  const isGood = percentage >= 50;

  const starPulse = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  const numberValue = useSharedValue(0);

  useEffect(() => {
    // Animate progress bar
    progressWidth.value = withTiming(percentage, { 
      duration: 1000, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    });

    // Animate number count up
    numberValue.value = withTiming(earned, { duration: 800 });

    // Pulse if doing well
    if (isGreat) {
      starPulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    }
  }, [earned, budget, percentage]);

  const shieldAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starPulse.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const getProgressColor = () => {
    if (isGreat) return ChildColors.statusApproved;
    if (isGood) return ChildColors.starGold;
    return ChildColors.statusRejected;
  };

  const getMessage = () => {
    if (percentage >= 100) return 'Perfeito!';
    if (percentage >= 80) return 'Muito bem!';
    if (percentage >= 50) return 'Continue assim!';
    if (percentage > 0) return 'Vamos lá!';
    return 'Comece agora!';
  };

  return (
    <View style={styles.container}>
      {/* Header with star */}
      <View style={styles.header}>
        <Animated.Text style={[styles.starEmoji, shieldAnimatedStyle]}>
          {STAR_EMOJI}
        </Animated.Text>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Gols do Dia</Text>
          <Text style={styles.subtitle}>{getMessage()}</Text>
        </View>
        <Animated.Text style={[styles.starEmoji, shieldAnimatedStyle]}>
          {STAR_EMOJI}
        </Animated.Text>
      </View>

      {/* Big number display */}
      <View style={styles.numberRow}>
        <Text style={styles.earnedNumber}>{earned}</Text>
        <Text style={styles.divider}>/</Text>
        <Text style={styles.budgetNumber}>{budget}</Text>
      </View>

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
            +{pending} aguardando aprovação
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
  starEmoji: {
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
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  earnedNumber: {
    fontSize: 56,
    fontWeight: '900',
    color: ChildColors.starGold,
  },
  divider: {
    fontSize: 32,
    color: ChildColors.textMuted,
    marginHorizontal: 8,
  },
  budgetNumber: {
    fontSize: 32,
    fontWeight: '600',
    color: ChildColors.textSecondary,
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
