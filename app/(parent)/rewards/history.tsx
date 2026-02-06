import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Card, Text, Icon, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Layout } from '../../../constants';
import { ChildColors, ChildSizes } from '../../../constants/childTheme';
import { useAuthStore, useRewardStore } from '../../../lib/stores';
import { EmptyState } from '../../../components/ui/EmptyState';

export default function RedemptionHistoryScreen() {
  const familyId = useAuthStore((s) => s.familyId);
  const { redemptions, fulfillRedemption, rejectRedemption } = useRewardStore();

  const handleFulfill = async (id: string) => {
    if (!familyId) return;
    await fulfillRedemption(familyId, id);
  };

  const handleReject = async (id: string) => {
    if (!familyId) return;
    await rejectRedemption(familyId, id);
  };

  if (redemptions.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <EmptyState
          icon="history"
          title="No Redemptions Yet"
          description="Redemptions will appear here when your child redeems rewards."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={redemptions}
        keyExtractor={(item) => item.id!}
        renderItem={({ item, index }) => {
          const statusColor =
            item.status === 'fulfilled' ? ChildColors.accentGreen
            : item.status === 'rejected' ? ChildColors.accentRed
            : ChildColors.starGold;

          return (
            <Animated.View entering={FadeInDown.delay(index * 60).duration(300)}>
              <Card style={styles.card}>
                <Card.Content style={styles.content}>
                  <View style={styles.info}>
                    <Text variant="titleSmall" style={styles.name}>
                      {item.rewardName}
                    </Text>
                    <View style={styles.metaRow}>
                      <Icon source="star" size={14} color={ChildColors.starGold} />
                      <Text variant="bodySmall" style={styles.cost}>
                        {item.starCost} stars
                      </Text>
                      <Text variant="bodySmall" style={styles.date}>
                        {format(item.redeemedAt.toDate(), 'MMM d, h:mm a')}
                      </Text>
                    </View>
                    <Text variant="bodySmall" style={[styles.status, { color: statusColor }]}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                  </View>
                  {item.status === 'pending' && (
                    <View style={styles.actions}>
                      <Button
                        mode="contained"
                        compact
                        onPress={() => handleFulfill(item.id!)}
                        style={styles.fulfillBtn}
                        labelStyle={styles.btnLabel}
                      >
                        Fulfill
                      </Button>
                      <Button
                        mode="outlined"
                        compact
                        onPress={() => handleReject(item.id!)}
                        textColor={ChildColors.accentRed}
                        style={styles.rejectBtn}
                        labelStyle={styles.btnLabel}
                      >
                        Reject
                      </Button>
                    </View>
                  )}
                </Card.Content>
              </Card>
            </Animated.View>
          );
        }}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
  list: {
    padding: Layout.padding.md,
  },
  card: {
    marginVertical: Layout.padding.xs,
    backgroundColor: ChildColors.cardBackground,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cost: {
    color: ChildColors.starGoldDark,
  },
  date: {
    color: ChildColors.textPrimarySecondary,
    marginLeft: Layout.padding.sm,
  },
  status: {
    marginTop: 2,
    fontWeight: 'bold',
  },
  actions: {
    gap: Layout.padding.xs,
  },
  fulfillBtn: {
    backgroundColor: ChildColors.accentGreen,
  },
  rejectBtn: {
    borderColor: ChildColors.accentRed,
  },
  btnLabel: {
    fontSize: 12,
  },
});
