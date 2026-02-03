import { useMemo } from 'react';
import { useTaskStore } from '../stores';
import { useCompletionStore } from '../stores/completionStore';
import { getTasksForDate } from '../utils/recurrence';
import { compareTimeStrings } from '../utils/time';
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

    const mapped = scheduledTasks
      .map((task): TodayTask => ({
        ...task,
        id: task.id!,
        completion: getCompletionForTask(task.id!, today),
      }))
      .filter((task) => {
        // Hide "once" tasks that were already completed on any day this period
        if (task.recurrence.type === 'once' && !task.completion) {
          const hasAnyCompletion = completions.some(
            (c) => c.taskId === task.id && (c.status === 'approved' || c.status === 'pending'),
          );
          if (hasAnyCompletion) return false;
        }
        return true;
      });

    return mapped.sort((a, b) => compareTimeStrings(a.startTime, b.startTime));
  }, [tasks, completions]);

  return {
    todayTasks,
    isLoading: tasksLoading || completionsLoading,
  };
}
