import { create } from 'zustand';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import type { TaskCompletion, Task } from '../types';
import {
  createCompletion,
  updateCompletion,
  subscribeCompletions,
  updatePeriod,
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
    starValue: number,
    currentEarned: number,
    currentPending: number,
  ) => Promise<void>;
  rejectCompletion: (
    familyId: string,
    periodId: string,
    completionId: string,
    reason: string,
    starValue: number,
    currentPending: number,
  ) => Promise<void>;
  getPendingCompletions: () => TaskCompletion[];
  getCompletionForTask: (taskId: string, date: Date) => TaskCompletion | undefined;
}

export const useCompletionStore = create<CompletionStore>((set, get) => ({
  completions: [],
  isLoading: true,

  subscribe: (familyId: string, periodId: string) => {
    set({ isLoading: true });
    const unsubscribe = subscribeCompletions(familyId, periodId, (completions) => {
      set({ completions, isLoading: false });
    });
    return unsubscribe;
  },

  markTaskDone: async (familyId: string, periodId: string, task: Task) => {
    const now = new Date();
    const dateStr = format(now, 'yyyy-MM-dd');
    const completionId = `${task.id}_${dateStr}`;

    const completion: Omit<TaskCompletion, 'id'> = {
      taskId: task.id!,
      taskName: task.name,
      taskStarValue: task.starValue,
      date: Timestamp.fromDate(now),
      status: 'pending',
      completedAt: Timestamp.fromDate(now),
    };

    await createCompletion(familyId, periodId, completion, completionId);

    // Update pending star count on the period
    const { completions } = get();
    const currentPending = completions.filter((c) => c.status === 'pending').length;
    // We add the star value of the new completion to pending
    await updatePeriod(familyId, periodId, {
      starsPending: currentPending > 0
        ? completions
            .filter((c) => c.status === 'pending')
            .reduce((s, c) => s + c.taskStarValue, 0) + task.starValue
        : task.starValue,
    });
  },

  approveCompletion: async (
    familyId: string,
    periodId: string,
    completionId: string,
    starValue: number,
    currentEarned: number,
    currentPending: number,
  ) => {
    await updateCompletion(familyId, periodId, completionId, {
      status: 'approved',
      reviewedAt: Timestamp.fromDate(new Date()),
    });
    await updatePeriod(familyId, periodId, {
      starsEarned: currentEarned + starValue,
      starsPending: Math.max(0, currentPending - starValue),
    });
  },

  rejectCompletion: async (
    familyId: string,
    periodId: string,
    completionId: string,
    reason: string,
    starValue: number,
    currentPending: number,
  ) => {
    await updateCompletion(familyId, periodId, completionId, {
      status: 'rejected',
      rejectionReason: reason,
      reviewedAt: Timestamp.fromDate(new Date()),
    });
    await updatePeriod(familyId, periodId, {
      starsPending: Math.max(0, currentPending - starValue),
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
}));
