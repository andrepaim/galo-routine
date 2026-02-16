import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Layout } from '../../../constants';
import { ChildColors, ChildSizes } from '../../../constants/childTheme';
import { TaskForm } from '../../../components/tasks/TaskForm';
import { useTaskStore, useAuthStore } from '../../../lib/stores';
import type { TaskFormData } from '../../../lib/types';

export default function EditTaskScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const familyId = useAuthStore((s) => s.familyId);
  const tasks = useTaskStore((s) => s.tasks);
  const editTask = useTaskStore((s) => s.editTask);
  const removeTask = useTaskStore((s) => s.removeTask);
  const toggleTask = useTaskStore((s) => s.toggleTask);
  const [loading, setLoading] = useState(false);

  const task = tasks.find((t) => t.id === id);

  if (!task || !id) {
    return null;
  }

  const handleSubmit = async (data: TaskFormData) => {
    if (!familyId) return;
    setLoading(true);
    try {
      await editTask(familyId, id, data);
      router.back();
    } catch (e) {
      console.error('Failed to update task:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir Tarefa',
      `Tem certeza que deseja excluir "${task.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            if (!familyId) return;
            await removeTask(familyId, id);
            router.back();
          },
        },
      ],
    );
  };

  const handleToggle = async () => {
    if (!familyId) return;
    await toggleTask(familyId, id, !task.isActive);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TaskForm
        initialData={{
          name: task.name,
          description: task.description,
          starValue: task.starValue,
          icon: task.icon,
          recurrenceType: task.recurrence.type,
          days: task.recurrence.days ?? [],
          startTime: task.startTime,
          endTime: task.endTime,
        }}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isLoading={loading}
        submitLabel="Salvar"
      />
      <View style={styles.footer}>
        <Button
          mode="outlined"
          icon={task.isActive ? 'pause' : 'play'}
          onPress={handleToggle}
          style={styles.footerBtn}
        >
          {task.isActive ? 'Desativar' : 'Ativar'}
        </Button>
        <Button
          mode="outlined"
          icon="delete"
          textColor={ChildColors.accentRed}
          onPress={handleDelete}
          style={styles.footerBtn}
        >
          Excluir
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
  footer: {
    flexDirection: 'row',
    gap: Layout.padding.md,
    padding: Layout.padding.md,
    borderTopWidth: 1,
    borderTopColor: ChildColors.cardBorder,
  },
  footerBtn: {
    flex: 1,
  },
});
