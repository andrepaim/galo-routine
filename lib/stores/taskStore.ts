import { create } from 'zustand';
import type { Task, TaskFormData } from '../types';
import {
  createTask,
  updateTask,
  deleteTask,
  subscribeTasks,
} from '../firebase/firestore';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  subscribe: (familyId: string) => () => void;
  addTask: (familyId: string, data: TaskFormData) => Promise<string>;
  editTask: (familyId: string, taskId: string, data: Partial<TaskFormData>) => Promise<void>;
  removeTask: (familyId: string, taskId: string) => Promise<void>;
  toggleTask: (familyId: string, taskId: string, isActive: boolean) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  isLoading: true,

  subscribe: (familyId: string) => {
    set({ isLoading: true });
    const unsubscribe = subscribeTasks(familyId, (tasks) => {
      set({ tasks, isLoading: false });
    });
    return unsubscribe;
  },

  addTask: async (familyId: string, data: TaskFormData) => {
    const recurrence: Task['recurrence'] = { type: data.recurrenceType };
    if (data.recurrenceType === 'specific_days') {
      recurrence.days = data.days;
    }
    const task: Omit<Task, 'id'> = {
      name: data.name,
      description: data.description,
      starValue: data.starValue,
      icon: data.icon,
      isActive: true,
      recurrence,
      ...(data.startTime ? { startTime: data.startTime } : {}),
      ...(data.endTime ? { endTime: data.endTime } : {}),
    };
    return createTask(familyId, task);
  },

  editTask: async (familyId: string, taskId: string, data: Partial<TaskFormData>) => {
    const update: Partial<Task> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) update.description = data.description;
    if (data.starValue !== undefined) update.starValue = data.starValue;
    if (data.icon !== undefined) update.icon = data.icon;
    if (data.recurrenceType !== undefined) {
      const recurrence: Task['recurrence'] = { type: data.recurrenceType };
      if (data.recurrenceType === 'specific_days') {
        recurrence.days = data.days;
      }
      update.recurrence = recurrence;
    }
    // Use deleteField() sentinel or simply set; Firestore won't store undefined
    // So we always set the field — if cleared, store empty string which we treat as unset
    if ('startTime' in data) update.startTime = data.startTime || undefined;
    if ('endTime' in data) update.endTime = data.endTime || undefined;
    await updateTask(familyId, taskId, update);
  },

  removeTask: async (familyId: string, taskId: string) => {
    await deleteTask(familyId, taskId);
  },

  toggleTask: async (familyId: string, taskId: string, isActive: boolean) => {
    await updateTask(familyId, taskId, { isActive });
  },
}));
