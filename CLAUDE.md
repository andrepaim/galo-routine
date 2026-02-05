# Star Routine

A parent-child task & reward app built with Expo (SDK 54), React Native, Firebase, and Zustand.

## Commands
- `npx expo start --tunnel` — start Expo dev server with tunnel (tested on physical device via Expo Go)
- `npx tsc --noEmit` — type-check (no test suite yet)
- Cloud functions: `cd functions && npm run build && npm run deploy`

## Architecture

### Routing (Expo Router)
File-based routing with three groups:
- `app/(auth)/` — login, register, child-pin (no auth required)
- `app/(parent)/` — tab layout: home, tasks/, periods/, approvals, rewards/, goals, analytics, settings
- `app/(child)/` — tab layout: today, tasks, stars, shop, badges, profile

Auth gate in `app/_layout.tsx` redirects based on `role` (parent/child/null).

### State (Zustand)
Seven stores in `lib/stores/`:
- `authStore` — auth state, role, family data (persists role via expo-secure-store)
- `taskStore` — tasks CRUD + batch creation + real-time Firestore subscription
- `periodStore` — periods, active period, completion logic
- `completionStore` — task completions (pending/approved/rejected), star balance increment on approval
- `rewardStore` — rewards CRUD, redemptions, star balance deduction on redemption
- `goalStore` — long-term goals CRUD
- `badgeStore` — earned badges tracking

Stores use Firestore `onSnapshot()` for real-time sync. Subscriptions set up in `lib/hooks/useSubscriptions.ts`, called from root layout's `DataSubscriptions` component. Family document is also subscribed for real-time balance/streak updates.

### Firebase
- **Auth**: single account per family; child uses PIN stored as hash
- **Firestore collections** under `families/{familyId}/`:
  - `tasks` — task definitions with categories and scheduling
  - `periods/{periodId}/completions` — task completion records
  - `rewards` — reward definitions (shop items)
  - `redemptions` — reward redemption records
  - `goals` — long-term star goals
  - `earnedBadges` — badge awards
  - `streakFreezes` — streak freeze records
- **Cloud Functions** (`functions/src/index.ts`):
  - `autoRollPeriods` — daily cron at midnight, auto-completes expired periods + creates new ones
  - `onCompletionWrite` — trigger that recalculates period star counts, handles bonus stars, streak updates, and badge awards
  - `dailyStreakCheck` — daily cron at 11 PM, resets broken streaks

### Key types (`lib/types/index.ts`)
- `Family` / `FamilySettings` — family config, thresholds, bonus settings, streak settings, notification settings
- `Task` / `TaskRecurrence` — tasks with daily/specific_days/once recurrence, categories, time scheduling
- `Period` / `PeriodThresholds` — time periods with star budgets and reward/penalty zones
- `TaskCompletion` — pending → approved/rejected flow with on-time bonus and proof fields
- `Reward` / `Redemption` — shop rewards with star costs and approval flow
- `LongTermGoal` — lifetime star goals with deadlines
- `Badge` / `EarnedBadge` — achievement badges (milestone, consistency, category)
- `StreakFreeze` / `StreakMilestone` — streak tracking helpers
- `TaskCategory` / `TaskTemplate` — category system and task templates
- `StarProgress` — computed: earned/pending/budget percentages + zone flags

## Conventions
- **Named exports** for components (`export function TaskCard`), **default exports** for route screens
- **PascalCase** files for components, **camelCase** for hooks/utils/stores
- `import type { X }` for type-only imports
- All colors from `constants/colors.ts`, all spacing from `constants/layout.ts` — no hardcoded values
- Styles via `StyleSheet.create()`, gap-based flexbox layout
- Animations via `react-native-reanimated` (layout animations + shared values)
- UI components from `react-native-paper` (Material Design 3)

## Key directories
| Directory | Purpose |
|-----------|---------|
| `components/stars/` | StarBudgetRing, StarCounter, StarDisplay |
| `components/tasks/` | TaskCard, ChildTaskCard, ApprovalCard, TaskForm, TemplateSelector |
| `components/rewards/` | RewardCard, RewardForm |
| `components/timeline/` | TimelineView, FocusModeCard |
| `components/badges/` | BadgeGrid |
| `components/goals/` | GoalCard |
| `components/streaks/` | StreakDisplay |
| `lib/hooks/` | useCurrentPeriod, useTodayTasks, useStarBudget, useStarBudgetSync, useSubscriptions |
| `lib/utils/` | starCalculations, recurrence, periodUtils, pin, time |
| `lib/firebase/` | config, auth, firestore |
| `constants/` | colors, layout, defaults (categories, badges, templates, milestones), theme |

## Feature status (2026-02-05)

### Web Testing Setup
- **Expo Web** running at localhost:8081 (`npx expo start --web`)
- **Puppeteer** for automated browser testing (scripts in `scripts/`)
- **Test screenshots** saved to `test-screenshots/`
- Start expo in screen: `screen -dmS expo bash -c 'cd /root/star-routine && npx expo start --web --port 8081'`

### Bugs Fixed (2026-02-05)
1. **expo-secure-store web compatibility** — Created `lib/utils/storage.ts` for cross-platform storage (SecureStore on native, AsyncStorage on web)
2. **Login page navigation** — Replaced Button with Link component for "Create Family Account" navigation

### Runtime-tested on Web (2026-02-05)
- ✅ Auth flow (register, login)
- ✅ Parent Dashboard
- ✅ Task Management page
- ✅ Rewards System
- ✅ Approvals page
- ✅ Goals page
- ✅ Analytics page
- ✅ Settings page
- ✅ Periods page

### Code-complete (not runtime-tested on native)
- **Phase 2**: Star system & thresholds (animated rings, counters, cards)
- **Feature 1**: Rewards CRUD & shop (parent CRUD, child shop with redemptions)
- **Feature 2**: Timeline view & focus mode (components created, integrated in child tasks)
- **Feature 3**: Cumulative points & long-term goals (star balance, lifetime counter, goals screen)
- **Feature 4**: Task templates (19 predefined templates, bulk creation)
- **Feature 5**: Notifications (settings UI only, no expo-notifications integration yet)
- **Feature 6**: Streaks & consistency bonuses (display, cloud function tracking, freezes)
- **Feature 7**: Achievement badges (badge grid, cloud function awarding)
- **Feature 8**: Task categories/tags (9 predefined categories, color stripes)
- **Feature 9**: Parent analytics dashboard (overview card, category breakdown, task analysis)
- **Feature 10**: Bonus star mechanics (on-time, perfect day, early finish bonuses)
- **Feature 11**: Task completion proof (fields added, no photo picker yet)
- **Feature 12**: Child profile (avatar picker, accent color, stats)

### Not yet implemented
- Push notifications via expo-notifications
- Photo picker for task completion proof
- Custom category creation
- Early finish bonus check in cloud functions
