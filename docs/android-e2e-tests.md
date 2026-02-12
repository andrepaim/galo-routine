# Android Emulator E2E Test Suite

Automated end-to-end tests for Galo Routine running on an Android emulator via `adb`.

## Prerequisites

1. **Android emulator** running with USB debugging enabled and authorized
2. **adb** installed and connected to the emulator
3. **Expo Go** installed on the emulator (`host.exp.exponent`)
4. **Expo dev server** running: `npx expo start`
5. **App loaded** in Expo Go and **logged in as parent** (starting state)

### WSL2 Setup

If running from WSL2, connect to the Windows-hosted emulator:

```bash
# Find the Windows host IP
HOST_IP=$(ip route show default | awk '{print $3}')

# Connect adb
adb connect $HOST_IP:5555

# Verify connection
adb devices -l
```

You must accept the "Allow USB debugging?" dialog on the emulator when connecting for the first time.

## Running the Tests

```bash
# Basic run (prompts for child PIN or uses default 0412)
CHILD_PIN=0412 bash scripts/android-e2e-tests.sh

# Or set the PIN via environment variable
export CHILD_PIN=0412
bash scripts/android-e2e-tests.sh
```

### Output

- **Screenshots**: `test-screenshots/android/*.png` (32 screenshots)
- **Results JSON**: `test-screenshots/android/results.json`
- **Test log**: `test-screenshots/android/tests.log`

### Expected Duration

~4 minutes (19 suites, 4-second settle time per navigation).

---

## Test Suites

### Suite 1: Parent Dashboard

| # | Test | Assertion |
|---|------|-----------|
| 1 | Dashboard renders | Header shows "Início" |
| 2 | Greeting visible | Shows "Olá" greeting |
| 3 | Goal balance | Shows "Saldo de Gols" |
| 4 | Active period | Shows "Período Atual" |
| 5 | Quick actions | Shows "Ações Rápidas" |
| 6 | No stale branding | No "Star Routine" text |
| 7 | No stale terminology | No "Saldo de Estrelas" text |

**Screenshots**: `01-parent-dashboard.png`, `01b-parent-dashboard-scrolled.png`

### Suite 2: Parent Tasks

| # | Test | Assertion |
|---|------|-----------|
| 1 | Tasks page renders | Title "Tarefas" visible |
| 2 | Filter chips | "Todas" chip visible |
| 3 | Category filters | "Hygiene" category visible |
| 4 | Category filters | "School" category visible |

Also tests category filter interaction (tap Hygiene chip, then reset to Todas).

**Screenshots**: `02-parent-tasks.png`, `02b-parent-tasks-hygiene-filter.png`, `02c-parent-tasks-fab.png`

### Suite 3: Parent Rewards

| # | Test | Assertion |
|---|------|-----------|
| 1 | Rewards page renders | Title "Prêmios" visible |

**Screenshots**: `03-parent-rewards.png`

### Suite 4: Parent Approvals

| # | Test | Assertion |
|---|------|-----------|
| 1 | Approvals page renders | Title "Aprovar" visible |

**Screenshots**: `04-parent-approvals.png`

### Suite 5: Parent Periods

| # | Test | Assertion |
|---|------|-----------|
| 1 | Periods page renders | Title "Períodos" visible |

**Screenshots**: `05-parent-periods.png`

### Suite 6: Parent Goals

| # | Test | Assertion |
|---|------|-----------|
| 1 | Goals page renders | Title "Metas" visible |

**Screenshots**: `06-parent-goals.png`

### Suite 7: Parent Analytics

| # | Test | Assertion |
|---|------|-----------|
| 1 | Analytics page renders | Title "Relatórios" visible |

**Screenshots**: `07-parent-analytics.png`, `07b-parent-analytics-scrolled.png`

### Suite 8: Parent Settings

| # | Test | Assertion |
|---|------|-----------|
| 1 | Settings page renders | Title "Config" visible |

Also captures scrolled views of all settings sections.

**Screenshots**: `08-parent-settings.png`, `08b-parent-settings-scrolled.png`, `08c-parent-settings-scrolled2.png`

### Suite 9: Role Switching (Parent → Child)

