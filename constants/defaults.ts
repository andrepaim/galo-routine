import type { FamilySettings, TaskCategory, TaskCategoryId, Badge, StreakMilestone, TemplateCategory } from '../lib/types';
import { Colors } from './colors';

export const DEFAULT_SETTINGS: FamilySettings = {
  rewardThresholdPercent: 80,
  penaltyThresholdPercent: 50,
  rewardDescription: 'Great job! You earned a special reward!',
  penaltyDescription: 'Let\'s try harder next time!',
  periodType: 'weekly',
  periodStartDay: 1, // Monday
  autoRollPeriods: true,
  // Bonus star mechanics
  onTimeBonusEnabled: true,
  onTimeBonusStars: 1,
  perfectDayBonusEnabled: true,
  perfectDayBonusStars: 3,
  earlyFinishBonusEnabled: false,
  earlyFinishBonusStars: 2,
  earlyFinishCutoff: '20:00',
  // Streak settings
  streakFreezeCost: 10,
  maxStreakFreezesPerPeriod: 2,
  // Notification settings
  taskReminderLeadMinutes: 5,
  morningNotificationTime: '07:00',
  quietHoursStart: '21:00',
  quietHoursEnd: '07:00',
  notificationsEnabled: {
    taskStarting: true,
    morningSummary: true,
    streakReminder: true,
    taskApproved: true,
    goalMilestone: true,
    pendingApprovals: true,
    periodEnding: true,
    streakAtRisk: true,
  },
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

export const REWARD_ICONS = [
  'gift',
  'gamepad-variant',
  'movie-open',
  'ice-cream',
  'bike',
  'puzzle',
  'palette',
  'controller',
  'pizza',
  'cake-variant',
  'popcorn',
  'trophy',
  'ticket',
  'shopping',
  'soccer',
  'star-circle',
] as const;

export const PIN_LENGTH = 4;

// ── Task Categories (Feature 8) ──────────────────────────────────

export const TASK_CATEGORIES: TaskCategory[] = [
  { id: 'hygiene', name: 'Hygiene', color: Colors.categoryHygiene, icon: 'water-outline' },
  { id: 'school', name: 'School', color: Colors.categorySchool, icon: 'school-outline' },
  { id: 'study', name: 'Study', color: Colors.categoryStudy, icon: 'book-outline' },
  { id: 'chores', name: 'Chores', color: Colors.categoryChores, icon: 'broom' },
  { id: 'meals', name: 'Meals', color: Colors.categoryMeals, icon: 'food-apple-outline' },
  { id: 'exercise', name: 'Exercise / Sports', color: Colors.categoryExercise, icon: 'run' },
  { id: 'extracurricular', name: 'Extracurricular', color: Colors.categoryExtracurricular, icon: 'music-note' },
  { id: 'rest', name: 'Rest', color: Colors.categoryRest, icon: 'bed-outline' },
  { id: 'other', name: 'Other', color: Colors.categoryOther, icon: 'dots-horizontal' },
];

export function getCategoryById(id?: string): TaskCategory | undefined {
  if (!id) return undefined;
  return TASK_CATEGORIES.find((c) => c.id === id);
}

export function getCategoryColor(id?: string): string {
  return getCategoryById(id)?.color ?? Colors.textSecondary;
}

// ── Streak Milestones (Feature 6) ────────────────────────────────

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, bonusStars: 2, label: '3-day streak' },
  { days: 7, bonusStars: 5, label: '7-day streak' },
  { days: 14, bonusStars: 10, label: '14-day streak' },
  { days: 30, bonusStars: 25, label: '30-day streak' },
];

// ── Badges (Feature 7) ──────────────────────────────────────────

