import { Timestamp } from 'firebase/firestore';

// Re-export championship types
export * from './championship';

// ── Firestore Models ──────────────────────────────────────────────

export interface Family {
  parentUid: string;
  childPin: string; // Hashed 4-6 digit PIN
  childName: string;
  parentName: string;
  settings: FamilySettings;
  // Cumulative star system (Feature 3)
  starBalance: number;
  lifetimeStarsEarned: number;
  // Streak tracking (Feature 6)
  currentStreak: number;
  bestStreak: number;
  lastStreakDate?: string; // "yyyy-MM-dd" of last completed streak day
  // Child profile (Feature 12)
  childAvatar?: string;
  childAccentColor?: string;
}

export interface FamilySettings {
  rewardThresholdPercent: number;
  penaltyThresholdPercent: number;
  rewardDescription: string;
  penaltyDescription: string;
  periodType: PeriodType;
  customPeriodDays?: number;
  periodStartDay: number; // 0=Sun..6=Sat
  autoRollPeriods: boolean;
  // Bonus star mechanics (Feature 10)
  onTimeBonusEnabled: boolean;
  onTimeBonusStars: number;
  perfectDayBonusEnabled: boolean;
  perfectDayBonusStars: number;
  earlyFinishBonusEnabled: boolean;
  earlyFinishBonusStars: number;
  earlyFinishCutoff: string; // "HH:mm" format
  // Streak settings (Feature 6)
  streakFreezeCost: number;
  maxStreakFreezesPerPeriod: number;
  // Notification settings (Feature 5)
  taskReminderLeadMinutes: number;
  morningNotificationTime: string; // "HH:mm"
  quietHoursStart: string; // "HH:mm"
  quietHoursEnd: string; // "HH:mm"
  notificationsEnabled: NotificationSettings;
}

export interface NotificationSettings {
  taskStarting: boolean;
  morningSummary: boolean;
  streakReminder: boolean;
  taskApproved: boolean;
  goalMilestone: boolean;
  pendingApprovals: boolean;
  periodEnding: boolean;
  streakAtRisk: boolean;
}

export type PeriodType = 'weekly' | 'biweekly' | 'monthly' | 'custom';

// ── Task Categories (Feature 8) ──────────────────────────────────

export type TaskCategoryId =
  | 'hygiene'
  | 'school'
  | 'study'
  | 'chores'
  | 'meals'
  | 'exercise'
  | 'extracurricular'
  | 'rest'
  | 'other';

export interface TaskCategory {
  id: TaskCategoryId | string;
  name: string;
  color: string;
  icon: string;
}

export interface Task {
  id?: string;
  name: string;
  description: string;
  starValue: number; // 1-5
  icon?: string;
  isActive: boolean;
  recurrence: TaskRecurrence;
  startTime?: string; // "HH:mm" format
  endTime?: string; // "HH:mm" format
  category?: TaskCategoryId | string; // Feature 8
  requiresProof?: boolean; // Feature 11
}

export interface TaskRecurrence {
  type: 'daily' | 'specific_days' | 'once';
  days?: number[]; // [0-6], 0=Sun..6=Sat
}

// ── Periods ──────────────────────────────────────────────────────

export interface Period {
  id?: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: PeriodStatus;
  starBudget: number;
  starsEarned: number;
  starsPending: number;
  thresholds: PeriodThresholds;
  outcome?: PeriodOutcome;
}

export type PeriodStatus = 'active' | 'completed' | 'upcoming';
export type PeriodOutcome = 'reward' | 'neutral' | 'penalty';

export interface PeriodThresholds {
  rewardPercent: number;
  penaltyPercent: number;
  rewardDescription: string;
  penaltyDescription: string;
}

// ── Task Completions ─────────────────────────────────────────────

