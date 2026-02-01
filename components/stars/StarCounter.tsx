import React, { useEffect } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withSequence,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Colors, Layout } from '../../constants';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

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

  const animatedEarned = useSharedValue(0);
  const starScale = useSharedValue(1);

  useEffect(() => {
    animatedEarned.value = withTiming(earned, { duration: 600 });
    starScale.value = withSequence(
      withSpring(1.3, { damping: 4, stiffness: 200 }),
      withSpring(1, { damping: 8, stiffness: 150 }),
    );
  }, [earned]);

  const animatedTextProps = useAnimatedProps(() => ({
    text: `${Math.round(animatedEarned.value)}`,
    defaultValue: `${earned}`,
  }));

  const starAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Animated.View style={starAnimatedStyle}>
          <Icon source="star" size={iconSize} color={Colors.starFilled} />
        </Animated.View>
        <AnimatedTextInput
          animatedProps={animatedTextProps}
          editable={false}
          style={[
            styles.earned,
            isLarge ? styles.earnedLarge : styles.earnedSmall,
          ]}
        />
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
    padding: 0,
  },
  earnedLarge: {
    fontSize: 28,
    lineHeight: 34,
  },
  earnedSmall: {
    fontSize: 18,
    lineHeight: 24,
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
