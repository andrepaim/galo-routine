import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { FAB, Text, Card, Icon, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Layout } from '../../../constants';
import { useAuthStore, useRewardStore } from '../../../lib/stores';
import { RewardCard } from '../../../components/rewards/RewardCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';

export default function RewardsScreen() {
  const router = useRouter();
  const familyId = useAuthStore((s) => s.familyId);
  const family = useAuthStore((s) => s.family);
  const { rewards, redemptions, isLoading } = useRewardStore();

  const pendingRedemptions = redemptions.filter((r) => r.status === 'pending');

  if (isLoading) {
    return <LoadingScreen variant="skeleton-list" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {pendingRedemptions.length > 0 && (
        <Card style={styles.pendingCard}>
          <Card.Content style={styles.pendingContent}>
            <Icon source="clock-outline" size={24} color={Colors.neutral} />
            <Text variant="bodyMedium" style={styles.pendingText}>
              {pendingRedemptions.length} pending {pendingRedemptions.length === 1 ? 'redemption' : 'redemptions'}
            </Text>
            <Button
              mode="text"
              compact
              onPress={() => router.push('/(parent)/rewards/history')}
            >
              Review
            </Button>
          </Card.Content>
        </Card>
      )}

      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id!}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 60).duration(300)}>
            <RewardCard
              reward={item}
              starBalance={family?.starBalance ?? 0}
              onPress={() => router.push(`/(parent)/rewards/${item.id}`)}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="gift-outline"
            title="No Rewards Yet"
            description="Create rewards for your child to redeem with their stars!"
          />
        }
        contentContainerStyle={styles.list}
      />

      <FAB
        icon="plus"
        onPress={() => router.push('/(parent)/rewards/new')}
        style={styles.fab}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  pendingCard: {
    margin: Layout.padding.md,
    marginBottom: 0,
    backgroundColor: Colors.neutralContainer,
  },
  pendingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.sm,
  },
  pendingText: {
    flex: 1,
    color: Colors.text,
  },
  list: {
    padding: Layout.padding.md,
  },
  fab: {
    position: 'absolute',
    right: Layout.padding.md,
    bottom: Layout.padding.md,
    backgroundColor: Colors.primary,
  },
});
