import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { ViewStyle, StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

type HapticWeight = 'light' | 'medium' | 'heavy' | 'none';

const HAPTIC_MAP: Record<Exclude<HapticWeight, 'none'>, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

interface AnimatedPressableProps {
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  scaleValue?: number;
  haptic?: HapticWeight;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function AnimatedPressable({
  onPress,
  onLongPress,
  disabled,
  scaleValue = 0.97,
  haptic = 'light',
  style,
  children,
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(scaleValue, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = async () => {
    if (haptic !== 'none') {
      await Haptics.impactAsync(HAPTIC_MAP[haptic]);
    }
    onPress?.();
  };

  return (
    <AnimatedPressableBase
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressableBase>
  );
}
