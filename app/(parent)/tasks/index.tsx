import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { FAB, Chip, Icon } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors, Layout, TASK_CATEGORIES } from '../../../constants';
import { useTaskStore, useAuthStore } from '../../../lib/stores';
import { TaskCard } from '../../../components/tasks/TaskCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';

export default function TasksListScreen() {
  const router = useRouter();
  const familyId = useAuthStore((s) => s.familyId);
  const { tasks, isLoading } = useTaskStore();
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [fabOpen, setFabOpen] = useState(false);

  const filteredTasks = filterCategory
    ? tasks.filter((t) => t.category === filterCategory)
    : tasks;

  if (isLoading) {
    return <LoadingScreen variant="skeleton-list" />;
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
        <FAB.Group
          open={fabOpen}
          icon={fabOpen ? 'close' : 'plus'}
          visible
          actions={[
            { icon: 'plus', label: 'New Task', onPress: () => router.push('/(parent)/tasks/new') },
            { icon: 'file-document-outline', label: 'From Templates', onPress: () => router.push('/(parent)/tasks/templates') },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          fabStyle={styles.fab}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id!}
        ListHeaderComponent={
          <View style={styles.filterRow}>
            <Chip
              selected={filterCategory === null}
              onPress={() => setFilterCategory(null)}
              style={styles.filterChip}
            >
              All
            </Chip>
            {TASK_CATEGORIES.map((cat) => (
              <Chip
                key={cat.id}
                selected={filterCategory === cat.id}
                onPress={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
                icon={() => <Icon source={cat.icon} size={14} color={filterCategory === cat.id ? Colors.white : cat.color} />}
                style={[styles.filterChip, filterCategory === cat.id && { backgroundColor: cat.color }]}
                textStyle={filterCategory === cat.id ? { color: Colors.white } : undefined}
              >
                {cat.name}
              </Chip>
            ))}
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
            <TaskCard
              task={item}
              onPress={() => router.push(`/(parent)/tasks/${item.id}`)}
            />
          </Animated.View>
        )}
        contentContainerStyle={styles.list}
      />
      <FAB.Group
        open={fabOpen}
        icon={fabOpen ? 'close' : 'plus'}
        visible
        actions={[
          { icon: 'plus', label: 'New Task', onPress: () => router.push('/(parent)/tasks/new') },
          { icon: 'file-document-outline', label: 'From Templates', onPress: () => router.push('/(parent)/tasks/templates') },
        ]}
        onStateChange={({ open }) => setFabOpen(open)}
        fabStyle={styles.fab}
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.padding.xs,
    marginBottom: Layout.padding.md,
  },
  filterChip: {
    backgroundColor: Colors.surfaceVariant,
  },
  fab: {
    backgroundColor: Colors.primary,
  },
});