export const ALL_BADGES: Badge[] = [
  // Milestone badges
  { id: 'first_star', name: 'First Star', description: 'Earn your first star', icon: 'star', category: 'milestone' },
  { id: 'star_collector_10', name: 'Star Collector', description: 'Earn 10 total stars', icon: 'star-circle', category: 'milestone' },
  { id: 'star_collector_50', name: 'Star Hoarder', description: 'Earn 50 total stars', icon: 'star-circle-outline', category: 'milestone' },
  { id: 'star_collector_100', name: 'Star Master', description: 'Earn 100 total stars', icon: 'star-four-points', category: 'milestone' },
  { id: 'star_collector_500', name: 'Star Legend', description: 'Earn 500 total stars', icon: 'star-shooting', category: 'milestone' },
  { id: 'streak_3', name: 'Streak Starter', description: 'Maintain a 3-day streak', icon: 'fire', category: 'milestone' },
  { id: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: 'fire', category: 'milestone' },
  { id: 'streak_14', name: 'Fortnight Fighter', description: 'Maintain a 14-day streak', icon: 'fire', category: 'milestone' },
  { id: 'streak_30', name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: 'fire', category: 'milestone' },
  { id: 'reward_shopper', name: 'Reward Shopper', description: 'Redeem your first reward', icon: 'gift', category: 'milestone' },

  // Consistency badges
  { id: 'perfect_day', name: 'Perfect Day', description: 'Complete all tasks in a single day', icon: 'check-decagram', category: 'consistency' },
  { id: 'perfect_week', name: 'Perfect Week', description: 'Complete all tasks for 7 consecutive days', icon: 'calendar-check', category: 'consistency' },
  { id: 'early_bird', name: 'Early Bird', description: 'Complete all morning tasks on time for 5 days', icon: 'weather-sunny', category: 'consistency' },
  { id: 'night_owl', name: 'Night Owl', description: 'Complete all evening tasks for 5 consecutive days', icon: 'weather-night', category: 'consistency' },

  // Category badges
  { id: 'hygiene_hero', name: 'Hygiene Hero', description: 'Complete all hygiene tasks for 30 days', icon: 'water', category: 'category' },
  { id: 'study_star', name: 'Study Star', description: 'Complete all study tasks for 30 days', icon: 'book-open-variant', category: 'category' },
  { id: 'chore_champion', name: 'Chore Champion', description: 'Complete all chore tasks for 30 days', icon: 'broom', category: 'category' },
];

// ── Task Templates (Feature 4) ───────────────────────────────────

