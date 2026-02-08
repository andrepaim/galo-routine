import { useTaskStore } from '../taskStore';
import { usePeriodStore } from '../periodStore';
import { useCompletionStore } from '../completionStore';
import { useRewardStore } from '../rewardStore';
import { useGoalStore } from '../goalStore';
import { useBadgeStore } from '../badgeStore';
import * as firestoreMock from '../../firebase/firestore';

// Reset all stores between tests
beforeEach(() => {
  useTaskStore.setState({ tasks: [], isLoading: true });
  usePeriodStore.setState({ periods: [], activePeriod: null, isLoading: true, _ensureLock: false });
  useCompletionStore.setState({ completions: [], isLoading: true });
  useRewardStore.setState({ rewards: [], redemptions: [], isLoading: true });
  useGoalStore.setState({ goals: [], isLoading: true });
  useBadgeStore.setState({ earnedBadges: [], isLoading: true });
  jest.clearAllMocks();
});

describe('taskStore', () => {
  it('should have initial state', () => {
    const state = useTaskStore.getState();
    expect(state.tasks).toEqual([]);
    expect(state.isLoading).toBe(true);
  });

  it('should call createTask on addTask', async () => {
    const data = { name: 'Test', description: 'Desc', goals: 1, taskType: 'routine' as const, recurrenceType: 'daily' as const, days: [] };
    await useTaskStore.getState().addTask('family-1', data);
    expect(firestoreMock.createTask).toHaveBeenCalledWith('family-1', expect.objectContaining({ name: 'Test', goals: 1 }));
  });

  it('should call updateTask on editTask', async () => {
    await useTaskStore.getState().editTask('family-1', 'task-1', { name: 'Updated' });
    expect(firestoreMock.updateTask).toHaveBeenCalledWith('family-1', 'task-1', expect.objectContaining({ name: 'Updated' }));
  });

  it('should call deleteTask on removeTask', async () => {
    await useTaskStore.getState().removeTask('family-1', 'task-1');
    expect(firestoreMock.deleteTask).toHaveBeenCalledWith('family-1', 'task-1');
  });

  it('should call updateTask on toggleTask', async () => {
    await useTaskStore.getState().toggleTask('family-1', 'task-1', false);
    expect(firestoreMock.updateTask).toHaveBeenCalledWith('family-1', 'task-1', { isActive: false });
  });

  it('addTasksBatch should create all tasks', async () => {
    const dataList = [
      { name: 'T1', description: '', goals: 1, taskType: 'routine' as const, recurrenceType: 'daily' as const, days: [] },
      { name: 'T2', description: '', goals: 2, taskType: 'routine' as const, recurrenceType: 'daily' as const, days: [] },
    ];
    await useTaskStore.getState().addTasksBatch('family-1', dataList);
    expect(firestoreMock.createTask).toHaveBeenCalledTimes(2);
  });
});

describe('periodStore', () => {
  it('should have initial state', () => {
    const state = usePeriodStore.getState();
    expect(state.periods).toEqual([]);
    expect(state.activePeriod).toBeNull();
    expect(state.isLoading).toBe(true);
  });
});

describe('completionStore', () => {
  it('should have initial state', () => {
    const state = useCompletionStore.getState();
    expect(state.completions).toEqual([]);
    expect(state.isLoading).toBe(true);
  });

  it('getPendingCompletions should filter pending', () => {
    useCompletionStore.setState({
      completions: [
        { id: '1', taskId: 't1', taskName: 'T1', taskGoalValue: 1, date: {} as any, status: 'pending', completedAt: {} as any },
        { id: '2', taskId: 't2', taskName: 'T2', taskGoalValue: 2, date: {} as any, status: 'approved', completedAt: {} as any },
        { id: '3', taskId: 't3', taskName: 'T3', taskGoalValue: 1, date: {} as any, status: 'pending', completedAt: {} as any },
      ],
    });
    const pending = useCompletionStore.getState().getPendingCompletions();
    expect(pending).toHaveLength(2);
    expect(pending.every(c => c.status === 'pending')).toBe(true);
  });

  it('approveCompletion should call updateCompletion and incrementFamilyField', async () => {
    useCompletionStore.setState({
      completions: [
        { id: 'c1', taskId: 't1', taskName: 'T1', taskGoalValue: 3, date: {} as any, status: 'pending', completedAt: {} as any },
      ],
    });
    await useCompletionStore.getState().approveCompletion('f1', 'p1', 'c1');
    expect(firestoreMock.updateCompletion).toHaveBeenCalledWith('f1', 'p1', 'c1', expect.objectContaining({ status: 'approved' }));
    expect(firestoreMock.incrementFamilyField).toHaveBeenCalledWith('f1', 'goalBalance', 3);
    expect(firestoreMock.incrementFamilyField).toHaveBeenCalledWith('f1', 'lifetimeGoalsEarned', 3);
  });

  it('rejectCompletion should call updateCompletion', async () => {
    await useCompletionStore.getState().rejectCompletion('f1', 'p1', 'c1', 'reason');
    expect(firestoreMock.updateCompletion).toHaveBeenCalledWith('f1', 'p1', 'c1', expect.objectContaining({ status: 'rejected', rejectionReason: 'reason' }));
  });
});

