import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChildColors, ChildSizes } from '../../../constants/childTheme';
import { useAuthStore, useTaskStore } from '../../../lib/stores';
import { TemplateSelector } from '../../../components/tasks/TemplateSelector';
import type { TaskTemplate, TaskFormData } from '../../../lib/types';

export default function TemplatesScreen() {
  const router = useRouter();
  const familyId = useAuthStore((s) => s.familyId);
  const addTasksBatch = useTaskStore((s) => s.addTasksBatch);

  const handleSelect = async (templates: TaskTemplate[]) => {
    if (!familyId || templates.length === 0) return;
    const formDataList: TaskFormData[] = templates.map((t) => ({
      name: t.name,
      description: t.description,
      goals: t.goals,
      icon: t.icon,
      recurrenceType: t.recurrence.type,
      days: t.recurrence.days ?? [],
      startTime: t.startTime,
      endTime: t.endTime,
      category: t.category,
      taskType: 'routine',
    }));
    await addTasksBatch(familyId, formDataList);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TemplateSelector onSelect={handleSelect} onCancel={() => router.back()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
});
