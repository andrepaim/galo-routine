import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Text, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Layout } from '../../../constants';
import { useAuthStore, usePeriodStore, useTaskStore } from '../../../lib/stores';
import { useCurrentPeriod } from '../../../lib/hooks/useCurrentPeriod';
import { useStarBudget } from '../../../lib/hooks/useStarBudget';
import { StarBudgetRing } from '../../../components/stars/StarBudgetRing';
import { PeriodSummary } from '../../../components/periods/PeriodSummary';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { buildPeriod } from '../../../lib/utils/periodUtils';
import { createPeriod } from '../../../lib/firebase/firestore';

export default function PeriodScreen() {
  const router = useRouter();
  const familyId = useAuthStore((s) => s.familyId);
  const family = useAuthStore((s) => s.family);
  const tasks = useTaskStore((s) => s.tasks);
  const { activePeriod, isLoading } = useCurrentPeriod();
  const starProgress = useStarBudget();
  const completePeriod = usePeriodStore((s) => s.completePeriod);

  if (isLoading) {
    return <LoadingScreen message="Loading period..." />;
  }

  const handleEndPeriod = () => {
    if (!familyId || !activePeriod?.id) return;
    Alert.alert(
      'End Period',
      'Are you sure you want to end the current period? The outcome will be calculated based on stars earned.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Period',
          onPress: async () => {
            await completePeriod(familyId, activePeriod.id!);
          },
        },
      ],
    );
  };

  const handleNewPeriod = async () => {
    if (!familyId || !family?.settings) return;
    const period = buildPeriod(family.settings, tasks);
    await createPeriod(familyId, period);
  };

  if (!activePeriod) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <EmptyState
          icon="calendar-plus"
          title="No Active Period"
          description="Start a new period to begin tracking stars."
          actionLabel="Start Period"
          onAction={handleNewPeriod}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {starProgress && (
          <View style={styles.ringContainer}>
            <StarBudgetRing progress={starProgress} size={220} />
          </View>
        )}

        <PeriodSummary period={activePeriod} />

        <Divider style={styles.divider} />

        <View style={styles.thresholds}>
          <Text variant="titleSmall" style={styles.thresholdTitle}>
            Thresholds
          </Text>
          <Text variant="bodyMedium" style={styles.thresholdItem}>
            Reward ({activePeriod.thresholds.rewardPercent}%): {activePeriod.thresholds.rewardDescription}
          </Text>
          <Text variant="bodyMedium" style={styles.thresholdItem}>
            Penalty ({activePeriod.thresholds.penaltyPercent}%): {activePeriod.thresholds.penaltyDescription}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => router.push('/(parent)/periods/history')}
            icon="history"
          >
            View History
          </Button>
          <Button
            mode="contained"
            buttonColor={Colors.penalty}
            onPress={handleEndPeriod}
            icon="stop"
          >
            End Period Early
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Layout.padding.md,
  },
  ringContainer: {
    alignItems: 'center',
    marginVertical: Layout.padding.lg,
  },
  divider: {
    marginVertical: Layout.padding.lg,
  },
  thresholds: {
    gap: Layout.padding.sm,
  },
  thresholdTitle: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  thresholdItem: {
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: Layout.padding.md,
    marginTop: Layout.padding.xl,
  },
});
