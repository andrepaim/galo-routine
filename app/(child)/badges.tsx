import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors, Layout, ALL_BADGES } from '../../constants';
import { useBadgeStore } from '../../lib/stores';
import { BadgeGrid } from '../../components/badges/BadgeGrid';

export default function BadgesScreen() {
  const { earnedBadges } = useBadgeStore();
  const totalBadges = ALL_BADGES.length;
  const earnedCount = earnedBadges.length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
          <Icon source="shield-star" size={48} color={Colors.badgeGold} />
          <Text variant="headlineSmall" style={styles.title}>
            My Badges
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {earnedCount} of {totalBadges} earned
          </Text>
        </Animated.View>

        <BadgeGrid earnedBadges={earnedBadges} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondaryContainer,
  },
  content: {
    padding: Layout.padding.md,
    paddingBottom: Layout.padding.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.padding.xl,
  },
  title: {
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Layout.padding.sm,
  },
  subtitle: {
    color: Colors.textSecondary,
  },
});
