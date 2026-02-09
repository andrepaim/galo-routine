# Galo Routine

A parent-child task & reward app built with Expo (SDK 54), React Native, Firebase, and Zustand.

## Commands
- `npx expo start --tunnel` — start Expo dev server with tunnel (tested on physical device via Expo Go)
- `npx expo start --web` — start Expo web dev server
- `npx tsc --noEmit` — type-check
- `npx jest` — run unit tests (Jest + jest-expo)
- `node scripts/e2e-tests.mjs` — run E2E tests (requires Expo web running on port 8081)
- Cloud functions: `cd functions && npm run build && npm run deploy`

## Testing

### Unit Tests
- `npx jest` — run all unit tests
- `npx jest --coverage` — with coverage report

### E2E Tests (Web — Playwright)
- Start Expo web first: `npx expo start --web --port 8081`
- Run E2E suite: `node scripts/e2e-tests.mjs`
- Screenshots saved to `test-screenshots/e2e/`
- Uses Playwright headless browser against dev mode URLs (`?dev=parent`, `?dev=child`)

### E2E Tests (Android — adb)
- Requires: Android emulator with Expo Go, app loaded, logged in as parent
- Run: `CHILD_PIN=0412 bash scripts/android-e2e-tests.sh`
- Screenshots saved to `test-screenshots/android/`
- 19 suites covering all parent/child screens, role switching, PIN auth, terminology audit
- Full docs: `docs/android-e2e-tests.md`

### Before Pushing a Feature Branch
1. `npx tsc --noEmit` — type-check passes
2. `npx jest` — unit tests pass
3. `node scripts/e2e-tests.mjs` — E2E tests pass (with Expo web running)

### When Adding New Features
- Add unit tests in `__tests__/` directories alongside the code
- **Update `scripts/e2e-tests.mjs`** to cover the new screen/feature:
  - Add navigation to the new route
  - Add text assertions for key labels
  - Add screenshot capture
  - Verify no regressions in existing features

## Architecture

### Routing (Expo Router)
File-based routing with three groups:
- `app/(auth)/` — login, register, child-pin (no auth required)
- `app/(parent)/` — tab layout: home, tasks/, periods/, approvals, rewards/, goals, analytics, settings
- `app/(child)/` — tab layout: today, tasks, championship (Meu Campeonato), shop, table, trophies, badges (hidden), profile

Auth gate in `app/_layout.tsx` redirects based on `role` (parent/child/null).

### State (Zustand)
Eight stores in `lib/stores/`:
- `authStore` — auth state, role, family data (persists role via expo-secure-store)
- `taskStore` — tasks CRUD + batch creation + real-time Firestore subscription
- `periodStore` — periods, active period, completion logic
- `completionStore` — task completions (pending/approved/rejected), goal balance increment on approval
- `rewardStore` — rewards CRUD, redemptions, goal balance deduction on redemption
- `goalStore` — long-term goals CRUD
- `badgeStore` — earned badges tracking
- `championshipStore` — championship state, matches, trophies, day closure logic

Stores use Firestore `onSnapshot()` for real-time sync. Subscriptions set up in `lib/hooks/useSubscriptions.ts`, called from root layout's `DataSubscriptions` component. Family document is also subscribed for real-time balance/streak updates.

### Firebase
- **Auth**: single account per family; child uses PIN stored as hash
- **Firestore collections** under `families/{familyId}/`:
  - `tasks` — task definitions with categories and scheduling
  - `periods/{periodId}/completions` — task completion records
  - `rewards` — reward definitions (shop items)
  - `redemptions` — reward redemption records
  - `goals` — long-term goal targets
  - `earnedBadges` — badge awards
  - `streakFreezes` — streak freeze records
  - `championships` — monthly championship documents (teams, standings, fixtures)
  - `championships/{championshipId}/matches` — daily match records
  - `trophies` — earned trophies (weekly and championship)
