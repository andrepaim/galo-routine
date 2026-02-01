import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Layout } from '../../../constants';
import { usePeriodStore } from '../../../lib/stores';
import { PeriodSummary } from '../../../components/periods/PeriodSummary';
import { EmptyState } from '../../../components/ui/EmptyState';

export default function PeriodHistoryScreen() {
  const periods = usePeriodStore((s) => s.periods);
  const completedPeriods = periods.filter((p) => p.status === 'completed');

  if (completedPeriods.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <EmptyState
          icon="calendar-blank"
          title="No History Yet"
          description="Completed periods will appear here."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={completedPeriods}
        keyExtractor={(item) => item.id!}
        renderItem={({ item }) => <PeriodSummary period={item} />}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: Layout.padding.md,
  },
});
