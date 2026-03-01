import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock firebase config
vi.mock('../lib/firebase/config', () => ({
  db: {},
  auth: {},
}));

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// navigator.vibrate mock
Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), writable: true });
