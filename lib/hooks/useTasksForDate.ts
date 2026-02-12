import { useMemo } from 'react';
import { useTaskStore } from '../stores';
import { useCompletionStore } from '../stores/completionStore';
import { getTasksForDate } from '../utils/recurrence';
import { compareTimeStrings } from '../utils/time';
import { format } from 'date-fns';
import type { TodayTask } from '../types';

export function useTasksForDate(date: Date): { todayTasks: TodayTask[]; isLoading: boolean } {
  const tasks = useTaskStore((s) => s.tasks);
  const tasksLoading = useTaskStore((s) => s.isLoading);
  const completions = useCompletionStore((s) => s.completions);
  const completionsLoading = useCompletionStore((s) => s.isLoading);
  const getCompletionForTask = useCompletionStore((s) => s.getCompletionForTask);

  // Normalize to yyyy-MM-dd to avoid re-renders on same calendar day
  const dateKey = format(date, 'yyyy-MM-dd');

  const todayTasks = useMemo(() => {
    const targetDate = new Date(dateKey + 'T12:00:00');
    const scheduledTasks = getTasksForDate(tasks, targetDate);

    const mapped = scheduledTasks
      .map((task): TodayTask => ({
        ...task,
        id: task.id!,
        completion: getCompletionForTask(task.id!, targetDate),
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
  }, [tasks, completions, dateKey]);

  return {
    todayTasks,
    isLoading: tasksLoading || completionsLoading,
  };
}
