# RFC-001: Task Score System (v2)

## 1. Title
**Task Score System – Goals, Daily Matches, Weekly Rounds, and Monthly Championships**

## 2. Status
Draft v2

## 3. Authors
Andre Lemos, Botler

## 4. Date
2026-02-07

---

## 5. Abstract

This RFC defines a gamified task management system using football (soccer) metaphors. Tasks earn "goals" (gols), each day is a "match," and each month is a "championship" (campeonato) in one of four leagues (Série D → A). Users compete against simulated teams in a full league table, with promotion based on final standings.

---

## 6. Motivation

Traditional task systems reward completion but fail to:
- Provide meaningful daily feedback
- Encourage consistency over time
- Create long-term progression

This system addresses these gaps through:
- **Daily matches** with clear win/draw/loss outcomes
- **League tables** where your position matters
- **Monthly championships** with promotion stakes
- **Simulated rivals** that create competitive pressure

The football metaphor is intentional—familiar, engaging, and naturally maps to productivity concepts.

---

## 7. Terminology

| Term | Definition |
|------|------------|
| **Task** | A unit of work scheduled for a specific day |
| **Goal (Gol)** | Points a task is worth (positive integer) |
| **Routine Task** | Required task; if incomplete, Rival scores its goals |
| **Bonus Task** | Optional task; only scores if completed, no penalty |
| **Match** | A single day's competition |
| **Your Team** | Represents completed tasks |
| **Rival Team** | The simulated opponent for that day's match |
| **Round (Rodada)** | One week of matches (7 days) |
| **Championship (Campeonato)** | One month of competition in a league |
| **League (Série)** | Division level (D, C, B, or A) |
| **Goal Difference (Saldo de Gols)** | Goals scored minus goals conceded |

---

## 8. Design Principles

1. **Immediate Feedback** — Know if you won or lost today
2. **Consistency Rewarded** — Monthly standings favor steady performance
3. **Goal Difference Matters** — Bonus tasks create separation from strong rivals
4. **Clear Progression** — Promote through leagues over months
5. **Immutability** — Results cannot be changed after the day closes

---

## 9. Task Scoring

### 9.1 Goals per Task

Each task MUST have a positive integer goal value assigned at creation.

**Reference scale (configurable):**
| Task Type | Goals |
|-----------|-------|
| Trivial | 1 |
| Standard | 2 |
| High-effort | 3+ |

### 9.2 Scoring Rules

For each task scheduled on Day D:

| Task Type | Completed | Not Completed |
|-----------|-----------|---------------|
| **Routine** | Your Team scores its goals | Rival Team scores its goals |
| **Bonus** | Your Team scores its goals | No goals scored |

- A task scores at most once
- Partial completion = zero goals
- Goal values are immutable after completion

### 9.3 Who Assigns Goals?

Parents configure goal values when creating tasks. The system MAY suggest values based on estimated duration or historical data.

---

## 10. Daily Match

### 10.1 Match Definition

Each calendar day is a match between:
- **Your Team** — representing completed tasks
- **Opponent** — a simulated team from the current league

### 10.2 Your Team Score Calculation

```
Your Team Goals = Σ (goals of completed routine tasks) + Σ (goals of completed bonus tasks)
Rival Penalty = Σ (goals of incomplete routine tasks)
```

Your Team's match score = Your Team Goals
Opponent's match score = Simulated based on opponent's strength profile + Rival Penalty

**Important:** Incomplete routine tasks ADD to the opponent's score, not subtract from yours.

### 10.3 Match Outcome

| Result | Condition | Points |
|--------|-----------|--------|
| **Win** | Your Goals > Opponent Goals | 3 |
| **Draw** | Your Goals = Opponent Goals | 1 |
| **Loss** | Your Goals < Opponent Goals | 0 |

### 10.4 Day Closure

- Day closes when **parent confirms the final task** (explicit action)
- This allows the child to see match result and updated table before sleeping
- Results are immutable after closure
- Rescheduling a task removes it from the current day's match
- If parent doesn't close the day, system auto-closes at **06:00 next day**

---

## 11. League Structure

### 11.1 Four Divisions

| League | Level | Teams | Strong Teams | Elite Teams | Others |
|--------|-------|-------|--------------|-------------|--------|
| **Série D** | Entry | 8 | 1 | 0 | 6 Weak/Medium |
| **Série C** | 2nd | 10 | 2 | 0 | 7 Weak/Medium |
| **Série B** | 3rd | 12 | 3 | 1 | 7 Medium |
| **Série A** | Top | 16 | 4 | 3 | 8 Medium/Strong |

Users start in **Série D**.

**Strong teams** make the league competitive. **Elite teams** (Série B/A only) are near-guaranteed winners that force goal difference battles.

### 11.2 Team Composition