describe('rewardStore', () => {
  it('should have initial state', () => {
    const state = useRewardStore.getState();
    expect(state.rewards).toEqual([]);
    expect(state.redemptions).toEqual([]);
  });

  it('addReward should call createReward', async () => {
    const data = { name: 'Reward', description: 'Desc', goalCost: 10, icon: 'gift', availability: 'unlimited' as const, requiresApproval: true };
    await useRewardStore.getState().addReward('f1', data);
    expect(firestoreMock.createReward).toHaveBeenCalledWith('f1', expect.objectContaining({ name: 'Reward', goalCost: 10 }));
  });

  it('removeReward should call deleteReward', async () => {
    await useRewardStore.getState().removeReward('f1', 'r1');
    expect(firestoreMock.deleteReward).toHaveBeenCalledWith('f1', 'r1');
  });

  it('redeemReward should deduct stars', async () => {
    const reward = { id: 'r1', name: 'R', description: '', goalCost: 5, icon: 'gift', isActive: true, availability: 'unlimited' as const, requiresApproval: false };
    await useRewardStore.getState().redeemReward('f1', reward);
    expect(firestoreMock.createRedemption).toHaveBeenCalled();
    expect(firestoreMock.incrementFamilyField).toHaveBeenCalledWith('f1', 'goalBalance', -5);
  });

  it('rejectRedemption should refund stars', async () => {
    useRewardStore.setState({
      redemptions: [{ id: 'red1', rewardId: 'r1', rewardName: 'R', goalCost: 10, redeemedAt: {} as any, status: 'pending' }],
    });
    await useRewardStore.getState().rejectRedemption('f1', 'red1');
    expect(firestoreMock.incrementFamilyField).toHaveBeenCalledWith('f1', 'goalBalance', 10);
    expect(firestoreMock.updateRedemption).toHaveBeenCalledWith('f1', 'red1', expect.objectContaining({ status: 'rejected' }));
  });
});

describe('goalStore', () => {
  it('should have initial state', () => {
    const state = useGoalStore.getState();
    expect(state.goals).toEqual([]);
  });

  it('addGoal should call createGoal', async () => {
    const data = { name: 'Goal', description: 'Desc', targetGoals: 100, rewardDescription: 'Prize' };
    await useGoalStore.getState().addGoal('f1', data);
    expect(firestoreMock.createGoal).toHaveBeenCalledWith('f1', expect.objectContaining({ name: 'Goal', targetGoals: 100 }));
  });

  it('removeGoal should call deleteGoal', async () => {
    await useGoalStore.getState().removeGoal('f1', 'g1');
    expect(firestoreMock.deleteGoal).toHaveBeenCalledWith('f1', 'g1');
  });

  it('completeGoal should call updateGoal', async () => {
    await useGoalStore.getState().completeGoal('f1', 'g1');
    expect(firestoreMock.updateGoal).toHaveBeenCalledWith('f1', 'g1', expect.objectContaining({ isCompleted: true }));
  });
});

describe('badgeStore', () => {
  it('should have initial state', () => {
    const state = useBadgeStore.getState();
    expect(state.earnedBadges).toEqual([]);
  });

  it('hasBadge should return false when no badges', () => {
    expect(useBadgeStore.getState().hasBadge('some-badge')).toBe(false);
  });

  it('hasBadge should return true when badge exists', () => {
    useBadgeStore.setState({
      earnedBadges: [{ badgeId: 'first_star', earnedAt: {} as any }],
    });
    expect(useBadgeStore.getState().hasBadge('first_star')).toBe(true);
  });

  it('awardBadge should call createEarnedBadge', async () => {
    await useBadgeStore.getState().awardBadge('f1', 'first_star');
    expect(firestoreMock.createEarnedBadge).toHaveBeenCalledWith('f1', expect.objectContaining({ badgeId: 'first_star' }));
  });

  it('awardBadge should not duplicate existing badge', async () => {
    useBadgeStore.setState({
      earnedBadges: [{ badgeId: 'first_star', earnedAt: {} as any }],
    });
    await useBadgeStore.getState().awardBadge('f1', 'first_star');
    expect(firestoreMock.createEarnedBadge).not.toHaveBeenCalled();
  });
});
