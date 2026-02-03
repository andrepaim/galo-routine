import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';
import type { Family, RegisterFormData } from '../types';
import { DEFAULT_SETTINGS } from '../../constants/defaults';
import { hashPin } from '../utils/pin';

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function registerParent(data: RegisterFormData): Promise<string> {
  const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const familyId = user.uid;

  const family: Family = {
    parentUid: user.uid,
    childPin: await hashPin(data.childPin),
    childName: data.childName,
    parentName: data.parentName,
    settings: { ...DEFAULT_SETTINGS },
    starBalance: 0,
    lifetimeStarsEarned: 0,
    currentStreak: 0,
    bestStreak: 0,
  };

  await setDoc(doc(db, 'families', familyId), family);
  return familyId;
}

export async function loginParent(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export async function getFamilyDoc(familyId: string): Promise<Family | null> {
  const snap = await getDoc(doc(db, 'families', familyId));
  return snap.exists() ? (snap.data() as Family) : null;
}

export async function verifyChildPin(familyId: string, pin: string): Promise<boolean> {
  const family = await getFamilyDoc(familyId);
  if (!family) return false;
  const hashed = await hashPin(pin);
  return hashed === family.childPin;
}
