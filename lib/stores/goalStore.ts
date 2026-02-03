import { create } from 'zustand';
import { Timestamp } from 'firebase/firestore';
import type { LongTermGoal, GoalFormData } from '../types';
import {
  createGoal,
  updateGoal,
  deleteGoal,
  subscribeGoals,
} from '../firebase/firestore';

interface GoalStore {
  goals: LongTermGoal[];
  isLoading: boolean;
  subscribe: (familyId: string) => () => void;
  addGoal: (familyId: string, data: GoalFormData) => Promise<string>;
  editGoal: (familyId: string, goalId: string, data: Partial<GoalFormData>) => Promise<void>;
  removeGoal: (familyId: string, goalId: string) => Promise<void>;
  completeGoal: (familyId: string, goalId: string) => Promise<void>;
}

export const useGoalStore = create<GoalStore>((set) => ({
  goals: [],
  isLoading: true,

  subscribe: (familyId: string) => {
    set({ isLoading: true });
    const unsubscribe = subscribeGoals(familyId, (goals) => {
      set({ goals, isLoading: false });
    });
    return unsubscribe;
  },

  addGoal: async (familyId: string, data: GoalFormData) => {
    const goal: Omit<LongTermGoal, 'id'> = {
      name: data.name,
      description: data.description,
      targetStars: data.targetStars,
      deadline: data.deadline ? Timestamp.fromDate(data.deadline) : undefined,
      rewardDescription: data.rewardDescription,
      isCompleted: false,
    };
    return createGoal(familyId, goal);
  },

  editGoal: async (familyId: string, goalId: string, data: Partial<GoalFormData>) => {
    const update: Partial<LongTermGoal> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) update.description = data.description;
    if (data.targetStars !== undefined) update.targetStars = data.targetStars;
    if (data.rewardDescription !== undefined) update.rewardDescription = data.rewardDescription;
    if (data.deadline !== undefined) update.deadline = Timestamp.fromDate(data.deadline);
    await updateGoal(familyId, goalId, update);
  },

  removeGoal: async (familyId: string, goalId: string) => {
    await deleteGoal(familyId, goalId);
  },

  completeGoal: async (familyId: string, goalId: string) => {
    await updateGoal(familyId, goalId, {
      isCompleted: true,
      completedAt: Timestamp.fromDate(new Date()),
    });
  },
}));
