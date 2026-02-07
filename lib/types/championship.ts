import { Timestamp } from 'firebase/firestore';
import { LeagueId, TeamProfile } from '@/constants/leagueConfig';

// Championship team (simulated or user)
export interface ChampionshipTeam {
  id: string;
  name: string;
  isUser: boolean;
  profile: TeamProfile | 'user';
  // Simulation parameters (only for simulated teams)
  winRate?: number;
  avgGoals?: number;
  variance?: number;
}

// Standing in the league table
export interface Standing {
  teamId: string;
  teamName: string;
  isUser: boolean;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
}

// Championship document (one per month)
export interface Championship {
  id: string;
  familyId: string;
  childId: string;
  month: number;       // 1-12
  year: number;
  league: LeagueId;
  status: 'active' | 'completed';
  teams: ChampionshipTeam[];
  standings: Standing[];
  fixtures: Fixture[];  // All matches for the month
  currentRound: number; // Current week (1-4)
  createdAt: Timestamp;
  completedAt?: Timestamp;
  winnerId?: string;
  userFinalPosition?: number;
}

// A scheduled match in the championship
export interface Fixture {
  id: string;
  round: number;       // Week number (1-4)
  day: number;         // Day of the month (1-31)
  date: string;        // YYYY-MM-DD
  homeTeamId: string;
  awayTeamId: string;
  homeGoals?: number;
  awayGoals?: number;
  played: boolean;
}

// Daily match (user's perspective)
export interface Match {
  id: string;
  championshipId: string;
  familyId: string;
  date: string;        // YYYY-MM-DD
  round: number;       // Week number
  
  // User's match
  userGoals: number;
  opponentId: string;
  opponentName: string;
  opponentProfile: TeamProfile;
  opponentGoals: number;
  result: 'W' | 'D' | 'L' | null;  // null = not closed yet
  points: number;
  
  // Closure
  status: 'open' | 'closed';
  closedAt?: Timestamp;
  closedBy?: string;  // parent userId
  
  // Task breakdown
  routineGoalsCompleted: number;
  routineGoalsMissed: number;
  bonusGoalsCompleted: number;
  totalUserGoals: number;
}

// Trophy earned
export interface Trophy {
  id: string;
  familyId: string;
  childId: string;
  type: 'weekly' | 'championship';
  championshipId: string;
  week?: number;       // 1-4 for weekly trophies
  league: LeagueId;
  earnedAt: Timestamp;
  title: string;       // Display title
}

// Extended task type with championship fields
export interface ChampionshipTask {
  id: string;
  name: string;
  goals: number;
  taskType: 'routine' | 'bonus';
  completed: boolean;
  completedAt?: Timestamp;
  scheduledDate: string;  // YYYY-MM-DD
}

// Child profile extension
export interface ChildChampionshipProfile {
  currentLeague: LeagueId;
  totalTrophies: number;
  weeklyTrophies: number;
  championshipTitles: number;
  totalWins: number;
  totalGoals: number;
  bestGoalDifference: number;
  promotions: number;
}

// Match result for animations
export interface MatchResult {
  userGoals: number;
  opponentGoals: number;
  opponentName: string;
  result: 'W' | 'D' | 'L';
  points: number;
  previousPosition: number;
  newPosition: number;
  positionChange: number;  // positive = moved up
}
