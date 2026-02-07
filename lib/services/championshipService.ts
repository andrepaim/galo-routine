import { 
  LEAGUE_CONFIG, 
  LeagueId, 
  TeamProfile,
  getNextLeague,
  qualifiesForPromotion,
  POINTS 
} from '../../constants/leagueConfig';
import { 
  Championship, 
  ChampionshipTeam, 
  Standing, 
  Fixture,
  Trophy 
} from '../types/championship';
import teamsData from '../../assets/data/teams.json';

// Get random teams from the pool
function getRandomTeams(count: number, exclude: string[] = []): { id: string; name: string }[] {
  const available = teamsData.teams.filter(t => !exclude.includes(t.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Generate simulated teams for a league
export function generateLeagueTeams(
  league: LeagueId, 
  userId: string,
  userName: string
): ChampionshipTeam[] {
  const config = LEAGUE_CONFIG[league];
  const teams: ChampionshipTeam[] = [];
  
  // Add user's team first
  teams.push({
    id: userId,
    name: userName,
    isUser: true,
    profile: 'user',
  });
  
  // Calculate how many simulated teams we need
  const simulatedCount = config.totalTeams - 1;
  const randomTeams = getRandomTeams(simulatedCount);
  
  // Distribute teams according to profile config
  let teamIndex = 0;
  const profiles: TeamProfile[] = ['weak', 'medium', 'strong', 'elite'];
  
  for (const profile of profiles) {
    const profileConfig = config.teamProfiles[profile];
    if (!profileConfig) continue;
    
    for (let i = 0; i < profileConfig.count && teamIndex < randomTeams.length; i++) {
      const team = randomTeams[teamIndex++];
      teams.push({
        id: team.id,
        name: team.name,
        isUser: false,
        profile,
        winRate: profileConfig.winRate,
        avgGoals: profileConfig.avgGoals,
        variance: profileConfig.variance,
      });
    }
  }
  
  return teams;
}

// Initialize standings for all teams
export function initializeStandings(teams: ChampionshipTeam[]): Standing[] {
  return teams.map((team, index) => ({
    teamId: team.id,
    teamName: team.name,
    isUser: team.isUser,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    position: index + 1,
  }));
}

// Sort standings by points, goal difference, goals scored
export function sortStandings(standings: Standing[]): Standing[] {
  const sorted = [...standings].sort((a, b) => {
    // First by points (descending)
    if (b.points !== a.points) return b.points - a.points;
    // Then by goal difference (descending)
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    // Then by goals scored (descending)
    return b.goalsFor - a.goalsFor;
  });
  
  // Update positions
  return sorted.map((s, i) => ({ ...s, position: i + 1 }));
}

// Generate fixtures for the month (round-robin style)
export function generateFixtures(
  teams: ChampionshipTeam[], 
  year: number, 
  month: number
): Fixture[] {
  const fixtures: Fixture[] = [];
  const numTeams = teams.length;
  
  // Get days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  
  // Simple round-robin: each team plays every other team once
  // We distribute matches across the month
  let fixtureId = 0;
  const allMatches: { home: string; away: string }[] = [];
  
  for (let i = 0; i < numTeams; i++) {
    for (let j = i + 1; j < numTeams; j++) {
      allMatches.push({ 
        home: teams[i].id, 
        away: teams[j].id 
      });
    }
  }
  
  // Shuffle matches
  allMatches.sort(() => Math.random() - 0.5);
  
  // Distribute across days (skip some days if needed)
  const matchesPerDay = Math.ceil(allMatches.length / daysInMonth);
  let day = 1;
  let round = 1;
  
  for (let i = 0; i < allMatches.length; i++) {
    const match = allMatches[i];
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    fixtures.push({
      id: `fixture-${fixtureId++}`,
      round: Math.ceil(day / 7), // Week number
      day,
      date: dateStr,
      homeTeamId: match.home,
      awayTeamId: match.away,
      played: false,
    });
    
    // Move to next day every few matches
    if ((i + 1) % matchesPerDay === 0) {
      day = Math.min(day + 1, daysInMonth);
    }
  }
  
  return fixtures;
}

// Simulate a match between two AI teams
export function simulateMatch(
  homeTeam: ChampionshipTeam,
  awayTeam: ChampionshipTeam
): { homeGoals: number; awayGoals: number } {
  const homeGoals = simulateGoals(homeTeam);
  const awayGoals = simulateGoals(awayTeam);
  return { homeGoals, awayGoals };
}

// Simulate goals for a team based on their profile
export function simulateGoals(team: ChampionshipTeam): number {
  if (team.isUser) return 0; // User goals are calculated from tasks
  
  const avg = team.avgGoals || 2;
  const variance = team.variance || 0.3;
  
  // Normal distribution approximation
  const randomFactor = 1 + (Math.random() - 0.5) * 2 * variance;
  const goals = Math.round(avg * randomFactor);
  
  return Math.max(0, goals);
}

// Simulate opponent's goals for user's daily match
export function simulateOpponentGoals(team: ChampionshipTeam): number {
  // Check if team wins this match (based on win rate)
  const wins = Math.random() < (team.winRate || 0.5);
  
  if (wins) {
    // If opponent "wins", they score more
    return simulateGoals(team) + Math.floor(Math.random() * 2) + 1;
  } else {
    // If opponent "loses", they score less
    return Math.max(0, simulateGoals(team) - Math.floor(Math.random() * 2));
  }
}

// Get today's opponent for the user
export function getTodayOpponent(
  championship: Championship,
  dateStr: string
): ChampionshipTeam | null {
  // Find today's fixture involving the user
  const userId = championship.childId;
  const fixture = championship.fixtures.find(
    f => f.date === dateStr && 
    (f.homeTeamId === userId || f.awayTeamId === userId) &&
    !f.played
  );
  
  if (!fixture) return null;
  
  const opponentId = fixture.homeTeamId === userId 
    ? fixture.awayTeamId 
    : fixture.homeTeamId;
    
  return championship.teams.find(t => t.id === opponentId) || null;
}

// Update standings after a match
export function updateStandingsAfterMatch(
  standings: Standing[],
  homeTeamId: string,
  awayTeamId: string,
  homeGoals: number,
  awayGoals: number
): Standing[] {
  const updated = standings.map(s => {
    if (s.teamId === homeTeamId) {
      const won = homeGoals > awayGoals;
      const drawn = homeGoals === awayGoals;
      const lost = homeGoals < awayGoals;
      return {
        ...s,
        played: s.played + 1,
        won: s.won + (won ? 1 : 0),
        drawn: s.drawn + (drawn ? 1 : 0),
        lost: s.lost + (lost ? 1 : 0),
        goalsFor: s.goalsFor + homeGoals,
        goalsAgainst: s.goalsAgainst + awayGoals,
        goalDifference: s.goalDifference + (homeGoals - awayGoals),
        points: s.points + (won ? POINTS.WIN : drawn ? POINTS.DRAW : POINTS.LOSS),
      };
    }
    if (s.teamId === awayTeamId) {
      const won = awayGoals > homeGoals;
      const drawn = awayGoals === homeGoals;
      const lost = awayGoals < homeGoals;
      return {
        ...s,
        played: s.played + 1,
        won: s.won + (won ? 1 : 0),
        drawn: s.drawn + (drawn ? 1 : 0),
        lost: s.lost + (lost ? 1 : 0),
        goalsFor: s.goalsFor + awayGoals,
        goalsAgainst: s.goalsAgainst + homeGoals,
        goalDifference: s.goalDifference + (awayGoals - homeGoals),
        points: s.points + (won ? POINTS.WIN : drawn ? POINTS.DRAW : POINTS.LOSS),
      };
    }
    return s;
  });
  
  return sortStandings(updated);
}

// Simulate all AI vs AI matches for a specific day
export function simulateDayMatches(
  championship: Championship,
  dateStr: string,
  userId: string
): { fixtures: Fixture[]; standings: Standing[] } {
  let { fixtures, standings } = championship;
  
  // Get all matches for this day that don't involve the user
  const dayFixtures = fixtures.filter(
    f => f.date === dateStr && 
    f.homeTeamId !== userId && 
    f.awayTeamId !== userId &&
    !f.played
  );
  
  for (const fixture of dayFixtures) {
    const homeTeam = championship.teams.find(t => t.id === fixture.homeTeamId);
    const awayTeam = championship.teams.find(t => t.id === fixture.awayTeamId);
    
    if (homeTeam && awayTeam) {
      const result = simulateMatch(homeTeam, awayTeam);
      
      // Update fixture
      fixtures = fixtures.map(f => 
        f.id === fixture.id 
          ? { ...f, homeGoals: result.homeGoals, awayGoals: result.awayGoals, played: true }
          : f
      );
      
      // Update standings
      standings = updateStandingsAfterMatch(
        standings,
        homeTeam.id,
        awayTeam.id,
        result.homeGoals,
        result.awayGoals
      );
    }
  }
  
  return { fixtures, standings };
}

// Check if user earned weekly trophy (1st place in the week)
export function checkWeeklyTrophy(
  standings: Standing[],
  userId: string,
  round: number
): boolean {
  const userStanding = standings.find(s => s.teamId === userId);
  return userStanding?.position === 1;
}

// Get user's position in standings
export function getUserPosition(standings: Standing[], userId: string): number {
  const userStanding = standings.find(s => s.teamId === userId);
  return userStanding?.position || standings.length;
}

// Create a new championship for the month
export function createChampionship(
  familyId: string,
  childId: string,
  childName: string,
  league: LeagueId,
  year: number,
  month: number
): Omit<Championship, 'id' | 'createdAt'> {
  const teams = generateLeagueTeams(league, childId, childName);
  const standings = initializeStandings(teams);
  const fixtures = generateFixtures(teams, year, month);
  
  return {
    familyId,
    childId,
    month,
    year,
    league,
    status: 'active',
    teams,
    standings,
    fixtures,
    currentRound: 1,
  };
}

// Process end of month: determine winner, check promotion
export function processMonthEnd(
  championship: Championship
): { 
  winnerId: string;
  winnerName: string;
  userPosition: number;
  promoted: boolean;
  newLeague: LeagueId | null;
} {
  const sortedStandings = sortStandings(championship.standings);
  const winner = sortedStandings[0];
  const userStanding = sortedStandings.find(s => s.teamId === championship.childId);
  const userPosition = userStanding?.position || sortedStandings.length;
  
  const promoted = qualifiesForPromotion(userPosition, championship.league);
  const newLeague = promoted ? getNextLeague(championship.league) : null;
  
  return {
    winnerId: winner.teamId,
    winnerName: winner.teamName,
    userPosition,
    promoted,
    newLeague,
  };
}
