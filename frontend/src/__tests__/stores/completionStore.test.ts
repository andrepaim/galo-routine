import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/api/db');

import { useCompletionStore } from '../../lib/stores/completionStore';
import {
  createCompletion,
  updateCompletion,
  subscribeCompletions,
  incrementFamilyField,
} from '../../lib/api/db';
import type { Task, TaskCompletion } from '../../lib/types';

const mockedCreateCompletion = vi.mocked(createCompletion);
const mockedUpdateCompletion = vi.mocked(updateCompletion);
const mockedIncrementFamilyField = vi.mocked(incrementFamilyField);

const FAMILY_ID = 'test-family';
const PERIOD_ID = 'period-1';

function makeCompletion(overrides: Partial<TaskCompletion> = {}): TaskCompletion {
  return {
    id: 'comp-1',
    taskId: 'task-1',
    taskName: 'Test Task',
    taskStarValue: 2,
    date: new Date().toISOString(),
    status: 'pending',
    completedAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useCompletionStore.setState({ completions: [], isLoading: false });
});

describe('completionStore', () => {
  describe('markTaskDone', () => {
    it('creates a pending completion', async () => {
      const task: Task = {
        id: 'task-1',
        name: 'Brush teeth',
        description: '',
        starValue: 2,
        isActive: true,
        recurrence: { type: 'daily' },
      };
      await useCompletionStore.getState().markTaskDone(FAMILY_ID, PERIOD_ID, task);
      expect(mockedCreateCompletion).toHaveBeenCalledWith(
        FAMILY_ID,
        PERIOD_ID,
        expect.objectContaining({
          taskId: 'task-1',
          taskName: 'Brush teeth',
          taskStarValue: 2,
          status: 'pending',
        }),
        expect.any(String),
      );
    });

    it('generates a deterministic completion ID with taskId and date', async () => {
      const task: Task = {
        id: 'task-1',
        name: 'Test',
        description: '',
        starValue: 1,
        isActive: true,
        recurrence: { type: 'daily' },
      };
      await useCompletionStore.getState().markTaskDone(FAMILY_ID, PERIOD_ID, task);
      const completionId = mockedCreateCompletion.mock.calls[0][3];
      expect(completionId).toContain('task-1_');
    });

    it('detects on-time bonus when task has startTime+endTime and completed before endTime', async () => {
      const task: Task = {
        id: 'task-1',
        name: 'Morning brush',
        description: '',
        starValue: 2,
        isActive: true,
        recurrence: { type: 'daily' },
        startTime: '00:00',
        endTime: '23:59', // far future to ensure on-time
      };
      await useCompletionStore.getState().markTaskDone(FAMILY_ID, PERIOD_ID, task);
      const completion = mockedCreateCompletion.mock.calls[0][2];
      expect(completion.onTimeBonus).toBe(true);
    });
  });

  describe('approveCompletion', () => {
    it('updates status (backend handles star crediting)', async () => {
      useCompletionStore.setState({
        completions: [makeCompletion({ id: 'comp-1', taskStarValue: 3 })],
      });
      await useCompletionStore.getState().approveCompletion(FAMILY_ID, PERIOD_ID, 'comp-1');
      expect(mockedUpdateCompletion).toHaveBeenCalledWith(FAMILY_ID, PERIOD_ID, 'comp-1', expect.objectContaining({
        status: 'approved',
      }));
      // Star balance is now handled atomically by the backend, not the frontend
    });

    it('handles missing completion gracefully', async () => {
      useCompletionStore.setState({ completions: [] });
      await useCompletionStore.getState().approveCompletion(FAMILY_ID, PERIOD_ID, 'nonexistent');
      expect(mockedUpdateCompletion).toHaveBeenCalled();
      expect(mockedIncrementFamilyField).not.toHaveBeenCalled();
    });
  });

  describe('rejectCompletion', () => {
    it('updates status with reason', async () => {
      await useCompletionStore.getState().rejectCompletion(FAMILY_ID, PERIOD_ID, 'comp-1', 'Not done properly');
      expect(mockedUpdateCompletion).toHaveBeenCalledWith(FAMILY_ID, PERIOD_ID, 'comp-1', expect.objectContaining({
        status: 'rejected',
        rejectionReason: 'Not done properly',
      }));
    });
  });

  describe('getPendingCompletions', () => {
    it('filters pending completions', () => {
      useCompletionStore.setState({
        completions: [
          makeCompletion({ id: 'c1', status: 'pending' }),
          makeCompletion({ id: 'c2', status: 'approved' }),
          makeCompletion({ id: 'c3', status: 'pending' }),
        ],
      });
      const pending = useCompletionStore.getState().getPendingCompletions();
      expect(pending).toHaveLength(2);
    });
  });

  describe('getCompletionForTask', () => {
    it('finds completion by taskId and date', () => {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const completionId = `task-1_${dateStr}`;
      useCompletionStore.setState({
        completions: [makeCompletion({ id: completionId, taskId: 'task-1' })],
      });
      const result = useCompletionStore.getState().getCompletionForTask('task-1', today);
      expect(result).toBeDefined();
      expect(result?.taskId).toBe('task-1');
    });

    it('returns undefined for non-existing completion', () => {
      useCompletionStore.setState({ completions: [] });
      const result = useCompletionStore.getState().getCompletionForTask('task-1', new Date());
      expect(result).toBeUndefined();
    });
  });

  describe('subscribe', () => {
    it('subscribes and updates state', () => {
      vi.mocked(subscribeCompletions).mockImplementation((fid: string, pid: string, cb: Function) => {
        cb([makeCompletion()]);
        return vi.fn();
      });
      useCompletionStore.getState().subscribe(FAMILY_ID, PERIOD_ID);
      expect(useCompletionStore.getState().completions).toHaveLength(1);
      expect(useCompletionStore.getState().isLoading).toBe(false);
    });
  });
});
