// League configuration for the championship system
// Each league (Série) has different difficulty levels

export type LeagueId = 'D' | 'C' | 'B' | 'A';
export type TeamProfile = 'weak' | 'medium' | 'strong' | 'elite';

export interface TeamProfileConfig {
  count: number;
  winRate: number;      // 0.0 - 1.0 probability of winning a match
  avgGoals: number;     // Average goals scored per match
  variance: number;     // Goal variance (0.0 - 1.0)
}

export interface LeagueConfig {
  name: string;
  totalTeams: number;
  promotionSpots: number;
  teamProfiles: Partial<Record<TeamProfile, TeamProfileConfig>>;
}

export const LEAGUE_CONFIG: Record<LeagueId, LeagueConfig> = {
  D: {
    name: 'Série D',
    totalTeams: 8,
    promotionSpots: 2,
    teamProfiles: {
      weak: { count: 4, winRate: 0.25, avgGoals: 1.5, variance: 0.3 },
      medium: { count: 2, winRate: 0.45, avgGoals: 2.5, variance: 0.4 },
      strong: { count: 1, winRate: 0.70, avgGoals: 3.5, variance: 0.3 },
    }
  },
  C: {
    name: 'Série C',
    totalTeams: 10,
    promotionSpots: 2,
    teamProfiles: {
      weak: { count: 3, winRate: 0.25, avgGoals: 1.5, variance: 0.3 },
      medium: { count: 4, winRate: 0.50, avgGoals: 2.5, variance: 0.4 },
      strong: { count: 2, winRate: 0.72, avgGoals: 3.5, variance: 0.3 },
    }
  },
  B: {
    name: 'Série B',
    totalTeams: 12,
    promotionSpots: 2,
    teamProfiles: {
      medium: { count: 7, winRate: 0.50, avgGoals: 2.5, variance: 0.4 },
      strong: { count: 3, winRate: 0.75, avgGoals: 3.5, variance: 0.3 },
      elite: { count: 1, winRate: 0.88, avgGoals: 4.5, variance: 0.2 },
    }
  },
  A: {
    name: 'Série A',
    totalTeams: 16,
    promotionSpots: 0, // Top league - no promotion
    teamProfiles: {
      medium: { count: 8, winRate: 0.55, avgGoals: 3.0, variance: 0.4 },
      strong: { count: 4, winRate: 0.78, avgGoals: 4.0, variance: 0.3 },
      elite: { count: 3, winRate: 0.92, avgGoals: 5.0, variance: 0.2 },
    }
  }
};

// Points system
export const POINTS = {
  WIN: 3,
  DRAW: 1,
  LOSS: 0,
} as const;

// Auto-close day at midnight if parent hasn't reviewed all tasks
export const AUTO_CLOSE_HOUR = 0;

// League display info
export const LEAGUE_DISPLAY: Record<LeagueId, { emoji: string; color: string }> = {
  D: { emoji: '🏟️', color: '#8B4513' },  // Bronze
  C: { emoji: '🏟️', color: '#C0C0C0' },  // Silver
  B: { emoji: '🏟️', color: '#FFD700' },  // Gold
  A: { emoji: '🏆', color: '#E5E4E2' },  // Platinum
};

// Get next league for promotion
export function getNextLeague(current: LeagueId): LeagueId | null {
  const order: LeagueId[] = ['D', 'C', 'B', 'A'];
  const idx = order.indexOf(current);
  if (idx === -1 || idx >= order.length - 1) return null;
  return order[idx + 1];
}

// Check if team qualifies for promotion (top 2)
export function qualifiesForPromotion(position: number, league: LeagueId): boolean {
  if (league === 'A') return false; // Already at top
  return position <= LEAGUE_CONFIG[league].promotionSpots;
}
