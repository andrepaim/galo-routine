import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  increment,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import type { GaloSchedule } from '../types';

/**
 * Strip undefined values from an object before sending to Firestore.
 * Firestore rejects undefined field values — this prevents the entire class of errors.
 */
export function stripUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

import type {
  Task,
  Period,
  TaskCompletion,
  Family,
  FamilySettings,
  Reward,
  Redemption,
  EarnedBadge,
  StreakFreeze,
} from '../types';

// ── Family ────────────────────────────────────────────────────────

export async function updateFamilySettings(familyId: string, settings: Partial<FamilySettings>) {
  const ref = doc(db, 'families', familyId);
  const updateData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(settings)) {
    updateData[`settings.${key}`] = value;
  }
  await updateDoc(ref, updateData);
}

export async function updateFamily(familyId: string, data: Partial<Family>) {
  await updateDoc(doc(db, 'families', familyId), stripUndefined(data));
}

export function subscribeToFamily(familyId: string, callback: (family: Family | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'families', familyId), (snap) => {
    callback(snap.exists() ? (snap.data() as Family) : null);
  });
}

export async function incrementFamilyField(familyId: string, field: string, amount: number) {
  await updateDoc(doc(db, 'families', familyId), { [field]: increment(amount) });
}

// ── Tasks ─────────────────────────────────────────────────────────

function tasksRef(familyId: string) {
  return collection(db, 'families', familyId, 'tasks');
}

export async function createTask(familyId: string, task: Omit<Task, 'id'>): Promise<string> {
  const ref = await addDoc(tasksRef(familyId), stripUndefined(task));
  return ref.id;
}

export async function updateTask(familyId: string, taskId: string, data: Partial<Task>) {
  await updateDoc(doc(db, 'families', familyId, 'tasks', taskId), stripUndefined(data));
}

export async function deleteTask(familyId: string, taskId: string) {
  await deleteDoc(doc(db, 'families', familyId, 'tasks', taskId));
}

export function subscribeTasks(familyId: string, callback: (tasks: Task[]) => void): Unsubscribe {
  return onSnapshot(tasksRef(familyId), (snap) => {
    const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
    callback(tasks);
  });
}

// ── Periods ───────────────────────────────────────────────────────

function periodsRef(familyId: string) {
  return collection(db, 'families', familyId, 'periods');
}

export async function createPeriod(familyId: string, period: Omit<Period, 'id'>): Promise<string> {
  const ref = await addDoc(periodsRef(familyId), stripUndefined(period));
  return ref.id;
}

export async function updatePeriod(familyId: string, periodId: string, data: Partial<Period>) {
  await updateDoc(doc(db, 'families', familyId, 'periods', periodId), stripUndefined(data));
}

export function subscribePeriods(familyId: string, callback: (periods: Period[]) => void): Unsubscribe {
  const q = query(periodsRef(familyId), orderBy('startDate', 'desc'));
  return onSnapshot(q, (snap) => {
    const periods = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Period));
    callback(periods);
  });
}

export async function getActivePeriod(familyId: string): Promise<Period | null> {
  const q = query(periodsRef(familyId), where('status', '==', 'active'));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Period;
}

// ── Completions ───────────────────────────────────────────────────

function completionsRef(familyId: string, periodId: string) {
  return collection(db, 'families', familyId, 'periods', periodId, 'completions');
}

export async function createCompletion(
  familyId: string,
  periodId: string,
  completion: Omit<TaskCompletion, 'id'>,
  completionId: string,
) {
  await setDoc(doc(db, 'families', familyId, 'periods', periodId, 'completions', completionId), stripUndefined(completion));
}

export async function updateCompletion(
  familyId: string,
  periodId: string,
  completionId: string,
  data: Partial<TaskCompletion>,
) {
  await updateDoc(doc(db, 'families', familyId, 'periods', periodId, 'completions', completionId), stripUndefined(data));
}

export function subscribeCompletions(
  familyId: string,
  periodId: string,
  callback: (completions: TaskCompletion[]) => void,
): Unsubscribe {
  return onSnapshot(completionsRef(familyId, periodId), (snap) => {
    const completions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TaskCompletion));
    callback(completions);
  });
}

export async function getCompletionsForDate(
  familyId: string,
  periodId: string,
  date: Date,
): Promise<TaskCompletion[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const q = query(
    completionsRef(familyId, periodId),
    where('date', '>=', Timestamp.fromDate(startOfDay)),
    where('date', '<=', Timestamp.fromDate(endOfDay)),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TaskCompletion));
}

