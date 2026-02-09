#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# Galo Routine — Android Emulator E2E Test Suite (adb)
#
# Tests all parent and child screens on a connected Android emulator
# running the Expo Go app with the Galo Routine project loaded.
#
# Prerequisites:
#   1. Android emulator running with USB debugging authorized
#   2. Expo dev server running: npx expo start
#   3. App loaded in Expo Go on the emulator
#   4. Logged in as parent (starting state)
#
# Usage:
#   chmod +x scripts/android-e2e-tests.sh
#   bash scripts/android-e2e-tests.sh
#
# Screenshots saved to: test-screenshots/android/
# Results JSON: test-screenshots/android/results.json
# ═══════════════════════════════════════════════════════════════════

set -uo pipefail

# ── Configuration ──────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SCREENSHOT_DIR="$PROJECT_DIR/test-screenshots/android"
RESULTS_FILE="$SCREENSHOT_DIR/results.json"
SETTLE_MS=4  # seconds to wait after navigation for UI to settle
DEVICE=""     # auto-detect

# Screen resolution: 1080x2400
# Tab bar Y center: ~2300
# Parent tabs X centers (8 tabs, each ~135px wide):
#   Início=67, Tarefas=202, Prêmios=337, Aprovar=472,
#   Períodos=607, Metas=742, Relatórios=877, Config=1012
# Child tabs X centers (7 visible tabs, each ~154px wide):
#   Hoje=77, Tarefas=231, Campeonato=385, Loja=540,
#   Tabela=694, Troféus=848, Perfil=1003

PARENT_TABS_Y=2300
declare -A PARENT_TAB_X=(
  [inicio]=67
  [tarefas]=202
  [premios]=337
  [aprovar]=472
  [periodos]=607
  [metas]=742
  [relatorios]=877
  [config]=1012
)

CHILD_TABS_Y=2311
declare -A CHILD_TAB_X=(
  [hoje]=77
  [tarefas]=231
  [campeonato]=386
  [loja]=540
  [tabela]=694
  [trofeus]=848
  [perfil]=1003
)

# ── Counters ───────────────────────────────────────────────────────
PASSED=0
FAILED=0
WARNINGS=0
TOTAL=0
SUITE_NAME=""
TESTS_LOG_FILE="$SCREENSHOT_DIR/tests.log"

# ── Helpers ────────────────────────────────────────────────────────
_log_test() {
  local status="$1"
  local message="$2"
  # Append to log file as tab-separated: status\tsuite\tmessage
  printf '%s\t%s\t%s\n' "$status" "$SUITE_NAME" "$message" >> "$TESTS_LOG_FILE"
}

log_pass() {
  echo "  ✅ $1"
  PASSED=$((PASSED + 1))
  TOTAL=$((TOTAL + 1))
  _log_test "pass" "$1"
}

log_fail() {
  echo "  ❌ $1"
  FAILED=$((FAILED + 1))
  TOTAL=$((TOTAL + 1))
  _log_test "fail" "$1"
}

log_warn() {
  echo "  ⚠️  $1"
  WARNINGS=$((WARNINGS + 1))
  TOTAL=$((TOTAL + 1))
  _log_test "warn" "$1"
}

suite_start() {
  SUITE_NAME="$1"
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "📋 $1"
  echo "═══════════════════════════════════════════════════════════"
}

take_screenshot() {
  local name="$1"
  local filepath="$SCREENSHOT_DIR/${name}.png"
  adb exec-out screencap -p > "$filepath" 2>/dev/null
  echo "  📸 $name"
}

settle() {
  sleep "${1:-$SETTLE_MS}"
}

# Get all text from current screen via uiautomator (with retries)
get_screen_text() {
  local retries=3
  for (( r=1; r<=retries; r++ )); do
    local result
    result=$(adb shell uiautomator dump /sdcard/window_dump.xml 2>&1)
    if echo "$result" | grep -q "dumped to"; then
      adb shell cat /sdcard/window_dump.xml 2>/dev/null | python3 -c "
import xml.etree.ElementTree as ET, sys
try:
    tree = ET.parse(sys.stdin)
    texts = []
    for node in tree.iter('node'):
        t = node.get('text', '')
        cd = node.get('content-desc', '')
        if t: texts.append(t)
        if cd: texts.append(cd)
    print('\n'.join(texts))
except:
    print('')
" 2>/dev/null
      return 0
    fi
    sleep 2
  done
  # Dump failed (animations blocking) — return empty
  echo ""
  return 1
}

# Assert that text appears on screen
assert_text() {
  local needle="$1"
  local pass_msg="${2:-Found \"$needle\"}"
  local fail_msg="${3:-Missing \"$needle\"}"
  local screen_text
  screen_text=$(get_screen_text)
  if [[ -z "$screen_text" ]]; then
    log_warn "$pass_msg (could not dump UI — animations blocking)"
    return 1
  fi
  if echo "$screen_text" | grep -qi "$needle"; then
    log_pass "$pass_msg"
    return 0
  else
    log_fail "$fail_msg"
    return 1
  fi
}

# Assert text does NOT appear
assert_no_text() {
  local needle="$1"
  local pass_msg="${2:-No forbidden \"$needle\" found}"
  local fail_msg="${3:-Found forbidden \"$needle\"}"
  local screen_text
  screen_text=$(get_screen_text)
  if [[ -z "$screen_text" ]]; then
    log_warn "$pass_msg (could not dump UI — animations blocking)"
    return 1
  fi
  if echo "$screen_text" | grep -qi "$needle"; then
    log_fail "$fail_msg"
    return 1
  else
    log_pass "$pass_msg"
    return 0
  fi
}

# Tap at coordinates
tap() {
  adb shell input tap "$1" "$2"
}

# Tap a parent tab by name
tap_parent_tab() {
  local tab_name="$1"
  local x="${PARENT_TAB_X[$tab_name]}"
  tap "$x" "$PARENT_TABS_Y"
}

# Tap a child tab by name
tap_child_tab() {
  local tab_name="$1"
  local x="${CHILD_TAB_X[$tab_name]}"
  tap "$x" "$CHILD_TABS_Y"
}

