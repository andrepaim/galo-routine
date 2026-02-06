import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Icon, Chip } from 'react-native-paper';
import { Colors, Layout } from '../../constants';
import { ChildColors, ChildSizes } from '../../constants/childTheme';
import { StarCounter } from '../stars/StarCounter';
import { AnimatedPressable } from '../ui/AnimatedPressable';
import { formatPeriodRange, getRemainingDays } from '../../lib/utils/periodUtils';
import type { Period } from '../../lib/types';

interface PeriodSummaryProps {
  period: Period;
  onPress?: () => void;
}

export function PeriodSummary({ period, onPress }: PeriodSummaryProps) {
  const remaining = getRemainingDays(period);
  const isActive = period.status === 'active';

  const card = (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium">{formatPeriodRange(period)}</Text>
          <Chip
            icon={getStatusIcon(period.status)}
            compact
            style={[styles.statusChip, { backgroundColor: getStatusColor(period) }]}
            textStyle={styles.statusText}
          >
            {getStatusLabel(period)}
          </Chip>
        </View>

        <View style={styles.statsRow}>
          <StarCounter
            earned={period.starsEarned}
            budget={period.starBudget}
            pending={period.starsPending}
          />
          {isActive && (
            <View style={styles.daysLeft}>
              <Text variant="headlineSmall" style={styles.daysNumber}>
                {remaining}
              </Text>
              <Text variant="bodySmall" style={styles.daysLabel}>
                days left
              </Text>
            </View>
          )}
        </View>

        {period.outcome && (
          <View style={styles.outcomeRow}>
            <Icon
              source={getOutcomeIcon(period.outcome)}
              size={20}
              color={getOutcomeColor(period.outcome)}
            />
            <Text style={[styles.outcomeText, { color: getOutcomeColor(period.outcome) }]}>
              {period.outcome === 'reward'
                ? period.thresholds.rewardDescription
                : period.outcome === 'penalty'
                  ? period.thresholds.penaltyDescription
                  : 'Good effort!'}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  if (onPress) {
    return (
      <AnimatedPressable onPress={onPress} haptic="light">
        {card}
      </AnimatedPressable>
    );
  }

  return card;
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'active': return 'play-circle';
    case 'completed': return 'check-circle';
    default: return 'clock';
  }
}

function getStatusLabel(period: Period): string {
  if (period.status === 'completed' && period.outcome) {
    return period.outcome.charAt(0).toUpperCase() + period.outcome.slice(1);
  }
  return period.status.charAt(0).toUpperCase() + period.status.slice(1);
}

function getStatusColor(period: Period): string {
  if (period.outcome === 'reward') return ChildColors.accentGreenLight;
  if (period.outcome === 'penalty') return ChildColors.accentRedLight;
  if (period.status === 'active') return ChildColors.starGoldLight;
  return ChildColors.cardBackgroundVariant;
}

function getOutcomeIcon(outcome: string): string {
  switch (outcome) {
    case 'reward': return 'trophy';
    case 'penalty': return 'alert-circle';
    default: return 'minus-circle';
  }
}

function getOutcomeColor(outcome: string): string {
  switch (outcome) {
    case 'reward': return ChildColors.accentGreen;
    case 'penalty': return ChildColors.accentRed;
    default: return ChildColors.starGold;
  }
}

const styles = StyleSheet.create({
  card: {
    marginVertical: Layout.padding.xs,
    backgroundColor: ChildColors.cardBackground,
    elevation: Layout.elevation.low,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.padding.md,
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daysLeft: {
    alignItems: 'center',
  },
  daysNumber: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
  },
  daysLabel: {
    color: ChildColors.textPrimarySecondary,
  },
  outcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.sm,
    marginTop: Layout.padding.md,
    padding: Layout.padding.sm,
    borderRadius: Layout.radius.sm,
    backgroundColor: ChildColors.cardBackgroundVariant,
  },
  outcomeText: {
    flex: 1,
    fontSize: 14,
  },
});