// ── Rewards (Feature 1) ──────────────────────────────────────────

function rewardsRef(familyId: string) {
  return collection(db, 'families', familyId, 'rewards');
}

export async function createReward(familyId: string, reward: Omit<Reward, 'id'>): Promise<string> {
  const ref = await addDoc(rewardsRef(familyId), stripUndefined(reward));
  return ref.id;
}

export async function updateReward(familyId: string, rewardId: string, data: Partial<Reward>) {
  await updateDoc(doc(db, 'families', familyId, 'rewards', rewardId), stripUndefined(data));
}

export async function deleteReward(familyId: string, rewardId: string) {
  await deleteDoc(doc(db, 'families', familyId, 'rewards', rewardId));
}

export function subscribeRewards(familyId: string, callback: (rewards: Reward[]) => void): Unsubscribe {
  return onSnapshot(rewardsRef(familyId), (snap) => {
    const rewards = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reward));
    callback(rewards);
  });
}

// ── Redemptions (Feature 1) ──────────────────────────────────────

function redemptionsRef(familyId: string) {
  return collection(db, 'families', familyId, 'redemptions');
}

export async function createRedemption(familyId: string, redemption: Omit<Redemption, 'id'>): Promise<string> {
  const ref = await addDoc(redemptionsRef(familyId), stripUndefined(redemption));
  return ref.id;
}

export async function updateRedemption(familyId: string, redemptionId: string, data: Partial<Redemption>) {
  await updateDoc(doc(db, 'families', familyId, 'redemptions', redemptionId), stripUndefined(data));
}

export function subscribeRedemptions(familyId: string, callback: (redemptions: Redemption[]) => void): Unsubscribe {
  const q = query(redemptionsRef(familyId), orderBy('redeemedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const redemptions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Redemption));
    callback(redemptions);
  });
}

// ── Earned Badges (Feature 7) ────────────────────────────────────

function badgesRef(familyId: string) {
  return collection(db, 'families', familyId, 'earnedBadges');
}

export async function createEarnedBadge(familyId: string, badge: Omit<EarnedBadge, 'id'>): Promise<string> {
  const ref = await addDoc(badgesRef(familyId), badge);
  return ref.id;
}

export function subscribeEarnedBadges(familyId: string, callback: (badges: EarnedBadge[]) => void): Unsubscribe {
  return onSnapshot(badgesRef(familyId), (snap) => {
    const badges = snap.docs.map((d) => ({ id: d.id, ...d.data() } as EarnedBadge));
    callback(badges);
  });
}

// ── Streak Freezes (Feature 6) ───────────────────────────────────

function streakFreezesRef(familyId: string) {
  return collection(db, 'families', familyId, 'streakFreezes');
}

export async function createStreakFreeze(familyId: string, freeze: Omit<StreakFreeze, 'id'>): Promise<string> {
  const ref = await addDoc(streakFreezesRef(familyId), freeze);
  return ref.id;
}

export function subscribeStreakFreezes(familyId: string, callback: (freezes: StreakFreeze[]) => void): Unsubscribe {
  return onSnapshot(streakFreezesRef(familyId), (snap) => {
    const freezes = snap.docs.map((d) => ({ id: d.id, ...d.data() } as StreakFreeze));
    callback(freezes);
  });
}


// ── Galo Schedule ────────────────────────────────────────────────

export function subscribeGaloSchedule(
  familyId: string,
  callback: (schedule: GaloSchedule | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, 'families', familyId, 'galoSchedule', 'current'), (snap) => {
    if (!snap.exists()) { callback(null); return; }
    callback(snap.data() as GaloSchedule);
  });
}

// ── Galo News State ──────────────────────────────────────────────────────────

export async function getGaloNewsState(familyId: string): Promise<string[]> {
  const snap = await getDoc(doc(db, 'families', familyId, 'galoSchedule', 'newsState'));
  if (!snap.exists()) return [];
  return (snap.data().shownIds as string[]) || [];
}

export async function addShownNewsId(familyId: string, newsId: string): Promise<void> {
  const ref = doc(db, 'families', familyId, 'galoSchedule', 'newsState');
  const snap = await getDoc(ref);
  const current: string[] = snap.exists() ? (snap.data().shownIds as string[]) || [] : [];
  // Remove if already present, then push to end
  const updated = [...current.filter((id) => id !== newsId), newsId];
  await setDoc(ref, { shownIds: updated });
}
