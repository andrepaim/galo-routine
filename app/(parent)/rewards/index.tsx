import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { FAB, Text, Card, Icon, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChildColors, ChildSizes } from '../../../constants/childTheme';
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
            <Icon source="clock-outline" size={24} color={ChildColors.starGold} />
            <Text variant="bodyMedium" style={styles.pendingText}>
              {pendingRedemptions.length} {pendingRedemptions.length === 1 ? 'resgate pendente' : 'resgates pendentes'}
            </Text>
            <Button
              mode="text"
              compact
              onPress={() => router.push('/(parent)/rewards/history')}
              textColor={ChildColors.starGold}
            >
              Revisar
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
            title="Sem Prêmios"
            description="Crie prêmios para seu filho resgatar com as estrelas!"
          />
        }
        contentContainerStyle={styles.list}
      />

      <FAB
        icon="plus"
        onPress={() => router.push('/(parent)/rewards/new')}
        style={styles.fab}
        color={ChildColors.galoBlack}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
  pendingCard: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    borderWidth: 1,
    borderColor: ChildColors.starGold,
  },
  pendingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pendingText: {
    flex: 1,
    color: ChildColors.textPrimary,
  },
  list: {
    padding: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: ChildColors.starGold,
  },
});
