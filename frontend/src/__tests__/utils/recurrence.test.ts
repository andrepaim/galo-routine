import { describe, it, expect } from 'vitest';
import { isTaskScheduledForDate, getTasksForDate, countTaskOccurrences } from '../../lib/utils/recurrence';
import type { Task, TaskRecurrence } from '../../lib/types';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    name: 'Test Task',
    description: 'desc',
    starValue: 2,
    isActive: true,
    recurrence: { type: 'daily' },
    ...overrides,
  };
}

describe('isTaskScheduledForDate', () => {
  it('daily tasks are always scheduled', () => {
    const rec: TaskRecurrence = { type: 'daily' };
    expect(isTaskScheduledForDate(rec, new Date('2026-01-06'))).toBe(true); // Monday
    expect(isTaskScheduledForDate(rec, new Date('2026-01-11'))).toBe(true); // Saturday
    expect(isTaskScheduledForDate(rec, new Date('2026-01-12'))).toBe(true); // Sunday
  });

  it('specific_days matches correct days', () => {
    const rec: TaskRecurrence = { type: 'specific_days', days: [1, 3, 5] }; // Mon, Wed, Fri
    expect(isTaskScheduledForDate(rec, new Date('2026-01-05'))).toBe(true);  // Monday
    expect(isTaskScheduledForDate(rec, new Date('2026-01-06'))).toBe(false); // Tuesday
    expect(isTaskScheduledForDate(rec, new Date('2026-01-07'))).toBe(true);  // Wednesday
  });

  it('specific_days returns false when days array is undefined', () => {
    const rec: TaskRecurrence = { type: 'specific_days' };
    expect(isTaskScheduledForDate(rec, new Date('2026-01-06'))).toBe(false);
  });

  it('once tasks are always scheduled', () => {
    const rec: TaskRecurrence = { type: 'once' };
    expect(isTaskScheduledForDate(rec, new Date('2026-01-06'))).toBe(true);
    expect(isTaskScheduledForDate(rec, new Date('2026-01-10'))).toBe(true);
  });

  it('unknown type returns false', () => {
    const rec = { type: 'unknown' } as any;
    expect(isTaskScheduledForDate(rec, new Date('2026-01-06'))).toBe(false);
  });
});

describe('getTasksForDate', () => {
  it('returns only active tasks scheduled for the date', () => {
    const tasks = [
      makeTask({ id: '1', recurrence: { type: 'daily' } }),
      makeTask({ id: '2', isActive: false, recurrence: { type: 'daily' } }),
      makeTask({ id: '3', recurrence: { type: 'specific_days', days: [0] } }), // Sunday only
    ];
    // Tuesday Jan 6, 2026
    const result = getTasksForDate(tasks, new Date('2026-01-06'));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('returns empty for no matching tasks', () => {
    const tasks = [makeTask({ isActive: false })];
    const result = getTasksForDate(tasks, new Date('2026-01-06'));
    expect(result).toHaveLength(0);
  });

  it('returns all daily active tasks', () => {
    const tasks = [
      makeTask({ id: '1' }),
      makeTask({ id: '2' }),
    ];
    const result = getTasksForDate(tasks, new Date('2026-01-06'));
    expect(result).toHaveLength(2);
  });
});

describe('countTaskOccurrences', () => {
  it('once recurrence always returns 1', () => {
    const rec: TaskRecurrence = { type: 'once' };
    expect(countTaskOccurrences(rec, new Date('2026-01-06'), new Date('2026-01-12'))).toBe(1);
  });

  it('daily recurrence counts all days in range', () => {
    const rec: TaskRecurrence = { type: 'daily' };
    expect(countTaskOccurrences(rec, new Date('2026-01-06'), new Date('2026-01-12'))).toBe(7);
  });

  it('specific_days counts only matching days', () => {
    // Mon(1), Wed(3), Fri(5) in a Mon-Sun week starting 2026-01-05
    const rec: TaskRecurrence = { type: 'specific_days', days: [1, 3, 5] };
    expect(countTaskOccurrences(rec, new Date('2026-01-05'), new Date('2026-01-11'))).toBe(3);
  });

  it('single day range', () => {
    const rec: TaskRecurrence = { type: 'daily' };
    expect(countTaskOccurrences(rec, new Date('2026-01-06'), new Date('2026-01-06'))).toBe(1);
  });
});
