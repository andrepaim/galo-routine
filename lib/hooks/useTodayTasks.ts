import { useMemo } from 'react';
import { useTaskStore } from '../stores';
import { useCompletionStore } from '../stores/completionStore';
import { getTasksForDate } from '../utils/recurrence';
import type { TodayTask } from '../types';

export function useTodayTasks(): { todayTasks: TodayTask[]; isLoading: boolean } {
  const tasks = useTaskStore((s) => s.tasks);
  const tasksLoading = useTaskStore((s) => s.isLoading);
  const completions = useCompletionStore((s) => s.completions);
  const completionsLoading = useCompletionStore((s) => s.isLoading);
  const getCompletionForTask = useCompletionStore((s) => s.getCompletionForTask);

  const todayTasks = useMemo(() => {
    const today = new Date();
    const scheduledTasks = getTasksForDate(tasks, today);

    return scheduledTasks.map((task): TodayTask => ({
      ...task,
      id: task.id!,
      completion: getCompletionForTask(task.id!, today),
    }));
  }, [tasks, completions]);

  return {
    todayTasks,
    isLoading: tasksLoading || completionsLoading,
  };
}
