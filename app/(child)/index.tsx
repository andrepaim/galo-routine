import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInLeft, FadeInUp } from 'react-native-reanimated';
import { Colors, Layout } from '../../constants';
import { useAuthStore, usePeriodStore, useCompletionStore } from '../../lib/stores';
import { useTodayTasks } from '../../lib/hooks/useTodayTasks';
import { useStarBudget } from '../../lib/hooks/useStarBudget';
import { useCurrentPeriod } from '../../lib/hooks/useCurrentPeriod';
import { ChildTaskCard } from '../../components/tasks/ChildTaskCard';
import { StarCounter } from '../../components/stars/StarCounter';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

export default function ChildTodayScreen() {
  const childName = useAuthStore((s) => s.childName);
  const familyId = useAuthStore((s) => s.familyId);
  const { activePeriod } = useCurrentPeriod();
  const starProgress = useStarBudget();
  const { todayTasks, isLoading } = useTodayTasks();
  const markTaskDone = useCompletionStore((s) => s.markTaskDone);

  const today = new Date();

  const handleComplete = async (task: typeof todayTasks[0]) => {
    if (!familyId || !activePeriod?.id) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await markTaskDone(familyId, activePeriod.id, task);
  };

  if (isLoading) {
    return <LoadingScreen message="Loading your tasks..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={todayTasks}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Animated.View entering={FadeInLeft.duration(400)} style={styles.greeting}>
              <Icon source="hand-wave" size={32} color={Colors.primary} />
              <Text variant="headlineMedium" style={styles.name}>
                Hi, {childName || 'Star'}!
              </Text>
            </Animated.View>
            <Animated.View entering={FadeInLeft.delay(100).duration(400)}>
              <Text variant="titleMedium" style={styles.date}>
                {format(today, 'EEEE, MMMM d')}
              </Text>
            </Animated.View>

            {starProgress && (
              <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.starSummary}>
                <StarCounter
                  earned={starProgress.earned}
                  budget={starProgress.budget}
                  pending={starProgress.pending}
                  size="large"
                />
              </Animated.View>
            )}

            <Text variant="titleSmall" style={styles.sectionTitle}>
              Today's Tasks ({todayTasks.length})
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <ChildTaskCard
            task={item}
            onComplete={() => handleComplete(item)}
            index={index}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="party-popper"
            title="No Tasks Today!"
            description="Enjoy your free day!"
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
  header: {
    paddingBottom: Layout.padding.md,
  },
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.sm,
  },
  name: {
    fontWeight: 'bold',
    color: Colors.secondaryDark,
  },
  date: {
    color: Colors.textSecondary,
    marginTop: Layout.padding.xs,
    marginBottom: Layout.padding.md,
  },
  starSummary: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.lg,
    padding: Layout.padding.lg,
    alignItems: 'center',
    marginBottom: Layout.padding.lg,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.padding.xs,
  },
  list: {
    padding: Layout.padding.md,
  },
});
