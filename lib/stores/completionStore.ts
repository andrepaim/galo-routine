import { create } from 'zustand';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import type { TaskCompletion, Task } from '../types';
import {
  createCompletion,
  updateCompletion,
  subscribeCompletions,
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
  },

  approveCompletion: async (
    familyId: string,
    periodId: string,
    completionId: string,
  ) => {
    await updateCompletion(familyId, periodId, completionId, {
      status: 'approved',
      reviewedAt: Timestamp.fromDate(new Date()),
    });
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
}));
