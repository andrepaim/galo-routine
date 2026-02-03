import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon, Card, Button } from 'react-native-paper';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors, Layout, STREAK_MILESTONES } from '../../constants';

interface StreakDisplayProps {
  currentStreak: number;
  bestStreak: number;
  onFreeze?: () => void;
  freezeAvailable?: boolean;
  compact?: boolean;
}

export function StreakDisplay({
  currentStreak,
  bestStreak,
  onFreeze,
  freezeAvailable = false,
  compact = false,
}: StreakDisplayProps) {
  const nextMilestone = STREAK_MILESTONES.find((m) => m.days > currentStreak);
  const daysToNext = nextMilestone ? nextMilestone.days - currentStreak : 0;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Icon source="fire" size={20} color={currentStreak > 0 ? Colors.streak : Colors.textLight} />
        <Text variant="titleMedium" style={[styles.compactCount, currentStreak > 0 && styles.activeStreak]}>
          {currentStreak}
        </Text>
        <Text variant="bodySmall" style={styles.compactLabel}>
          day streak
        </Text>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeInUp.duration(400)}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.mainRow}>
            <View style={styles.streakCircle}>
              <Icon source="fire" size={40} color={currentStreak > 0 ? Colors.streak : Colors.textLight} />
              <Text variant="headlineLarge" style={styles.streakCount}>
                {currentStreak}
              </Text>
              <Text variant="bodySmall" style={styles.streakLabel}>
                day streak
              </Text>
            </View>

            <View style={styles.statsColumn}>
              <View style={styles.statRow}>
                <Icon source="trophy" size={16} color={Colors.badgeGold} />
                <Text variant="bodyMedium" style={styles.statText}>
                  Best: {bestStreak} days
                </Text>
              </View>
              {nextMilestone && (
                <View style={styles.statRow}>
                  <Icon source="star" size={16} color={Colors.starFilled} />
                  <Text variant="bodySmall" style={styles.statText}>
                    {daysToNext} {daysToNext === 1 ? 'day' : 'days'} to {nextMilestone.label}
                    {'\n'}(+{nextMilestone.bonusStars} bonus stars)
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Milestone progress dots */}
          <View style={styles.milestoneRow}>
            {STREAK_MILESTONES.map((milestone) => {
              const achieved = currentStreak >= milestone.days;
              return (
                <View key={milestone.days} style={styles.milestoneItem}>
                  <View style={[styles.milestoneDot, achieved && styles.milestoneAchieved]}>
                    <Text variant="bodySmall" style={[styles.milestoneText, achieved && styles.milestoneTextAchieved]}>
                      {milestone.days}
                    </Text>
                  </View>
                  <Text variant="labelSmall" style={styles.milestoneLabel}>
                    +{milestone.bonusStars}
                  </Text>
                </View>
              );
            })}
          </View>

          {onFreeze && freezeAvailable && currentStreak > 0 && (
            <Button
              mode="outlined"
              icon="snowflake"
              onPress={onFreeze}
              style={styles.freezeBtn}
              compact
            >
              Freeze Streak
            </Button>
          )}
        </Card.Content>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.xs,
  },
  compactCount: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  activeStreak: {
    color: Colors.streak,
  },
  compactLabel: {
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.surface,
    elevation: Layout.elevation.low,
  },
  content: {
    gap: Layout.padding.md,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.lg,
  },
  streakCircle: {
    alignItems: 'center',
    backgroundColor: Colors.streakContainer,
    borderRadius: Layout.radius.round,
    width: 100,
    height: 100,
    justifyContent: 'center',
  },
  streakCount: {
    fontWeight: 'bold',
    color: Colors.streak,
    marginTop: -4,
  },
  streakLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
  },
  statsColumn: {
    flex: 1,
    gap: Layout.padding.sm,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Layout.padding.sm,
  },
  statText: {
    color: Colors.textSecondary,
    flex: 1,
  },
  milestoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Layout.padding.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  milestoneItem: {
    alignItems: 'center',
    gap: 2,
  },
  milestoneDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneAchieved: {
    backgroundColor: Colors.streakContainer,
    borderWidth: 2,
    borderColor: Colors.streak,
  },
  milestoneText: {
    fontWeight: 'bold',
    color: Colors.textSecondary,
    fontSize: 12,
  },
  milestoneTextAchieved: {
    color: Colors.streak,
  },
  milestoneLabel: {
    color: Colors.textSecondary,
  },
  freezeBtn: {
    borderColor: Colors.categoryHygiene,
  },
});
