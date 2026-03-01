# Rotina do Atleticano ⭐

A private, self-hosted routine and reward app for kids, themed around Atlético Mineiro (Galo).

**Production:** https://rotinadoatleticano.duckdns.org

---

## Screenshots

| Child | Parent | Manage |
|:---:|:---:|:---:|
| ![Child screen](screenshots/child.png) | ![Parent screen](screenshots/parent.png) | ![Manage screen](screenshots/manage.png) |

---

## What is this?

A daily routine tracker where a child completes tasks to earn stars ⭐, then redeems stars for rewards. Parents approve completions and redemptions. The whole thing is wrapped in an Atlético Mineiro theme — stars become goals, and completing your day feels like winning a match.

Built for one family. Not a SaaS product.

---

## Features

- **Child view** — today's task list, star balance, reward redemption. After each task: celebration animation + Galo news card (upcoming matches, recent headlines)
- **Parent view** — approve or reject task completions and reward redemptions
- **Manage view** — add/edit tasks and rewards; one-tap add for AI-suggested Galo rewards (stadium tickets, TV game nights, static prizes)
- **PIN guard** — triple-tap the Galo badge to switch from child → parent; PIN entry to switch back
- **Real-time sync** — SSE-based invalidation; all connected devices update instantly on any write
- **PWA** — installable, fullscreen standalone on mobile

---

## Architecture

```
┌──────────────────────────────────────────────┐
│  Browser (React + Vite + Tailwind + PWA)      │
│                                               │
│  /child  /parent  /parent/manage              │
│                                               │
│  Zustand stores  ←  SSE invalidation stream  │
└────────────────────┬─────────────────────────┘
                     │ HTTP + SSE (/api/*)
              Apache reverse proxy
                     │
┌────────────────────▼─────────────────────────┐
│  galo-routine backend (Express, port 3200)    │
│                                               │
│  /api/tasks  /api/completions  /api/rewards   │
│  /api/redemptions  /api/family  /api/periods  │
│  /api/galo/schedule  /api/galo/news-state     │
│                                               │
│  SQLite (better-sqlite3, WAL mode)            │
│  SSE /api/events — broadcasts on writes       │
└──────────────────────────────────────────────┘
                     ↑
         scripts/galo-matches.mjs (daily cron)
         ESPN API + Google News RSS
```

---

## Tech Stack

**Frontend**
- React 18 + TypeScript + Vite
- Tailwind CSS — Galo theme (`galoBlack: #1A1A1A`, `starGold: #FFD700`)
- React Router v6
- Zustand — global state (auth, tasks, completions, rewards)
- Firebase — Google sign-in only (no Firestore)
- PWA — `manifest.json` + Vite build

**Backend (`/root/galo-routine/`)**
- Express + better-sqlite3
- SSE for real-time push
- Systemd service: `galo-routine.service`

---

## Screens

| Route | Who | What |
|---|---|---|
| `/login` | Both | Google sign-in |
| `/register` | Parent | First-time family setup |
| `/child` | Child | Today's tasks + stars + rewards |
| `/parent` | Parent | Approve completions + redemptions |
| `/parent/manage` | Parent | Add/edit tasks, rewards, Galo suggestions |
| `/parent-pin` | Both | PIN entry to switch to parent role |

Default entry is `/child`. Parent access requires PIN.

---

## Database Schema

8 tables in `galo-routine.db`:

| Table | Contents |
|---|---|
| `families` | Single family row — names, PIN, star balance, streaks |
| `tasks` | Task definitions — name, icon, star value, recurrence, time window |
| `periods` | Weekly/monthly periods with star budgets and outcomes |
| `completions` | Task completion records — pending/approved/rejected |
| `rewards` | Reward catalogue — cost, icon, availability, approval flag |
| `redemptions` | Redemption requests — pending/fulfilled/rejected |
| `galo_schedule` | Latest fixtures + news + suggested rewards (written by cron) |
| `galo_news_state` | Tracks which news IDs have already been shown to the child |

---

## Galo Integration

A daily cron (`scripts/galo-matches.mjs`, 08:00 BRT) fetches:

1. **Upcoming fixtures** via ESPN public API — Brasileirão, Libertadores, Sul-Americana (no key needed)
2. **Recent news** via Google News RSS (`q=Atletico+Mineiro`, last 3 days)
3. Builds **suggested rewards** for the Manage screen:
   - 🏟️ Next home match at Arena MRV (100⭐, dynamic)
   - 📺 Next weekday night game ≥ 19:00 BRT (25⭐, dynamic)
   - 🎮 2h de FIFA (15⭐), 🕹️ 1h videogame (10⭐), 👕 Camisa do Galo (80⭐)

After a task is completed, the child sees a `GaloCelebration` animation, then a `GaloNewsCard` with the next unseen headline or fixture. Seen IDs are tracked in `galo_news_state` so nothing repeats.

A Telegram alert fires if the next home match is within 7 days.

---

## Running Locally

### Backend

```bash
cd /root/galo-routine
npm install
node src/index.js   # http://localhost:3200
```

### Frontend

```bash
cd /root/star-routine-pwa
npm install
npm run dev         # http://localhost:5174
```

The Vite dev server proxies `/api/*` → `http://localhost:3200`.

---

## Deploying to Production

```bash
cd /root/star-routine-pwa
bash deploy.sh
```

Builds the frontend and copies `dist/` → `/var/www/rotinadoatleticano/`. Apache serves the static files and proxies `/api/` to the backend.

The backend runs as a persistent systemd service:

```bash
systemctl status galo-routine.service
systemctl restart galo-routine.service
```

---

## Scripts

| Script | What it does |
|---|---|
| `scripts/galo-matches.mjs` | Daily cron — ESPN + News → backend; Telegram alert if home match ≤ 7 days |
| `scripts/import-tasks-admin.mjs` | One-shot admin import of the full task list via Firebase Admin SDK |

---

## Family Config

- **Family ID:** hardcoded in backend (`EXmCPl8hrnOYDzrPewHoXlGa5762`)
- **Auth:** Google sign-in; allowed email enforced in Firebase console
- **No blue.** Cruzeiro is the arch-rival. The theme is black and gold, always.
