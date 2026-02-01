import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Layout } from '../../../constants';
import { useTaskStore, useAuthStore } from '../../../lib/stores';
import { TaskCard } from '../../../components/tasks/TaskCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';

export default function TasksListScreen() {
  const router = useRouter();
  const familyId = useAuthStore((s) => s.familyId);
  const { tasks, isLoading } = useTaskStore();

  if (isLoading) {
    return <LoadingScreen message="Loading tasks..." />;
  }

  if (tasks.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <EmptyState
          icon="format-list-checks"
          title="No Tasks Yet"
          description="Create tasks for your child to earn stars!"
          actionLabel="Create First Task"
          onAction={() => router.push('/(parent)/tasks/new')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id!}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={() => router.push(`/(parent)/tasks/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/(parent)/tasks/new')}
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
  fab: {
    position: 'absolute',
    right: Layout.padding.md,
    bottom: Layout.padding.md,
    backgroundColor: Colors.primary,
  },
});