- **Cloud Functions** (`functions/src/index.ts`):
  - `autoRollPeriods` — daily cron at midnight, auto-completes expired periods + creates new ones
  - `onCompletionWrite` — trigger that recalculates period goal counts, handles bonus goals, streak updates, and badge awards
  - `dailyStreakCheck` — daily cron at 11 PM, resets broken streaks
  - `autoCloseDayMatches` — daily cron at midnight UTC, auto-closes open championship matches

### Key types
- `lib/types/index.ts` — core types:
  - `Family` / `FamilySettings` — family config, thresholds, bonus settings, streak settings, notification settings
  - `Task` / `TaskRecurrence` — tasks with daily/specific_days/once recurrence, categories, time scheduling, taskType (routine/bonus)
  - `Period` / `PeriodThresholds` — time periods with goal budgets and reward/penalty zones
  - `TaskCompletion` — pending → approved/rejected flow with on-time bonus and proof fields
  - `Reward` / `Redemption` — shop rewards with goal costs and approval flow
  - `LongTermGoal` — lifetime goal targets with deadlines
  - `Badge` / `EarnedBadge` — achievement badges (milestone, consistency, category)
  - `StreakFreeze` / `StreakMilestone` — streak tracking helpers
  - `TaskCategory` / `TaskTemplate` — category system and task templates
  - `GoalProgress` — computed: earned/pending/budget percentages + zone flags
- `lib/types/championship.ts` — championship types:
  - `Championship` — monthly league with teams, standings, fixtures
  - `ChampionshipTeam` — simulated or user team with profile parameters
  - `Standing` — league table row (points, wins, goals, etc.)
  - `Fixture` — scheduled match in round-robin
  - `Match` — daily user match with goals breakdown and closure state
  - `Trophy` — weekly or championship trophy earned
  - `ChampionshipTask` — task mapped to championship goals
  - `MatchResult` — result data for animations

### Services (`lib/services/`)
- `championshipService.ts` — championship creation, team generation, fixture scheduling, standings management, AI match simulation, promotion logic
- `matchService.ts` — user goal calculation from tasks, opponent goal simulation, result determination, score formatting, Portuguese result messages

## Conventions
- **Named exports** for components (`export function TaskCard`), **default exports** for route screens
- **PascalCase** files for components, **camelCase** for hooks/utils/stores
- `import type { X }` for type-only imports
- All colors from `constants/colors.ts`, all spacing from `constants/layout.ts` — no hardcoded values
- Styles via `StyleSheet.create()`, gap-based flexbox layout
- Animations via `react-native-reanimated` (layout animations + shared values)
- UI components from `react-native-paper` (Material Design 3)
- App language is **Portuguese (pt-BR)** for all user-facing text

## Key directories
| Directory | Purpose |
|-----------|---------|
| `components/stars/` | StarBudgetRing (GoalProgress ring), StarCounter, StarDisplay, GaloStarCounter (Gols do Dia) |
| `components/tasks/` | TaskCard, ChildTaskCard, GaloTaskCard, ApprovalCard, TaskForm, TemplateSelector |
| `components/rewards/` | RewardCard, RewardForm |
| `components/timeline/` | TimelineView, FocusModeCard |
| `components/badges/` | BadgeGrid |
| `components/goals/` | GoalCard |
| `components/streaks/` | StreakDisplay |
| `components/periods/` | PeriodSummary |
| `components/championship/` | StandingsTable, LiveScoreboard, RivalReveal, GaloGoalCounter, DayClosureModal |
| `components/ui/` | AnimatedPressable, CelebrationOverlay, EmptyState, LoadingScreen, SkeletonLoader, TimePicker |
| `lib/hooks/` | useCurrentPeriod, useTodayTasks, useGoalBudget, useGoalBudgetSync, useSubscriptions, useChampionship, useMatch (+ useMatchSync) |
| `lib/utils/` | goalCalculations, recurrence, periodUtils, pin, time, storage |
| `lib/services/` | championshipService, matchService |
| `lib/firebase/` | config, auth, firestore |
| `constants/` | colors, layout, defaults, theme, childTheme, leagueConfig, index |
| `assets/images/mascot/` | Galo mascot images (galo-doido, galo-volpi, galo-shield variants) |
| `assets/data/` | teams.json (team names for championship simulation) |