Each league contains:
- **Your Team** (1)
- **Simulated Teams** (N-1)

Simulated teams have varied strength profiles:
- **Weak**: Often loses, low goal output
- **Medium**: Inconsistent, average goals
- **Strong**: Usually wins, good goal output
- **Elite**: Almost always wins, high goals (only in Série A)

### 11.3 Team Names

Simulated teams use real football club names for immersion:
- Names sourced from public data (see Section 18)
- Display only (no logos, crests, or affiliation)
- Names remain stable during a championship
- Atlético Mineiro is NEVER used as rival (that's Vitor's team!)

---

## 12. Weekly Round (Rodada)

### 12.1 Definition

Each week = 1 **Rodada** (round) of 7 matches.

### 12.2 Fixtures

- Your Team plays one match per day against a different opponent
- All simulated teams also play matches against each other (simulated)
- Full round-robin across the month

### 12.3 Weekly Trophy 🏆

If Your Team finishes **1st in the weekly round standings**, a symbolic trophy is awarded.

- Trophies are cosmetic/collectible
- They do NOT affect monthly standings directly
- One trophy per week maximum

---

## 13. Monthly Championship (Campeonato)

### 13.1 Definition

Each calendar month = 1 **Campeonato** in your current league.

All teams (Your Team + simulated) compete across ~4 weekly rounds.

### 13.2 League Table

Standings are determined by:

1. **Total Points** (primary)
2. **Goal Difference** (first tiebreaker)
3. **Goals Scored** (second tiebreaker)

The table updates after each match.

### 13.3 Monthly Champion

The team at **1st place** when the month ends wins the championship.

---

## 14. Promotion System

### 14.1 Promotion Rule

At month end, the **top 2 teams** in the standings are promoted to the next higher league.

| Current League | Promoted To |
|---------------|-------------|
| Série D | Série C |
| Série C | Série B |
| Série B | Série A |
| Série A | — (stay) |

### 14.2 No Relegation

This RFC does not define relegation. Users cannot drop to a lower league.

### 14.3 Série A Permanence

Once promoted to Série A, the user remains there permanently. The challenge becomes:
- Winning championships against elite simulated teams
- Collecting trophies and titles

---

## 15. Simulated Team Behavior

### 15.1 Strength Profiles

Each simulated team has parameters:

| Parameter | Description |
|-----------|-------------|
| `winRate` | Probability of winning a match |
| `avgGoals` | Average goals scored per match |
| `variance` | Goal output variability |
| `consistency` | How often they perform at expected level |

### 15.2 Example Profiles

| Profile | Win Rate | Avg Goals | Notes |
|---------|----------|-----------|-------|
| **Weak** | 20-35% | 1-2 | Loses often, easy points |
| **Medium** | 40-55% | 2-3 | Unpredictable |
| **Strong** | 65-80% | 3-4 | Tough opponent |
| **Elite** | 85-95% | 4-5 | Almost always wins |

### 15.3 Why Elite Teams Matter

Elite teams (Série A) are designed to almost always win. This makes **goal difference (saldo de gols)** critical:

- You likely can't beat them on points
- You CAN beat them on goal difference by completing bonus tasks
- Strategic bonus task completion = higher league position

---

## 16. Routine vs Bonus Tasks

### 16.1 Routine Tasks

- Represent daily obligations
- **MUST** be completed to avoid giving goals to opponent
- Define the baseline performance expectation

### 16.2 Bonus Tasks

- Optional extra tasks
- Score goals only for Your Team
- No penalty if incomplete
- **Strategic tool** for:
  - Improving goal difference
  - Competing against elite teams
  - Recovering from bad weeks

### 16.3 Example Day

| Task | Type | Goals | Completed? | Result |
|------|------|-------|------------|--------|
| Homework | Routine | 2 | ✅ | Your Team +2 |
| Clean room | Routine | 1 | ❌ | Opponent +1 |
| Read 20 pages | Bonus | 2 | ✅ | Your Team +2 |
| Practice piano | Bonus | 1 | ❌ | Nothing |

**Your Team: 4 goals** | **Opponent base: 1 goal** (+ their simulated score)

---

## 17. User Interface Specifications

### 17.1 Visual Theme

- **Icons:** Soccer balls (⚽) replace stars throughout the app
- **Colors:** Maintain Galo theme (black, white, gold accents)
- **Mascot:** Galo Volpi appears in celebrations

### 17.2 Daily Rival Presentation

When the day begins (or on first app open):
- **Full-screen rival reveal** with team name and crest placeholder
- Dramatic entrance animation (slide in, fade, etc.)
- Show rival's strength indicator (e.g., 1-5 soccer balls)
- Text: "Hoje você enfrenta: **[Team Name]**"
- Tap to dismiss → goes to task list

### 17.3 Live Match View (Today Screen)

