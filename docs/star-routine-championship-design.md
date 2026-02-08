# Star Routine Championship System - Design Document

## Overview

Transform the Star Routine app from a star-based reward system to a football championship system. The child competes in monthly leagues (Série D → A), playing daily matches against simulated teams.

**Target User:** Vitor (9 years old, Atlético Mineiro fan)
**Theme:** Galo (already implemented)
**Platform:** React Native (Expo SDK 54)

---

## Phase 1: Data & Backend

### Task 1.1: Scrape Real Team Names
**Priority:** P0 (blocker for everything)
**Estimated:** 30 min

Create a script to collect football team names from public sources.

**Input:** None
**Output:** `/root/star-routine/assets/data/teams.json`

```json
{
  "lastUpdated": "2026-02-07",
  "teams": [
    { "id": "flamengo", "name": "Flamengo", "country": "BR" },
    { "id": "barcelona", "name": "Barcelona", "country": "ES" },
    ...
  ]
}
```

**Requirements:**
- Minimum 100 teams from diverse leagues
- Brazilian teams: Séries A, B, C (all)
- International: Top 5 European leagues
- EXCLUDE: Atlético Mineiro (Vitor's team)
- No logos or copyrighted content

**Implementation:**
1. Scrape Wikipedia "List of football clubs in Brazil"
2. Scrape Wikipedia European league pages
3. Clean and deduplicate
4. Save as static JSON asset

---

### Task 1.2: Update Firestore Schema
**Priority:** P0
**Estimated:** 45 min
**Depends on:** 1.1

Update the data model to support championships.

**New Collections/Documents:**

```typescript
// families/{familyId}/championships/{championshipId}
interface Championship {
  id: string;
  month: number;  // 1-12
  year: number;
  league: 'D' | 'C' | 'B' | 'A';
  status: 'active' | 'completed';
  teams: ChampionshipTeam[];
  standings: Standing[];
  createdAt: Timestamp;
  completedAt?: Timestamp;
  winnerId?: string;
}

interface ChampionshipTeam {
  id: string;
  name: string;
  isUser: boolean;
  profile: 'weak' | 'medium' | 'strong' | 'elite';
  // Simulation parameters
  winRate: number;      // 0.0 - 1.0
  avgGoals: number;     // 1-5
  variance: number;     // 0.0 - 1.0
}

interface Standing {
  teamId: string;
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

// families/{familyId}/matches/{matchId}
interface Match {
  id: string;
  championshipId: string;
  date: string;  // YYYY-MM-DD
  
  // User's match
  userGoals: number;
  opponentId: string;
  opponentName: string;
  opponentGoals: number;
  result: 'W' | 'D' | 'L';
  points: number;
  
  // Closure
  status: 'open' | 'closed';
  closedAt?: Timestamp;
  closedBy?: string;  // parent userId
  
  // Task breakdown
  routineGoalsCompleted: number;
  routineGoalsMissed: number;
  bonusGoalsCompleted: number;
}

// Update existing Task interface
interface Task {
  // ... existing fields ...
  goals: number;          // NEW: replaces stars concept
  taskType: 'routine' | 'bonus';  // NEW
}

// families/{familyId}/trophies/{trophyId}
interface Trophy {
  id: string;
  type: 'weekly' | 'championship';
  championshipId: string;
  week?: number;  // 1-4 for weekly
  league: 'D' | 'C' | 'B' | 'A';
  earnedAt: Timestamp;
}

// Update User/Child profile
interface ChildProfile {
  // ... existing fields ...
  currentLeague: 'D' | 'C' | 'B' | 'A';
  totalTrophies: number;
  championshipTitles: number;
}
```

**Migration:**
- Existing `stars` field → map to `goals` (1 star = 1 goal)
- All existing tasks default to `taskType: 'routine'`
- Set `currentLeague: 'D'` for all children

---

### Task 1.3: League Configuration Constants
**Priority:** P0
**Estimated:** 15 min

Create configuration file for league parameters.

**File:** `/root/star-routine/constants/leagueConfig.ts`

```typescript
export const LEAGUE_CONFIG = {
  D: {
    name: 'Série D',
    totalTeams: 8,
    strongTeams: 1,
    eliteTeams: 0,
    promotionSpots: 2,
    teamProfiles: {
      weak: { count: 4, winRate: 0.25, avgGoals: 1.5 },
      medium: { count: 2, winRate: 0.45, avgGoals: 2.5 },
      strong: { count: 1, winRate: 0.70, avgGoals: 3.5 },
    }
  },
  C: {
    name: 'Série C',
    totalTeams: 10,
    strongTeams: 2,
    eliteTeams: 0,
    promotionSpots: 2,
    teamProfiles: {
      weak: { count: 3, winRate: 0.25, avgGoals: 1.5 },
      medium: { count: 4, winRate: 0.50, avgGoals: 2.5 },
      strong: { count: 2, winRate: 0.72, avgGoals: 3.5 },
    }
  },
  B: {
    name: 'Série B',
    totalTeams: 12,
    strongTeams: 3,
    eliteTeams: 1,
    promotionSpots: 2,
    teamProfiles: {
      medium: { count: 7, winRate: 0.50, avgGoals: 2.5 },
      strong: { count: 3, winRate: 0.75, avgGoals: 3.5 },
      elite: { count: 1, winRate: 0.88, avgGoals: 4.5 },
    }
  },
  A: {
    name: 'Série A',
    totalTeams: 16,
    strongTeams: 4,
    eliteTeams: 3,
    promotionSpots: 0,  // Top league
    teamProfiles: {
      medium: { count: 8, winRate: 0.55, avgGoals: 3.0 },
      strong: { count: 4, winRate: 0.78, avgGoals: 4.0 },
      elite: { count: 3, winRate: 0.92, avgGoals: 5.0 },
    }
  }
};

export const POINTS = {
  WIN: 3,
  DRAW: 1,
  LOSS: 0,
};

export const AUTO_CLOSE_HOUR = 0;  // Midnight
```

---

### Task 1.4: Championship Service
**Priority:** P0
**Estimated:** 1 hour
**Depends on:** 1.1, 1.2, 1.3

Create service to manage championships.

**File:** `/root/star-routine/lib/services/championshipService.ts`

**Functions:**
```typescript
// Create new championship for the month
createChampionship(familyId: string, childId: string): Promise<Championship>

// Get current active championship
getCurrentChampionship(familyId: string): Promise<Championship | null>

// Generate fixtures for the month
generateFixtures(championship: Championship): Promise<void>

// Get today's opponent
getTodayOpponent(championshipId: string): Promise<ChampionshipTeam>

// Simulate other teams' matches for the day
simulateOtherMatches(championshipId: string, date: string): Promise<void>

// Update standings after a match
updateStandings(championshipId: string): Promise<Standing[]>

// Check and process promotions
processMonthEnd(championshipId: string): Promise<{promoted: boolean, newLeague?: string}>
```

---

### Task 1.5: Match Service
**Priority:** P0
**Estimated:** 45 min
**Depends on:** 1.4

Create service to manage daily matches.

**File:** `/root/star-routine/lib/services/matchService.ts`

**Functions:**
```typescript
// Get or create today's match
getTodayMatch(familyId: string): Promise<Match>

// Calculate user's goals from completed tasks
calculateUserGoals(familyId: string, date: string): Promise<{
  routineCompleted: number;
  routineMissed: number;
  bonusCompleted: number;
  total: number;
}>

// Simulate opponent's goals based on profile
simulateOpponentGoals(team: ChampionshipTeam): number

// Close the day (parent action)
closeDay(matchId: string, parentId: string): Promise<Match>

// Determine match result
determineResult(userGoals: number, opponentGoals: number): 'W' | 'D' | 'L'
```

---

## Phase 2: UI Components

### Task 2.1: Replace Stars with Soccer Balls
**Priority:** P1
**Estimated:** 30 min

Global find/replace of star icons with soccer ball.

**Changes:**
- `⭐` → `⚽` everywhere
- `GaloStarCounter` → `GaloGoalCounter`
- Update all star-related naming to goal-related
- Task cards show "⚽ × 2" instead of "★ × 2"

---

### Task 2.2: Rival Reveal Screen
**Priority:** P1
**Estimated:** 1 hour

Full-screen modal showing today's opponent.

**File:** `/root/star-routine/components/championship/RivalReveal.tsx`

**Design:**
```
┌─────────────────────────────────┐
│                                 │
│     🏟️ PARTIDA DE HOJE 🏟️      │
│                                 │
│         Você enfrenta:          │
│                                 │
│    ┌─────────────────────┐      │
│    │                     │      │
│    │   [Team Shield]     │      │
│    │                     │      │
│    │   FLAMENGO          │      │
│    │   ⚽⚽⚽⚽ (força)     │      │
│    │                     │      │
│    └─────────────────────┘      │
│                                 │
│        [ BORA JOGAR! ]          │
│                                 │
└─────────────────────────────────┘
```

**Animation:**
- Slide up from bottom
- Team name types in letter by letter
- Strength balls appear one by one
- Button pulses

---

### Task 2.3: Live Scoreboard Component
**Priority:** P1
**Estimated:** 45 min

Header component showing current match score.

**File:** `/root/star-routine/components/championship/LiveScoreboard.tsx`

**Design:**
```
┌─────────────────────────────────┐
│  VITOR  ⚽ 4 : 2 ⚽  FLAMENGO   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
└─────────────────────────────────┘
```

**Behavior:**
- Updates live when task is completed
- Opponent score shown after day closes (or simulated preview)
- Tap to expand match details

---

### Task 2.4: Updated Today Screen
**Priority:** P1
**Estimated:** 1.5 hours
**Depends on:** 2.1, 2.2, 2.3

Redesign the child's Today view.

**File:** `/root/star-routine/app/(child)/index.tsx`

**Layout:**
```
┌─────────────────────────────────┐
│  [Live Scoreboard]              │
├─────────────────────────────────┤
│  🐓 "Bora, Vitor!"              │
│                                 │
│  ── TAREFAS DE HOJE ──          │
│                                 │
│  ┌─────────────────────────┐    │
│  │ ☐ Fazer dever    ⚽×2   │    │
│  │    ROTINA               │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ ☐ Ler 20 páginas ⚽×2   │    │
│  │    BÔNUS                │    │
│  └─────────────────────────┘    │
│                                 │
│  ...                            │
├─────────────────────────────────┤
│ [Hoje] [Tabela] [Tarefas] [🏆] │
└─────────────────────────────────┘
```

**Features:**
- Show rival reveal on first open of the day
- Scoreboard always visible at top
- Tasks grouped: Routine first, then Bonus
- Visual distinction between routine/bonus
- Ball animation when completing task

---

### Task 2.5: League Table Screen
**Priority:** P1
**Estimated:** 1.5 hours
**Depends on:** 1.4

New tab showing full standings.

**File:** `/root/star-routine/app/(child)/table.tsx`

**Design:**
```
┌─────────────────────────────────┐
│  📊 SÉRIE D - FEV 2026          │
│  Rodada 2 de 4                  │
├─────────────────────────────────┤
│ Pos  Time           SG   Pts    │
│ ─────────────────────────────── │
│ 🟢1  Vitor ⭐       +8   9      │
│ 🟢2  Palmeiras      +5   7      │
│  3   Santos         +2   6      │
│  4   São Paulo      +1   4      │
│  5   Corinthians    -1   3      │
│  6   Fluminense     -3   3      │
│  7   Botafogo       -5   1      │
│  8   Vasco          -7   0      │
├─────────────────────────────────┤
│  🟢 = Zona de promoção          │
├─────────────────────────────────┤
│ [Hoje] [Tabela] [Tarefas] [🏆] │
└─────────────────────────────────┘
```

**Features:**
- Pull to refresh
- User row highlighted (gold background)
- Promotion zone marked green
- Tap row for team details
- Swipe left/right for full stats (P, V, E, D, GP, GC, SG, Pts)

---

### Task 2.6: Day Closure Flow
**Priority:** P1
**Estimated:** 2 hours
**Depends on:** 1.5, 2.3

Day closes automatically when parent reviews last task → animations → results.

**File:** `/root/star-routine/components/championship/DayClosureModal.tsx`

**Flow:**
1. Parent approves/rejects the last pending task of the day
2. System detects all tasks have been reviewed
3. Automatically triggers day closure:
   - Calculate final scores
   - Simulate opponent's match
   - Full-screen result animation
4. If parent doesn't review all tasks, auto-close at **midnight**

**Result Animation:**

**WIN:**
```
┌─────────────────────────────────┐
│                                 │
│         🎉 VITÓRIA! 🎉          │
│                                 │
│     VITOR  5 ⚽ 2  FLAMENGO     │
│                                 │
│         [Galo dancing]          │
│                                 │
│    📈 Subiu para 1º lugar!      │
│                                 │
│        [ VER TABELA ]           │
│                                 │
└─────────────────────────────────┘
```

**DRAW:**
```
┌─────────────────────────────────┐
│                                 │
│           EMPATE 🤝             │
│                                 │
│     VITOR  3 ⚽ 3  FLAMENGO     │
│                                 │
│       [Galo neutral]            │
│                                 │
│    → Manteve 2º lugar           │
│                                 │
│        [ VER TABELA ]           │
│                                 │
└─────────────────────────────────┘
```

**LOSS:**
```
┌─────────────────────────────────┐
│                                 │
│          DERROTA 😔             │
│                                 │
│     VITOR  1 ⚽ 4  FLAMENGO     │
│                                 │
│        [Galo sad]               │
│                                 │
│   "Amanhã a gente busca!"       │
│                                 │
│        [ VER TABELA ]           │
│                                 │
└─────────────────────────────────┘
```

---

### Task 2.7: Trophy Cabinet Screen
**Priority:** P2
**Estimated:** 1 hour

Display collected trophies and titles.

**File:** `/root/star-routine/app/(child)/trophies.tsx`

**Design:**
```
┌─────────────────────────────────┐
│  🏆 SALA DE TROFÉUS             │
├─────────────────────────────────┤
│  TÍTULOS                        │
│  ┌─────┐                        │
│  │ 🏆  │ Campeão Série D        │
│  │     │ Janeiro 2026           │
│  └─────┘                        │
├─────────────────────────────────┤
│  TROFÉUS SEMANAIS               │
│  🏆 🏆 🏆 ⬜ ⬜ ⬜ ⬜ ⬜ ...      │
│  Semana 1  Semana 2  ...        │
├─────────────────────────────────┤
│  ESTATÍSTICAS                   │
│  Vitórias: 23                   │
│  Gols marcados: 87              │
│  Maior goleada: 7 x 1           │
├─────────────────────────────────┤
│ [Hoje] [Tabela] [Tarefas] [🏆] │
└─────────────────────────────────┘
```

---

### Task 2.8: Task Creation Update (Parent)
**Priority:** P1
**Estimated:** 45 min

Update task creation to include goals and type.

**File:** `/root/star-routine/components/tasks/TaskForm.tsx`

**Changes:**
- Replace "Stars" picker with "Goals" picker (⚽ × 1, 2, 3...)
- Add "Task Type" toggle: Routine / Bonus
- Help text explaining the difference
- Default: Routine, 1 goal

---

### Task 2.9: Update Tab Navigation
**Priority:** P1
**Estimated:** 30 min

Update bottom tabs for child view.

**File:** `/root/star-routine/app/(child)/_layout.tsx`

**Tabs:**
1. **Hoje** (soccer ball icon) - Today's match
2. **Tabela** (list/table icon) - Standings
3. **Tarefas** (checkmark icon) - Tasks (parent only?)
4. **Troféus** (trophy icon) - Cabinet

---

## Phase 3: Integration & Polish

### Task 3.1: Championship Initialization Hook
**Priority:** P0
**Estimated:** 30 min
**Depends on:** Phase 1

Auto-create championship at month start.

**File:** `/root/star-routine/lib/hooks/useChampionship.ts`

**Behavior:**
- On app load, check if current month has championship
- If not, create one with appropriate teams
- Return current championship data

---

### Task 3.2: Real-time Score Updates
**Priority:** P1
**Estimated:** 45 min

Update score live when tasks are completed.

**Implementation:**
- Listen to task completion events
- Recalculate goals
- Update scoreboard component
- Small animation on goal scored

---

### Task 3.3: End-of-Month Processing
**Priority:** P1
**Estimated:** 1 hour

Handle month transition.

**Flow:**
1. Detect month change
2. Close any open matches
3. Calculate final standings
4. Award championship trophy to winner
5. Check promotion eligibility
6. Create new championship

---

### Task 3.4: Animations & Polish
**Priority:** P2
**Estimated:** 2 hours

Add engaging animations throughout.

**Animations to add:**
- Task completion: Ball flies into goal net
- Goal scored: Scoreboard number bounces
- Win: Confetti + Galo celebration
- Promotion: Fireworks + league badge upgrade
- Trophy earned: Trophy spins into cabinet

---

### Task 3.5: Testing
**Priority:** P0
**Estimated:** 1 hour

Test all flows via Puppeteer screenshots.

**Test scenarios:**
1. Fresh start (create championship)
2. Task completion (score update)
3. Day closure (all results)
4. Week end (trophy award)
5. Month end (promotion)
6. Table display (all positions)
7. Rival reveal animation
8. Parent task creation

---

## Implementation Order

```
Phase 1: Data & Backend (3.5 hours)
├── 1.1 Scrape teams (30 min)
├── 1.2 Firestore schema (45 min)
├── 1.3 League config (15 min)
├── 1.4 Championship service (1 hour)
└── 1.5 Match service (45 min)

Phase 2: UI Components (9 hours)
├── 2.1 Stars → Balls (30 min)
├── 2.2 Rival reveal (1 hour)
├── 2.3 Live scoreboard (45 min)
├── 2.4 Today screen (1.5 hours)
├── 2.5 League table (1.5 hours)
├── 2.6 Day closure (2 hours)
├── 2.7 Trophy cabinet (1 hour)
├── 2.8 Task creation (45 min)
└── 2.9 Tab navigation (30 min)

Phase 3: Integration (5 hours)
├── 3.1 Championship hook (30 min)
├── 3.2 Real-time updates (45 min)
├── 3.3 Month-end (1 hour)
├── 3.4 Animations (2 hours)
└── 3.5 Testing (1 hour)

TOTAL: ~17.5 hours
```

---

## Testing Checklist

- [ ] Championship created on first load
- [ ] Correct number of teams per league
- [ ] Rival reveal shows on day start
- [ ] Scoreboard updates on task completion
- [ ] Routine miss adds to opponent score
- [ ] Bonus miss has no penalty
- [ ] Day closure shows correct result
- [ ] Standings update correctly
- [ ] Promotion works at month end
- [ ] Trophies awarded correctly
- [ ] All screens render properly
- [ ] Dark theme consistent
- [ ] Galo mascot appears in celebrations

---

## Files to Create/Modify

**New Files:**
- `assets/data/teams.json`
- `constants/leagueConfig.ts`
- `lib/services/championshipService.ts`
- `lib/services/matchService.ts`
- `lib/hooks/useChampionship.ts`
- `lib/hooks/useMatch.ts`
- `components/championship/RivalReveal.tsx`
- `components/championship/LiveScoreboard.tsx`
- `components/championship/DayClosureModal.tsx`
- `components/championship/StandingsTable.tsx`
- `app/(child)/table.tsx`
- `app/(child)/trophies.tsx`
- `scripts/scrape-teams.js`

**Modified Files:**
- `components/tasks/GaloTaskCard.tsx` (stars → goals)
- `components/stars/GaloStarCounter.tsx` → `GaloGoalCounter.tsx`
- `app/(child)/index.tsx` (Today screen redesign)
- `app/(child)/_layout.tsx` (new tabs)
- `components/tasks/TaskForm.tsx` (add goals/type)
- `lib/hooks/useSubscriptions.ts` (add championship data)

---

## Success Criteria

1. ✅ Child sees daily opponent on app open
2. ✅ Live scoreboard shows current match state
3. ✅ Completing tasks adds goals to user's score
4. ✅ Missing routine tasks adds goals to opponent
5. ✅ Parent can close day and see result
6. ✅ Standings table shows all teams correctly
7. ✅ Weekly trophies awarded for 1st place
8. ✅ Month-end promotion works
9. ✅ Trophy cabinet displays achievements
10. ✅ All animations are smooth and engaging
11. ✅ Atlético Mineiro never appears as rival
