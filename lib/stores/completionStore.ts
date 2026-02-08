import { create } from 'zustand';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import type { TaskCompletion, Task } from '../types';
import {
  createCompletion,
  updateCompletion,
  subscribeCompletions,
  incrementFamilyField,
} from '../firebase/firestore';

interface CompletionStore {
  completions: TaskCompletion[];
  isLoading: boolean;
  subscribe: (familyId: string, periodId: string) => () => void;
  markTaskDone: (familyId: string, periodId: string, task: Task) => Promise<void>;
  approveCompletion: (
    familyId: string,
    periodId: string,
    completionId: string,
  ) => Promise<void>;
  rejectCompletion: (
    familyId: string,
    periodId: string,
    completionId: string,
    reason: string,
  ) => Promise<void>;
  getPendingCompletions: () => TaskCompletion[];
  getCompletionForTask: (taskId: string, date: Date) => TaskCompletion | undefined;
  areAllTodayReviewed: () => boolean;
}

export const useCompletionStore = create<CompletionStore>((set, get) => ({
  completions: [],
  isLoading: true,

  subscribe: (familyId: string, periodId: string) => {
    set({ completions: [], isLoading: true });
    const unsubscribe = subscribeCompletions(familyId, periodId, (completions) => {
      set({ completions, isLoading: false });
    });
    return unsubscribe;
  },

  markTaskDone: async (familyId: string, periodId: string, task: Task) => {
    const now = new Date();
    const dateStr = format(now, 'yyyy-MM-dd');
    const completionId = `${task.id}_${dateStr}`;

    // Check if the task was completed on time (within its scheduled window)
    let onTimeBonus = false;
    if (task.startTime && task.endTime) {
      const [endH, endM] = task.endTime.split(':').map(Number);
      const endMinutes = endH * 60 + endM;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      onTimeBonus = nowMinutes <= endMinutes;
    }

    const completion: Omit<TaskCompletion, 'id'> = {
      taskId: task.id!,
      taskName: task.name,
      taskGoalValue: task.goals,
      date: Timestamp.fromDate(now),
      status: 'pending',
      completedAt: Timestamp.fromDate(now),
      onTimeBonus,
    };

    await createCompletion(familyId, periodId, completion, completionId);
  },

  approveCompletion: async (
    familyId: string,
    periodId: string,
    completionId: string,
  ) => {
    // Find the completion to get its goal value
    const completion = get().completions.find((c) => c.id === completionId);
    const goalValue = completion?.taskGoalValue ?? 0;

    await updateCompletion(familyId, periodId, completionId, {
      status: 'approved',
      reviewedAt: Timestamp.fromDate(new Date()),
    });

    // Increment goal balance and lifetime goals
    if (goalValue > 0) {
      await incrementFamilyField(familyId, 'goalBalance', goalValue);
      await incrementFamilyField(familyId, 'lifetimeGoalsEarned', goalValue);
    }
  },

  rejectCompletion: async (
    familyId: string,
    periodId: string,
    completionId: string,
    reason: string,
  ) => {
    await updateCompletion(familyId, periodId, completionId, {
      status: 'rejected',
      rejectionReason: reason,
      reviewedAt: Timestamp.fromDate(new Date()),
    });
  },

  getPendingCompletions: () => {
    return get().completions.filter((c) => c.status === 'pending');
  },

  getCompletionForTask: (taskId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const completionId = `${taskId}_${dateStr}`;
    return get().completions.find((c) => c.id === completionId);
  },

  areAllTodayReviewed: () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayCompletions = get().completions.filter((c) => {
      const completionDate = c.date instanceof Date ? c.date : (c.date as any).toDate?.() ?? new Date();
      return format(completionDate, 'yyyy-MM-dd') === today;
    });
    if (todayCompletions.length === 0) return false;
    return todayCompletions.every((c) => c.status === 'approved' || c.status === 'rejected');
  },
}));
