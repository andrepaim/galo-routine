import { eachDayOfInterval, getDay } from 'date-fns';
import type { Task, TaskRecurrence } from '../types';

/**
 * Check if a task is scheduled for a given date based on its recurrence.
 */
export function isTaskScheduledForDate(recurrence: TaskRecurrence, date: Date): boolean {
  const dayOfWeek = getDay(date); // 0=Sun..6=Sat
  switch (recurrence.type) {
    case 'daily':
      return true;
    case 'specific_days':
      return recurrence.days?.includes(dayOfWeek) ?? false;
    case 'once':
      // "once" tasks appear every day of the period (they are one-time tasks the child can do any day)
      return true;
    default:
      return false;
  }
}

/**
 * Get all tasks that are scheduled for a specific date.
 */
export function getTasksForDate(tasks: Task[], date: Date): Task[] {
  return tasks.filter((t) => t.isActive && isTaskScheduledForDate(t.recurrence, date));
}

/**
 * Count how many times a task appears in a date range.
 */
export function countTaskOccurrences(recurrence: TaskRecurrence, start: Date, end: Date): number {
  if (recurrence.type === 'once') return 1;

  const days = eachDayOfInterval({ start, end });
  return days.filter((d) => isTaskScheduledForDate(recurrence, d)).length;
}
