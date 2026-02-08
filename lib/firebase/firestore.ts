import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
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

function onSnapshotError(name: string) {
  return (error: Error) => {
    console.warn(`[Firestore] ${name} subscription error:`, error.message);
  };
}

import type {
  Task,
  Period,
  TaskCompletion,
  Family,
  FamilySettings,
  Reward,
  Redemption,
  LongTermGoal,
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
  await updateDoc(doc(db, 'families', familyId), data);
}

export function subscribeToFamily(familyId: string, callback: (family: Family | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'families', familyId), (snap) => {
    callback(snap.exists() ? (snap.data() as Family) : null);
  }, onSnapshotError('family'));
}

export async function incrementFamilyField(familyId: string, field: string, amount: number) {
  await updateDoc(doc(db, 'families', familyId), { [field]: increment(amount) });
}

// ── Tasks ─────────────────────────────────────────────────────────

function tasksRef(familyId: string) {
  return collection(db, 'families', familyId, 'tasks');
}

export async function createTask(familyId: string, task: Omit<Task, 'id'>): Promise<string> {
  const ref = await addDoc(tasksRef(familyId), task);
  return ref.id;
}

export async function updateTask(familyId: string, taskId: string, data: Partial<Task>) {
  await updateDoc(doc(db, 'families', familyId, 'tasks', taskId), data);
}

export async function deleteTask(familyId: string, taskId: string) {
  await deleteDoc(doc(db, 'families', familyId, 'tasks', taskId));
}

export function subscribeTasks(familyId: string, callback: (tasks: Task[]) => void): Unsubscribe {
  return onSnapshot(tasksRef(familyId), (snap) => {
    const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
    callback(tasks);
  }, onSnapshotError('tasks'));
}

// ── Periods ───────────────────────────────────────────────────────

function periodsRef(familyId: string) {
  return collection(db, 'families', familyId, 'periods');
}

export async function createPeriod(familyId: string, period: Omit<Period, 'id'>): Promise<string> {
  const ref = await addDoc(periodsRef(familyId), period);
  return ref.id;
}

export async function updatePeriod(familyId: string, periodId: string, data: Partial<Period>) {
  await updateDoc(doc(db, 'families', familyId, 'periods', periodId), data);
}

export function subscribePeriods(familyId: string, callback: (periods: Period[]) => void): Unsubscribe {
  const q = query(periodsRef(familyId), orderBy('startDate', 'desc'));
  return onSnapshot(q, (snap) => {
    const periods = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Period));
    callback(periods);
  }, onSnapshotError('periods'));
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
  await setDoc(doc(db, 'families', familyId, 'periods', periodId, 'completions', completionId), completion);
}

export async function updateCompletion(
  familyId: string,
  periodId: string,
  completionId: string,
  data: Partial<TaskCompletion>,
) {
  await updateDoc(doc(db, 'families', familyId, 'periods', periodId, 'completions', completionId), data);
}

export function subscribeCompletions(
  familyId: string,
  periodId: string,
  callback: (completions: TaskCompletion[]) => void,
): Unsubscribe {
  return onSnapshot(completionsRef(familyId, periodId), (snap) => {
    const completions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TaskCompletion));
    callback(completions);
  }, onSnapshotError('completions'));
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
  const ref = await addDoc(rewardsRef(familyId), reward);
  return ref.id;
}

export async function updateReward(familyId: string, rewardId: string, data: Partial<Reward>) {
  await updateDoc(doc(db, 'families', familyId, 'rewards', rewardId), data);
}

export async function deleteReward(familyId: string, rewardId: string) {
  await deleteDoc(doc(db, 'families', familyId, 'rewards', rewardId));
}

export function subscribeRewards(familyId: string, callback: (rewards: Reward[]) => void): Unsubscribe {
  return onSnapshot(rewardsRef(familyId), (snap) => {
    const rewards = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reward));
    callback(rewards);
  }, onSnapshotError('rewards'));
}

// ── Redemptions (Feature 1) ──────────────────────────────────────

function redemptionsRef(familyId: string) {
  return collection(db, 'families', familyId, 'redemptions');
}

export async function createRedemption(familyId: string, redemption: Omit<Redemption, 'id'>): Promise<string> {
  const ref = await addDoc(redemptionsRef(familyId), redemption);
  return ref.id;
}

export async function updateRedemption(familyId: string, redemptionId: string, data: Partial<Redemption>) {
  await updateDoc(doc(db, 'families', familyId, 'redemptions', redemptionId), data);
}

export function subscribeRedemptions(familyId: string, callback: (redemptions: Redemption[]) => void): Unsubscribe {
  const q = query(redemptionsRef(familyId), orderBy('redeemedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const redemptions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Redemption));
    callback(redemptions);
  }, onSnapshotError('redemptions'));
}

// ── Long-Term Goals (Feature 3) ──────────────────────────────────

function goalsRef(familyId: string) {
  return collection(db, 'families', familyId, 'goals');
}

