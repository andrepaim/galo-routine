import {
  generateLeagueTeams, initializeStandings, sortStandings, generateFixtures,
  simulateGoals, simulateMatch, getTodayOpponent, updateStandingsAfterMatch,
  simulateDayMatches, checkWeeklyTrophy, getUserPosition, createChampionship,
  processMonthEnd,
} from '../championshipService';
import type { Championship, ChampionshipTeam, Standing, Fixture } from '../../types/championship';
import { LEAGUE_CONFIG, POINTS } from '../../../constants/leagueConfig';
import { Timestamp } from 'firebase/firestore';

describe('championshipService', () => {
  describe('generateLeagueTeams', () => {
    it('should generate correct number of teams for league D', () => {
      const teams = generateLeagueTeams('D', 'user-1', 'Player');
      expect(teams).toHaveLength(LEAGUE_CONFIG.D.totalTeams);
    });
    it('should include user team first', () => {
      const teams = generateLeagueTeams('D', 'user-1', 'Player');
      expect(teams[0].id).toBe('user-1');
      expect(teams[0].isUser).toBe(true);
      expect(teams[0].profile).toBe('user');
    });
    it('should mark non-user teams correctly', () => {
      const teams = generateLeagueTeams('D', 'user-1', 'Player');
      const nonUser = teams.filter(t => !t.isUser);
      expect(nonUser.length).toBe(LEAGUE_CONFIG.D.totalTeams - 1);
      nonUser.forEach(t => { expect(t.isUser).toBe(false); });
    });
    it('should assign profiles to simulated teams', () => {
      const teams = generateLeagueTeams('D', 'user-1', 'Player');
      const nonUser = teams.filter(t => !t.isUser);
      nonUser.forEach(t => {
        expect(t.winRate).toBeDefined();
        expect(t.avgGoals).toBeDefined();
      });
    });
  });

  describe('initializeStandings', () => {
    it('should create standings for all teams', () => {
      const teams: ChampionshipTeam[] = [
        { id: 'user-1', name: 'Player', isUser: true, profile: 'user' },
        { id: 'team-1', name: 'T1', isUser: false, profile: 'weak', winRate: 0.3, avgGoals: 1.5, variance: 0.3 },
      ];
      const standings = initializeStandings(teams);
      expect(standings).toHaveLength(2);
    });
    it('should initialize all stats to zero', () => {
      const teams: ChampionshipTeam[] = [{ id: 'u', name: 'U', isUser: true, profile: 'user' }];
      const s = initializeStandings(teams);
      expect(s[0].played).toBe(0);
      expect(s[0].points).toBe(0);
      expect(s[0].goalDifference).toBe(0);
    });
    it('should assign sequential positions', () => {
      const teams: ChampionshipTeam[] = [
        { id: 'a', name: 'A', isUser: true, profile: 'user' },
        { id: 'b', name: 'B', isUser: false, profile: 'weak' },
      ];
      const s = initializeStandings(teams);
      expect(s[0].position).toBe(1);
      expect(s[1].position).toBe(2);
    });
  });

  describe('sortStandings', () => {
    it('should sort by points descending', () => {
      const standings: Standing[] = [
        { teamId: 'a', teamName: 'A', isUser: false, played: 2, won: 0, drawn: 1, lost: 1, goalsFor: 2, goalsAgainst: 3, goalDifference: -1, points: 1, position: 1 },
        { teamId: 'b', teamName: 'B', isUser: false, played: 2, won: 2, drawn: 0, lost: 0, goalsFor: 4, goalsAgainst: 1, goalDifference: 3, points: 6, position: 2 },
      ];
      const sorted = sortStandings(standings);
      expect(sorted[0].teamId).toBe('b');
      expect(sorted[1].teamId).toBe('a');
    });
    it('should use goal difference as tiebreaker', () => {
      const standings: Standing[] = [
        { teamId: 'a', teamName: 'A', isUser: false, played: 2, won: 1, drawn: 0, lost: 1, goalsFor: 2, goalsAgainst: 3, goalDifference: -1, points: 3, position: 1 },
        { teamId: 'b', teamName: 'B', isUser: false, played: 2, won: 1, drawn: 0, lost: 1, goalsFor: 4, goalsAgainst: 1, goalDifference: 3, points: 3, position: 2 },
      ];
      const sorted = sortStandings(standings);
      expect(sorted[0].teamId).toBe('b');
    });
    it('should update positions', () => {
      const standings: Standing[] = [
        { teamId: 'a', teamName: 'A', isUser: false, played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 3, goalDifference: -3, points: 0, position: 1 },
        { teamId: 'b', teamName: 'B', isUser: false, played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 3, goalsAgainst: 0, goalDifference: 3, points: 3, position: 2 },
      ];
      const sorted = sortStandings(standings);
      expect(sorted[0].position).toBe(1);
      expect(sorted[1].position).toBe(2);
    });
  });

  describe('generateFixtures', () => {
    it('should generate correct number of fixtures for 3 teams', () => {
      const teams: ChampionshipTeam[] = [
        { id: 'a', name: 'A', isUser: true, profile: 'user' },
        { id: 'b', name: 'B', isUser: false, profile: 'weak' },
        { id: 'c', name: 'C', isUser: false, profile: 'medium' },
      ];
      const fixtures = generateFixtures(teams, 2026, 1);
      expect(fixtures).toHaveLength(3);
    });
    it('should set all fixtures as not played', () => {
      const teams: ChampionshipTeam[] = [
        { id: 'a', name: 'A', isUser: true, profile: 'user' },
        { id: 'b', name: 'B', isUser: false, profile: 'weak' },
      ];
      const fixtures = generateFixtures(teams, 2026, 1);
      fixtures.forEach(f => { expect(f.played).toBe(false); });
    });
    it('should assign unique IDs', () => {
      const teams: ChampionshipTeam[] = [
        { id: 'a', name: 'A', isUser: true, profile: 'user' },
        { id: 'b', name: 'B', isUser: false, profile: 'weak' },
        { id: 'c', name: 'C', isUser: false, profile: 'medium' },
      ];
      const fixtures = generateFixtures(teams, 2026, 1);
      const ids = new Set(fixtures.map(f => f.id));
      expect(ids.size).toBe(fixtures.length);
    });
  });

  describe('simulateGoals', () => {
    it('should return 0 for user team', () => {
      expect(simulateGoals({ id: 'u', name: 'U', isUser: true, profile: 'user' })).toBe(0);
    });
    it('should return non-negative for AI teams', () => {
      const team: ChampionshipTeam = { id: 't', name: 'T', isUser: false, profile: 'medium', winRate: 0.5, avgGoals: 2, variance: 0.3 };
      for (let i = 0; i < 50; i++) { expect(simulateGoals(team)).toBeGreaterThanOrEqual(0); }
    });
  });

  describe('simulateMatch', () => {
    it('should return goals for both teams', () => {
      const h: ChampionshipTeam = { id: 'h', name: 'H', isUser: false, profile: 'medium', winRate: 0.5, avgGoals: 2, variance: 0.3 };
      const a: ChampionshipTeam = { id: 'a', name: 'A', isUser: false, profile: 'weak', winRate: 0.3, avgGoals: 1.5, variance: 0.3 };
      const r = simulateMatch(h, a);
      expect(r.homeGoals).toBeGreaterThanOrEqual(0);
      expect(r.awayGoals).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getTodayOpponent', () => {
    const makeChamp = (fixtures: Fixture[]): Championship => ({
      id: 'c1', familyId: 'f1', childId: 'user-1', month: 1, year: 2026, league: 'D', status: 'active',
      teams: [
        { id: 'user-1', name: 'P', isUser: true, profile: 'user' },
        { id: 't1', name: 'T1', isUser: false, profile: 'weak', winRate: 0.3, avgGoals: 1.5, variance: 0.3 },
      ],
      standings: [], fixtures, currentRound: 1, createdAt: Timestamp.now(),
    });

    it('should find opponent when user is home', () => {
      const c = makeChamp([{ id: 'f1', round: 1, day: 5, date: '2026-01-05', homeTeamId: 'user-1', awayTeamId: 't1', played: false }]);
      expect(getTodayOpponent(c, '2026-01-05')!.id).toBe('t1');
    });
    it('should return null when no fixture', () => {
      const c = makeChamp([{ id: 'f1', round: 1, day: 6, date: '2026-01-06', homeTeamId: 'user-1', awayTeamId: 't1', played: false }]);
      expect(getTodayOpponent(c, '2026-01-05')).toBeNull();
    });
    it('should return null when fixture played', () => {
      const c = makeChamp([{ id: 'f1', round: 1, day: 5, date: '2026-01-05', homeTeamId: 'user-1', awayTeamId: 't1', played: true }]);
      expect(getTodayOpponent(c, '2026-01-05')).toBeNull();
    });
  });

  describe('updateStandingsAfterMatch', () => {
    const initial: Standing[] = [
      { teamId: 'a', teamName: 'A', isUser: true, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, position: 1 },
      { teamId: 'b', teamName: 'B', isUser: false, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, position: 2 },
    ];
    it('should update after home win', () => {
      const u = updateStandingsAfterMatch(initial, 'a', 'b', 3, 1);
      const a = u.find(s => s.teamId === 'a')!;
      expect(a.won).toBe(1);
      expect(a.points).toBe(POINTS.WIN);
      expect(a.goalsFor).toBe(3);
    });
    it('should update after draw', () => {
      const u = updateStandingsAfterMatch(initial, 'a', 'b', 2, 2);
      expect(u.find(s => s.teamId === 'a')!.drawn).toBe(1);
      expect(u.find(s => s.teamId === 'a')!.points).toBe(POINTS.DRAW);
    });
  });

  describe('checkWeeklyTrophy', () => {
    it('true when user is 1st', () => {
      const s: Standing[] = [{ teamId: 'u', teamName: 'U', isUser: true, played: 3, won: 3, drawn: 0, lost: 0, goalsFor: 9, goalsAgainst: 2, goalDifference: 7, points: 9, position: 1 }];
      expect(checkWeeklyTrophy(s, 'u', 1)).toBe(true);
    });
    it('false when user not 1st', () => {
      const s: Standing[] = [{ teamId: 'u', teamName: 'U', isUser: true, played: 3, won: 1, drawn: 0, lost: 2, goalsFor: 3, goalsAgainst: 6, goalDifference: -3, points: 3, position: 2 }];
      expect(checkWeeklyTrophy(s, 'u', 1)).toBe(false);
    });
  });

  describe('getUserPosition', () => {
    it('should return user position', () => {
      const s: Standing[] = [
        { teamId: 't1', teamName: 'T1', isUser: false, played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 3, goalsAgainst: 0, goalDifference: 3, points: 3, position: 1 },
        { teamId: 'u', teamName: 'U', isUser: true, played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 3, goalDifference: -3, points: 0, position: 2 },
      ];
      expect(getUserPosition(s, 'u')).toBe(2);
    });
    it('should return length when not found', () => {
      const s: Standing[] = [{ teamId: 't1', teamName: 'T1', isUser: false, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, position: 1 }];
      expect(getUserPosition(s, 'nope')).toBe(1);
    });
  });

  describe('createChampionship', () => {
    it('should create with correct structure', () => {
      const c = createChampionship('f1', 'c1', 'Child', 'D', 2026, 1);
      expect(c.familyId).toBe('f1');
      expect(c.childId).toBe('c1');
      expect(c.league).toBe('D');
      expect(c.status).toBe('active');
      expect(c.teams).toHaveLength(LEAGUE_CONFIG.D.totalTeams);
      expect(c.standings).toHaveLength(c.teams.length);
      expect(c.fixtures.length).toBe(28);
    });
  });

  describe('processMonthEnd', () => {
    it('should determine winner and promotion', () => {
      const c: Championship = {
        id: 'c1', familyId: 'f1', childId: 'u', month: 1, year: 2026, league: 'D', status: 'active',
        teams: [], fixtures: [], currentRound: 4, createdAt: Timestamp.now(),
        standings: [
          { teamId: 'u', teamName: 'U', isUser: true, played: 5, won: 5, drawn: 0, lost: 0, goalsFor: 15, goalsAgainst: 3, goalDifference: 12, points: 15, position: 1 },
          { teamId: 't', teamName: 'T', isUser: false, played: 5, won: 3, drawn: 0, lost: 2, goalsFor: 9, goalsAgainst: 6, goalDifference: 3, points: 9, position: 2 },
        ],
      };
      const r = processMonthEnd(c);
      expect(r.winnerId).toBe('u');
      expect(r.promoted).toBe(true);
      expect(r.newLeague).toBe('C');
    });
    it('should not promote from league A', () => {
      const c: Championship = {
        id: 'c1', familyId: 'f1', childId: 'u', month: 1, year: 2026, league: 'A', status: 'active',
        teams: [], fixtures: [], currentRound: 4, createdAt: Timestamp.now(),
        standings: [{ teamId: 'u', teamName: 'U', isUser: true, played: 5, won: 5, drawn: 0, lost: 0, goalsFor: 15, goalsAgainst: 3, goalDifference: 12, points: 15, position: 1 }],
      };
      expect(processMonthEnd(c).promoted).toBe(false);
    });
  });
});
