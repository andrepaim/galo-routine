import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Icon, Chip } from 'react-native-paper';
import { Layout } from '../../constants';
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
          <Text variant="titleMedium" style={styles.title}>{formatPeriodRange(period)}</Text>
          <Chip
            icon={getStatusIcon(period.status)}
            compact
            style={[styles.statusChip, { backgroundColor: getStatusBgColor(period) }]}
            textStyle={[styles.statusText, { color: getStatusTextColor(period) }]}
          >
            {getStatusLabel(period)}
          </Chip>
        </View>

        <View style={styles.statsRow}>
          <StarCounter
            earned={period.goalsEarned ?? 0}
            budget={period.goalBudget ?? 0}
            pending={period.goalsPending ?? 0}
          />
          {isActive && (
            <View style={styles.daysLeft}>
              <Text variant="headlineSmall" style={styles.daysNumber}>
                {remaining}
              </Text>
              <Text variant="bodySmall" style={styles.daysLabel}>
                dias restantes
              </Text>
            </View>
          )}
        </View>

        {period.outcome && (
          <View style={[styles.outcomeRow, { backgroundColor: getOutcomeBgColor(period.outcome) }]}>
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
                  : 'Bom esforço!'}
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
    switch (period.outcome) {
      case 'reward': return 'Prêmio';
      case 'penalty': return 'Penalidade';
      default: return 'Neutro';
    }
  }
  return period.status === 'active' ? 'Ativo' : 'Concluído';
}

function getStatusBgColor(period: Period): string {
  if (period.outcome === 'reward') return ChildColors.accentGreen + '30';
  if (period.outcome === 'penalty') return ChildColors.accentRed + '30';
  if (period.status === 'active') return ChildColors.starGold + '30';
  return ChildColors.galoDark;
}

function getStatusTextColor(period: Period): string {
  if (period.outcome === 'reward') return ChildColors.accentGreen;
  if (period.outcome === 'penalty') return ChildColors.accentRed;
  if (period.status === 'active') return ChildColors.starGold;
  return ChildColors.textSecondary;
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

function getOutcomeBgColor(outcome: string): string {
  switch (outcome) {
    case 'reward': return ChildColors.accentGreen + '20';
    case 'penalty': return ChildColors.accentRed + '20';
    default: return ChildColors.starGold + '20';
  }
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: ChildColors.textPrimary,
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
    color: ChildColors.textSecondary,
  },
  outcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  outcomeText: {
    flex: 1,
    fontSize: 14,
  },
});
