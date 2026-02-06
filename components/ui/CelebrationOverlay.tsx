import React, { useEffect, useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  BounceIn,
  FadeIn,
  FadeOut,
  runOnJS,
} from 'react-native-reanimated';
import { Text, Icon } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { Colors, Layout } from '../../constants';
import { ChildColors, ChildSizes } from '../../constants/childTheme';

interface CelebrationOverlayProps {
  visible: boolean;
  onDismiss: () => void;
  message?: string;
}

const CONFETTI_STARS = Array.from({ length: 12 }).map((_, i) => ({
  id: i,
  x: (Math.random() - 0.5) * 300,
  y: (Math.random() - 0.5) * 500,
  rotation: Math.random() * 360,
  scale: 0.3 + Math.random() * 0.5,
  delay: 200 + Math.random() * 600,
}));

function ConfettiStar({ config }: { config: (typeof CONFETTI_STARS)[0] }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(config.delay, withTiming(1, { duration: 200 }));
    translateX.value = withDelay(
      config.delay,
      withSpring(config.x, { damping: 8, stiffness: 60 }),
    );
    translateY.value = withDelay(
      config.delay,
      withSpring(config.y, { damping: 8, stiffness: 60 }),
    );
    rotate.value = withDelay(
      config.delay,
      withSpring(config.rotation, { damping: 6, stiffness: 40 }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: config.scale },
    ],
    opacity: opacity.value,
  }));

  const starColors = [ChildColors.starGold, ChildColors.starGold, ChildColors.starGoldLight, ChildColors.accentGreen];
  const color = starColors[config.id % starColors.length];

  return (
    <Animated.View style={[styles.confettiStar, style]}>
      <Icon source="star-four-points" size={24} color={color} />
    </Animated.View>
  );
}

export function CelebrationOverlay({ visible, onDismiss, message = 'Great job!' }: CelebrationOverlayProps) {
  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(300)} style={styles.overlay}>
      <Pressable style={styles.pressArea} onPress={onDismiss}>
        {CONFETTI_STARS.map((config) => (
          <ConfettiStar key={config.id} config={config} />
        ))}

        <Animated.View entering={BounceIn.delay(100).duration(600)} style={styles.centerContent}>
          <Icon source="star" size={80} color={ChildColors.starGold} />
        </Animated.View>

        <Animated.View entering={BounceIn.delay(400).duration(500)} style={styles.trophyContainer}>
          <Icon source="trophy" size={48} color={ChildColors.starGold} />
        </Animated.View>

        <Animated.View entering={BounceIn.delay(600).duration(400)}>
          <Text variant="headlineLarge" style={styles.message}>
            {message}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(1000).duration(400)}>
          <Text variant="bodyMedium" style={styles.dismiss}>
            Tap to dismiss
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 100,
  },
  pressArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiStar: {
    position: 'absolute',
  },
  centerContent: {
    marginBottom: Layout.padding.md,
  },
  trophyContainer: {
    marginBottom: Layout.padding.lg,
  },
  message: {
    color: ChildColors.galoWhite,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dismiss: {
    color: ChildColors.textMuted,
    marginTop: Layout.padding.xl,
  },
});
