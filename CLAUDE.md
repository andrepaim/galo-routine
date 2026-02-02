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
- `app/(parent)/` — tab layout: home, tasks/, periods/, approvals, settings
- `app/(child)/` — today's tasks, all tasks, stars screen

Auth gate in `app/_layout.tsx` redirects based on `role` (parent/child/null).

### State (Zustand)
Four stores in `lib/stores/`:
- `authStore` — auth state, role, family data (persists role via expo-secure-store)
- `taskStore` — tasks CRUD + real-time Firestore subscription
- `periodStore` — periods, active period, completion logic
- `completionStore` — task completions (pending/approved/rejected)

Stores use Firestore `onSnapshot()` for real-time sync. Subscriptions set up in `lib/hooks/useSubscriptions.ts`, called from root layout's `DataSubscriptions` component.

### Firebase
- **Auth**: single account per family; child uses PIN stored as hash
- **Firestore**: `families/{familyId}/tasks`, `families/{familyId}/periods/{periodId}/completions`
- **Cloud Functions** (`functions/src/index.ts`):
  - `autoRollPeriods` — daily cron, auto-completes expired periods + creates new ones
  - `onCompletionWrite` — trigger that recalculates `starsEarned`/`starsPending` on period

### Key types (`lib/types/index.ts`)
- `Family` / `FamilySettings` — family config + thresholds
- `Task` / `TaskRecurrence` — tasks with daily/specific_days/once recurrence
- `Period` / `PeriodThresholds` — time periods with star budgets and reward/penalty zones
- `TaskCompletion` — pending → approved/rejected flow
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
| `components/tasks/` | TaskCard, ChildTaskCard, ApprovalCard, TaskForm |
| `lib/hooks/` | useCurrentPeriod, useTodayTasks, useStarBudget, useStarBudgetSync, useSubscriptions |
| `lib/utils/` | starCalculations, recurrence, periodUtils, pin |
| `lib/firebase/` | config, auth, firestore |
| `constants/` | colors, layout, defaults, theme |

## Current status (2026-02-01)
Phase 2 (Star System & Thresholds) is code-complete but not runtime-tested. Changes:
- StarBudgetRing: animated arcs + threshold tick markers
- StarCounter: animated number + star pulse
- ChildTaskCard: staggered entrance + completion bounce
- Child screens: entrance animations (FadeInLeft, FadeInUp, FadeInRight)
- Parent settings: slider-based thresholds + mini preview ring
- useStarBudgetSync: recalculates star budget when tasks change mid-period

Runtime verification still needed (see plan file for checklist).
