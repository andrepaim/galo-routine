import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSubscriptions } from '../../lib/hooks/useSubscriptions';
import { useAuthStore } from '../../lib/stores/authStore';
import { usePeriodStore } from '../../lib/stores/periodStore';
import { useTaskStore } from '../../lib/stores/taskStore';
import { useCompletionStore } from '../../lib/stores/completionStore';

// Mock api/db with all subscription functions returning vi.fn() (unsubscribe function)
vi.mock('../../lib/api/db', () => ({
  subscribeTasks: vi.fn((_fid: string, cb: Function) => { cb([]); return vi.fn(); }),
  subscribePeriods: vi.fn((_fid: string, cb: Function) => { cb([]); return vi.fn(); }),
  subscribeCompletions: vi.fn((_fid: string, _pid: string, cb: Function) => { cb([]); return vi.fn(); }),
  subscribeRewards: vi.fn((_fid: string, cb: Function) => { cb([]); return vi.fn(); }),
  subscribeRedemptions: vi.fn((_fid: string, cb: Function) => { cb([]); return vi.fn(); }),
  subscribeToFamily: vi.fn((_fid: string, cb: Function) => { cb(null); return vi.fn(); }),
  getActivePeriod: vi.fn().mockResolvedValue(null),
  createTask: vi.fn().mockResolvedValue('mock-task-id'),
  updateTask: vi.fn().mockResolvedValue(undefined),
  deleteTask: vi.fn().mockResolvedValue(undefined),
  createPeriod: vi.fn().mockResolvedValue('mock-period-id'),
  updatePeriod: vi.fn().mockResolvedValue(undefined),
  createCompletion: vi.fn().mockResolvedValue(undefined),
  updateCompletion: vi.fn().mockResolvedValue(undefined),
  createReward: vi.fn().mockResolvedValue('mock-reward-id'),
  updateReward: vi.fn().mockResolvedValue(undefined),
  deleteReward: vi.fn().mockResolvedValue(undefined),
  createRedemption: vi.fn().mockResolvedValue('mock-redemption-id'),
  updateRedemption: vi.fn().mockResolvedValue(undefined),
  updateFamily: vi.fn().mockResolvedValue(undefined),
  incrementFamilyField: vi.fn().mockResolvedValue(undefined),
  updateFamilySettings: vi.fn().mockResolvedValue(undefined),
  stripUndefined: <T extends Record<string, any>>(obj: T): T =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T,
}));

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    familyId: null,
    family: null,
    uid: null,
    email: null,
    role: null,
    childName: null,
    parentName: null,
    isLoading: false,
    isAuthenticated: false,
  });
  usePeriodStore.setState({ periods: [], activePeriod: null, isLoading: false, _ensureLock: false });
  useTaskStore.setState({ tasks: [], isLoading: false });
  useCompletionStore.setState({ completions: [], isLoading: false });
});

describe('useSubscriptions', () => {
  it('does nothing when no familyId', () => {
    const { unmount } = renderHook(() => useSubscriptions());
    unmount();
    // Should not throw
  });

  it('sets up dev mode data when familyId is dev-family-123', () => {
    useAuthStore.setState({ familyId: 'dev-family-123' });
    renderHook(() => useSubscriptions());
    const tasks = useTaskStore.getState().tasks;
    expect(tasks.length).toBeGreaterThan(0);
  });

  it('cleans up on unmount without errors (dev mode)', () => {
    useAuthStore.setState({ familyId: 'dev-family-123' });
    const { unmount } = renderHook(() => useSubscriptions());
    expect(() => unmount()).not.toThrow();
  });

  it('sets up mock period in dev mode', () => {
    useAuthStore.setState({ familyId: 'dev-family-123' });
    renderHook(() => useSubscriptions());
    const period = usePeriodStore.getState().activePeriod;
    expect(period).toBeDefined();
    expect(period?.id).toBe('period-1');
  });
});
