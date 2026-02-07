import { POINTS } from '../../constants/leagueConfig';
import { Match, ChampionshipTask, MatchResult } from '../types/championship';
import { simulateOpponentGoals } from './championshipService';
import { ChampionshipTeam } from '../types/championship';

// Calculate user's goals from today's tasks
export function calculateUserGoals(tasks: ChampionshipTask[]): {
  routineCompleted: number;
  routineMissed: number;
  bonusCompleted: number;
  total: number;
} {
  let routineCompleted = 0;
  let routineMissed = 0;
  let bonusCompleted = 0;
  
  for (const task of tasks) {
    if (task.taskType === 'routine') {
      if (task.completed) {
        routineCompleted += task.goals;
      } else {
        routineMissed += task.goals;
      }
    } else if (task.taskType === 'bonus' && task.completed) {
      bonusCompleted += task.goals;
    }
  }
  
  return {
    routineCompleted,
    routineMissed,
    bonusCompleted,
    total: routineCompleted + bonusCompleted,
  };
}

// Calculate opponent's total goals (simulated + user's missed routine)
export function calculateOpponentGoals(
  opponent: ChampionshipTeam,
  missedRoutineGoals: number
): number {
  const simulatedGoals = simulateOpponentGoals(opponent);
  return simulatedGoals + missedRoutineGoals;
}

// Determine match result
export function determineResult(
  userGoals: number, 
  opponentGoals: number
): 'W' | 'D' | 'L' {
  if (userGoals > opponentGoals) return 'W';
  if (userGoals === opponentGoals) return 'D';
  return 'L';
}

// Calculate points from result
export function calculatePoints(result: 'W' | 'D' | 'L'): number {
  switch (result) {
    case 'W': return POINTS.WIN;
    case 'D': return POINTS.DRAW;
    case 'L': return POINTS.LOSS;
  }
}

// Close the day and calculate final result
export function closeMatch(
  tasks: ChampionshipTask[],
  opponent: ChampionshipTeam,
  previousPosition: number
): MatchResult {
  const userGoals = calculateUserGoals(tasks);
  const opponentGoals = calculateOpponentGoals(opponent, userGoals.routineMissed);
  const result = determineResult(userGoals.total, opponentGoals);
  const points = calculatePoints(result);
  
  // Position change will be calculated after updating standings
  // For now, return a placeholder
  return {
    userGoals: userGoals.total,
    opponentGoals,
    opponentName: opponent.name,
    result,
    points,
    previousPosition,
    newPosition: previousPosition, // Will be updated
    positionChange: 0,
  };
}

// Get result emoji
export function getResultEmoji(result: 'W' | 'D' | 'L'): string {
  switch (result) {
    case 'W': return '🎉';
    case 'D': return '🤝';
    case 'L': return '😔';
  }
}

// Get result text (Portuguese)
export function getResultText(result: 'W' | 'D' | 'L'): string {
  switch (result) {
    case 'W': return 'VITÓRIA!';
    case 'D': return 'EMPATE';
    case 'L': return 'DERROTA';
  }
}

// Get encouraging message based on result
export function getResultMessage(result: 'W' | 'D' | 'L', position: number): string {
  switch (result) {
    case 'W':
      if (position === 1) return '🥇 Você é o líder!';
      if (position <= 2) return '🔥 Na zona de promoção!';
      return '💪 Boa vitória!';
    case 'D':
      return '📊 Um ponto conquistado!';
    case 'L':
      return '💪 Amanhã a gente busca!';
  }
}

// Get position change text
export function getPositionChangeText(change: number): string {
  if (change > 0) return `📈 Subiu ${change} posição${change > 1 ? 'ões' : ''}!`;
  if (change < 0) return `📉 Caiu ${Math.abs(change)} posição${Math.abs(change) > 1 ? 'ões' : ''}`;
  return '➡️ Manteve a posição';
}

// Format score display
export function formatScore(userGoals: number, opponentGoals: number): string {
  return `${userGoals} ⚽ ${opponentGoals}`;
}

// Calculate live score (before day is closed)
export function calculateLiveScore(tasks: ChampionshipTask[]): {
  userGoals: number;
  pendingRoutine: number;
  potentialBonus: number;
} {
  let userGoals = 0;
  let pendingRoutine = 0;
  let potentialBonus = 0;
  
  for (const task of tasks) {
    if (task.completed) {
      userGoals += task.goals;
    } else if (task.taskType === 'routine') {
      pendingRoutine += task.goals;
    } else {
      potentialBonus += task.goals;
    }
  }
  
  return { userGoals, pendingRoutine, potentialBonus };
}

// Create a new match object
export function createMatch(
  championshipId: string,
  familyId: string,
  date: string,
  round: number,
  opponent: ChampionshipTeam
): Omit<Match, 'id'> {
  return {
    championshipId,
    familyId,
    date,
    round,
    userGoals: 0,
    opponentId: opponent.id,
    opponentName: opponent.name,
    opponentProfile: opponent.profile as any,
    opponentGoals: 0,
    result: null,
    points: 0,
    status: 'open',
    routineGoalsCompleted: 0,
    routineGoalsMissed: 0,
    bonusGoalsCompleted: 0,
    totalUserGoals: 0,
  };
}