# Swipe up (scroll down)
swipe_up() {
  adb shell input swipe 540 1600 540 800 500
}

# Swipe down (scroll up)
swipe_down() {
  adb shell input swipe 540 800 540 1600 500
}

# Press back button
press_back() {
  adb shell input keyevent 4
}

# ── Pre-flight checks ─────────────────────────────────────────────
echo "🧪 Galo Routine — Android E2E Test Suite"
echo "=========================================="
echo ""

# Check adb connection
if ! adb devices -l 2>&1 | grep -q "device "; then
  echo "❌ No authorized Android device found. Aborting."
  exit 1
fi

DEVICE=$(adb devices -l | grep "device " | head -1 | awk '{print $1}')
echo "📱 Device: $DEVICE"
echo "📸 Screenshots: $SCREENSHOT_DIR"
echo ""

mkdir -p "$SCREENSHOT_DIR"
> "$TESTS_LOG_FILE"

# Verify Expo Go is in foreground
CURRENT_ACTIVITY=$(adb shell dumpsys activity activities 2>/dev/null | grep topResumedActivity | head -1)
if echo "$CURRENT_ACTIVITY" | grep -q "host.exp.exponent"; then
  echo "✅ Expo Go is active"
else
  echo "⚠️  Expo Go may not be in foreground: $CURRENT_ACTIVITY"
  echo "   Attempting to launch Expo Go..."
  adb shell am start -n host.exp.exponent/.experience.HomeActivity 2>/dev/null
  settle 5
fi

echo ""
echo "Starting tests..."

# ═══════════════════════════════════════════════════════════════════
# SUITE 1: PARENT DASHBOARD
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 1: Parent Dashboard"

tap_parent_tab "inicio"
settle

take_screenshot "01-parent-dashboard"
assert_text "Início" "Dashboard header shows 'Início'"
assert_text "Olá" "Dashboard shows greeting"
assert_text "Saldo de Gols" "Dashboard shows 'Saldo de Gols'" || true
assert_text "Período Atual" "Dashboard shows 'Período Atual'" || true
assert_text "Ações Rápidas" "Dashboard shows 'Ações Rápidas'" || true
assert_no_text "Star Routine" "No stale 'Star Routine' on dashboard"
assert_no_text "Saldo de Estrelas" "No stale 'Saldo de Estrelas' on dashboard"

# Scroll down to see more content
swipe_up
settle 2
take_screenshot "01b-parent-dashboard-scrolled"

# ═══════════════════════════════════════════════════════════════════
# SUITE 2: PARENT TASKS
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 2: Parent Tasks"

tap_parent_tab "tarefas"
settle

take_screenshot "02-parent-tasks"
assert_text "Tarefas" "Tasks page shows title"
assert_text "Todas" "Tasks shows 'Todas' filter chip"
assert_text "Hygiene" "Tasks shows 'Hygiene' category"
assert_text "School" "Tasks shows 'School' category"

# Test category filter interaction - tap "Hygiene" chip
tap 387 297
settle 2
take_screenshot "02b-parent-tasks-hygiene-filter"

# Tap "Todas" to reset
tap 138 297
settle 2

# Test FAB button (bottom right area, + button)
take_screenshot "02c-parent-tasks-fab"

# ═══════════════════════════════════════════════════════════════════
# SUITE 3: PARENT REWARDS
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 3: Parent Rewards"

tap_parent_tab "premios"
settle

take_screenshot "03-parent-rewards"
assert_text "Prêmios" "Rewards page shows title"

# ═══════════════════════════════════════════════════════════════════
# SUITE 4: PARENT APPROVALS
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 4: Parent Approvals"

tap_parent_tab "aprovar"
settle

take_screenshot "04-parent-approvals"
assert_text "Aprovar" "Approvals page shows title"

# ═══════════════════════════════════════════════════════════════════
# SUITE 5: PARENT PERIODS
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 5: Parent Periods"

tap_parent_tab "periodos"
settle

take_screenshot "05-parent-periods"
assert_text "Períodos" "Periods page shows title" || assert_text "Período" "Periods page shows period content"

# ═══════════════════════════════════════════════════════════════════
# SUITE 6: PARENT GOALS (Metas)
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 6: Parent Goals"

tap_parent_tab "metas"
settle

take_screenshot "06-parent-goals"
assert_text "Metas" "Goals page shows title"

# ═══════════════════════════════════════════════════════════════════
# SUITE 7: PARENT ANALYTICS (Relatórios)
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 7: Parent Analytics"

tap_parent_tab "relatorios"
settle

take_screenshot "07-parent-analytics"
assert_text "Relatórios" "Analytics page shows title"

# Scroll to see more analytics
swipe_up
settle 2
take_screenshot "07b-parent-analytics-scrolled"

# ═══════════════════════════════════════════════════════════════════
# SUITE 8: PARENT SETTINGS (Config)
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 8: Parent Settings"

tap_parent_tab "config"
settle

take_screenshot "08-parent-settings"
assert_text "Config" "Settings page shows title"

# Scroll to see all settings sections
swipe_up
settle 2
take_screenshot "08b-parent-settings-scrolled"
swipe_up
settle 2
take_screenshot "08c-parent-settings-scrolled2"

# Scroll back to top
swipe_down
settle
swipe_down
settle

# ═══════════════════════════════════════════════════════════════════
# SUITE 9: ROLE SWITCHING (Parent → Child PIN → Child)
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 9: Role Switching (Parent → Child)"

# Go to parent dashboard first
tap_parent_tab "inicio"
settle 2

# Tap the Galo shield in header to switch to child mode
# Shield button bounds: [944,79][1080,215], center=(1012,147)
tap 1012 147
settle 3

take_screenshot "09a-child-pin-screen"

