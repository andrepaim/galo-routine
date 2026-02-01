import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Layout } from '../../constants';
import { useAuthStore, usePeriodStore, useCompletionStore } from '../../lib/stores';
import { ApprovalCard } from '../../components/tasks/ApprovalCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

export default function ApprovalsScreen() {
  const familyId = useAuthStore((s) => s.familyId);
  const activePeriod = usePeriodStore((s) => s.activePeriod);
  const { completions, isLoading, approveCompletion, rejectCompletion } = useCompletionStore();

  const pendingCompletions = completions.filter((c) => c.status === 'pending');

  if (isLoading) {
    return <LoadingScreen message="Loading approvals..." />;
  }

  if (pendingCompletions.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <EmptyState
          icon="check-all"
          title="All Caught Up!"
          description="No pending completions to review."
        />
      </SafeAreaView>
    );
  }

  const handleApprove = async (completionId: string, starValue: number) => {
    if (!familyId || !activePeriod?.id) return;
    await approveCompletion(
      familyId,
      activePeriod.id,
      completionId,
      starValue,
      activePeriod.starsEarned,
      activePeriod.starsPending,
    );
  };

  const handleReject = async (completionId: string, reason: string, starValue: number) => {
    if (!familyId || !activePeriod?.id) return;
    await rejectCompletion(
      familyId,
      activePeriod.id,
      completionId,
      reason,
      starValue,
      activePeriod.starsPending,
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={pendingCompletions}
        keyExtractor={(item) => item.id!}
        renderItem={({ item }) => (
          <ApprovalCard
            completion={item}
            onApprove={() => handleApprove(item.id!, item.taskStarValue)}
            onReject={(reason) => handleReject(item.id!, reason, item.taskStarValue)}
          />
        )}
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
