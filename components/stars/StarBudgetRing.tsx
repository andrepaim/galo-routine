import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Layout } from '../../constants';
import type { StarProgress } from '../../lib/types';

interface StarBudgetRingProps {
  progress: StarProgress;
  size?: number;
  strokeWidth?: number;
}

export function StarBudgetRing({ progress, size = 200, strokeWidth = 16 }: StarBudgetRingProps) {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const earnedOffset = circumference - (circumference * Math.min(progress.earnedPercent, 100)) / 100;
  const pendingEnd = Math.min(progress.earnedPercent + progress.pendingPercent, 100);
  const pendingOffset = circumference - (circumference * pendingEnd) / 100;

  let progressColor: string = Colors.neutral;
  if (progress.isRewardZone) progressColor = Colors.reward;
  if (progress.isPenaltyZone) progressColor = Colors.penalty;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={Colors.surfaceVariant}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Pending arc */}
        {progress.pendingPercent > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={Colors.starPending}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={pendingOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        )}
        {/* Earned arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={earnedOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.centerContent}>
        <Text variant="displaySmall" style={[styles.earnedText, { color: progressColor }]}>
          {progress.earned}
        </Text>
        <Text variant="bodySmall" style={styles.budgetText}>
          of {progress.budget}
        </Text>
        <Text variant="labelSmall" style={styles.label}>
          stars
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
    color: Colors.textSecondary,
  },
  label: {
    color: Colors.textLight,
    textTransform: 'uppercase',
  },
});