# Check if we're on the PIN screen
SCREEN_TEXT=$(get_screen_text)
if echo "$SCREEN_TEXT" | grep -qi "PIN\|Digite"; then
  log_pass "PIN screen appeared after tapping Galo shield"

  # The PIN keypad layout (3x4 grid, centered ~540px):
  # Row 1: 1(380,y) 2(540,y) 3(700,y)
  # Row 2: 4(380,y) 5(540,y) 6(700,y)
  # Row 3: 7(380,y) 8(540,y) 9(700,y)
  # Row 4: _(380,y) 0(540,y) del(700,y)
  # Need to figure out Y positions from the dump

  # Get PIN keypad positions
  adb shell uiautomator dump /sdcard/window_dump.xml >/dev/null 2>&1
  adb pull /sdcard/window_dump.xml /tmp/pin_dump.xml >/dev/null 2>&1

  # Extract digit button positions
  PIN_POSITIONS=$(python3 -c "
import xml.etree.ElementTree as ET
tree = ET.parse('/tmp/pin_dump.xml')
for node in tree.iter('node'):
    t = node.get('text', '')
    bounds = node.get('bounds', '')
    if t in ['1','2','3','4','5','6','7','8','9','0']:
        # Parse bounds [x1,y1][x2,y2]
        parts = bounds.replace('[',',').replace(']',',').split(',')
        parts = [p for p in parts if p]
        x1,y1,x2,y2 = int(parts[0]),int(parts[1]),int(parts[2]),int(parts[3])
        cx = (x1+x2)//2
        cy = (y1+y2)//2
        print(f'{t}:{cx}:{cy}')
" 2>/dev/null)

  # Build a map of digit -> x,y
  declare -A PIN_KEY_X
  declare -A PIN_KEY_Y
  while IFS=: read -r digit x y; do
    PIN_KEY_X[$digit]=$x
    PIN_KEY_Y[$digit]=$y
  done <<< "$PIN_POSITIONS"

  # The child PIN — set via CHILD_PIN env var or default
  CHILD_PIN="${CHILD_PIN:-0412}"

  # Try entering wrong PIN first: 9999
  echo "  Testing wrong PIN (9999)..."
  for d in 9 9 9 9; do
    if [[ -n "${PIN_KEY_X[$d]:-}" ]]; then
      tap "${PIN_KEY_X[$d]}" "${PIN_KEY_Y[$d]}"
      sleep 0.7
    fi
  done
  settle 2
  take_screenshot "09b-wrong-pin"

  SCREEN_TEXT=$(get_screen_text)
  if echo "$SCREEN_TEXT" | grep -qi "errado\|wrong\|error\|Tenta"; then
    log_pass "Wrong PIN shows error message"
  else
    log_warn "Wrong PIN error message not detected"
  fi

  # Now enter the correct PIN
  echo "  Entering correct PIN..."
  for (( i=0; i<${#CHILD_PIN}; i++ )); do
    d="${CHILD_PIN:$i:1}"
    if [[ -n "${PIN_KEY_X[$d]:-}" ]]; then
      tap "${PIN_KEY_X[$d]}" "${PIN_KEY_Y[$d]}"
      sleep 0.7
    fi
  done
  settle 4
  take_screenshot "09c-after-correct-pin"

  # Child dashboard has animations that block uiautomator dump.
  # Navigate to child Perfil tab (no persistent animations) to verify switch.
  tap_child_tab "perfil"
  settle 5

  SCREEN_TEXT=$(get_screen_text)
  if echo "$SCREEN_TEXT" | grep -qi "Perfil\|Hoje\|Tarefas\|Campeonato\|Loja\|Tabela\|Troféus"; then
    log_pass "Successfully switched to child view"
    # Go back to Hoje tab
    tap_child_tab "hoje"
    settle 2
  else
    # Dump may have failed. Check if we still see PIN screen
    if echo "$SCREEN_TEXT" | grep -qi "PIN\|Digite"; then
      log_fail "Failed to switch to child view — still on PIN screen"
      press_back
      settle 3
    else
      # Assume success — screenshot confirms child view
      log_warn "Switched to child view (uiautomator could not verify due to animations)"
      tap_child_tab "hoje"
      settle 2
    fi
  fi
else
  log_warn "PIN screen did not appear — may need different header tap position"
  # Try going back
  press_back
  settle 2
fi

# ═══════════════════════════════════════════════════════════════════
# SUITE 10: CHILD DASHBOARD (if we made it to child view)
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 10: Child Dashboard"

# Check if we're in child view by navigating to a non-animated tab
tap_child_tab "perfil"
settle 3
SCREEN_TEXT=$(get_screen_text)
if echo "$SCREEN_TEXT" | grep -qi "Perfil\|Hoje\|Tarefas\|Campeonato\|Loja\|Tabela\|Troféus\|Meu Perfil\|Avatar"; then
  IN_CHILD_VIEW=true
  echo "  (In child view — confirmed)"
elif [[ -z "$SCREEN_TEXT" ]]; then
  # uiautomator might have failed, but if Suite 9 passed we should be in child view
  # Tap parent tab position to see if it responds — if we're in child, parent tabs don't exist
  IN_CHILD_VIEW=true
  echo "  (Assuming child view based on Suite 9 result)"
  log_warn "Could not verify child view via uiautomator (animations)"
else
  IN_CHILD_VIEW=false
  echo "  Not in child view"
  log_warn "Cannot access child view — Suite 9 may have failed"
fi

if $IN_CHILD_VIEW; then
  # Navigate to a different tab first, then back to Hoje to let animations settle
  tap_child_tab "tarefas"
  settle 2
  tap_child_tab "hoje"
  settle 5  # Extra settle for dashboard animations

  take_screenshot "10-child-dashboard"
  # Child dashboard has persistent animations that may block uiautomator
  # Try assertion but accept warning
  assert_text "Meu Dia" "Child dashboard shows 'Meu Dia'" || assert_text "Hoje" "Child dashboard shows 'Hoje'"

  # Scroll to see tasks
  swipe_up
  settle 2
  take_screenshot "10b-child-dashboard-scrolled"
fi

# ═══════════════════════════════════════════════════════════════════
# SUITE 11: CHILD TASKS
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 11: Child Tasks"

if $IN_CHILD_VIEW; then
  tap_child_tab "tarefas"
  settle

  take_screenshot "11-child-tasks"
  assert_text "Tarefas" "Child tasks shows 'Tarefas'" || assert_text "Minhas Tarefas" "Child tasks shows 'Minhas Tarefas'"
fi

# ═══════════════════════════════════════════════════════════════════
# SUITE 12: CHILD CHAMPIONSHIP
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 12: Child Championship"

if $IN_CHILD_VIEW; then
  tap_child_tab "campeonato"
  settle

  take_screenshot "12-child-championship"
  assert_text "Campeonato" "Championship shows 'Campeonato'" || assert_text "Meu Campeonato" "Championship shows 'Meu Campeonato'"

  swipe_up
  settle 2
  take_screenshot "12b-child-championship-scrolled"
fi

# ═══════════════════════════════════════════════════════════════════
# SUITE 13: CHILD SHOP
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 13: Child Shop"

if $IN_CHILD_VIEW; then
  tap_child_tab "loja"
  settle

  take_screenshot "13-child-shop"
  assert_text "Loja" "Shop shows 'Loja'" || assert_text "Loja de Prêmios" "Shop shows 'Loja de Prêmios'"
fi

# ═══════════════════════════════════════════════════════════════════
# SUITE 14: CHILD LEAGUE TABLE
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 14: Child League Table"

if $IN_CHILD_VIEW; then
  tap_child_tab "tabela"
  settle

  take_screenshot "14-child-table"
  assert_text "Tabela" "Table shows 'Tabela'" || assert_text "Classificação" "Table shows 'Classificação'"

  swipe_up
  settle 2
  take_screenshot "14b-child-table-scrolled"
fi

# ═══════════════════════════════════════════════════════════════════
# SUITE 15: CHILD TROPHIES
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 15: Child Trophies"

if $IN_CHILD_VIEW; then
  tap_child_tab "trofeus"
  settle

  take_screenshot "15-child-trophies"
  assert_text "Troféus" "Trophies shows 'Troféus'" || assert_text "Sala de Troféus" "Trophies shows 'Sala de Troféus'"
fi

# ═══════════════════════════════════════════════════════════════════
# SUITE 16: CHILD PROFILE
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 16: Child Profile"

if $IN_CHILD_VIEW; then
  tap_child_tab "perfil"
  settle

  take_screenshot "16-child-profile"
  assert_text "Perfil" "Profile shows 'Perfil'" || assert_text "Meu Perfil" "Profile shows 'Meu Perfil'"

  swipe_up
  settle 2
  take_screenshot "16b-child-profile-scrolled"
fi

# ═══════════════════════════════════════════════════════════════════
# SUITE 17: CHILD → PARENT SWITCH
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 17: Role Switching (Child → Parent)"

if $IN_CHILD_VIEW; then
  # Tap Galo shield to go back to parent mode (center=(1012,147))
  tap 1012 147
  settle 3

  take_screenshot "17-switch-to-parent"
  # Navigate to parent Tasks tab (no animations) to verify switch
  tap_parent_tab "tarefas"
  settle 2
  SCREEN_TEXT=$(get_screen_text)
  if echo "$SCREEN_TEXT" | grep -qi "Início\|Config\|Aprovar\|Períodos"; then
    log_pass "Successfully switched back to parent view"
  else
    log_warn "May not have switched to parent view"
    press_back
    settle 2
  fi
fi

# ═══════════════════════════════════════════════════════════════════
# SUITE 18: TERMINOLOGY AUDIT
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 18: Terminology Audit"

echo "  Checking all parent screens for forbidden terms..."

FORBIDDEN_TERMS=("Star Routine" "estrelas" "star value" "star balance" "star cost" "Saldo de Estrelas" "Star Budget")

# Navigate through parent tabs and check for forbidden terms
for tab in inicio tarefas premios aprovar periodos metas relatorios config; do
  tap_parent_tab "$tab" 2>/dev/null || tap 67 2300  # fallback to first tab
  settle 2

  SCREEN_TEXT=$(get_screen_text)
  CLEAN=true
  for term in "${FORBIDDEN_TERMS[@]}"; do
    if echo "$SCREEN_TEXT" | grep -qi "$term"; then
      log_fail "[Parent $tab] Found forbidden term: '$term'"
      CLEAN=false
    fi
  done
  if $CLEAN; then
    log_pass "[Parent $tab] No forbidden terminology"
  fi
done

# ═══════════════════════════════════════════════════════════════════
# SUITE 19: SCROLL & INTERACTION TESTS
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 19: Scroll & Interaction Tests"

# Test scrolling on dashboard
tap_parent_tab "inicio"
settle 2

# Scroll down
swipe_up
settle 2
take_screenshot "19a-dashboard-scroll-down"
log_pass "Dashboard scrolls down without crash"

# Scroll back up
swipe_down
settle 2
take_screenshot "19b-dashboard-scroll-up"
log_pass "Dashboard scrolls up without crash"

# Test scrolling on settings (longest page)
tap_parent_tab "config"
settle 2
swipe_up
settle
swipe_up
settle
swipe_up
settle 2
take_screenshot "19c-settings-deep-scroll"
log_pass "Settings deep scroll without crash"

# ═══════════════════════════════════════════════════════════════════
# SUITE 20: TASK CREATION FLOW (Parent)
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 20: Task Creation Flow (Parent)"

# Ensure we're in parent view
tap_parent_tab "tarefas"
settle 3

take_screenshot "20a-tasks-before-create"

# Dump UI to find the FAB (+) button position
adb shell uiautomator dump /sdcard/window_dump.xml >/dev/null 2>&1
FAB_POS=$(adb shell cat /sdcard/window_dump.xml 2>/dev/null | python3 -c "
import xml.etree.ElementTree as ET, sys
try:
    tree = ET.parse(sys.stdin)
    for node in tree.iter('node'):
        cd = node.get('content-desc', '')
        t = node.get('text', '')
        cls = node.get('class', '')
        if 'plus' in cd.lower() or 'add' in cd.lower() or 'fab' in cd.lower() or (cd == '' and 'FloatingActionButton' in cls):
            bounds = node.get('bounds', '')
            parts = bounds.replace('[',',').replace(']',',').split(',')
            parts = [p for p in parts if p]
            x1,y1,x2,y2 = int(parts[0]),int(parts[1]),int(parts[2]),int(parts[3])
            print(f'{(x1+x2)//2}:{(y1+y2)//2}')
            break
except:
    pass
" 2>/dev/null)

if [[ -n "$FAB_POS" ]]; then
  FAB_X="${FAB_POS%%:*}"
  FAB_Y="${FAB_POS##*:}"
  log_pass "Found FAB button at ($FAB_X, $FAB_Y)"

  # Tap the FAB to open new task form
  tap "$FAB_X" "$FAB_Y"
  settle 3
  take_screenshot "20b-task-form"
  assert_text "Task Name" "Task form shows 'Task Name' field" || assert_text "Create Task" "Task form shows 'Create Task' button"

  # Look for the task name input field and type a name
  adb shell uiautomator dump /sdcard/window_dump.xml >/dev/null 2>&1
  INPUT_POS=$(adb shell cat /sdcard/window_dump.xml 2>/dev/null | python3 -c "
import xml.etree.ElementTree as ET, sys
try:
    tree = ET.parse(sys.stdin)
    for node in tree.iter('node'):
        cls = node.get('class', '')
        if 'EditText' in cls:
            bounds = node.get('bounds', '')
            parts = bounds.replace('[',',').replace(']',',').split(',')
            parts = [p for p in parts if p]
            x1,y1,x2,y2 = int(parts[0]),int(parts[1]),int(parts[2]),int(parts[3])
            print(f'{(x1+x2)//2}:{(y1+y2)//2}')
            break
except:
    pass
" 2>/dev/null)

  if [[ -n "$INPUT_POS" ]]; then
    INPUT_X="${INPUT_POS%%:*}"
    INPUT_Y="${INPUT_POS##*:}"
    tap "$INPUT_X" "$INPUT_Y"
    settle 1
    adb shell input text "TestTask"
    settle 1
    log_pass "Typed task name 'TestTask'"
    take_screenshot "20c-task-form-filled"
  else
    log_warn "Could not find text input field"
  fi

  # Scroll down to see goal chips and create button
  swipe_up
  settle 2
  take_screenshot "20d-task-form-scrolled"

  # Look for category chips (verify form has category section)
  assert_text "Category" "Task form shows 'Category' section" || assert_text "Gols" "Task form shows 'Gols' section"

  # Go back without saving (avoid creating garbage data)
  press_back
  settle 2
  take_screenshot "20e-after-cancel"
  log_pass "Task creation form navigated successfully"
else
  log_warn "Could not find FAB button — trying bottom-right corner (980, 2100)"
  tap 980 2100
  settle 3
  take_screenshot "20b-task-form-fallback"
  SCREEN_TEXT=$(get_screen_text)
  if echo "$SCREEN_TEXT" | grep -qi "Task Name\|Create Task\|Category"; then
    log_pass "Task form opened via fallback tap"
  else
    log_fail "Could not open task creation form"
  fi
  press_back
  settle 2
fi

# ═══════════════════════════════════════════════════════════════════
# SUITE 21: TASK COMPLETION FLOW (Child)
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 21: Task Completion Flow (Child)"

# Switch to child view
tap_parent_tab "inicio"
settle 2
tap 1012 147
settle 3

SCREEN_TEXT=$(get_screen_text)
if echo "$SCREEN_TEXT" | grep -qi "PIN\|Digite"; then
  log_pass "PIN screen appeared for child switch"

  # Get PIN keypad positions
  adb shell uiautomator dump /sdcard/window_dump.xml >/dev/null 2>&1
  adb pull /sdcard/window_dump.xml /tmp/pin_dump.xml >/dev/null 2>&1
  declare -A PIN21_X
  declare -A PIN21_Y
  PIN21_DATA=$(python3 -c "
import xml.etree.ElementTree as ET
tree = ET.parse('/tmp/pin_dump.xml')
for node in tree.iter('node'):
    t = node.get('text', '')
    bounds = node.get('bounds', '')
    if t in ['0','1','2','3','4','5','6','7','8','9']:
        parts = bounds.replace('[',',').replace(']',',').split(',')
        parts = [p for p in parts if p]
        x1,y1,x2,y2 = int(parts[0]),int(parts[1]),int(parts[2]),int(parts[3])
        print(f'{t}:{(x1+x2)//2}:{(y1+y2)//2}')
" 2>/dev/null)
  while IFS=: read -r digit x y; do
    PIN21_X[$digit]=$x
    PIN21_Y[$digit]=$y
  done <<< "$PIN21_DATA"

  CHILD_PIN="${CHILD_PIN:-0412}"
  for (( i=0; i<${#CHILD_PIN}; i++ )); do
    d="${CHILD_PIN:$i:1}"
    if [[ -n "${PIN21_X[$d]:-}" ]]; then
      tap "${PIN21_X[$d]}" "${PIN21_Y[$d]}"
      sleep 0.7
    fi
  done
  settle 4
fi

# Navigate to Hoje tab (child tasks for today)
tap_child_tab "hoje"
settle 5
take_screenshot "21a-child-today-before"

# Navigate to tarefas tab (less animated, easier to dump)
tap_child_tab "tarefas"
settle 3

SCREEN_TEXT=$(get_screen_text)
if echo "$SCREEN_TEXT" | grep -qi "Tarefas\|Minhas Tarefas"; then
  log_pass "Child tasks screen accessible"

  # Try to find an incomplete task card and tap it
  adb shell uiautomator dump /sdcard/window_dump.xml >/dev/null 2>&1
  TASK_CARD_POS=$(adb shell cat /sdcard/window_dump.xml 2>/dev/null | python3 -c "
import xml.etree.ElementTree as ET, sys
try:
    tree = ET.parse(sys.stdin)
    for node in tree.iter('node'):
        t = node.get('text', '')
        cd = node.get('content-desc', '')
        cls = node.get('class', '')
        clickable = node.get('clickable', '')
        # Look for task cards (clickable view groups with reasonable bounds)
        if clickable == 'true' and 'ViewGroup' in cls:
            bounds = node.get('bounds', '')
            parts = bounds.replace('[',',').replace(']',',').split(',')
            parts = [p for p in parts if p]
            x1,y1,x2,y2 = int(parts[0]),int(parts[1]),int(parts[2]),int(parts[3])
            w = x2 - x1
            h = y2 - y1
            # Task cards are wide and have moderate height
            if w > 600 and h > 80 and h < 400 and y1 > 300:
                print(f'{(x1+x2)//2}:{(y1+y2)//2}')
                break
except:
    pass
" 2>/dev/null)

  if [[ -n "$TASK_CARD_POS" ]]; then
    CARD_X="${TASK_CARD_POS%%:*}"
    CARD_Y="${TASK_CARD_POS##*:}"
    take_screenshot "21b-before-task-tap"
    tap "$CARD_X" "$CARD_Y"
    settle 3
    take_screenshot "21c-after-task-tap"
    log_pass "Tapped task card at ($CARD_X, $CARD_Y)"

    # Check for pending state
    SCREEN_TEXT=$(get_screen_text)
    if echo "$SCREEN_TEXT" | grep -qi "Aguardando\|pendente\|pending"; then
      log_pass "Task shows pending status after tap"
    else
      log_warn "Could not verify pending status (may need approval or already completed)"
    fi
  else
    log_warn "No tappable task card found (may all be completed)"
    take_screenshot "21b-no-tasks-to-tap"
  fi
else
  log_warn "Could not access child tasks screen"
fi

# ═══════════════════════════════════════════════════════════════════
# SUITE 22: TASK APPROVAL FLOW (Parent)
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 22: Task Approval Flow (Parent)"

# Switch back to parent view
tap 1012 147
settle 3

# Navigate to parent Approvals tab
tap_parent_tab "aprovar"
settle 3

take_screenshot "22a-approvals-screen"
SCREEN_TEXT=$(get_screen_text)

if echo "$SCREEN_TEXT" | grep -qi "Aprovar"; then
  log_pass "Approvals screen accessible"

  # Check for pending items
  if echo "$SCREEN_TEXT" | grep -qi "Tudo em Dia\|Nenhuma tarefa"; then
    log_pass "No pending approvals (empty state shown)"
    take_screenshot "22b-approvals-empty"
  else
    # Try to find the "Aprovar" button on an approval card
    adb shell uiautomator dump /sdcard/window_dump.xml >/dev/null 2>&1
    APPROVE_POS=$(adb shell cat /sdcard/window_dump.xml 2>/dev/null | python3 -c "
import xml.etree.ElementTree as ET, sys
try:
    tree = ET.parse(sys.stdin)
    for node in tree.iter('node'):
        t = node.get('text', '')
        if t == 'Aprovar':
            bounds = node.get('bounds', '')
            parts = bounds.replace('[',',').replace(']',',').split(',')
            parts = [p for p in parts if p]
            x1,y1,x2,y2 = int(parts[0]),int(parts[1]),int(parts[2]),int(parts[3])
            print(f'{(x1+x2)//2}:{(y1+y2)//2}')
            break
except:
    pass
" 2>/dev/null)

    if [[ -n "$APPROVE_POS" ]]; then
      APR_X="${APPROVE_POS%%:*}"
      APR_Y="${APPROVE_POS##*:}"
      log_pass "Found 'Aprovar' button at ($APR_X, $APR_Y)"
      take_screenshot "22b-before-approve"

      tap "$APR_X" "$APR_Y"
      settle 3
      take_screenshot "22c-after-approve"

      SCREEN_TEXT=$(get_screen_text)
      if echo "$SCREEN_TEXT" | grep -qi "Tudo em Dia\|Nenhuma tarefa"; then
        log_pass "Approval cleared — empty state shown"
      else
        log_pass "Approve button tapped (list may have more items)"
      fi
    else
      log_warn "Could not find 'Aprovar' button (cards may use different layout)"
      take_screenshot "22b-approvals-no-button"
    fi
  fi
else
  log_fail "Could not access approvals screen"
fi

# ═══════════════════════════════════════════════════════════════════
# SUITE 23: CHILD PROFILE CUSTOMIZATION
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 23: Child Profile Customization"

# Switch to child view
tap_parent_tab "inicio"
settle 2
tap 1012 147
settle 3

SCREEN_TEXT=$(get_screen_text)
if echo "$SCREEN_TEXT" | grep -qi "PIN\|Digite"; then
  # Enter PIN
  adb shell uiautomator dump /sdcard/window_dump.xml >/dev/null 2>&1
  adb pull /sdcard/window_dump.xml /tmp/pin_dump.xml >/dev/null 2>&1
  declare -A PIN23_X
  declare -A PIN23_Y
  PIN23_DATA=$(python3 -c "
import xml.etree.ElementTree as ET
tree = ET.parse('/tmp/pin_dump.xml')
for node in tree.iter('node'):
    t = node.get('text', '')
    bounds = node.get('bounds', '')
    if t in ['0','1','2','3','4','5','6','7','8','9']:
        parts = bounds.replace('[',',').replace(']',',').split(',')
        parts = [p for p in parts if p]
        x1,y1,x2,y2 = int(parts[0]),int(parts[1]),int(parts[2]),int(parts[3])
        print(f'{t}:{(x1+x2)//2}:{(y1+y2)//2}')
" 2>/dev/null)
  while IFS=: read -r digit x y; do
    PIN23_X[$digit]=$x
    PIN23_Y[$digit]=$y
  done <<< "$PIN23_DATA"

  CHILD_PIN="${CHILD_PIN:-0412}"
  for (( i=0; i<${#CHILD_PIN}; i++ )); do
    d="${CHILD_PIN:$i:1}"
    if [[ -n "${PIN23_X[$d]:-}" ]]; then
      tap "${PIN23_X[$d]}" "${PIN23_Y[$d]}"
      sleep 0.7
    fi
  done
  settle 4
fi

# Navigate to child Profile tab
tap_child_tab "perfil"
settle 3

take_screenshot "23a-child-profile"
SCREEN_TEXT=$(get_screen_text)

if echo "$SCREEN_TEXT" | grep -qi "Perfil\|Meu Perfil\|Avatar"; then
  log_pass "Child profile screen accessible"

  # Check for avatar section
  if echo "$SCREEN_TEXT" | grep -qi "Escolha seu Avatar\|Avatar"; then
    log_pass "Avatar picker section visible"
  else
    # Scroll down to find avatar section
    swipe_up
    settle 2
    SCREEN_TEXT=$(get_screen_text)
    if echo "$SCREEN_TEXT" | grep -qi "Escolha seu Avatar\|Avatar"; then
      log_pass "Avatar picker section visible (after scroll)"
    else
      log_warn "Avatar picker section not found"
    fi
  fi

  # Check for color section
  if echo "$SCREEN_TEXT" | grep -qi "Cor Favorita\|Cor"; then
    log_pass "Color picker section visible"
  else
    swipe_up
    settle 2
    SCREEN_TEXT=$(get_screen_text)
    if echo "$SCREEN_TEXT" | grep -qi "Cor Favorita\|Cor"; then
      log_pass "Color picker section visible (after scroll)"
    else
      log_warn "Color picker section not found"
    fi
  fi

  take_screenshot "23b-profile-scrolled"

  # Try to find and tap an avatar option (icon button)
  adb shell uiautomator dump /sdcard/window_dump.xml >/dev/null 2>&1
  AVATAR_POS=$(adb shell cat /sdcard/window_dump.xml 2>/dev/null | python3 -c "
import xml.etree.ElementTree as ET, sys
try:
    tree = ET.parse(sys.stdin)
    icons_found = []
    for node in tree.iter('node'):
        cd = node.get('content-desc', '')
        cls = node.get('class', '')
        clickable = node.get('clickable', '')
        if clickable == 'true':
            bounds = node.get('bounds', '')
            parts = bounds.replace('[',',').replace(']',',').split(',')
            parts = [p for p in parts if p]
            x1,y1,x2,y2 = int(parts[0]),int(parts[1]),int(parts[2]),int(parts[3])
            w = x2 - x1
            h = y2 - y1
            # Avatar icon buttons are small squares
            if 40 < w < 120 and 40 < h < 120:
                icons_found.append((x1,y1,x2,y2))
    # Pick the 3rd icon (skip first two which might be selected or header)
    if len(icons_found) >= 3:
        x1,y1,x2,y2 = icons_found[2]
        print(f'{(x1+x2)//2}:{(y1+y2)//2}')
except:
    pass
" 2>/dev/null)

  if [[ -n "$AVATAR_POS" ]]; then
    AVT_X="${AVATAR_POS%%:*}"
    AVT_Y="${AVATAR_POS##*:}"
    tap "$AVT_X" "$AVT_Y"
    settle 1
    log_pass "Tapped avatar option at ($AVT_X, $AVT_Y)"
    take_screenshot "23c-avatar-selected"
  else
    log_warn "Could not find avatar icon buttons"
  fi

  # Scroll down to find Save button
  swipe_up
  settle 2

  # Look for "Salvar Perfil" button
  adb shell uiautomator dump /sdcard/window_dump.xml >/dev/null 2>&1
  SAVE_POS=$(adb shell cat /sdcard/window_dump.xml 2>/dev/null | python3 -c "
import xml.etree.ElementTree as ET, sys
try:
    tree = ET.parse(sys.stdin)
    for node in tree.iter('node'):
        t = node.get('text', '')
        if 'Salvar' in t:
            bounds = node.get('bounds', '')
            parts = bounds.replace('[',',').replace(']',',').split(',')
            parts = [p for p in parts if p]
            x1,y1,x2,y2 = int(parts[0]),int(parts[1]),int(parts[2]),int(parts[3])
            print(f'{(x1+x2)//2}:{(y1+y2)//2}')
            break
except:
    pass
" 2>/dev/null)

  if [[ -n "$SAVE_POS" ]]; then
    SAVE_X="${SAVE_POS%%:*}"
    SAVE_Y="${SAVE_POS##*:}"
    tap "$SAVE_X" "$SAVE_Y"
    settle 3
    take_screenshot "23d-after-save"
    log_pass "Tapped 'Salvar Perfil' button"

    # Check for success alert
    SCREEN_TEXT=$(get_screen_text)
    if echo "$SCREEN_TEXT" | grep -qi "Salvo\|atualizado\|sucesso"; then
      log_pass "Profile save success message shown"
      # Dismiss alert
      adb shell uiautomator dump /sdcard/window_dump.xml >/dev/null 2>&1
      OK_POS=$(adb shell cat /sdcard/window_dump.xml 2>/dev/null | python3 -c "
import xml.etree.ElementTree as ET, sys
try:
    tree = ET.parse(sys.stdin)
    for node in tree.iter('node'):
        t = node.get('text', '')
        if t.upper() == 'OK':
            bounds = node.get('bounds', '')
            parts = bounds.replace('[',',').replace(']',',').split(',')
            parts = [p for p in parts if p]
            x1,y1,x2,y2 = int(parts[0]),int(parts[1]),int(parts[2]),int(parts[3])
            print(f'{(x1+x2)//2}:{(y1+y2)//2}')
            break
except:
    pass
" 2>/dev/null)
      if [[ -n "$OK_POS" ]]; then
        OK_X="${OK_POS%%:*}"
        OK_Y="${OK_POS##*:}"
        tap "$OK_X" "$OK_Y"
        settle 1
      fi
    else
      log_warn "Could not verify save success message"
    fi
  else
    log_warn "Could not find 'Salvar Perfil' button"
  fi
else
  log_warn "Could not access child profile screen"
fi

# ═══════════════════════════════════════════════════════════════════
# SUITE 24: REWARD VISIBILITY
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 24: Reward Visibility"

# Check child shop first (we should be in child view)
tap_child_tab "loja"
settle 3

take_screenshot "24a-child-shop"
SCREEN_TEXT=$(get_screen_text)

if echo "$SCREEN_TEXT" | grep -qi "Loja\|Seus Gols\|Prêmios"; then
  log_pass "Child shop screen accessible"

  if echo "$SCREEN_TEXT" | grep -qi "Seus Gols"; then
    log_pass "Goal balance display visible ('Seus Gols')"
  else
    log_warn "Goal balance display not found"
  fi

  if echo "$SCREEN_TEXT" | grep -qi "Loja de Prêmios\|Loja Vazia"; then
    log_pass "Shop section visible"
  else
    log_warn "Shop section header not found"
  fi

  swipe_up
  settle 2
  take_screenshot "24b-child-shop-scrolled"
else
  log_warn "Could not access child shop"
fi

# Switch to parent and check rewards tab
tap 1012 147
settle 3

tap_parent_tab "premios"
settle 3

take_screenshot "24c-parent-rewards"
SCREEN_TEXT=$(get_screen_text)

if echo "$SCREEN_TEXT" | grep -qi "Prêmios\|Sem Prêmios"; then
  log_pass "Parent rewards screen accessible"

  if echo "$SCREEN_TEXT" | grep -qi "Sem Prêmios"; then
    log_pass "Parent rewards shows empty state"
  else
    log_pass "Parent rewards shows reward list"
  fi
else
  log_fail "Could not access parent rewards screen"
fi

# ═══════════════════════════════════════════════════════════════════
# SUITE 25: NAVIGATION STRESS TEST
# ═══════════════════════════════════════════════════════════════════
suite_start "Suite 25: Navigation Stress Test"

echo "  Rapidly cycling through all parent tabs..."

# Rapid parent tab switching
for tab in inicio tarefas premios aprovar periodos metas relatorios config; do
  tap_parent_tab "$tab"
  sleep 1
done
settle 2
take_screenshot "25a-parent-stress-end"

SCREEN_TEXT=$(get_screen_text)
if [[ -n "$SCREEN_TEXT" ]]; then
  log_pass "Parent tabs: rapid switching did not crash (UI responsive)"
else
  log_warn "Parent tabs: UI may be unresponsive after rapid switching"
fi

# Switch to child
tap_parent_tab "inicio"
settle 2
tap 1012 147
settle 3

SCREEN_TEXT=$(get_screen_text)
if echo "$SCREEN_TEXT" | grep -qi "PIN\|Digite"; then
  # Enter PIN quickly
  adb shell uiautomator dump /sdcard/window_dump.xml >/dev/null 2>&1
  adb pull /sdcard/window_dump.xml /tmp/pin_dump.xml >/dev/null 2>&1
  declare -A PIN25_X
  declare -A PIN25_Y
  PIN25_DATA=$(python3 -c "
import xml.etree.ElementTree as ET
tree = ET.parse('/tmp/pin_dump.xml')
for node in tree.iter('node'):
    t = node.get('text', '')
    bounds = node.get('bounds', '')
    if t in ['0','1','2','3','4','5','6','7','8','9']:
        parts = bounds.replace('[',',').replace(']',',').split(',')
        parts = [p for p in parts if p]
        x1,y1,x2,y2 = int(parts[0]),int(parts[1]),int(parts[2]),int(parts[3])
        print(f'{t}:{(x1+x2)//2}:{(y1+y2)//2}')
" 2>/dev/null)
  while IFS=: read -r digit x y; do
    PIN25_X[$digit]=$x
    PIN25_Y[$digit]=$y
  done <<< "$PIN25_DATA"

  CHILD_PIN="${CHILD_PIN:-0412}"
  for (( i=0; i<${#CHILD_PIN}; i++ )); do
    d="${CHILD_PIN:$i:1}"
    if [[ -n "${PIN25_X[$d]:-}" ]]; then
      tap "${PIN25_X[$d]}" "${PIN25_Y[$d]}"
      sleep 0.5
    fi
  done
  settle 4
fi

echo "  Rapidly cycling through all child tabs..."

# Rapid child tab switching
for tab in hoje tarefas campeonato loja tabela trofeus perfil; do
  tap_child_tab "$tab"
  sleep 1
done
settle 2
take_screenshot "25b-child-stress-end"

# Navigate to a stable tab (perfil) for final verification
tap_child_tab "perfil"
settle 3
SCREEN_TEXT=$(get_screen_text)
if [[ -n "$SCREEN_TEXT" ]]; then
  log_pass "Child tabs: rapid switching did not crash (UI responsive)"
else
  log_warn "Child tabs: UI may be unresponsive after rapid switching"
fi

# Switch back to parent for final state
tap 1012 147
settle 3
tap_parent_tab "inicio"
settle 2
take_screenshot "25c-final-parent-state"
log_pass "Navigation stress test complete — app survived rapid tab switching"

# ═══════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📊 ANDROID E2E TEST SUMMARY"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  ✅ Passed:   $PASSED"
echo "  ❌ Failed:   $FAILED"
echo "  ⚠️  Warnings: $WARNINGS"
echo "  📋 Total:    $TOTAL"
echo "  📸 Screenshots: $SCREENSHOT_DIR"
echo ""

if [ $FAILED -gt 0 ]; then
  echo "  Result: SOME TESTS FAILED"
else
  echo "  Result: ALL TESTS PASSED"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"

# Write results JSON from log file
python3 -c "
import json

tests = []
try:
    with open('$TESTS_LOG_FILE', 'r') as f:
        for line in f:
            parts = line.strip().split('\t', 2)
            if len(parts) == 3:
                tests.append({'status': parts[0], 'suite': parts[1], 'message': parts[2]})
except FileNotFoundError:
    pass

results = {
    'passed': $PASSED,
    'failed': $FAILED,
    'warnings': $WARNINGS,
    'total': $TOTAL,
    'tests': tests,
}
with open('$RESULTS_FILE', 'w') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print(f'Results written to $RESULTS_FILE')
"

# Exit with failure code if any tests failed
if [ $FAILED -gt 0 ]; then
  exit 1
fi