export interface TaskCompletion {
  id?: string;
  taskId: string;
  taskName: string;
  taskStarValue: number;
  date: Timestamp;
  status: CompletionStatus;
  completedAt: Timestamp;
  reviewedAt?: Timestamp;
  rejectionReason?: string;
  // Proof (Feature 11)
  proofPhotoUrl?: string;
  proofNote?: string;
  // Bonus tracking (Feature 10)
  onTimeBonus?: boolean;
}

export type CompletionStatus = 'pending' | 'approved' | 'rejected';

// ── Rewards (Feature 1) ─────────────────────────────────────────

export interface Reward {
  id?: string;
  name: string;
  description: string;
  starCost: number;
  icon: string;
  isActive: boolean;
  availability: 'unlimited' | 'limited';
  quantity?: number; // only if limited
  requiresApproval: boolean;
}

export interface Redemption {
  id?: string;
  rewardId: string;
  rewardName: string;
  starCost: number;
  redeemedAt: Timestamp;
  status: RedemptionStatus;
  fulfilledAt?: Timestamp;
}

export type RedemptionStatus = 'pending' | 'fulfilled' | 'rejected';

// ── Long-Term Goals (Feature 3) ──────────────────────────────────

export interface LongTermGoal {
  id?: string;
  name: string;
  description: string;
  targetStars: number;
  deadline?: Timestamp;
  rewardDescription: string;
  isCompleted: boolean;
  completedAt?: Timestamp;
}

// ── Streaks (Feature 6) ─────────────────────────────────────────

export interface StreakFreeze {
  id?: string;
  date: string; // "yyyy-MM-dd"
  starCost: number;
  createdAt: Timestamp;
}

export interface StreakMilestone {
  days: number;
  bonusStars: number;
  label: string;
}

// ── Badges (Feature 7) ──────────────────────────────────────────

export type BadgeCategory = 'milestone' | 'consistency' | 'category';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
}

export interface EarnedBadge {
  id?: string;
  badgeId: string;
  earnedAt: Timestamp;
}

// ── App Types ─────────────────────────────────────────────────────

export type UserRole = 'parent' | 'child' | null;

export interface AuthState {
  uid: string | null;
  email: string | null;
  familyId: string | null;
  role: UserRole;
  childName: string | null;
  parentName: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ── Form Types ────────────────────────────────────────────────────

export interface RegisterFormData {
  email: string;
  password: string;
  parentName: string;
  childName: string;
  childPin: string;
}

export interface TaskFormData {
  name: string;
  description: string;
  starValue: number;
  icon?: string;
  recurrenceType: 'daily' | 'specific_days' | 'once';
  days: number[];
  startTime?: string; // "HH:mm" format
  endTime?: string; // "HH:mm" format
  category?: TaskCategoryId | string; // Feature 8
  requiresProof?: boolean; // Feature 11
}

export interface RewardFormData {
  name: string;
  description: string;
  starCost: number;
  icon: string;
  availability: 'unlimited' | 'limited';
  quantity?: number;
  requiresApproval: boolean;
}

export interface GoalFormData {
  name: string;
  description: string;
  targetStars: number;
  deadline?: Date;
  rewardDescription: string;
}

// ── Computed Types ────────────────────────────────────────────────

export interface TodayTask extends Task {
  id: string;
  completion?: TaskCompletion;
}

export interface StarProgress {
  earned: number;
  pending: number;
  budget: number;
  earnedPercent: number;
  pendingPercent: number;
  isRewardZone: boolean;
  isPenaltyZone: boolean;
  isNeutralZone: boolean;
}

export interface DayTasks {
  date: Date;
  dayLabel: string;
  tasks: TodayTask[];
  isToday: boolean;
  isPast: boolean;
}

// ── Template Types (Feature 4) ───────────────────────────────────

export interface TaskTemplate {
  name: string;
  description: string;
  starValue: number;
  icon: string;
  category: TaskCategoryId;
  recurrence: TaskRecurrence;
  startTime?: string;
  endTime?: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
  templates: TaskTemplate[];
}
