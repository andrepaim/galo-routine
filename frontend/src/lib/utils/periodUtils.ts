import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  addDays,
  startOfMonth,
  endOfMonth,
  format,
  isWithinInterval,
  isBefore,
  isAfter,
  isToday as isTodayFn,
} from 'date-fns';
import type { FamilySettings, Period, PeriodThresholds, Task } from '../types';
import { calculateStarBudget } from './starCalculations';

/**
 * Parse a period date field (ISO string) to a Date object.
 */
function toDate(val: string | { toDate?: () => Date; _seconds?: number; seconds?: number } | Date): Date {
  if (val instanceof Date) return val;
  if (typeof val === 'string') return new Date(val);
  if (typeof val === 'object') {
    if (typeof (val as { toDate?: () => Date }).toDate === 'function') {
      return (val as { toDate: () => Date }).toDate();
    }
    const seconds = (val as { _seconds?: number; seconds?: number })._seconds
      ?? (val as { seconds?: number }).seconds;
    if (seconds !== undefined) return new Date(seconds * 1000);
  }
  return new Date(String(val));
}

/**
 * Calculate the start and end dates for a new period based on settings.
 */
export function calculatePeriodDates(
  settings: FamilySettings,
  referenceDate: Date = new Date(),
): { start: Date; end: Date } {
  const { periodType, periodStartDay, customPeriodDays } = settings;

  switch (periodType) {
    case 'weekly': {
      const start = startOfWeek(referenceDate, { weekStartsOn: periodStartDay as 0 | 1 | 2 | 3 | 4 | 5 | 6 });
      const end = endOfWeek(referenceDate, { weekStartsOn: periodStartDay as 0 | 1 | 2 | 3 | 4 | 5 | 6 });
      return { start, end };
    }
    case 'biweekly': {
      const start = startOfWeek(referenceDate, { weekStartsOn: periodStartDay as 0 | 1 | 2 | 3 | 4 | 5 | 6 });
      const end = addDays(addWeeks(start, 2), -1);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case 'monthly': {
      const start = startOfMonth(referenceDate);
      const end = endOfMonth(referenceDate);
      return { start, end };
    }
    case 'custom': {
      const days = customPeriodDays ?? 7;
      const start = new Date(referenceDate);
      start.setHours(0, 0, 0, 0);
      const end = addDays(start, days - 1);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    default:
      throw new Error(`Unknown period type: ${periodType}`);
  }
}

/**
 * Create a new period object (uses ISO strings, no Timestamps).
 */
export function buildPeriod(
  settings: FamilySettings,
  tasks: Task[],
  referenceDate?: Date,
): Omit<Period, 'id'> {
  const { start, end } = calculatePeriodDates(settings, referenceDate);
  const starBudget = calculateStarBudget(tasks, start, end);

  const thresholds: PeriodThresholds = {
    rewardPercent: settings.rewardThresholdPercent,
    penaltyPercent: settings.penaltyThresholdPercent,
    rewardDescription: settings.rewardDescription,
    penaltyDescription: settings.penaltyDescription,
  };

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    status: 'active',
    starBudget,
    starsEarned: 0,
    starsPending: 0,
    thresholds,
  };
}

/**
 * Format a period's date range for display.
 */
export function formatPeriodRange(period: Period): string {
  const start = toDate(period.startDate as unknown as string);
  const end = toDate(period.endDate as unknown as string);
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
}

/**
 * Check if today falls within a period.
 */
export function isPeriodCurrent(period: Period): boolean {
  const now = new Date();
  return isWithinInterval(now, {
    start: toDate(period.startDate as unknown as string),
    end: toDate(period.endDate as unknown as string),
  });
}

/**
 * Check if a period has ended (end date is in the past).
 */
export function hasPeriodEnded(period: Period): boolean {
  return isBefore(toDate(period.endDate as unknown as string), new Date());
}

/**
 * Format remaining days in a period.
 */
export function getRemainingDays(period: Period): number {
  const now = new Date();
  const end = toDate(period.endDate as unknown as string);
  if (isAfter(now, end)) return 0;
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isToday(date: Date): boolean {
  return isTodayFn(date);
}
