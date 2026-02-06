import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Icon, Button } from 'react-native-paper';
import { Colors, Layout } from '../../constants';
import { ChildColors, ChildSizes } from '../../constants/childTheme';
import type { Reward } from '../../lib/types';

interface RewardCardProps {
  reward: Reward;
  starBalance: number;
  onRedeem?: () => void;
  onPress?: () => void;
  showRedeem?: boolean;
}

export function RewardCard({ reward, starBalance, onRedeem, onPress, showRedeem = false }: RewardCardProps) {
  const canAfford = starBalance >= reward.starCost;
  const isAvailable = reward.isActive && (reward.availability === 'unlimited' || (reward.quantity ?? 0) > 0);

  return (
    <Card style={[styles.card, !isAvailable && styles.unavailable]} onPress={onPress}>
      <Card.Content style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon source={reward.icon} size={40} color={isAvailable ? ChildColors.starGold : ChildColors.textMuted} />
        </View>
        <View style={styles.info}>
          <Text variant="titleMedium" style={[styles.name, !isAvailable && styles.disabledText]}>
            {reward.name}
          </Text>
          {reward.description ? (
            <Text variant="bodySmall" style={styles.description} numberOfLines={2}>
              {reward.description}
            </Text>
          ) : null}
          <View style={styles.costRow}>
            <Icon source="star" size={16} color={ChildColors.starGold} />
            <Text variant="titleSmall" style={styles.cost}>
              {reward.starCost}
            </Text>
            {reward.availability === 'limited' && (
              <Text variant="bodySmall" style={styles.quantity}>
                ({reward.quantity} left)
              </Text>
            )}
          </View>
        </View>
        {showRedeem && (
          <Button
            mode="contained"
            compact
            onPress={onRedeem}
            disabled={!canAfford || !isAvailable}
            style={styles.redeemBtn}
            labelStyle={styles.redeemLabel}
          >
            Redeem
          </Button>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: Layout.padding.xs,
    backgroundColor: ChildColors.cardBackground,
    elevation: Layout.elevation.low,
  },
  unavailable: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: Layout.radius.md,
    backgroundColor: ChildColors.starGoldContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
  },
  disabledText: {
    color: ChildColors.textMuted,
  },
  description: {
    color: ChildColors.textPrimarySecondary,
    marginTop: 2,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Layout.padding.xs,
  },
  cost: {
    color: ChildColors.starGoldDark,
    fontWeight: 'bold',
  },
  quantity: {
    color: ChildColors.textPrimarySecondary,
  },
  redeemBtn: {
    minWidth: 80,
  },
  redeemLabel: {
    fontSize: 12,
  },
});
