import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChildColors, ChildSizes } from '../../../constants/childTheme';
import { TaskForm } from '../../../components/tasks/TaskForm';
import { useTaskStore, useAuthStore } from '../../../lib/stores';
import type { TaskFormData } from '../../../lib/types';

export default function NewTaskScreen() {
  const router = useRouter();
  const familyId = useAuthStore((s) => s.familyId);
  const addTask = useTaskStore((s) => s.addTask);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: TaskFormData) => {
    if (!familyId) return;
    setLoading(true);
    try {
      await addTask(familyId, data);
      router.back();
    } catch (e) {
      console.error('Failed to create task:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TaskForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isLoading={loading}
        submitLabel="Create Task"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
});
