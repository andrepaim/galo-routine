import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { Colors, Layout } from '../../constants';

interface SkeletonBoxProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}

export function SkeletonBox({ width, height, borderRadius = Layout.radius.sm, style }: SkeletonBoxProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 800 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: Colors.divider,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={skeletonStyles.card}>
      <View style={skeletonStyles.cardRow}>
        <SkeletonBox width={40} height={40} borderRadius={20} />
        <View style={skeletonStyles.cardLines}>
          <SkeletonBox width={160} height={14} />
          <SkeletonBox width={100} height={12} />
        </View>
      </View>
    </View>
  );
}

interface SkeletonListProps {
  count?: number;
}

export function SkeletonList({ count = 5 }: SkeletonListProps) {
  return (
    <View style={skeletonStyles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View key={index} entering={FadeIn.delay(index * 100)}>
          <SkeletonCard />
        </Animated.View>
      ))}
    </View>
  );
}

export function SkeletonDashboard() {
  return (
    <View style={skeletonStyles.dashboard}>
      <Animated.View entering={FadeIn.delay(0)}>
        <SkeletonBox width={200} height={24} style={skeletonStyles.greetingBar} />
        <SkeletonBox width={140} height={16} style={skeletonStyles.subtitleBar} />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(100)} style={skeletonStyles.statsRow}>
        <View style={skeletonStyles.statBox}>
          <SkeletonBox width={48} height={48} borderRadius={24} />
          <SkeletonBox width={60} height={14} style={skeletonStyles.statLabel} />
        </View>
        <View style={skeletonStyles.statBox}>
          <SkeletonBox width={48} height={48} borderRadius={24} />
          <SkeletonBox width={60} height={14} style={skeletonStyles.statLabel} />
        </View>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(200)}>
        <SkeletonBox width={120} height={16} style={skeletonStyles.sectionTitle} />
        <SkeletonCard />
      </Animated.View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Layout.radius.md,
    padding: Layout.padding.md,
    marginBottom: Layout.padding.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
  },
  cardLines: {
    gap: Layout.padding.sm,
  },
  list: {
    padding: Layout.padding.md,
  },
  dashboard: {
    padding: Layout.padding.md,
  },
  greetingBar: {
    marginBottom: Layout.padding.sm,
  },
  subtitleBar: {
    marginBottom: Layout.padding.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Layout.padding.md,
    marginBottom: Layout.padding.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Layout.radius.md,
    padding: Layout.padding.lg,
    alignItems: 'center',
    gap: Layout.padding.sm,
  },
  statLabel: {
    marginTop: Layout.padding.xs,
  },
  sectionTitle: {
    marginBottom: Layout.padding.md,
  },
});
