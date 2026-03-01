import { create } from 'zustand';
import { format } from 'date-fns';
import type { TaskCompletion, Task } from '../types';
import {
  createCompletion,
  updateCompletion,
  subscribeCompletions,
  incrementFamilyField,
} from '../api/db';

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
      taskStarValue: task.starValue,
      date: now.toISOString(),
      status: 'pending',
      completedAt: now.toISOString(),
      onTimeBonus,
    };

    await createCompletion(familyId, periodId, completion, completionId);
  },

  approveCompletion: async (
    familyId: string,
    periodId: string,
    completionId: string,
  ) => {
    // Find the completion to get its star value
    const completion = get().completions.find((c) => c.id === completionId);
    const starValue = completion?.taskStarValue ?? 0;

    await updateCompletion(familyId, periodId, completionId, {
      status: 'approved',
      reviewedAt: new Date().toISOString(),
    });

    // Increment star balance and lifetime stars
    if (starValue > 0) {
      await incrementFamilyField(familyId, 'starBalance', starValue);
      await incrementFamilyField(familyId, 'lifetimeStarsEarned', starValue);
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
      reviewedAt: new Date().toISOString(),
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
