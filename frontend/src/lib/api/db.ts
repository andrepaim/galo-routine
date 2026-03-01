/**
 * src/lib/api/db.ts
 * Drop-in replacement for src/lib/firebase/firestore.ts
 * Uses the REST API instead of Firestore.
 */
import { apiFetch } from './client';
import { getSSE } from './sse';
import type {
  Task,
  Period,
  TaskCompletion,
  Family,
  FamilySettings,
  Reward,
  Redemption,
  GaloSchedule,
} from '../types';

export type Unsubscribe = () => void;

// ── Utility ───────────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

function onInvalidate(collection: string, cb: () => void): Unsubscribe {
  const es = getSSE();
  const handler = (e: MessageEvent) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'invalidate' && msg.collection === collection) {
        cb();
      }
    } catch { /* ignore */ }
  };
  es.addEventListener('message', handler);
  return () => es.removeEventListener('message', handler);
}

// ── Family ────────────────────────────────────────────────────────────────────

export async function updateFamilySettings(
  _familyId: string,
  settings: Partial<FamilySettings>,
) {
  await apiFetch('/family', {
    method: 'PUT',
    body: JSON.stringify({ settings }),
  });
}

export async function updateFamily(_familyId: string, data: Partial<Family>) {
  await apiFetch('/family', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function subscribeToFamily(
  _familyId: string,
  callback: (family: Family | null) => void,
): Unsubscribe {
  apiFetch<Family>('/family').then(callback).catch(console.error);
  return onInvalidate('family', () => {
    apiFetch<Family>('/family').then(callback).catch(console.error);
  });
}

export async function incrementFamilyField(
  _familyId: string,
  field: string,
  amount: number,
) {
  await apiFetch('/family/increment', {
    method: 'PUT',
    body: JSON.stringify({ field, amount }),
  });
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function createTask(
  _familyId: string,
  task: Omit<Task, 'id'>,
): Promise<string> {
  const created = await apiFetch<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  });
  return created.id!;
}

export async function updateTask(
  _familyId: string,
  taskId: string,
  data: Partial<Task>,
) {
  await apiFetch(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTask(_familyId: string, taskId: string) {
  await apiFetch(`/tasks/${taskId}`, { method: 'DELETE' });
}

export function subscribeTasks(
  _familyId: string,
  callback: (tasks: Task[]) => void,
): Unsubscribe {
  apiFetch<Task[]>('/tasks').then(callback).catch(console.error);
  return onInvalidate('tasks', () => {
    apiFetch<Task[]>('/tasks').then(callback).catch(console.error);
  });
}

// ── Periods ───────────────────────────────────────────────────────────────────

export async function createPeriod(
  _familyId: string,
  period: Omit<Period, 'id'>,
): Promise<string> {
  const created = await apiFetch<Period>('/periods', {
    method: 'POST',
    body: JSON.stringify(period),
  });
  return created.id!;
}

export async function updatePeriod(
  _familyId: string,
  periodId: string,
  data: Partial<Period>,
) {
  await apiFetch(`/periods/${periodId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function subscribePeriods(
  _familyId: string,
  callback: (periods: Period[]) => void,
): Unsubscribe {
  apiFetch<Period[]>('/periods').then(callback).catch(console.error);
  return onInvalidate('periods', () => {
    apiFetch<Period[]>('/periods').then(callback).catch(console.error);
  });
}

export async function getActivePeriod(_familyId: string): Promise<Period | null> {
  return apiFetch<Period | null>('/periods/active');
}

// ── Completions ───────────────────────────────────────────────────────────────

export async function createCompletion(
  _familyId: string,
  periodId: string,
  completion: Omit<TaskCompletion, 'id'>,
  completionId: string,
) {
  await apiFetch(`/completions/${periodId}`, {
    method: 'POST',
    body: JSON.stringify({ id: completionId, ...completion }),
  });
}

export async function updateCompletion(
  _familyId: string,
  periodId: string,
  completionId: string,
  data: Partial<TaskCompletion>,
) {
  await apiFetch(`/completions/${periodId}/${completionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function subscribeCompletions(
  _familyId: string,
  periodId: string,
  callback: (completions: TaskCompletion[]) => void,
): Unsubscribe {
  apiFetch<TaskCompletion[]>(`/completions/${periodId}`)
    .then(callback)
    .catch(console.error);
  return onInvalidate('completions', () => {
    apiFetch<TaskCompletion[]>(`/completions/${periodId}`)
      .then(callback)
      .catch(console.error);
  });
}

export async function getCompletionsForDate(
  _familyId: string,
  periodId: string,
  date: Date,
): Promise<TaskCompletion[]> {
  const all = await apiFetch<TaskCompletion[]>(`/completions/${periodId}`);
  const dateStr = date.toISOString().slice(0, 10);
  return all.filter((c) => {
    const cDate = (c.date as string).slice(0, 10);
    return cDate === dateStr;
  });
}

// ── Rewards ───────────────────────────────────────────────────────────────────

export async function createReward(
  _familyId: string,
  reward: Omit<Reward, 'id'>,
): Promise<string> {
  const created = await apiFetch<Reward>('/rewards', {
    method: 'POST',
    body: JSON.stringify(reward),
  });
  return created.id!;
}

export async function updateReward(
  _familyId: string,
  rewardId: string,
  data: Partial<Reward>,
) {
  await apiFetch(`/rewards/${rewardId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteReward(_familyId: string, rewardId: string) {
  await apiFetch(`/rewards/${rewardId}`, { method: 'DELETE' });
}

export function subscribeRewards(
  _familyId: string,
  callback: (rewards: Reward[]) => void,
): Unsubscribe {
  apiFetch<Reward[]>('/rewards').then(callback).catch(console.error);
  return onInvalidate('rewards', () => {
    apiFetch<Reward[]>('/rewards').then(callback).catch(console.error);
  });
}

// ── Redemptions ───────────────────────────────────────────────────────────────

export async function createRedemption(
  _familyId: string,
  redemption: Omit<Redemption, 'id'>,
): Promise<string> {
  const created = await apiFetch<Redemption>('/redemptions', {
    method: 'POST',
    body: JSON.stringify(redemption),
  });
  return created.id!;
}

export async function updateRedemption(
  _familyId: string,
  redemptionId: string,
  data: Partial<Redemption>,
) {
  await apiFetch(`/redemptions/${redemptionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function subscribeRedemptions(
  _familyId: string,
  callback: (redemptions: Redemption[]) => void,
): Unsubscribe {
  apiFetch<Redemption[]>('/redemptions').then(callback).catch(console.error);
  return onInvalidate('redemptions', () => {
    apiFetch<Redemption[]>('/redemptions').then(callback).catch(console.error);
  });
}

// ── Galo Schedule ─────────────────────────────────────────────────────────────

export function subscribeGaloSchedule(
  _familyId: string,
  callback: (schedule: GaloSchedule | null) => void,
): Unsubscribe {
  apiFetch<GaloSchedule | null>('/galo/schedule').then(callback).catch(console.error);
  return onInvalidate('galoSchedule', () => {
    apiFetch<GaloSchedule | null>('/galo/schedule').then(callback).catch(console.error);
  });
}

// ── Galo News State ───────────────────────────────────────────────────────────

export async function getGaloNewsState(_familyId: string): Promise<string[]> {
  const data = await apiFetch<{ shownIds: string[] }>('/galo/news-state');
  return data.shownIds || [];
}

export async function addShownNewsId(
  _familyId: string,
  newsId: string,
): Promise<void> {
  const current = await getGaloNewsState(_familyId);
  const updated = [...current.filter((id) => id !== newsId), newsId];
  await apiFetch('/galo/news-state', {
    method: 'PUT',
    body: JSON.stringify({ shownIds: updated }),
  });
}

// ── Strip undefined helper (kept for compat) ──────────────────────────────────
export function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;
}

// ── Unused Firebase stubs (kept for TS compatibility) ─────────────────────────
export async function createEarnedBadge(_familyId: string, _badge: unknown): Promise<string> {
  return '';
}
export function subscribeEarnedBadges(_familyId: string, _cb: (b: unknown[]) => void): Unsubscribe {
  _cb([]);
  return () => {};
}
export async function createStreakFreeze(_familyId: string, _freeze: unknown): Promise<string> {
  return '';
}
export function subscribeStreakFreezes(_familyId: string, _cb: (f: unknown[]) => void): Unsubscribe {
  _cb([]);
  return () => {};
}

export { now };
