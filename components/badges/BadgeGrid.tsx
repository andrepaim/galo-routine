import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Layout, ALL_BADGES } from '../../constants';
import { ChildColors, ChildSizes } from '../../constants/childTheme';
import type { EarnedBadge, BadgeCategory } from '../../lib/types';

interface BadgeGridProps {
  earnedBadges: EarnedBadge[];
  filterCategory?: BadgeCategory;
}

export function BadgeGrid({ earnedBadges, filterCategory }: BadgeGridProps) {
  const earnedSet = new Set(earnedBadges.map((b) => b.badgeId));
  const badges = filterCategory ? ALL_BADGES.filter((b) => b.category === filterCategory) : ALL_BADGES;

  const categoryLabels: Record<BadgeCategory, string> = {
    milestone: 'Milestone Badges',
    consistency: 'Consistency Badges',
    category: 'Category Badges',
  };

  const categories = filterCategory
    ? [filterCategory]
    : (['milestone', 'consistency', 'category'] as BadgeCategory[]);

  return (
    <View style={styles.container}>
      {categories.map((cat) => {
        const catBadges = badges.filter((b) => b.category === cat);
        if (catBadges.length === 0) return null;

        return (
          <View key={cat} style={styles.section}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              {categoryLabels[cat]}
            </Text>
            <View style={styles.grid}>
              {catBadges.map((badge, index) => {
                const isEarned = earnedSet.has(badge.id);
                return (
                  <Animated.View
                    key={badge.id}
                    entering={FadeInDown.delay(index * 50).duration(300)}
                    style={styles.badgeItem}
                  >
                    <View style={[styles.badgeCircle, isEarned ? styles.earnedCircle : styles.lockedCircle]}>
                      <Icon
                        source={badge.icon}
                        size={32}
                        color={isEarned ? ChildColors.starGold : ChildColors.textMuted}
                      />
                    </View>
                    <Text
                      variant="bodySmall"
                      style={[styles.badgeName, !isEarned && styles.lockedText]}
                      numberOfLines={2}
                    >
                      {badge.name}
                    </Text>
                    {!isEarned && (
                      <Icon source="lock" size={12} color={ChildColors.textMuted} />
                    )}
                  </Animated.View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Layout.padding.lg,
  },
  section: {},
  sectionTitle: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
    marginBottom: Layout.padding.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.padding.md,
  },
  badgeItem: {
    alignItems: 'center',
    width: 80,
    gap: Layout.padding.xs,
  },
  badgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earnedCircle: {
    backgroundColor: ChildColors.galoDark,
    borderWidth: 2,
    borderColor: ChildColors.starGold,
  },
  lockedCircle: {
    backgroundColor: ChildColors.galoDark,
    borderWidth: 2,
    borderColor: ChildColors.cardBorder,
  },
  badgeName: {
    textAlign: 'center',
    color: ChildColors.textPrimary,
    fontSize: 11,
  },
  lockedText: {
    color: ChildColors.textMuted,
  },
});
