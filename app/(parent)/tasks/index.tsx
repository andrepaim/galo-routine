import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { FAB, Chip, Icon } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { TASK_CATEGORIES } from '../../../constants';
import { ChildColors, ChildSizes } from '../../../constants/childTheme';
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
          title="Sem Tarefas"
          description="Crie tarefas para seu filho ganhar estrelas!"
          actionLabel="Criar Primeira Tarefa"
          onAction={() => router.push('/(parent)/tasks/new')}
        />
        <FAB.Group
          open={fabOpen}
          icon={fabOpen ? 'close' : 'plus'}
          visible
          actions={[
            { icon: 'plus', label: 'Nova Tarefa', onPress: () => router.push('/(parent)/tasks/new') },
            { icon: 'file-document-outline', label: 'De Modelos', onPress: () => router.push('/(parent)/tasks/templates') },
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
              style={[styles.filterChip, filterCategory === null && styles.filterChipSelected]}
              textStyle={filterCategory === null ? styles.filterChipTextSelected : styles.filterChipText}
            >
              Todas
            </Chip>
            {TASK_CATEGORIES.map((cat) => (
              <Chip
                key={cat.id}
                selected={filterCategory === cat.id}
                onPress={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
                icon={() => <Icon source={cat.icon} size={14} color={filterCategory === cat.id ? ChildColors.galoBlack : cat.color} />}
                style={[styles.filterChip, filterCategory === cat.id && { backgroundColor: cat.color }]}
                textStyle={filterCategory === cat.id ? { color: ChildColors.galoBlack } : { color: ChildColors.textSecondary }}
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
          { icon: 'plus', label: 'Nova Tarefa', onPress: () => router.push('/(parent)/tasks/new') },
          { icon: 'file-document-outline', label: 'De Modelos', onPress: () => router.push('/(parent)/tasks/templates') },
        ]}
        onStateChange={({ open }) => setFabOpen(open)}
        fabStyle={styles.fab}
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
  list: {
    padding: 16,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: ChildColors.cardBackground,
  },
  filterChipSelected: {
    backgroundColor: ChildColors.starGold,
  },
  filterChipText: {
    color: ChildColors.textSecondary,
  },
  filterChipTextSelected: {
    color: ChildColors.galoBlack,
  },
  fab: {
    backgroundColor: ChildColors.starGold,
  },
});
