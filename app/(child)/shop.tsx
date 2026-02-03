import React from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Text, Icon, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors, Layout } from '../../constants';
import { useAuthStore, useRewardStore } from '../../lib/stores';
import { RewardCard } from '../../components/rewards/RewardCard';
import { EmptyState } from '../../components/ui/EmptyState';

export default function RewardShopScreen() {
  const familyId = useAuthStore((s) => s.familyId);
  const family = useAuthStore((s) => s.family);
  const { rewards, redemptions, redeemReward } = useRewardStore();

  const starBalance = family?.starBalance ?? 0;
  const activeRewards = rewards.filter((r) => r.isActive);
  const myRedemptions = redemptions.filter((r) => r.status === 'pending' || r.status === 'fulfilled');

  const handleRedeem = (reward: typeof rewards[0]) => {
    if (starBalance < reward.starCost) return;
    Alert.alert(
      'Redeem Reward',
      `Spend ${reward.starCost} stars on "${reward.name}"?\n\nYou'll have ${starBalance - reward.starCost} stars remaining.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem!',
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={activeRewards}
        keyExtractor={(item) => item.id!}
        ListHeaderComponent={
          <View>
            <Animated.View entering={FadeInUp.duration(400)} style={styles.balanceCard}>
              <Icon source="star" size={32} color={Colors.starFilled} />
              <Text variant="headlineMedium" style={styles.balanceCount}>
                {starBalance}
              </Text>
              <Text variant="bodyMedium" style={styles.balanceLabel}>
                stars to spend
              </Text>
            </Animated.View>

            {myRedemptions.length > 0 && (
              <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  My Rewards
                </Text>
                {myRedemptions.slice(0, 3).map((r) => (
                  <Card key={r.id} style={styles.redemptionCard}>
                    <Card.Content style={styles.redemptionContent}>
                      <Text variant="bodyMedium" style={styles.redemptionName}>
                        {r.rewardName}
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={{
                          color: r.status === 'pending' ? Colors.neutral : Colors.reward,
                          fontWeight: 'bold',
                        }}
                      >
                        {r.status === 'pending' ? 'Pending...' : 'Fulfilled!'}
                      </Text>
                    </Card.Content>
                  </Card>
                ))}
              </Animated.View>
            )}

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Available Rewards
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(200 + index * 80).duration(300)}>
            <RewardCard
              reward={item}
              starBalance={starBalance}
              onRedeem={() => handleRedeem(item)}
              showRedeem
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="gift-outline"
            title="No Rewards Available"
            description="Ask your parent to add rewards!"
          />
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondaryContainer,
  },
  list: {
    padding: Layout.padding.md,
  },
  balanceCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.lg,
    padding: Layout.padding.lg,
    marginBottom: Layout.padding.lg,
    elevation: 2,
  },
  balanceCount: {
    fontWeight: 'bold',
    color: Colors.primaryDark,
  },
  balanceLabel: {
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.padding.sm,
    marginTop: Layout.padding.md,
  },
  redemptionCard: {
    marginVertical: Layout.padding.xs,
    backgroundColor: Colors.surface,
  },
  redemptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  redemptionName: {
    color: Colors.text,
  },
});