## Championship System

Football-themed gamification where task completion translates into "goals" in a simulated league:

### Concept
- Monthly championships with round-robin fixtures
- Child's team competes against AI-simulated teams
- Completing tasks = scoring goals; missing routine tasks = opponent bonus goals
- Daily match closure by parent triggers result calculation + AI simulation
- League table with standings, win/draw/loss tracking
- Promotion system: Série D → C → B → A (top 2 qualify)

### League Structure (`constants/leagueConfig.ts`)
- **Série D**: 8 teams (4 weak, 2 medium, 1 strong) — entry league
- **Série C**: 10 teams (3 weak, 4 medium, 2 strong)
- **Série B**: 12 teams (7 medium, 3 strong, 1 elite)
- **Série A**: 16 teams (8 medium, 4 strong, 3 elite) — top league, no promotion
- Points: Win=3, Draw=1, Loss=0

### Child Theme (`constants/childTheme.ts`)
- Atlético Mineiro "Galo" inspired: black, white, gold palette
- `ChildColors`, `ChildGradients`, `ChildSizes` constants
- Galo mascot imagery throughout child UI

## Feature status (2026-02-08)

### Web Testing Setup
- **Expo Web** running at localhost:8081 (`npx expo start --web`)
- **Playwright** for E2E tests (`scripts/e2e-tests.mjs`) — primary test runner
- **Puppeteer** for legacy screenshot scripts (`scripts/screenshot-*.mjs`)
- **Test screenshots** saved to `test-screenshots/`
- Start expo in screen: `screen -dmS expo bash -c 'cd /home/andrepaim/src/star-routine && npx expo start --web --port 8081'`

### Bugs Fixed (2026-02-05)
1. **expo-secure-store web compatibility** — Created `lib/utils/storage.ts` for cross-platform storage (SecureStore on native, AsyncStorage on web)
2. **Login page navigation** — Replaced Button with Link component for "Create Family Account" navigation

### Runtime-tested on Web (2026-02-05)
- Auth flow (register, login)
- Parent Dashboard
- Task Management page
- Rewards System
- Approvals page
- Goals page
- Analytics page
- Settings page
- Periods page

### Code-complete (not runtime-tested on native)
- **Phase 2**: Goal system & thresholds (animated rings, counters, cards)
- **Feature 1**: Rewards CRUD & shop (parent CRUD, child shop with redemptions)
- **Feature 2**: Timeline view & focus mode (components created, integrated in child tasks)
- **Feature 3**: Cumulative points & long-term goals (goal balance, lifetime counter, goals screen)
- **Feature 4**: Task templates (19 predefined templates, bulk creation)
- **Feature 5**: Notifications (settings UI only, no expo-notifications integration yet)
- **Feature 6**: Streaks & consistency bonuses (display, cloud function tracking, freezes)
- **Feature 7**: Achievement badges (badge grid, cloud function awarding)
- **Feature 8**: Task categories/tags (9 predefined categories, color stripes)
- **Feature 9**: Parent analytics dashboard (overview card, category breakdown, task analysis)
- **Feature 10**: Bonus goal mechanics (on-time, perfect day, early finish bonuses)
- **Feature 11**: Task completion proof (fields added, no photo picker yet)
- **Feature 12**: Child profile (avatar picker, accent color, stats)
- **Feature 13**: Championship system (monthly leagues, AI teams, daily matches, standings table, trophies, day closure, Galo theme)

### Not yet implemented
- Push notifications via expo-notifications
- Photo picker for task completion proof
- Custom category creation
- Early finish bonus check in cloud functions
- Championship promotion/relegation automation at month end
- Championship cloud function for auto-closing days (added `autoCloseDayMatches` in functions)