| # | Test | Assertion |
|---|------|-----------|
| 1 | PIN screen appears | Tapping Galo shield navigates to child-pin screen |
| 2 | Wrong PIN rejected | Entering 9999 shows "PIN errado. Tenta de novo!" |
| 3 | Correct PIN accepted | Entering the real PIN switches to child view |

The Galo shield button is in the top-right header at coordinates `(1012, 147)`.

**Screenshots**: `09a-child-pin-screen.png`, `09b-wrong-pin.png`, `09c-after-correct-pin.png`

### Suite 10: Child Dashboard

| # | Test | Assertion |
|---|------|-----------|
| 1 | Dashboard renders | Shows "Meu Dia" header |

**Known limitation**: The child dashboard uses `react-native-reanimated` layout animations that prevent `uiautomator dump` from completing. Text assertions produce warnings instead of failures. Screenshot verification confirms the screen renders correctly.

**Screenshots**: `10-child-dashboard.png`, `10b-child-dashboard-scrolled.png`

### Suite 11: Child Tasks

| # | Test | Assertion |
|---|------|-----------|
| 1 | Tasks page renders | Shows "Tarefas" or "Minhas Tarefas" |

**Screenshots**: `11-child-tasks.png`

### Suite 12: Child Championship

| # | Test | Assertion |
|---|------|-----------|
| 1 | Championship renders | Shows "Campeonato" or "Meu Campeonato" |

**Screenshots**: `12-child-championship.png`, `12b-child-championship-scrolled.png`

### Suite 13: Child Shop

| # | Test | Assertion |
|---|------|-----------|
| 1 | Shop renders | Shows "Loja" or "Loja de Prêmios" |

**Screenshots**: `13-child-shop.png`

### Suite 14: Child League Table

| # | Test | Assertion |
|---|------|-----------|
| 1 | Table renders | Shows "Tabela" or "Classificação" |

**Screenshots**: `14-child-table.png`, `14b-child-table-scrolled.png`

### Suite 15: Child Trophies

| # | Test | Assertion |
|---|------|-----------|
| 1 | Trophies renders | Shows "Troféus" or "Sala de Troféus" |

**Screenshots**: `15-child-trophies.png`

### Suite 16: Child Profile

| # | Test | Assertion |
|---|------|-----------|
| 1 | Profile renders | Shows "Perfil" or "Meu Perfil" |

**Screenshots**: `16-child-profile.png`, `16b-child-profile-scrolled.png`

### Suite 17: Role Switching (Child → Parent)

| # | Test | Assertion |
|---|------|-----------|
| 1 | Switch back to parent | Tapping Galo shield returns to parent view |

Child-to-parent switch does not require a PIN (calls `setRole('parent')` directly).

**Screenshots**: `17-switch-to-parent.png`

### Suite 18: Terminology Audit

Scans all 8 parent screens for forbidden legacy terms:

| Forbidden term |
|---|
| Star Routine |
| estrelas |
| star value |
| star balance |
| star cost |
| Saldo de Estrelas |
| Star Budget |

Tests one assertion per screen (8 total).

### Suite 19: Scroll & Interaction Tests

| # | Test | Assertion |
|---|------|-----------|
| 1 | Dashboard scroll down | No crash |
| 2 | Dashboard scroll up | No crash |
| 3 | Settings deep scroll | No crash after 3 consecutive swipe-ups |

**Screenshots**: `19a-dashboard-scroll-down.png`, `19b-dashboard-scroll-up.png`, `19c-settings-deep-scroll.png`

---

## How It Works

### Navigation

The script uses `adb shell input tap X Y` to interact with the app. Tab positions are hardcoded based on the 1080x2400 screen resolution:

**Parent tabs** (Y=2300, 8 tabs):

| Tab | X | Label |
|-----|---|-------|
| Início | 67 | Home/Dashboard |
| Tarefas | 202 | Tasks |
| Prêmios | 337 | Rewards |
| Aprovar | 472 | Approvals |
| Períodos | 607 | Periods |
| Metas | 742 | Goals |
| Relatórios | 877 | Analytics |
| Config | 1012 | Settings |

**Child tabs** (Y=2311, 7 visible):

