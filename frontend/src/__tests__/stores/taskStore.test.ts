import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/api/db');

import { useTaskStore } from '../../lib/stores/taskStore';
import {
  createTask,
  updateTask,
  deleteTask,
  subscribeTasks,
} from '../../lib/api/db';
import type { TaskFormData } from '../../lib/types';

const mockedCreateTask = vi.mocked(createTask);
const mockedUpdateTask = vi.mocked(updateTask);
const mockedDeleteTask = vi.mocked(deleteTask);

const FAMILY_ID = 'test-family';

beforeEach(() => {
  vi.clearAllMocks();
  useTaskStore.setState({ tasks: [], isLoading: false });
});

describe('taskStore', () => {
  describe('addTask', () => {
    it('creates a daily task', async () => {
      mockedCreateTask.mockResolvedValue('new-task-id');
      const data: TaskFormData = {
        name: 'Brush teeth',
        description: 'Morning hygiene',
        starValue: 2,
        recurrenceType: 'daily',
        days: [],
      };
      const id = await useTaskStore.getState().addTask(FAMILY_ID, data);
      expect(id).toBe('new-task-id');
      expect(mockedCreateTask).toHaveBeenCalledWith(FAMILY_ID, expect.objectContaining({
        name: 'Brush teeth',
        recurrence: { type: 'daily' },
        isActive: true,
      }));
    });

    it('creates a specific_days task with days', async () => {
      mockedCreateTask.mockResolvedValue('task-2');
      const data: TaskFormData = {
        name: 'Soccer',
        description: '',
        starValue: 3,
        recurrenceType: 'specific_days',
        days: [1, 3, 5],
      };
      await useTaskStore.getState().addTask(FAMILY_ID, data);
      const task = mockedCreateTask.mock.calls[0][1];
      expect(task.recurrence).toEqual({ type: 'specific_days', days: [1, 3, 5] });
    });

    it('includes optional fields when provided', async () => {
      mockedCreateTask.mockResolvedValue('task-3');
      const data: TaskFormData = {
        name: 'Study',
        description: 'Homework',
        starValue: 3,
        recurrenceType: 'daily',
        days: [],
        startTime: '14:00',
        endTime: '15:00',
        category: 'study',
        requiresProof: true,
      };
      await useTaskStore.getState().addTask(FAMILY_ID, data);
      const task = mockedCreateTask.mock.calls[0][1];
      expect(task.startTime).toBe('14:00');
      expect(task.endTime).toBe('15:00');
      expect(task.category).toBe('study');
      expect(task.requiresProof).toBe(true);
    });

    it('omits optional fields when not provided', async () => {
      mockedCreateTask.mockResolvedValue('task-4');
      const data: TaskFormData = {
        name: 'Quick task',
        description: '',
        starValue: 1,
        recurrenceType: 'once',
        days: [],
      };
      await useTaskStore.getState().addTask(FAMILY_ID, data);
      const task = mockedCreateTask.mock.calls[0][1];
      expect(task).not.toHaveProperty('startTime');
      expect(task).not.toHaveProperty('endTime');
      expect(task).not.toHaveProperty('category');
    });
  });

  describe('addTasksBatch', () => {
    it('creates multiple tasks in parallel', async () => {
      mockedCreateTask.mockResolvedValue('batch-id');
      const tasks: TaskFormData[] = [
        { name: 'Task A', description: '', starValue: 1, recurrenceType: 'daily', days: [] },
        { name: 'Task B', description: '', starValue: 2, recurrenceType: 'daily', days: [] },
      ];
      await useTaskStore.getState().addTasksBatch(FAMILY_ID, tasks);
      expect(mockedCreateTask).toHaveBeenCalledTimes(2);
    });
  });

  describe('editTask', () => {
    it('updates specified fields', async () => {
      await useTaskStore.getState().editTask(FAMILY_ID, 'task-1', { name: 'Updated', starValue: 5 });
      expect(mockedUpdateTask).toHaveBeenCalledWith(FAMILY_ID, 'task-1', expect.objectContaining({
        name: 'Updated',
        starValue: 5,
      }));
    });

    it('converts recurrence type with days', async () => {
      await useTaskStore.getState().editTask(FAMILY_ID, 'task-1', {
        recurrenceType: 'specific_days',
        days: [0, 6],
      });
      expect(mockedUpdateTask).toHaveBeenCalledWith(FAMILY_ID, 'task-1', expect.objectContaining({
        recurrence: { type: 'specific_days', days: [0, 6] },
      }));
    });
  });

  describe('removeTask', () => {
    it('deletes the task', async () => {
      await useTaskStore.getState().removeTask(FAMILY_ID, 'task-1');
      expect(mockedDeleteTask).toHaveBeenCalledWith(FAMILY_ID, 'task-1');
    });
  });

  describe('toggleTask', () => {
    it('toggles isActive', async () => {
      await useTaskStore.getState().toggleTask(FAMILY_ID, 'task-1', false);
      expect(mockedUpdateTask).toHaveBeenCalledWith(FAMILY_ID, 'task-1', { isActive: false });
    });
  });

  describe('subscribe', () => {
    it('subscribes and updates state', () => {
      vi.mocked(subscribeTasks).mockImplementation((fid: string, cb: Function) => {
        cb([{ id: 't1', name: 'Task 1' }, { id: 't2', name: 'Task 2' }]);
        return vi.fn();
      });
      useTaskStore.getState().subscribe(FAMILY_ID);
      expect(useTaskStore.getState().tasks).toHaveLength(2);
      expect(useTaskStore.getState().isLoading).toBe(false);
    });
  });
});
