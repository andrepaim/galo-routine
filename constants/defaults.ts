import type { FamilySettings } from '../lib/types';

export const DEFAULT_SETTINGS: FamilySettings = {
  rewardThresholdPercent: 80,
  penaltyThresholdPercent: 50,
  rewardDescription: 'Great job! You earned a special reward!',
  penaltyDescription: 'Let\'s try harder next time!',
  periodType: 'weekly',
  periodStartDay: 1, // Monday
  autoRollPeriods: true,
};

export const STAR_VALUES = [1, 2, 3, 4, 5] as const;

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const TASK_ICONS = [
  'book-open-variant',
  'broom',
  'silverware-fork-knife',
  'tooth',
  'bed',
  'dog',
  'basketball',
  'music',
  'pencil',
  'tshirt-crew',
  'washing-machine',
  'flower',
  'run',
  'meditation',
  'food-apple',
  'water',
] as const;

export const PIN_LENGTH = 4;
