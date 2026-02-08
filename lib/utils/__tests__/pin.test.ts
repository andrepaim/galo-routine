import { hashPin } from '../pin';

describe('pin utilities', () => {
  describe('hashPin', () => {
    it('should return a string', async () => {
      const result = await hashPin('1234');
      expect(typeof result).toBe('string');
    });

    it('should return non-empty hash', async () => {
      const result = await hashPin('1234');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should produce consistent hashes for the same input', async () => {
      const hash1 = await hashPin('1234');
      const hash2 = await hashPin('1234');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', async () => {
      const hash1 = await hashPin('1234');
      const hash2 = await hashPin('5678');
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string input', async () => {
      const result = await hashPin('');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle long PIN input', async () => {
      const result = await hashPin('123456789');
      expect(typeof result).toBe('string');
    });

    it('should return base-36 encoded string', async () => {
      const result = await hashPin('1234');
      // base36 contains only 0-9 and a-z
      expect(result).toMatch(/^[0-9a-z]+$/);
    });
  });
});
