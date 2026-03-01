import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTodayTasks } from '../../lib/hooks/useTodayTasks';
import { useTaskStore } from '../../lib/stores/taskStore';
import { useCompletionStore } from '../../lib/stores/completionStore';
import type { Task, TaskCompletion } from '../../lib/types';

vi.mock('../../lib/api/db');

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    name: 'Test Task',
    description: 'desc',
    starValue: 2,
    isActive: true,
    recurrence: { type: 'daily' },
    ...overrides,
  };
}

function makeCompletion(overrides: Partial<TaskCompletion> = {}): TaskCompletion {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return {
    id: `task-1_${dateStr}`,
    taskId: 'task-1',
    taskName: 'Test Task',
    taskStarValue: 2,
    date: now.toISOString(),
    status: 'pending',
    completedAt: now.toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  useTaskStore.setState({ tasks: [], isLoading: false });
  useCompletionStore.setState({ completions: [], isLoading: false });
});

describe('useTodayTasks', () => {
  it('returns empty array when no tasks', () => {
    const { result } = renderHook(() => useTodayTasks());
    expect(result.current.todayTasks).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns daily active tasks', () => {
    useTaskStore.setState({
      tasks: [makeTask({ id: 't1' }), makeTask({ id: 't2' })],
      isLoading: false,
    });
    const { result } = renderHook(() => useTodayTasks());
    expect(result.current.todayTasks).toHaveLength(2);
  });

  it('excludes inactive tasks', () => {
    useTaskStore.setState({
      tasks: [makeTask({ id: 't1' }), makeTask({ id: 't2', isActive: false })],
      isLoading: false,
    });
    const { result } = renderHook(() => useTodayTasks());
    expect(result.current.todayTasks).toHaveLength(1);
  });

  it('attaches completion to matching task', () => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    useTaskStore.setState({ tasks: [makeTask({ id: 'task-1' })], isLoading: false });
    useCompletionStore.setState({
      completions: [makeCompletion({ id: `task-1_${dateStr}`, taskId: 'task-1' })],
      isLoading: false,
    });
    const { result } = renderHook(() => useTodayTasks());
    expect(result.current.todayTasks[0].completion).toBeDefined();
  });

  it('hides completed once tasks', () => {
    useTaskStore.setState({
      tasks: [makeTask({ id: 'once-1', recurrence: { type: 'once' } })],
      isLoading: false,
    });
    useCompletionStore.setState({
      completions: [makeCompletion({ id: 'other-id', taskId: 'once-1', status: 'approved' })],
      isLoading: false,
    });
    const { result } = renderHook(() => useTodayTasks());
    expect(result.current.todayTasks).toHaveLength(0);
  });

  it('sorts tasks by startTime', () => {
    useTaskStore.setState({
      tasks: [
        makeTask({ id: 't1', startTime: '14:00' }),
        makeTask({ id: 't2', startTime: '07:00' }),
        makeTask({ id: 't3' }), // no startTime, sorts last
      ],
      isLoading: false,
    });
    const { result } = renderHook(() => useTodayTasks());
    expect(result.current.todayTasks[0].id).toBe('t2');
    expect(result.current.todayTasks[1].id).toBe('t1');
    expect(result.current.todayTasks[2].id).toBe('t3');
  });

  it('reports loading when tasks are loading', () => {
    useTaskStore.setState({ tasks: [], isLoading: true });
    const { result } = renderHook(() => useTodayTasks());
    expect(result.current.isLoading).toBe(true);
  });

  it('reports loading when completions are loading', () => {
    useCompletionStore.setState({ completions: [], isLoading: true });
    const { result } = renderHook(() => useTodayTasks());
    expect(result.current.isLoading).toBe(true);
  });
});
