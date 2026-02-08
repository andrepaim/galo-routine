import { LEAGUE_CONFIG, POINTS, LEAGUE_DISPLAY, getNextLeague, qualifiesForPromotion } from '../leagueConfig';
import type { LeagueId } from '../leagueConfig';

describe('leagueConfig', () => {
  describe('LEAGUE_CONFIG structure', () => {
    it('should have all four leagues', () => {
      const leagues: LeagueId[] = ['D', 'C', 'B', 'A'];
      leagues.forEach(id => {
        expect(LEAGUE_CONFIG[id]).toBeDefined();
        expect(LEAGUE_CONFIG[id].name).toBeDefined();
        expect(LEAGUE_CONFIG[id].totalTeams).toBeGreaterThan(0);
        expect(LEAGUE_CONFIG[id].teamProfiles).toBeDefined();
      });
    });

    it('should have increasing team counts from D to A', () => {
      expect(LEAGUE_CONFIG.D.totalTeams).toBeLessThan(LEAGUE_CONFIG.C.totalTeams);
      expect(LEAGUE_CONFIG.C.totalTeams).toBeLessThan(LEAGUE_CONFIG.B.totalTeams);
      expect(LEAGUE_CONFIG.B.totalTeams).toBeLessThan(LEAGUE_CONFIG.A.totalTeams);
    });

    it('should have valid team profiles with required fields', () => {
      const leagues: LeagueId[] = ['D', 'C', 'B', 'A'];
      leagues.forEach(id => {
        const profiles = LEAGUE_CONFIG[id].teamProfiles;
        Object.values(profiles).forEach(p => {
          if (p) {
            expect(p.count).toBeGreaterThan(0);
            expect(p.winRate).toBeGreaterThanOrEqual(0);
            expect(p.winRate).toBeLessThanOrEqual(1);
            expect(p.avgGoals).toBeGreaterThan(0);
            expect(p.variance).toBeGreaterThanOrEqual(0);
            expect(p.variance).toBeLessThanOrEqual(1);
          }
        });
      });
    });

    it('team profile counts should sum to totalTeams - 1', () => {
      const leagues: LeagueId[] = ['D', 'C', 'B', 'A'];
      leagues.forEach(id => {
        const config = LEAGUE_CONFIG[id];
        const totalProfiles = Object.values(config.teamProfiles).reduce((sum, p) => sum + (p?.count || 0), 0);
        expect(totalProfiles).toBe(config.totalTeams - 1); // minus 1 for user
      });
    });
  });

  describe('POINTS', () => {
    it('should have correct point values', () => {
      expect(POINTS.WIN).toBe(3);
      expect(POINTS.DRAW).toBe(1);
      expect(POINTS.LOSS).toBe(0);
    });
  });

  describe('LEAGUE_DISPLAY', () => {
    it('should have display info for all leagues', () => {
      const leagues: LeagueId[] = ['D', 'C', 'B', 'A'];
      leagues.forEach(id => {
        expect(LEAGUE_DISPLAY[id]).toBeDefined();
        expect(LEAGUE_DISPLAY[id].emoji).toBeDefined();
        expect(LEAGUE_DISPLAY[id].color).toBeDefined();
        expect(LEAGUE_DISPLAY[id].color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('getNextLeague', () => {
    it('should return C for D', () => { expect(getNextLeague('D')).toBe('C'); });
    it('should return B for C', () => { expect(getNextLeague('C')).toBe('B'); });
    it('should return A for B', () => { expect(getNextLeague('B')).toBe('A'); });
    it('should return null for A (top league)', () => { expect(getNextLeague('A')).toBeNull(); });
  });

  describe('qualifiesForPromotion', () => {
    it('should qualify position 1 in league D', () => { expect(qualifiesForPromotion(1, 'D')).toBe(true); });
    it('should qualify position 2 in league D', () => { expect(qualifiesForPromotion(2, 'D')).toBe(true); });
    it('should not qualify position 3 in league D', () => { expect(qualifiesForPromotion(3, 'D')).toBe(false); });
    it('should never qualify from league A', () => {
      expect(qualifiesForPromotion(1, 'A')).toBe(false);
      expect(qualifiesForPromotion(2, 'A')).toBe(false);
    });
    it('should qualify position 1 in league C', () => { expect(qualifiesForPromotion(1, 'C')).toBe(true); });
    it('should not qualify position 5 in league B', () => { expect(qualifiesForPromotion(5, 'B')).toBe(false); });
  });
});
