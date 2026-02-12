import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Surface, Icon } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { ChildColors, ChildSizes, STAR_EMOJI, TROPHY_EMOJI } from '../../constants';
import { useAuthStore, useRewardStore, useGoalStore } from '../../lib/stores';
import { GaloRewardCard } from '../../components/rewards/GaloRewardCard';
import { GoalCard } from '../../components/goals/GoalCard';
import { StreakDisplay } from '../../components/streaks/StreakDisplay';

export default function ProgressScreen() {
  const familyId = useAuthStore((s) => s.familyId);
  const family = useAuthStore((s) => s.family);
  const { rewards, redemptions, redeemReward } = useRewardStore();
  const { goals } = useGoalStore();

  const goalBalance = family?.goalBalance ?? 0;
  const lifetimeGoals = family?.lifetimeGoalsEarned ?? 0;
  const currentStreak = family?.currentStreak ?? 0;
  const bestStreak = family?.bestStreak ?? 0;

  const activeRewards = rewards.filter((r) => r.isActive !== false);
  const myRedemptions = redemptions.filter((r) => r.status === 'pending' || r.status === 'fulfilled');

  const handleRedeem = (reward: typeof rewards[0]) => {
    if (goalBalance < reward.goalCost) return;
    Alert.alert(
      '🛒 Trocar Gols',
      `Gastar ${reward.goalCost} gols em "${reward.name}"?\n\nVocê terá ${goalBalance - reward.goalCost} gols restantes.`,
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

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Goal Balance Card */}
        <Animated.View entering={ZoomIn.duration(400)}>
          <Surface style={styles.balanceCard} elevation={0}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceEmoji}>{STAR_EMOJI}</Text>
              <Text style={styles.balanceTitle}>Seus Gols</Text>
            </View>
            <Text style={styles.balanceNumber}>{goalBalance}</Text>
            <Text style={styles.balanceSubtitle}>disponíveis para trocar</Text>
          </Surface>
        </Animated.View>

        {/* Pending Redemptions */}
        {myRedemptions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>{TROPHY_EMOJI}</Text>
              <Text style={styles.sectionTitle}>Meus Prêmios</Text>
            </View>
            {myRedemptions.slice(0, 5).map((r) => (
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

        {/* Rewards Section */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>🛒</Text>
            <Text style={styles.sectionTitle}>Prêmios</Text>
            <View style={styles.itemCount}>
              <Text style={styles.itemCountText}>{activeRewards.length}</Text>
            </View>
          </View>

          {activeRewards.length > 0 ? (
            activeRewards.map((reward) => (
              <GaloRewardCard
                key={reward.id}
                reward={reward}
                goalBalance={goalBalance}
                onRedeem={() => handleRedeem(reward)}
              />
            ))
          ) : (
            <Surface style={styles.emptyCard} elevation={0}>
              <Text style={styles.emptyEmoji}>🎁</Text>
              <Text style={styles.emptyTitle}>Loja Vazia!</Text>
              <Text style={styles.emptySubtitle}>
                Peça para seu pai adicionar prêmios legais!
              </Text>
            </Surface>
          )}
        </Animated.View>

        {/* Streak Section */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>🔥</Text>
            <Text style={styles.sectionTitle}>Sequência</Text>
          </View>
          <StreakDisplay
            currentStreak={currentStreak}
            bestStreak={bestStreak}
          />
        </Animated.View>

        {/* Long-term Goals Section */}
        {goals.length > 0 && (
          <Animated.View entering={FadeInUp.delay(400).duration(400)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>🎯</Text>
              <Text style={styles.sectionTitle}>Metas</Text>
            </View>
            {goals.map((goal) => (
              <View key={goal.id} style={styles.goalCardWrapper}>
                <GoalCard goal={goal} lifetimeGoals={lifetimeGoals} />
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
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
    backgroundColor: 'rgba(184, 150, 11, 0.2)',
  },
  statusFulfilled: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: ChildColors.textPrimary,
  },
  // Goal Card Wrapper
  goalCardWrapper: {
    marginBottom: ChildSizes.itemGap,
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
