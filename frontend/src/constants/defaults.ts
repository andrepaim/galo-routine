import type { FamilySettings, TaskCategory, Badge, StreakMilestone, TemplateCategory } from '../lib/types';
import { Colors } from './colors';

export const DEFAULT_SETTINGS: FamilySettings = {
  rewardThresholdPercent: 80,
  penaltyThresholdPercent: 50,
  rewardDescription: "Great job! You earned a special reward!",
  penaltyDescription: "Let's try harder next time!",
  periodType: 'weekly',
  periodStartDay: 1,
  autoRollPeriods: true,
  onTimeBonusEnabled: true,
  onTimeBonusStars: 1,
  perfectDayBonusEnabled: true,
  perfectDayBonusStars: 3,
  earlyFinishBonusEnabled: false,
  earlyFinishBonusStars: 2,
  earlyFinishCutoff: '20:00',
  streakFreezeCost: 10,
  maxStreakFreezesPerPeriod: 2,
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

export const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;
export const DAY_NAMES_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'] as const;

export const TASK_ICONS = [
  '📚', '🧹', '🍽️', '🦷', '🛏️', '🐕', '🏀', '🎵',
  '✏️', '👕', '🧺', '🌸', '🏃', '🧘', '🍎', '💧',
] as const;

export const REWARD_ICONS = [
  '🎁', '🎮', '🎬', '🍦', '🚲', '🧩', '🎨', '🕹️',
  '🍕', '🎂', '🍿', '🏆', '🎫', '🛍️', '⚽', '⭐',
] as const;

export const PIN_LENGTH = 4;

export const TASK_CATEGORIES: TaskCategory[] = [
  { id: 'hygiene', name: 'Higiene', color: Colors.categoryHygiene, icon: '💧' },
  { id: 'school', name: 'Escola', color: Colors.categorySchool, icon: '🏫' },
  { id: 'study', name: 'Estudo', color: Colors.categoryStudy, icon: '📖' },
  { id: 'chores', name: 'Tarefas de Casa', color: Colors.categoryChores, icon: '🧹' },
  { id: 'meals', name: 'Refeições', color: Colors.categoryMeals, icon: '🍎' },
  { id: 'exercise', name: 'Exercício/Esporte', color: Colors.categoryExercise, icon: '🏃' },
  { id: 'extracurricular', name: 'Extracurricular', color: Colors.categoryExtracurricular, icon: '🎵' },
  { id: 'rest', name: 'Descanso', color: Colors.categoryRest, icon: '🛏️' },
  { id: 'other', name: 'Outro', color: Colors.categoryOther, icon: '•••' },
];

export function getCategoryById(id?: string): TaskCategory | undefined {
  if (!id) return undefined;
  return TASK_CATEGORIES.find((c) => c.id === id);
}

export function getCategoryColor(id?: string): string {
  return getCategoryById(id)?.color ?? Colors.textSecondary;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, bonusStars: 2, label: '3-day streak' },
  { days: 7, bonusStars: 5, label: '7-day streak' },
  { days: 14, bonusStars: 10, label: '14-day streak' },
  { days: 30, bonusStars: 25, label: '30-day streak' },
];

export const ALL_BADGES: Badge[] = [];

export const TASK_TEMPLATES: TemplateCategory[] = [];

export const AVATAR_OPTIONS = ['👦', '👧', '🐓', '⭐', '🏆', '🚀'] as const;

export const ACCENT_COLOR_OPTIONS = [
  '#7C4DFF', '#03A9F4', '#4CAF50', '#FF9800', '#F44336', '#E91E63', '#009688', '#FF6D00',
] as const;
