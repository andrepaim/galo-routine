import { isTaskScheduledForDate, getTasksForDate, countTaskOccurrences } from '../recurrence';
import type { Task, TaskRecurrence } from '../../types';

describe('recurrence utilities', () => {
  describe('isTaskScheduledForDate', () => {
    it('should return true for daily recurrence on any day', () => {
      const recurrence: TaskRecurrence = { type: 'daily' };
      // Monday
      expect(isTaskScheduledForDate(recurrence, new Date(2026, 0, 5))).toBe(true);
      // Saturday
      expect(isTaskScheduledForDate(recurrence, new Date(2026, 0, 10))).toBe(true);
      // Sunday
      expect(isTaskScheduledForDate(recurrence, new Date(2026, 0, 11))).toBe(true);
    });

    it('should return true for specific_days when the day matches', () => {
      // Monday=1, Wednesday=3, Friday=5
      const recurrence: TaskRecurrence = { type: 'specific_days', days: [1, 3, 5] };
      // 2026-01-05 is a Monday
      expect(isTaskScheduledForDate(recurrence, new Date(2026, 0, 5))).toBe(true);
      // 2026-01-07 is a Wednesday
      expect(isTaskScheduledForDate(recurrence, new Date(2026, 0, 7))).toBe(true);
    });

    it('should return false for specific_days when the day does not match', () => {
      const recurrence: TaskRecurrence = { type: 'specific_days', days: [1, 3, 5] };
      // 2026-01-06 is a Tuesday
      expect(isTaskScheduledForDate(recurrence, new Date(2026, 0, 6))).toBe(false);
      // 2026-01-10 is a Saturday
      expect(isTaskScheduledForDate(recurrence, new Date(2026, 0, 10))).toBe(false);
    });

    it('should return false for specific_days with no days array', () => {
      const recurrence: TaskRecurrence = { type: 'specific_days' };
      expect(isTaskScheduledForDate(recurrence, new Date(2026, 0, 5))).toBe(false);
    });

    it('should return true for once recurrence on any day', () => {
      const recurrence: TaskRecurrence = { type: 'once' };
      expect(isTaskScheduledForDate(recurrence, new Date(2026, 0, 5))).toBe(true);
      expect(isTaskScheduledForDate(recurrence, new Date(2026, 0, 10))).toBe(true);
    });

    it('should return false for unknown recurrence type', () => {
      const recurrence = { type: 'unknown' } as any;
      expect(isTaskScheduledForDate(recurrence, new Date(2026, 0, 5))).toBe(false);
    });
  });

  describe('getTasksForDate', () => {
    const tasks: Task[] = [
      {
        id: 'task-1',
        name: 'Daily Task',
        description: '',
        goals: 1,
        taskType: 'routine' as const,
        isActive: true,
        recurrence: { type: 'daily' },
      },
      {
        id: 'task-2',
        name: 'Monday Task',
        description: '',
        goals: 2,
        taskType: 'routine' as const,
        isActive: true,
        recurrence: { type: 'specific_days', days: [1] },
      },
      {
        id: 'task-3',
        name: 'Inactive Task',
        description: '',
        goals: 1,
        taskType: 'routine' as const,
        isActive: false,
        recurrence: { type: 'daily' },
      },
    ];

    it('should include active daily tasks', () => {
      const result = getTasksForDate(tasks, new Date(2026, 0, 5)); // Monday
      expect(result.some(t => t.id === 'task-1')).toBe(true);
    });

    it('should include specific_days tasks on matching day', () => {
      const result = getTasksForDate(tasks, new Date(2026, 0, 5)); // Monday
      expect(result.some(t => t.id === 'task-2')).toBe(true);
    });

    it('should exclude specific_days tasks on non-matching day', () => {
      const result = getTasksForDate(tasks, new Date(2026, 0, 6)); // Tuesday
      expect(result.some(t => t.id === 'task-2')).toBe(false);
    });

    it('should exclude inactive tasks', () => {
      const result = getTasksForDate(tasks, new Date(2026, 0, 5));
      expect(result.some(t => t.id === 'task-3')).toBe(false);
    });

    it('should return empty array when no tasks match', () => {
      const result = getTasksForDate([], new Date(2026, 0, 5));
      expect(result).toEqual([]);
    });
  });

  describe('countTaskOccurrences', () => {
    it('should count daily recurrence as every day in the range', () => {
      const recurrence: TaskRecurrence = { type: 'daily' };
      // 7 days: Jan 5 (Mon) to Jan 11 (Sun)
      const count = countTaskOccurrences(
        recurrence,
        new Date(2026, 0, 5),
        new Date(2026, 0, 11),
      );
      expect(count).toBe(7);
    });

    it('should count specific_days correctly', () => {
      // Mon=1, Wed=3, Fri=5
      const recurrence: TaskRecurrence = { type: 'specific_days', days: [1, 3, 5] };
      // Jan 5 (Mon) to Jan 11 (Sun): Mon, Wed, Fri = 3
      const count = countTaskOccurrences(
        recurrence,
        new Date(2026, 0, 5),
        new Date(2026, 0, 11),
      );
      expect(count).toBe(3);
    });

    it('should count once recurrence as exactly 1', () => {
      const recurrence: TaskRecurrence = { type: 'once' };
      const count = countTaskOccurrences(
        recurrence,
        new Date(2026, 0, 5),
        new Date(2026, 0, 11),
      );
      expect(count).toBe(1);
    });

    it('should handle single-day range', () => {
      const recurrence: TaskRecurrence = { type: 'daily' };
      const count = countTaskOccurrences(
        recurrence,
        new Date(2026, 0, 5),
        new Date(2026, 0, 5),
      );
      expect(count).toBe(1);
    });

    it('should handle two-week specific_days', () => {
      const recurrence: TaskRecurrence = { type: 'specific_days', days: [6] }; // Saturday only
      // Jan 5 (Mon) to Jan 18 (Sun): 2 Saturdays (Jan 10, Jan 17)
      const count = countTaskOccurrences(
        recurrence,
        new Date(2026, 0, 5),
        new Date(2026, 0, 18),
      );
      expect(count).toBe(2);
    });
  });
});
