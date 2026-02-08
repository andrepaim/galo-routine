import { getCategoryById, getCategoryColor, TASK_CATEGORIES, ALL_BADGES, STREAK_MILESTONES, TASK_TEMPLATES, DEFAULT_SETTINGS, GOAL_VALUES, DAY_NAMES, DAY_NAMES_FULL, TASK_ICONS, REWARD_ICONS, PIN_LENGTH, AVATAR_OPTIONS, ACCENT_COLOR_OPTIONS } from '../defaults';

describe('defaults', () => {
  describe('getCategoryById', () => {
    it('should return category for valid id', () => {
      const cat = getCategoryById('hygiene');
      expect(cat).toBeDefined();
      expect(cat!.id).toBe('hygiene');
      expect(cat!.name).toBe('Hygiene');
    });
    it('should return undefined for invalid id', () => { expect(getCategoryById('nonexistent')).toBeUndefined(); });
    it('should return undefined for undefined input', () => { expect(getCategoryById(undefined)).toBeUndefined(); });
    it('should find all predefined categories', () => {
      const ids = ['hygiene', 'school', 'study', 'chores', 'meals', 'exercise', 'extracurricular', 'rest', 'other'];
      ids.forEach(id => { expect(getCategoryById(id)).toBeDefined(); });
    });
  });

  describe('getCategoryColor', () => {
    it('should return color for valid category', () => {
      const color = getCategoryColor('hygiene');
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
    it('should return fallback color for unknown category', () => {
      const color = getCategoryColor('nonexistent');
      expect(typeof color).toBe('string');
      expect(color.length).toBeGreaterThan(0);
    });
    it('should return fallback for undefined', () => {
      const color = getCategoryColor(undefined);
      expect(typeof color).toBe('string');
    });
  });

  describe('TASK_CATEGORIES', () => {
    it('should have 9 categories', () => { expect(TASK_CATEGORIES).toHaveLength(9); });
    it('should have required fields for each', () => {
      TASK_CATEGORIES.forEach(c => {
        expect(c.id).toBeDefined();
        expect(c.name).toBeDefined();
        expect(c.color).toBeDefined();
        expect(c.icon).toBeDefined();
      });
    });
  });

  describe('ALL_BADGES', () => {
    it('should have badges', () => { expect(ALL_BADGES.length).toBeGreaterThan(0); });
    it('should have required fields', () => {
      ALL_BADGES.forEach(b => {
        expect(b.id).toBeDefined();
        expect(b.name).toBeDefined();
        expect(b.description).toBeDefined();
        expect(b.icon).toBeDefined();
        expect(['milestone', 'consistency', 'category']).toContain(b.category);
      });
    });
    it('should have unique ids', () => {
      const ids = ALL_BADGES.map(b => b.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('STREAK_MILESTONES', () => {
    it('should have milestones in ascending order', () => {
      for (let i = 1; i < STREAK_MILESTONES.length; i++) {
        expect(STREAK_MILESTONES[i].days).toBeGreaterThan(STREAK_MILESTONES[i-1].days);
      }
    });
    it('should have positive bonus stars', () => {
      STREAK_MILESTONES.forEach(m => { expect(m.bonusGoals).toBeGreaterThan(0); });
    });
  });

  describe('TASK_TEMPLATES', () => {
    it('should have template categories', () => { expect(TASK_TEMPLATES.length).toBeGreaterThan(0); });
    it('each category should have templates', () => {
      TASK_TEMPLATES.forEach(tc => {
        expect(tc.id).toBeDefined();
        expect(tc.name).toBeDefined();
        expect(tc.templates.length).toBeGreaterThan(0);
      });
    });
  });

  describe('DEFAULT_SETTINGS', () => {
    it('should have valid threshold percentages', () => {
      expect(DEFAULT_SETTINGS.rewardThresholdPercent).toBeGreaterThan(0);
      expect(DEFAULT_SETTINGS.rewardThresholdPercent).toBeLessThanOrEqual(100);
      expect(DEFAULT_SETTINGS.penaltyThresholdPercent).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_SETTINGS.penaltyThresholdPercent).toBeLessThan(DEFAULT_SETTINGS.rewardThresholdPercent);
    });
    it('should have valid period settings', () => {
      expect(['weekly', 'biweekly', 'monthly', 'custom']).toContain(DEFAULT_SETTINGS.periodType);
      expect(DEFAULT_SETTINGS.periodStartDay).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_SETTINGS.periodStartDay).toBeLessThanOrEqual(6);
    });
  });

  describe('constants', () => {
    it('GOAL_VALUES should have valid range', () => { expect(GOAL_VALUES).toEqual([1, 2, 3, 4, 5]); });
    it('DAY_NAMES should have 7 entries', () => { expect(DAY_NAMES).toHaveLength(7); });
    it('DAY_NAMES_FULL should have 7 entries', () => { expect(DAY_NAMES_FULL).toHaveLength(7); });
    it('PIN_LENGTH should be 4', () => { expect(PIN_LENGTH).toBe(4); });
    it('TASK_ICONS should be non-empty', () => { expect(TASK_ICONS.length).toBeGreaterThan(0); });
    it('REWARD_ICONS should be non-empty', () => { expect(REWARD_ICONS.length).toBeGreaterThan(0); });
    it('AVATAR_OPTIONS should be non-empty', () => { expect(AVATAR_OPTIONS.length).toBeGreaterThan(0); });
    it('ACCENT_COLOR_OPTIONS should have valid hex colors', () => {
      ACCENT_COLOR_OPTIONS.forEach(c => { expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/); });
    });
  });
});
