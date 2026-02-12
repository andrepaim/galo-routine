import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { ChildColors, ChildSizes, STAR_EMOJI } from '../../constants';

// Galo-themed reward icons
const REWARD_ICONS: Record<string, string> = {
  'gamepad-variant': '🎮',
  'movie': '🎬',
  'ice-cream': '🍦',
  'pizza': '🍕',
  'gift': '🎁',
  'star': '⭐',
  'trophy': '🏆',
  'cake': '🎂',
  'music': '🎵',
  'book': '📚',
};

interface GaloRewardCardProps {
  reward: any;
  goalBalance: number;
  onRedeem: () => void;
}

export function GaloRewardCard({ reward, goalBalance, onRedeem }: GaloRewardCardProps) {
  const canAfford = goalBalance >= reward.goalCost;
  const remaining = reward.goalCost - goalBalance;
  const progressPercent = canAfford ? 100 : Math.round((goalBalance / reward.goalCost) * 100);
  const cardScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const handlePress = () => {
    if (!canAfford) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      cardScale.value = withSequence(
        withSpring(0.95, { damping: 4 }),
        withSpring(1, { damping: 8 })
      );
      return;
    }
    cardScale.value = withSequence(
      withSpring(0.95, { damping: 6 }),
      withSpring(1.02, { damping: 8 }),
      withSpring(1, { damping: 10 })
    );
    onRedeem();
  };

  const iconEmoji = REWARD_ICONS[reward.icon] || '🎁';

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPress={handlePress}>
        <Surface
          style={[
            styles.rewardCard,
            !canAfford && styles.rewardCardDisabled,
          ]}
          elevation={0}
        >
          <View style={styles.rewardIconContainer}>
            <Text style={styles.rewardIcon}>{iconEmoji}</Text>
          </View>

          <View style={styles.rewardInfo}>
            <Text style={styles.rewardName}>{reward.name}</Text>
            {reward.description && (
              <Text style={styles.rewardDescription} numberOfLines={1}>
                {reward.description}
              </Text>
            )}
            {canAfford ? (
              <Text style={styles.affordableText}>Disponível!</Text>
            ) : (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>
                <Text style={styles.remainingText}>Faltam {remaining} gols</Text>
              </View>
            )}
          </View>

          <View style={[
            styles.priceTag,
            canAfford ? styles.priceTagAffordable : styles.priceTagExpensive
          ]}>
            <Text style={styles.priceEmoji}>{STAR_EMOJI}</Text>
            <Text style={[
              styles.priceText,
              canAfford ? styles.priceTextAffordable : styles.priceTextExpensive
            ]}>
              {reward.goalCost}
            </Text>
          </View>
        </Surface>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  rewardCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: 16,
    marginBottom: ChildSizes.itemGap,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: ChildColors.cardBorder,
  },
  rewardCardDisabled: {
    opacity: 0.7,
    borderColor: ChildColors.textMuted,
  },
  rewardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rewardIcon: {
    fontSize: 32,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 18,
    fontWeight: '700',
    color: ChildColors.textPrimary,
  },
  rewardDescription: {
    fontSize: 14,
    color: ChildColors.textSecondary,
    marginTop: 2,
  },
  affordableText: {
    fontSize: 13,
    fontWeight: '700',
    color: ChildColors.accentGreen,
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: ChildColors.galoDark,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ChildColors.starGold,
    borderRadius: 3,
  },
  remainingText: {
    fontSize: 11,
    color: ChildColors.textMuted,
    marginTop: 4,
  },
  priceTag: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceTagAffordable: {
    backgroundColor: ChildColors.starGold,
  },
  priceTagExpensive: {
    backgroundColor: ChildColors.cardBorder,
  },
  priceEmoji: {
    fontSize: 18,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
  },
  priceTextAffordable: {
    color: ChildColors.galoBlack,
  },
  priceTextExpensive: {
    color: ChildColors.textMuted,
  },
});
