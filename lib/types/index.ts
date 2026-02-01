import { Timestamp } from 'firebase/firestore';

// ── Firestore Models ──────────────────────────────────────────────

export interface Family {
  parentUid: string;
  childPin: string; // Hashed 4-6 digit PIN
  childName: string;
  parentName: string;
  settings: FamilySettings;
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
}

export type PeriodType = 'weekly' | 'biweekly' | 'monthly' | 'custom';

export interface Task {
  id?: string;
  name: string;
  description: string;
  starValue: number; // 1-5
  icon?: string;
  isActive: boolean;
  recurrence: TaskRecurrence;
}

export interface TaskRecurrence {
  type: 'daily' | 'specific_days' | 'once';
  days?: number[]; // [0-6], 0=Sun..6=Sat
}

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
}

export type CompletionStatus = 'pending' | 'approved' | 'rejected';

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
