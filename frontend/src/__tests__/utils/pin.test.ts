import { describe, it, expect } from 'vitest';
import { hashPin } from '../../lib/utils/pin';

describe('hashPin', () => {
  it('produces a string hash', async () => {
    const result = await hashPin('1234');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('produces consistent hashes for same input', async () => {
    const hash1 = await hashPin('1234');
    const hash2 = await hashPin('1234');
    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for different inputs', async () => {
    const hash1 = await hashPin('1234');
    const hash2 = await hashPin('5678');
    expect(hash1).not.toBe(hash2);
  });

  it('handles single-digit pin', async () => {
    const result = await hashPin('0');
    expect(typeof result).toBe('string');
  });

  it('handles long pin', async () => {
    const result = await hashPin('123456');
    expect(typeof result).toBe('string');
  });
});
