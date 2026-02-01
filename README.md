# Star Routine

A parent-child task & reward app — kids earn stars by completing tasks, parents approve and track progress.

## Features

| Parent | Child |
|--------|-------|
| Create tasks with star values (1-5) and recurrence (daily / specific days / one-time) | View today's tasks with animated UI |
| Review and approve/reject task completions | Complete tasks with haptic feedback |
| Configure reward/penalty thresholds with sliders | Animated star budget ring with threshold zones (reward / neutral / penalty) |
| Manage periods (weekly / biweekly / monthly / custom) | PIN-protected access |
| Auto-roll periods option | |

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Expo SDK 54](https://expo.dev) | App framework & build tooling |
| [React Native](https://reactnative.dev) | Cross-platform mobile UI |
| TypeScript | Type safety |
| [Firebase](https://firebase.google.com) | Auth + Firestore + Cloud Functions |
| [Zustand](https://github.com/pmndrs/zustand) | State management |
| [React Native Paper](https://reactnativepaper.com) | Material Design 3 components |
| [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) | Animations |
| [Expo Router](https://docs.expo.dev/router/introduction/) | File-based routing |

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd star-routine
npm install
```

### 2. Configure environment

Copy the example env file and fill in your Firebase credentials:

```bash
cp .env.example .env
```

Required keys:

```
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
```

### 3. Firebase project setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Email/Password** authentication
3. Create a **Firestore** database
4. Deploy Cloud Functions:
   ```bash
   cd functions
   npm install
   npm run build
   npm run deploy
   ```
5. Deploy Firestore security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### 4. Start the app

```bash
npm start
```

This launches the Expo dev server. Scan the QR code with Expo Go or press `a` for Android emulator.

## Project Structure

```
app/
  (auth)/          Login, register, child PIN
  (parent)/        Tabs: home, tasks, periods, approvals, settings
  (child)/         Today's tasks, all tasks, stars screen
components/
  stars/           StarBudgetRing, StarCounter, StarDisplay
  tasks/           TaskCard, ChildTaskCard, ApprovalCard, TaskForm
  ui/              EmptyState, LoadingScreen
lib/
  stores/          Zustand stores (auth, task, period, completion)
  hooks/           useCurrentPeriod, useTodayTasks, useStarBudget, etc.
  utils/           starCalculations, recurrence, periodUtils, pin
  firebase/        config, auth, firestore
  types/           Shared TypeScript types
constants/         colors, layout, defaults, theme
functions/         Firebase Cloud Functions (autoRollPeriods, onCompletionWrite)
```

## Scripts

### App (root)

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Launch on Android emulator |
| `npm run ios` | Launch on iOS simulator |
| `npm run web` | Launch in browser |
| `npx tsc --noEmit` | Type-check the project |

### Cloud Functions (`functions/`)

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript |
| `npm run serve` | Build + start Firebase emulators |
| `npm run deploy` | Deploy functions to Firebase |

## Contributing

See [CLAUDE.md](./CLAUDE.md) for architecture details, conventions, and internal documentation.

## License

TODO
