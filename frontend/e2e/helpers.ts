import { Page } from '@playwright/test';

export async function goAsParent(page: Page) {
  await page.goto('/?dev=parent');
  await page.waitForURL('/parent');
}

export async function goAsChild(page: Page) {
  await page.goto('/?dev=child');
  await page.waitForURL('/child');
}

// Seed Zustand store state via page.evaluate
export async function seedTasks(page: Page, tasks: any[]) {
  await page.evaluate((tasks) => {
    (window as any).__taskStore?.setState({ tasks, isLoading: false });
  }, tasks);
}

export async function seedCompletions(page: Page, completions: any[]) {
  await page.evaluate((completions) => {
    (window as any).__completionStore?.setState({ completions, isLoading: false });
  }, completions);
}

export async function seedRewards(page: Page, rewards: any[]) {
  await page.evaluate((rewards) => {
    (window as any).__rewardStore?.setState({ rewards, isLoading: false });
  }, rewards);
}

export async function seedAuthState(page: Page, state: any) {
  await page.evaluate((state) => {
    (window as any).__authStore?.setState(state);
  }, state);
}

export function mockTask(overrides: any = {}) {
  return {
    id: `task-${Date.now()}`,
    name: 'Test Task',
    description: 'Test description',
    starValue: 2,
    icon: '⭐',
    isActive: true,
    recurrence: { type: 'daily' },
    ...overrides,
  };
}

export function mockReward(overrides: any = {}) {
  return {
    id: `reward-${Date.now()}`,
    name: 'Test Reward',
    description: 'Test description',
    starCost: 10,
    icon: '🎁',
    isActive: true,
    availability: 'unlimited',
    requiresApproval: false,
    ...overrides,
  };
}
