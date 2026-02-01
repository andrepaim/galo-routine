import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { Colors, Layout } from '../../constants';

interface StarCounterProps {
  earned: number;
  budget: number;
  pending?: number;
  size?: 'small' | 'large';
}

export function StarCounter({ earned, budget, pending = 0, size = 'small' }: StarCounterProps) {
  const isLarge = size === 'large';
  const iconSize = isLarge ? 32 : 20;
  const earnedPercent = budget > 0 ? Math.round((earned / budget) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Icon source="star" size={iconSize} color={Colors.starFilled} />
        <Text
          variant={isLarge ? 'headlineLarge' : 'titleMedium'}
          style={styles.earned}
        >
          {earned}
        </Text>
        <Text
          variant={isLarge ? 'titleMedium' : 'bodyMedium'}
          style={styles.budget}
        >
          / {budget}
        </Text>
      </View>
      {pending > 0 && (
        <Text variant="bodySmall" style={styles.pending}>
          +{pending} pending
        </Text>
      )}
      <Text
        variant="bodySmall"
        style={[
          styles.percent,
          earnedPercent >= 80 && styles.percentGood,
          earnedPercent < 50 && styles.percentBad,
        ]}
      >
        {earnedPercent}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earned: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  budget: {
    color: Colors.textSecondary,
  },
  pending: {
    color: Colors.neutral,
    marginTop: 2,
  },
  percent: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  percentGood: {
    color: Colors.reward,
    fontWeight: 'bold',
  },
  percentBad: {
    color: Colors.penalty,
  },
});