- **Scoreboard header:** "Vitor 4 ⚽ 2 [Rival Name]"
- Live update as tasks are completed
- Task list below with:
  - Task name
  - Goal value (⚽ × N)
  - Completion checkbox
  - Routine vs Bonus indicator
- Visual feedback on task completion (ball goes in net animation)

### 17.4 Day Closure Animation

When parent confirms final task:
1. **Whistle sound** (optional)
2. **Final score display** — full screen, big numbers
3. **Match result animation:**
   - Win: Confetti + Galo celebrating + "VITÓRIA!"
   - Draw: Neutral animation + "EMPATE"
   - Loss: Sad Galo + "DERROTA" (but encouraging message)
4. **Table position update** — show movement (↑↓→)
5. **Tap to see full table**

### 17.5 League Table Screen

Classic football table format:

| Pos | Time | P | V | E | D | GP | GC | SG | Pts |
|-----|------|---|---|---|---|----|----|----|----|
| 1 | **Vitor** ⭐ | 5 | 4 | 1 | 0 | 15 | 5 | +10 | 13 |
| 2 | Flamengo | 5 | 3 | 1 | 1 | 12 | 8 | +4 | 10 |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

- Highlight Your Team row (gold background)
- **Promotion zone** (top 2) marked in green
- Tap team to see head-to-head history
- Pull to refresh

### 17.6 Progress & Achievements

- **Current league badge** prominently displayed
- **Monthly progress:** "Rodada 3 de 4"
- **Trophy cabinet:** Collection of weekly trophies 🏆
- **Championship titles:** Série D Champion 2026, etc.

### 17.7 Navigation

Bottom tabs:
1. **Hoje** (Today) — Daily match view
2. **Tabela** (Table) — League standings  
3. **Tarefas** (Tasks) — Task management (parent)
4. **Troféus** (Trophies) — Achievements cabinet

---

## 18. Real Team Names (Scraping)

### 18.1 Data Source

Team names are scraped from public sources:
- Wikipedia lists of football clubs
- Transfermarkt public pages
- Official league websites

### 18.2 Scraping Rules

- Respect `robots.txt` and rate limits
- Cache results locally (refresh monthly)
- Extract name only (no logos, stats, or player data)
- Include teams from multiple leagues for variety:
  - Brasileirão Séries A/B/C/D
  - Major European leagues (Premier League, La Liga, etc.)
  - South American leagues

### 18.3 Team Pool

Maintain a local JSON file with scraped teams:

```json
{
  "teams": [
    { "name": "Flamengo", "country": "BR", "league": "Série A" },
    { "name": "Barcelona", "country": "ES", "league": "La Liga" },
    { "name": "Manchester United", "country": "EN", "league": "Premier League" }
  ]
}
```

### 18.4 Exclusions

The following teams are NEVER used as rivals:
- **Atlético Mineiro** (user's team)
- Any team the user explicitly excludes (future feature)

### 18.5 Assignment

At championship start:
1. Randomly select N-1 teams from pool for the league
2. Assign strength profiles based on league requirements
3. Lock assignments for the month

---

## 19. Data Model (Summary)

```
Task {
  id, name, goals, type (routine|bonus), 
  scheduledDate, completed, completedAt
}

Match {
  date, opponentId, yourGoals, opponentGoals, 
  result (W|D|L), points
}

Team {
  id, name, profile (weak|medium|strong|elite),
  leagueId, isSimulated
}

Championship {
  id, month, year, leagueId, 
  standings[], winnerId
}

User {
  currentLeague, trophies[], titles[]
}
```

---

## 20. Edge Cases

| Scenario | Resolution |
|----------|------------|
| No tasks scheduled | N/A — system ensures daily tasks exist (routine tasks always present) |
| All tasks completed | Your Team scores max; opponent has only simulated score |
| No tasks completed | Opponent gets all routine goals + simulated score |
| Mid-day task reschedule | Task removed from current match |
| Parent forgets to close day | Auto-close at 06:00 next day |

---

## 21. Security & Integrity

- Task completion events are timestamped and immutable
- Scores are deterministic and reproducible
- Manual overrides (if any) must be logged
- Day closure is parent-triggered (with auto fallback)

---

## 22. Future Extensions (Out of Scope)

- Relegation system
- Head-to-head tiebreakers
- Streak bonuses / multipliers
- Social features / leaderboards
- Copa/knockout tournaments
- Custom team exclusion list

---

## 23. Conclusion

The Task Score System transforms daily productivity into a football championship experience. By competing against simulated teams in monthly leagues, users receive:

- **Daily motivation** through match outcomes
- **Weekly milestones** through trophy opportunities  
- **Monthly stakes** through promotion races
- **Long-term progression** through the league pyramid

The system is simple enough for a child to understand yet deep enough to remain engaging over months of use.

---

**End of RFC-001 v2**
