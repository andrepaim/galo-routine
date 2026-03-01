import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStarBudget } from '../../lib/hooks/useStarBudget';
import { usePeriodStore } from '../../lib/stores/periodStore';
import { useCompletionStore } from '../../lib/stores/completionStore';
vi.mock('../../lib/api/db');

const mockPeriod = {
  id: 'p1',
  startDate: new Date().toISOString(),
  endDate: new Date().toISOString(),
  status: 'active' as const,
  starBudget: 100,
  starsEarned: 0,
  starsPending: 0,
  thresholds: {
    rewardPercent: 80,
    penaltyPercent: 30,
    rewardDescription: 'Great!',
    penaltyDescription: 'Try harder!',
  },
};

beforeEach(() => {
  usePeriodStore.setState({ periods: [], activePeriod: null, isLoading: false, _ensureLock: false });
  useCompletionStore.setState({ completions: [], isLoading: false });
});

describe('useStarBudget', () => {
  it('returns null when no active period', () => {
    const { result } = renderHook(() => useStarBudget());
    expect(result.current).toBeNull();
  });

  it('returns progress when active period exists', () => {
    usePeriodStore.setState({ activePeriod: mockPeriod });
    const { result } = renderHook(() => useStarBudget());
    expect(result.current).not.toBeNull();
    expect(result.current?.budget).toBe(100);
  });

  it('sums approved completions for earned stars', () => {
    usePeriodStore.setState({ activePeriod: mockPeriod });
    useCompletionStore.setState({
      completions: [
        { id: 'c1', taskId: 't1', taskName: 'T', taskStarValue: 5, status: 'approved', date: {} as any, completedAt: {} as any },
        { id: 'c2', taskId: 't2', taskName: 'T', taskStarValue: 3, status: 'approved', date: {} as any, completedAt: {} as any },
        { id: 'c3', taskId: 't3', taskName: 'T', taskStarValue: 2, status: 'pending', date: {} as any, completedAt: {} as any },
      ],
    });
    const { result } = renderHook(() => useStarBudget());
    expect(result.current?.earned).toBe(8);
    expect(result.current?.pending).toBe(2);
  });

  it('calculates zone flags correctly', () => {
    usePeriodStore.setState({ activePeriod: mockPeriod });
    useCompletionStore.setState({
      completions: [
        { id: 'c1', taskId: 't1', taskName: 'T', taskStarValue: 85, status: 'approved', date: {} as any, completedAt: {} as any },
      ],
    });
    const { result } = renderHook(() => useStarBudget());
    expect(result.current?.isRewardZone).toBe(true);
  });

  it('detects penalty zone', () => {
    usePeriodStore.setState({ activePeriod: mockPeriod });
    useCompletionStore.setState({
      completions: [
        { id: 'c1', taskId: 't1', taskName: 'T', taskStarValue: 10, status: 'approved', date: {} as any, completedAt: {} as any },
      ],
    });
    const { result } = renderHook(() => useStarBudget());
    expect(result.current?.isPenaltyZone).toBe(true);
  });
});