export const TASK_TEMPLATES: TemplateCategory[] = [
  {
    id: 'morning',
    name: 'Morning Routine',
    icon: 'weather-sunny',
    templates: [
      { name: 'Wake up on time', description: 'Get out of bed at the scheduled time', starValue: 1, icon: 'alarm', category: 'rest', recurrence: { type: 'daily' }, startTime: '06:30', endTime: '06:45' },
      { name: 'Brush teeth (morning)', description: 'Brush teeth after waking up', starValue: 1, icon: 'tooth', category: 'hygiene', recurrence: { type: 'daily' }, startTime: '06:45', endTime: '07:00' },
      { name: 'Get dressed', description: 'Put on clothes for the day', starValue: 1, icon: 'tshirt-crew', category: 'hygiene', recurrence: { type: 'daily' }, startTime: '07:00', endTime: '07:15' },
      { name: 'Have breakfast', description: 'Eat a healthy breakfast', starValue: 1, icon: 'food-apple', category: 'meals', recurrence: { type: 'daily' }, startTime: '07:15', endTime: '07:45' },
      { name: 'Pack school bag', description: 'Prepare backpack with all needed items', starValue: 1, icon: 'bag-personal', category: 'school', recurrence: { type: 'daily' }, startTime: '07:45', endTime: '08:00' },
      { name: 'Go to school', description: 'Leave for school on time', starValue: 2, icon: 'bus-school', category: 'school', recurrence: { type: 'specific_days', days: [1, 2, 3, 4, 5] }, startTime: '08:00', endTime: '08:15' },
    ],
  },
  {
    id: 'afternoon',
    name: 'Afternoon Routine',
    icon: 'white-balance-sunny',
    templates: [
      { name: 'Have lunch', description: 'Eat lunch', starValue: 1, icon: 'silverware-fork-knife', category: 'meals', recurrence: { type: 'daily' }, startTime: '12:00', endTime: '12:45' },
      { name: 'Rest / Quiet time', description: 'Relax after lunch', starValue: 1, icon: 'bed', category: 'rest', recurrence: { type: 'daily' }, startTime: '13:00', endTime: '14:00' },
      { name: 'Extra activity', description: 'English, piano, or other extracurricular activity', starValue: 3, icon: 'music', category: 'extracurricular', recurrence: { type: 'specific_days', days: [1, 3] }, startTime: '14:00', endTime: '15:00' },
      { name: 'Study / Homework', description: 'Complete homework and study', starValue: 3, icon: 'pencil', category: 'study', recurrence: { type: 'specific_days', days: [1, 2, 3, 4, 5] }, startTime: '15:00', endTime: '16:00' },
      { name: 'Reading time', description: 'Read a book or educational material', starValue: 2, icon: 'book-open-variant', category: 'study', recurrence: { type: 'daily' }, startTime: '16:00', endTime: '16:30' },
      { name: 'Soccer class', description: 'Attend soccer class', starValue: 3, icon: 'soccer', category: 'exercise', recurrence: { type: 'specific_days', days: [2, 4] }, startTime: '16:30', endTime: '18:00' },
    ],
  },
  {
    id: 'evening',
    name: 'Evening Routine',
    icon: 'weather-night',
    templates: [
      { name: 'Dinner', description: 'Eat dinner with the family', starValue: 1, icon: 'silverware-fork-knife', category: 'meals', recurrence: { type: 'daily' }, startTime: '19:00', endTime: '19:30' },
      { name: 'Shower / Bath', description: 'Take a shower or bath', starValue: 1, icon: 'shower', category: 'hygiene', recurrence: { type: 'daily' }, startTime: '19:30', endTime: '20:00' },
      { name: 'Brush teeth (evening)', description: 'Brush teeth before bed', starValue: 1, icon: 'tooth', category: 'hygiene', recurrence: { type: 'daily' }, startTime: '20:00', endTime: '20:10' },
      { name: 'Prepare for bed', description: 'Get ready for bedtime', starValue: 1, icon: 'bed', category: 'rest', recurrence: { type: 'daily' }, startTime: '20:10', endTime: '20:30' },
    ],
  },
  {
    id: 'weekly',
    name: 'Weekly Tasks',
    icon: 'calendar-week',
    templates: [
      { name: 'Clean room', description: 'Tidy up and organize your room', starValue: 3, icon: 'broom', category: 'chores', recurrence: { type: 'specific_days', days: [6] } },
      { name: 'Help with household chores', description: 'Help around the house', starValue: 2, icon: 'washing-machine', category: 'chores', recurrence: { type: 'specific_days', days: [0] } },
      { name: 'Organize school materials', description: 'Sort and prepare school supplies', starValue: 2, icon: 'book-open-variant', category: 'school', recurrence: { type: 'specific_days', days: [5] } },
    ],
  },
];

// ── Child Avatar Options (Feature 12) ────────────────────────────

export const AVATAR_OPTIONS = [
  'account-circle',
  'face-man',
  'face-woman',
  'emoticon-happy',
  'emoticon-cool',
  'robot-happy',
  'cat',
  'dog',
  'owl',
  'penguin',
  'unicorn',
  'rocket',
] as const;

export const ACCENT_COLOR_OPTIONS = [
  '#7C4DFF', // Purple (default)
  '#03A9F4', // Blue
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#F44336', // Red
  '#E91E63', // Pink
  '#009688', // Teal
  '#FF6D00', // Deep Orange
] as const;
