// Mock lib/firebase/firestore - all Firestore operations
export const createTask = jest.fn().mockResolvedValue('mock-task-id');
export const updateTask = jest.fn().mockResolvedValue(undefined);
export const deleteTask = jest.fn().mockResolvedValue(undefined);
export const subscribeTasks = jest.fn(() => jest.fn());

export const createPeriod = jest.fn().mockResolvedValue('mock-period-id');
export const updatePeriod = jest.fn().mockResolvedValue(undefined);
export const subscribePeriods = jest.fn(() => jest.fn());
export const getActivePeriod = jest.fn().mockResolvedValue(null);

export const createCompletion = jest.fn().mockResolvedValue(undefined);
export const updateCompletion = jest.fn().mockResolvedValue(undefined);
export const subscribeCompletions = jest.fn(() => jest.fn());
export const incrementFamilyField = jest.fn().mockResolvedValue(undefined);

export const createReward = jest.fn().mockResolvedValue('mock-reward-id');
export const updateReward = jest.fn().mockResolvedValue(undefined);
export const deleteReward = jest.fn().mockResolvedValue(undefined);
export const subscribeRewards = jest.fn(() => jest.fn());
export const createRedemption = jest.fn().mockResolvedValue(undefined);
export const updateRedemption = jest.fn().mockResolvedValue(undefined);
export const subscribeRedemptions = jest.fn(() => jest.fn());

export const createGoal = jest.fn().mockResolvedValue('mock-goal-id');
export const updateGoal = jest.fn().mockResolvedValue(undefined);
export const deleteGoal = jest.fn().mockResolvedValue(undefined);
export const subscribeGoals = jest.fn(() => jest.fn());

export const createEarnedBadge = jest.fn().mockResolvedValue(undefined);
export const subscribeEarnedBadges = jest.fn(() => jest.fn());

export const updateFamilySettings = jest.fn().mockResolvedValue(undefined);
export const updateFamily = jest.fn().mockResolvedValue(undefined);
export const subscribeToFamily = jest.fn(() => jest.fn());

// Championship firestore functions
export const createChampionship = jest.fn().mockResolvedValue('mock-championship-id');
export const updateChampionship = jest.fn().mockResolvedValue(undefined);
export const subscribeActiveChampionship = jest.fn(() => jest.fn());
export const createMatch = jest.fn().mockResolvedValue('mock-match-id');
export const updateMatch = jest.fn().mockResolvedValue(undefined);
export const subscribeTodayMatch = jest.fn(() => jest.fn());
export const getMatchForDate = jest.fn().mockResolvedValue(null);
export const createTrophy = jest.fn().mockResolvedValue(undefined);
export const subscribeTrophies = jest.fn(() => jest.fn());
