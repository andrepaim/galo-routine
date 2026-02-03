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
  addTasksBatch: (familyId: string, dataList: TaskFormData[]) => Promise<void>;
  editTask: (familyId: string, taskId: string, data: Partial<TaskFormData>) => Promise<void>;
  removeTask: (familyId: string, taskId: string) => Promise<void>;
  toggleTask: (familyId: string, taskId: string, isActive: boolean) => Promise<void>;
}

function formDataToTask(data: TaskFormData): Omit<Task, 'id'> {
  const recurrence: Task['recurrence'] = { type: data.recurrenceType };
  if (data.recurrenceType === 'specific_days') {
    recurrence.days = data.days;
  }
  return {
    name: data.name,
    description: data.description,
    starValue: data.starValue,
    icon: data.icon,
    isActive: true,
    recurrence,
    ...(data.startTime ? { startTime: data.startTime } : {}),
    ...(data.endTime ? { endTime: data.endTime } : {}),
    ...(data.category ? { category: data.category } : {}),
    ...(data.requiresProof ? { requiresProof: data.requiresProof } : {}),
  };
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
    return createTask(familyId, formDataToTask(data));
  },

  addTasksBatch: async (familyId: string, dataList: TaskFormData[]) => {
    await Promise.all(dataList.map((data) => createTask(familyId, formDataToTask(data))));
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
    if ('startTime' in data) update.startTime = data.startTime || undefined;
    if ('endTime' in data) update.endTime = data.endTime || undefined;
    if ('category' in data) update.category = data.category || undefined;
    if ('requiresProof' in data) update.requiresProof = data.requiresProof;
    await updateTask(familyId, taskId, update);
  },

  removeTask: async (familyId: string, taskId: string) => {
    await deleteTask(familyId, taskId);
  },

  toggleTask: async (familyId: string, taskId: string, isActive: boolean) => {
    await updateTask(familyId, taskId, { isActive });
  },
}));
