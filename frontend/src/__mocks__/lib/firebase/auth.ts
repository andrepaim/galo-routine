import { vi } from 'vitest';
export const onAuthChange = vi.fn((_cb: Function) => vi.fn());
export const ensureAuth = vi.fn().mockResolvedValue({ uid: 'anon-uid', email: null });
export const registerParent = vi.fn().mockResolvedValue('mock-family-id');
export const signOut = vi.fn().mockResolvedValue(undefined);
export const getFamilyDoc = vi.fn().mockResolvedValue(null);
export const verifyChildPin = vi.fn().mockResolvedValue(false);
