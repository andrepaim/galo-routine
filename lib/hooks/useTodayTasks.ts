import { useTasksForDate } from './useTasksForDate';

export function useTodayTasks() {
  return useTasksForDate(new Date());
}
