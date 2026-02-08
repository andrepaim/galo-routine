import { create } from 'zustand';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import type { Championship, Match, Trophy, Standing } from '../types/championship';
import { LeagueId } from '../../constants/leagueConfig';
import {
  createChampionship as fbCreateChampionship,
  updateChampionship,
  subscribeActiveChampionship,
  createMatch as fbCreateMatch,
  updateMatch,
  subscribeTodayMatch,
  getMatchForDate,
  createTrophy as fbCreateTrophy,
  subscribeTrophies,
} from '../firebase/firestore';
import {
  createChampionship as buildChampionship,
  getTodayOpponent,
  updateStandingsAfterMatch,
  simulateDayMatches,
  getUserPosition,
  sortStandings,
} from '../services/championshipService';
import {
  createMatch as buildMatch,
  calculateUserGoals,
  calculateOpponentGoals,
  determineResult,
  calculatePoints,
} from '../services/matchService';
import type { ChampionshipTask } from '../types/championship';

interface ChampionshipStore {
  // State
  championship: Championship | null;
  todayMatch: Match | null;
  trophies: Trophy[];
  isLoading: boolean;
  isMatchLoading: boolean;
  
  // Subscriptions
  subscribeChampionship: (familyId: string) => () => void;
  subscribeTodayMatch: (familyId: string, championshipId: string, dateStr: string) => () => void;
  subscribeTrophies: (familyId: string) => () => void;
  
  // Actions
  initializeChampionship: (
    familyId: string,
    childId: string,
    childName: string,
    league?: LeagueId
  ) => Promise<string>;
  
  ensureTodayMatch: (familyId: string, championshipId: string, dateStr: string) => Promise<Match>;
  
  updateUserGoals: (
    familyId: string,
    championshipId: string,
    matchId: string,
    goals: number
  ) => Promise<void>;
  
  closeDay: (
    familyId: string,
    championshipId: string,
    matchId: string,
    tasks: ChampionshipTask[],
    parentId: string
  ) => Promise<{ result: 'W' | 'D' | 'L'; newPosition: number }>;
  
  // Getters
  getUserStanding: () => Standing | null;
  getOpponentForToday: (dateStr: string) => { name: string; id: string } | null;
}

export const useChampionshipStore = create<ChampionshipStore>((set, get) => ({
  championship: null,
  todayMatch: null,
  trophies: [],
  isLoading: true,
  isMatchLoading: true,

  subscribeChampionship: (familyId: string) => {
    set({ isLoading: true });
    const unsubscribe = subscribeActiveChampionship(familyId, (championship) => {
      set({ championship, isLoading: false });
    });
    return unsubscribe;
  },

  subscribeTodayMatch: (familyId: string, championshipId: string, dateStr: string) => {
    set({ isMatchLoading: true });
    const unsubscribe = subscribeTodayMatch(familyId, championshipId, dateStr, (match) => {
      set({ todayMatch: match, isMatchLoading: false });
    });
    return unsubscribe;
  },

  subscribeTrophies: (familyId: string) => {
    const unsubscribe = subscribeTrophies(familyId, (trophies) => {
      set({ trophies });
    });
    return unsubscribe;
  },

  initializeChampionship: async (
    familyId: string,
    childId: string,
    childName: string,
    league: LeagueId = 'D'
  ) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    const champData = buildChampionship(familyId, childId, childName, league, year, month);
    const championshipId = await fbCreateChampionship(familyId, {
      ...champData,
      createdAt: Timestamp.now(),
    } as Omit<Championship, 'id'>);
    
    return championshipId;
  },

  ensureTodayMatch: async (familyId: string, championshipId: string, dateStr: string) => {
    // Check if match already exists
    const existingMatch = await getMatchForDate(familyId, championshipId, dateStr);
    if (existingMatch) {
      return existingMatch;
    }
    
    // Get championship to find opponent
    const { championship } = get();
    if (!championship) {
      throw new Error('No active championship');
    }
    
    const opponent = getTodayOpponent(championship, dateStr);
    if (!opponent) {
      throw new Error('No opponent scheduled for today');
    }
    
    // Calculate round (week of month)
    const day = parseInt(dateStr.split('-')[2], 10);
    const round = Math.ceil(day / 7);
    
    const matchData = buildMatch(championshipId, familyId, dateStr, round, opponent);
    const matchId = await fbCreateMatch(familyId, championshipId, matchData);
    
    return { id: matchId, ...matchData } as Match;
  },

  updateUserGoals: async (
    familyId: string,
    championshipId: string,
    matchId: string,
    goals: number
  ) => {
    await updateMatch(familyId, championshipId, matchId, {
      userGoals: goals,
      totalUserGoals: goals,
    });
  },

  closeDay: async (
    familyId: string,
    championshipId: string,
    matchId: string,
    tasks: ChampionshipTask[],
    parentId: string
  ) => {
    const { championship, todayMatch } = get();
    if (!championship || !todayMatch) {
      throw new Error('No active championship or match');
    }
    
    // Calculate final scores
    const userGoalsData = calculateUserGoals(tasks);
    const opponent = championship.teams.find(t => t.id === todayMatch.opponentId);
    if (!opponent) {
      throw new Error('Opponent not found');
    }
    
    const opponentGoals = calculateOpponentGoals(opponent, userGoalsData.routineMissed);
    const result = determineResult(userGoalsData.total, opponentGoals);
    const points = calculatePoints(result);
    
    // Update match
    await updateMatch(familyId, championshipId, matchId, {
      userGoals: userGoalsData.total,
      opponentGoals,
      result,
      points,
      status: 'closed',
      closedAt: Timestamp.now(),
      closedBy: parentId,
      routineGoalsCompleted: userGoalsData.routineCompleted,
      routineGoalsMissed: userGoalsData.routineMissed,
      bonusGoalsCompleted: userGoalsData.bonusCompleted,
      totalUserGoals: userGoalsData.total,
    });
    
    // Update championship standings
    const userId = championship.childId;
    let newStandings = updateStandingsAfterMatch(
      championship.standings,
      userId,
      todayMatch.opponentId,
      userGoalsData.total,
      opponentGoals
    );
    
    // Simulate AI matches for today
    const dateStr = todayMatch.date;
    const { fixtures: newFixtures, standings: aiStandings } = simulateDayMatches(
      { ...championship, standings: newStandings },
      dateStr,
      userId
    );
    
    // Mark user's fixture as played
    const updatedFixtures = newFixtures.map(f => {
      if (f.date === dateStr && (f.homeTeamId === userId || f.awayTeamId === userId)) {
        return {
          ...f,
          played: true,
          homeGoals: f.homeTeamId === userId ? userGoalsData.total : opponentGoals,
          awayGoals: f.awayTeamId === userId ? userGoalsData.total : opponentGoals,
        };
      }
      return f;
    });
    
    // Update championship with new standings and fixtures
    await updateChampionship(familyId, championshipId, {
      standings: aiStandings,
      fixtures: updatedFixtures,
    });
    
    const newPosition = getUserPosition(aiStandings, userId);
    
    return { result, newPosition };
  },

  getUserStanding: () => {
    const { championship } = get();
    if (!championship) return null;
    return championship.standings.find(s => s.teamId === championship.childId) || null;
  },

  getOpponentForToday: (dateStr: string) => {
    const { championship } = get();
    if (!championship) return null;
    const opponent = getTodayOpponent(championship, dateStr);
    return opponent ? { name: opponent.name, id: opponent.id } : null;
  },
}));
