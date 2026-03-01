/**
 * auth.ts — no-op Firebase auth replacement.
 * Single-family app: no auth needed. PIN verified via REST API.
 */
import { apiFetch } from '../api/client';

export async function ensureAuth() {
  return null;
}

export function onAuthChange(cb: (user: null) => void) {
  cb(null);
  return () => {};
}

export async function signOut() {}

export async function getFamilyDoc() {
  return null;
}

export async function verifyChildPin(_familyId: string, pin: string): Promise<boolean> {
  const { valid } = await apiFetch<{ valid: boolean }>('/auth/verify-pin', {
    method: 'POST',
    body: JSON.stringify({ pin }),
  });
  return valid;
}