export async function createGoal(familyId: string, goal: Omit<LongTermGoal, 'id'>): Promise<string> {
  const ref = await addDoc(goalsRef(familyId), goal);
  return ref.id;
}

export async function updateGoal(familyId: string, goalId: string, data: Partial<LongTermGoal>) {
  await updateDoc(doc(db, 'families', familyId, 'goals', goalId), data);
}

export async function deleteGoal(familyId: string, goalId: string) {
  await deleteDoc(doc(db, 'families', familyId, 'goals', goalId));
}

export function subscribeGoals(familyId: string, callback: (goals: LongTermGoal[]) => void): Unsubscribe {
  return onSnapshot(goalsRef(familyId), (snap) => {
    const goals = snap.docs.map((d) => ({ id: d.id, ...d.data() } as LongTermGoal));
    callback(goals);
  }, onSnapshotError('goals'));
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
  }, onSnapshotError('earnedBadges'));
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
  }, onSnapshotError('streakFreezes'));
}

// ── Championships ────────────────────────────────────────────────

import type { Championship, Match, Trophy } from '../types/championship';

function championshipsRef(familyId: string) {
  return collection(db, 'families', familyId, 'championships');
}

export async function createChampionship(
  familyId: string,
  championship: Omit<Championship, 'id'>
): Promise<string> {
  const ref = await addDoc(championshipsRef(familyId), {
    ...championship,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function updateChampionship(
  familyId: string,
  championshipId: string,
  data: Partial<Championship>
) {
  await updateDoc(doc(db, 'families', familyId, 'championships', championshipId), data);
}

export async function getChampionship(
  familyId: string,
  championshipId: string
): Promise<Championship | null> {
  const snap = await getDoc(doc(db, 'families', familyId, 'championships', championshipId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Championship;
}

export async function getActiveChampionship(familyId: string): Promise<Championship | null> {
  const q = query(championshipsRef(familyId), where('status', '==', 'active'));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Championship;
}

export function subscribeChampionship(
  familyId: string,
  championshipId: string,
  callback: (championship: Championship | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, 'families', familyId, 'championships', championshipId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } as Championship : null);
  }, onSnapshotError('championship'));
}

export function subscribeActiveChampionship(
  familyId: string,
  callback: (championship: Championship | null) => void
): Unsubscribe {
  const q = query(championshipsRef(familyId), where('status', '==', 'active'));
  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      callback(null);
    } else {
      const d = snap.docs[0];
      callback({ id: d.id, ...d.data() } as Championship);
    }
  }, onSnapshotError('activeChampionship'));
}

// ── Matches ──────────────────────────────────────────────────────

function matchesRef(familyId: string, championshipId: string) {
  return collection(db, 'families', familyId, 'championships', championshipId, 'matches');
}

export async function createMatch(
  familyId: string,
  championshipId: string,
  match: Omit<Match, 'id'>
): Promise<string> {
  const ref = await addDoc(matchesRef(familyId, championshipId), match);
  return ref.id;
}

export async function updateMatch(
  familyId: string,
  championshipId: string,
  matchId: string,
  data: Partial<Match>
) {
  await updateDoc(
    doc(db, 'families', familyId, 'championships', championshipId, 'matches', matchId),
    data
  );
}

export async function getMatchForDate(
  familyId: string,
  championshipId: string,
  dateStr: string
): Promise<Match | null> {
  const q = query(matchesRef(familyId, championshipId), where('date', '==', dateStr));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Match;
}

export function subscribeMatch(
  familyId: string,
  championshipId: string,
  matchId: string,
  callback: (match: Match | null) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'families', familyId, 'championships', championshipId, 'matches', matchId),
    (snap) => {
      callback(snap.exists() ? { id: snap.id, ...snap.data() } as Match : null);
    },
    onSnapshotError('match'),
  );
}

export function subscribeTodayMatch(
  familyId: string,
  championshipId: string,
  dateStr: string,
  callback: (match: Match | null) => void
): Unsubscribe {
  const q = query(matchesRef(familyId, championshipId), where('date', '==', dateStr));
  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      callback(null);
    } else {
      const d = snap.docs[0];
      callback({ id: d.id, ...d.data() } as Match);
    }
  }, onSnapshotError('todayMatch'));
}

// ── Trophies ─────────────────────────────────────────────────────

function trophiesRef(familyId: string) {
  return collection(db, 'families', familyId, 'trophies');
}

export async function createTrophy(familyId: string, trophy: Omit<Trophy, 'id'>): Promise<string> {
  const ref = await addDoc(trophiesRef(familyId), trophy);
  return ref.id;
}

export function subscribeTrophies(
  familyId: string,
  callback: (trophies: Trophy[]) => void
): Unsubscribe {
  const q = query(trophiesRef(familyId), orderBy('earnedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const trophies = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trophy));
    callback(trophies);
  }, onSnapshotError('trophies'));
}
