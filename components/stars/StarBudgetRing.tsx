import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Circle, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Layout } from '../../constants';
import { ChildColors } from '../../constants/childTheme';
import type { StarProgress } from '../../lib/types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface StarBudgetRingProps {
  progress: StarProgress;
  size?: number;
  strokeWidth?: number;
  rewardPercent?: number;
  penaltyPercent?: number;
  animated?: boolean;
}

function ThresholdMarker({
  percent,
  center,
  radius,
  strokeWidth,
}: {
  percent: number;
  center: number;
  radius: number;
  strokeWidth: number;
}) {
  const angle = ((-90 + (percent / 100) * 360) * Math.PI) / 180;
  const innerR = radius - strokeWidth / 2 - 2;
  const outerR = radius + strokeWidth / 2 + 2;

  return (
    <Line
      x1={center + innerR * Math.cos(angle)}
      y1={center + innerR * Math.sin(angle)}
      x2={center + outerR * Math.cos(angle)}
      y2={center + outerR * Math.sin(angle)}
      stroke={ChildColors.textMuted}
      strokeWidth={2}
      strokeLinecap="round"
    />
  );
}

export function StarBudgetRing({
  progress,
  size = 200,
  strokeWidth = 16,
  rewardPercent,
  penaltyPercent,
  animated = false,
}: StarBudgetRingProps) {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const earnedTarget = (circumference * Math.min(progress.earnedPercent, 100)) / 100;
  const pendingEnd = Math.min(progress.earnedPercent + progress.pendingPercent, 100);
  const pendingTarget = (circumference * pendingEnd) / 100;

  const animatedEarned = useSharedValue(animated ? 0 : earnedTarget);
  const animatedPending = useSharedValue(animated ? 0 : pendingTarget);

  useEffect(() => {
    if (animated) {
      animatedEarned.value = withTiming(earnedTarget, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      });
      animatedPending.value = withTiming(pendingTarget, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      animatedEarned.value = earnedTarget;
      animatedPending.value = pendingTarget;
    }
  }, [earnedTarget, pendingTarget, animated]);

  const earnedAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - animatedEarned.value,
  }));

  const pendingAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - animatedPending.value,
  }));

  // Simple palette: gold for progress, always
  const progressColor = ChildColors.starGold;
  // Pending: lighter gold (semi-transparent)
  const pendingColor = ChildColors.starGoldDark;
  // Track: dark gray
  const trackColor = '#333333';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Pending arc (lighter gold) */}
        {progress.pendingPercent > 0 && (
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={pendingColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            animatedProps={pendingAnimatedProps}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        )}
        {/* Earned arc (bright gold) */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={earnedAnimatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
        {/* Threshold markers (subtle gray) */}
        {rewardPercent != null && (
          <ThresholdMarker
            percent={rewardPercent}
            center={center}
            radius={radius}
            strokeWidth={strokeWidth}
          />
        )}
        {penaltyPercent != null && (
          <ThresholdMarker
            percent={penaltyPercent}
            center={center}
            radius={radius}
            strokeWidth={strokeWidth}
          />
        )}
      </Svg>
      <View style={styles.centerContent}>
        <Text variant="displaySmall" style={[styles.earnedText, { color: progressColor }]}>
          {progress.earned}
        </Text>
        <Text variant="bodySmall" style={styles.budgetText}>
          of {progress.budget}
        </Text>
        <Text variant="labelSmall" style={styles.label}>
          STARS
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  earnedText: {
    fontWeight: 'bold',
  },
  budgetText: {
    color: ChildColors.textSecondary,
  },
  label: {
    color: ChildColors.textMuted,
    textTransform: 'uppercase',
  },
});
