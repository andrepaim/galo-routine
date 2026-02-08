import { calculateUserGoals, determineResult, calculatePoints, closeMatch, getResultEmoji, getResultText, getResultMessage, getPositionChangeText, formatScore, calculateLiveScore, createMatch } from '../matchService';
import type { ChampionshipTask, ChampionshipTeam } from '../../types/championship';
import { POINTS } from '../../../constants/leagueConfig';
jest.mock('../championshipService', () => ({ simulateOpponentGoals: jest.fn().mockReturnValue(2) }));
describe('matchService', () => {
  it('calculateUserGoals completed', () => { const t: ChampionshipTask[] = [{ id: '1', name: 'T', goals: 2, taskType: 'routine', completed: true, scheduledDate: '2026-01-05' }]; expect(calculateUserGoals(t).total).toBe(2); });
  it('calculateUserGoals missed', () => { const t: ChampionshipTask[] = [{ id: '1', name: 'T', goals: 2, taskType: 'routine', completed: false, scheduledDate: '2026-01-05' }]; expect(calculateUserGoals(t).routineMissed).toBe(2); });
  it('calculateUserGoals bonus', () => { const t: ChampionshipTask[] = [{ id: '1', name: 'B', goals: 2, taskType: 'bonus', completed: true, scheduledDate: '2026-01-05' }]; expect(calculateUserGoals(t).bonusCompleted).toBe(2); });
  it('calculateUserGoals empty', () => { expect(calculateUserGoals([]).total).toBe(0); });
  it('determineResult', () => { expect(determineResult(3, 1)).toBe('W'); expect(determineResult(2, 2)).toBe('D'); expect(determineResult(1, 3)).toBe('L'); });
  it('calculatePoints', () => { expect(calculatePoints('W')).toBe(POINTS.WIN); expect(calculatePoints('D')).toBe(POINTS.DRAW); expect(calculatePoints('L')).toBe(POINTS.LOSS); });
  it('closeMatch', () => { const t: ChampionshipTask[] = [{ id: '1', name: 'T', goals: 3, taskType: 'routine', completed: true, scheduledDate: '2026-01-05' }]; const o: ChampionshipTeam = { id: 'o', name: 'O', isUser: false, profile: 'weak', winRate: 0.3, avgGoals: 1.5, variance: 0.3 }; expect(closeMatch(t, o, 3).userGoals).toBe(3); });
  it('display funcs differ', () => { expect(getResultEmoji('W')).not.toBe(getResultEmoji('L')); expect(getResultText('W')).not.toBe(getResultText('L')); expect(getResultMessage('W', 1).length).toBeGreaterThan(0); expect(getPositionChangeText(1)).not.toBe(getPositionChangeText(-1)); expect(formatScore(3, 1)).toContain('3'); });
  it('calculateLiveScore', () => { const t: ChampionshipTask[] = [{ id: '1', name: 'D', goals: 2, taskType: 'routine', completed: true, scheduledDate: '2026-01-05' }]; expect(calculateLiveScore(t).userGoals).toBe(2); expect(calculateLiveScore([]).userGoals).toBe(0); });
  it('createMatch', () => { const o: ChampionshipTeam = { id: 'o', name: 'O', isUser: false, profile: 'weak' }; const m = createMatch('c', 'f', '2026-01-05', 1, o); expect(m.status).toBe('open'); expect(m.result).toBeNull(); });
});
