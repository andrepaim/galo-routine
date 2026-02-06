import React from 'react';
import { View, FlatList, StyleSheet, Alert, Pressable } from 'react-native';
import { Text, Icon, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { ChildColors, ChildSizes, STAR_EMOJI, TROPHY_EMOJI } from '../../constants';
import { useAuthStore, useRewardStore } from '../../lib/stores';
import { EmptyState } from '../../components/ui/EmptyState';

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

function GaloRewardCard({ 
  reward, 
  starBalance, 
  onRedeem 
}: { 
  reward: any; 
  starBalance: number; 
  onRedeem: () => void;
}) {
  const canAfford = starBalance >= reward.starCost;
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
              {reward.starCost}
            </Text>
          </View>
        </Surface>
      </Pressable>
    </Animated.View>
  );
}

export default function RewardShopScreen() {
  const familyId = useAuthStore((s) => s.familyId);
  const family = useAuthStore((s) => s.family);
  const { rewards, redemptions, redeemReward } = useRewardStore();

  const starBalance = family?.starBalance ?? 0;
  const activeRewards = rewards.filter((r) => r.isActive !== false);
  const myRedemptions = redemptions.filter((r) => r.status === 'pending' || r.status === 'fulfilled');

  const handleRedeem = (reward: typeof rewards[0]) => {
    if (starBalance < reward.starCost) return;
    Alert.alert(
      '🛒 Trocar Estrelas',
      `Gastar ${reward.starCost} estrelas em "${reward.name}"?\n\nVocê terá ${starBalance - reward.starCost} estrelas restantes.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Trocar!',
          onPress: async () => {
            if (!familyId) return;
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await redeemReward(familyId, reward);
          },
        },
      ],
    );
  };

  // Skip loading in dev mode
  const isDevMode = typeof window !== 'undefined' && window.location.search.includes('dev=');

  return (
    <View style={styles.container}>
      <FlatList
        data={activeRewards}
        keyExtractor={(item) => item.id!}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Balance Card */}
            <Animated.View entering={FadeInUp.duration(400)}>
              <Surface style={styles.balanceCard} elevation={0}>
                <View style={styles.balanceHeader}>
                  <Text style={styles.balanceEmoji}>{STAR_EMOJI}</Text>
                  <Text style={styles.balanceTitle}>Suas Estrelas</Text>
                </View>
                <Text style={styles.balanceNumber}>{starBalance}</Text>
                <Text style={styles.balanceSubtitle}>disponíveis para trocar</Text>
              </Surface>
            </Animated.View>

            {/* Pending Rewards */}
            {myRedemptions.length > 0 && (
              <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionEmoji}>{TROPHY_EMOJI}</Text>
                  <Text style={styles.sectionTitle}>Meus Prêmios</Text>
                </View>
                {myRedemptions.slice(0, 3).map((r) => (
                  <Surface key={r.id} style={styles.redemptionCard} elevation={0}>
                    <Text style={styles.redemptionName}>{r.rewardName}</Text>
                    <View style={[
                      styles.statusBadge,
                      r.status === 'pending' ? styles.statusPending : styles.statusFulfilled
                    ]}>
                      <Text style={styles.statusText}>
                        {r.status === 'pending' ? '⏳ Esperando' : '✅ Entregue!'}
                      </Text>
                    </View>
                  </Surface>
                ))}
              </Animated.View>
            )}

            {/* Shop Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>🛒</Text>
              <Text style={styles.sectionTitle}>Loja de Prêmios</Text>
              <View style={styles.itemCount}>
                <Text style={styles.itemCountText}>{activeRewards.length}</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(200 + index * 80).duration(300)}>
            <GaloRewardCard
              reward={item}
              starBalance={starBalance}
              onRedeem={() => handleRedeem(item)}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <Animated.View entering={ZoomIn.delay(300).duration(400)}>
            <Surface style={styles.emptyCard} elevation={0}>
              <Text style={styles.emptyEmoji}>🎁</Text>
              <Text style={styles.emptyTitle}>Loja Vazia!</Text>
              <Text style={styles.emptySubtitle}>
                Peça para seu pai adicionar prêmios legais!
              </Text>
            </Surface>
          </Animated.View>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
  header: {
    marginBottom: ChildSizes.itemGap,
  },
  list: {
    padding: 16,
  },
  // Balance Card
  balanceCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: ChildSizes.cardPadding,
    alignItems: 'center',
    marginBottom: ChildSizes.sectionGap,
    borderWidth: 2,
    borderColor: ChildColors.starGold,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  balanceEmoji: {
    fontSize: 24,
  },
  balanceTitle: {
    fontSize: 16,
    color: ChildColors.textSecondary,
    fontWeight: '600',
  },
  balanceNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: ChildColors.starGold,
  },
  balanceSubtitle: {
    fontSize: 14,
    color: ChildColors.textSecondary,
    marginTop: 4,
  },
  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionEmoji: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ChildColors.textPrimary,
    flex: 1,
  },
  itemCount: {
    backgroundColor: ChildColors.starGold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: ChildColors.galoBlack,
  },
  // Redemption Cards
  redemptionCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  redemptionName: {
    fontSize: 16,
    color: ChildColors.textPrimary,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
  },
  statusFulfilled: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: ChildColors.textPrimary,
  },
  // Reward Cards
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
    opacity: 0.5,
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
  // Empty State
  emptyCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: ChildColors.starGold,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: ChildColors.textSecondary,
    textAlign: 'center',
  },
});
