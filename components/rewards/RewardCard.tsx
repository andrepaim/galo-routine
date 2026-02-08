import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Icon, Button } from 'react-native-paper';
import { Layout } from '../../constants';
import { ChildColors, ChildSizes } from '../../constants/childTheme';
import type { Reward } from '../../lib/types';

interface RewardCardProps {
  reward: Reward;
  goalBalance: number;
  onRedeem?: () => void;
  onPress?: () => void;
  showRedeem?: boolean;
}

export function RewardCard({ reward, goalBalance, onRedeem, onPress, showRedeem = false }: RewardCardProps) {
  const canAfford = goalBalance >= reward.goalCost;
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
              {reward.goalCost}
            </Text>
            {reward.availability === 'limited' && (
              <Text variant="bodySmall" style={styles.quantity}>
                ({reward.quantity} restantes)
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
            buttonColor={ChildColors.starGold}
            textColor={ChildColors.galoBlack}
            style={styles.redeemBtn}
            labelStyle={styles.redeemLabel}
          >
            Resgatar
          </Button>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  unavailable: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: ChildColors.galoDark,
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
    color: ChildColors.textSecondary,
    marginTop: 2,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  cost: {
    color: ChildColors.starGold,
    fontWeight: 'bold',
  },
  quantity: {
    color: ChildColors.textSecondary,
  },
  redeemBtn: {
    minWidth: 80,
  },
  redeemLabel: {
    fontSize: 12,
  },
});