| Tab | X | Label |
|-----|---|-------|
| Hoje | 77 | Today/Dashboard |
| Tarefas | 231 | Tasks |
| Campeonato | 386 | Championship |
| Loja | 540 | Shop |
| Tabela | 694 | League Table |
| Troféus | 848 | Trophies |
| Perfil | 1003 | Profile |

### Text Assertions

Text is extracted via `adb shell uiautomator dump` which produces an XML file of the view hierarchy. The script parses `text` and `content-desc` attributes from all nodes.

**Limitation**: `uiautomator dump` requires the UI to reach an idle state. Screens with persistent `react-native-reanimated` animations (notably the child dashboard) may fail to dump. In these cases, the test emits a warning and the screenshot serves as visual evidence.

### Screenshots

Captured via `adb exec-out screencap -p > file.png` — a direct pipe from the device framebuffer. All screenshots are saved to `test-screenshots/android/`.

---

## Troubleshooting

### "No authorized Android device found"

```bash
adb kill-server
adb start-server
adb connect <HOST_IP>:5555
# Accept the USB debugging dialog on the emulator
```

### "could not get idle state" on uiautomator dump

React Native animations prevent UI idle. The script handles this with retries and falls back to warnings. To reduce occurrences:

```bash
# Disable animations on the emulator
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
```

Note: This disables system animations but `react-native-reanimated` runs its own animation loop and may still block the dump.

### Wrong tab coordinates

If the emulator resolution changes, recalculate positions:

```bash
# Dump view hierarchy and find tab elements
adb shell uiautomator dump /sdcard/window_dump.xml
adb pull /sdcard/window_dump.xml .
# Parse with Python
python3 -c "
import xml.etree.ElementTree as ET
tree = ET.parse('window_dump.xml')
for node in tree.iter('node'):
    text = node.get('text', '')
    cd = node.get('content-desc', '')
    bounds = node.get('bounds', '')
    if (text or cd) and bounds:
        parts = bounds.replace('[',',').replace(']',',').split(',')
        parts = [p for p in parts if p]
        if len(parts)==4:
            x1,y1,x2,y2 = int(parts[0]),int(parts[1]),int(parts[2]),int(parts[3])
            if y1 > 2100:
                print(f'{text or cd}: center=({(x1+x2)//2},{(y1+y2)//2})')
"
```

### Child PIN

Set via the `CHILD_PIN` environment variable. The PIN is verified against Firestore (no dev mode bypass on native).

```bash
CHILD_PIN=0412 bash scripts/android-e2e-tests.sh
```

---

## Latest Results (2026-02-08)

```
✅ Passed:   38
❌ Failed:   0
⚠️  Warnings: 2
📋 Total:    40
```

Warnings are both on the child dashboard (animations blocking uiautomator). Screenshots confirm correct rendering.

### All Screens Tested

| # | Screen | Status |
|---|--------|--------|
| 1 | Parent Dashboard | ✅ |
| 2 | Parent Tasks (+ filter interaction) | ✅ |
| 3 | Parent Rewards | ✅ |
| 4 | Parent Approvals | ✅ |
| 5 | Parent Periods | ✅ |
| 6 | Parent Goals | ✅ |
| 7 | Parent Analytics | ✅ |
| 8 | Parent Settings (+ deep scroll) | ✅ |
| 9 | Child PIN Screen (wrong + correct PIN) | ✅ |
| 10 | Child Dashboard | ⚠️ (animations) |
| 11 | Child Tasks | ✅ |
| 12 | Child Championship | ✅ |
| 13 | Child Shop | ✅ |
| 14 | Child League Table | ✅ |
| 15 | Child Trophies | ✅ |
| 16 | Child Profile | ✅ |
| 17 | Role Switch: Parent → Child | ✅ |
| 18 | Role Switch: Child → Parent | ✅ |

---

## Future Improvements

- **Form interaction tests**: Fill and submit task/reward creation forms
- **Task completion flow**: Mark tasks as done from child view, verify in parent approvals
- **Reward redemption flow**: Redeem a reward in the shop, verify balance change
- **Championship day closure**: Close a match from parent dashboard, verify results
- **Detox/Maestro migration**: Replace adb coordinate-based taps with a proper RN testing framework that can query by `testID`
- **CI integration**: Run on Android emulator in CI pipeline (GitHub Actions with Android emulator action)
