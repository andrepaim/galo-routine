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
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import type { Task, Period, TaskCompletion, Family, FamilySettings } from '../types';

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
  });
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
  });
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
