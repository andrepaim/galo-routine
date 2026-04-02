# Rotina do Atleticano ⭐

> A self-hosted routine and reward app for kids, themed around Atlético Mineiro.

A self-hosted routine and reward app for kids, themed around Atlético Mineiro (Galo). Complete your daily tasks, earn stars, redeem rewards — and celebrate every win with the latest Galo news.

---

## Screenshots

| Child | Parent | Manage |
|:---:|:---:|:---:|
| ![Child screen](screenshots/child.png) | ![Parent screen](screenshots/parent.png) | ![Manage screen](screenshots/manage.png) |

| Rewards | Celebration | Galo News |
|:---:|:---:|:---:|
| ![Rewards](screenshots/rewards.png) | ![Celebration](screenshots/celebration.png) | ![Galo News](screenshots/news.png) |

---

## Why I Built This

Routine apps for kids are easy to find. Most of them work. But they're generic — star charts and task lists that could belong to anyone.

My son is an Atleticano. I wanted completing his daily tasks to feel like being part of the club, not filling out a chore chart. So I built it around Galo: every completed task ends with a celebration animation and the latest headline — a transfer rumour, a match result, an upcoming fixture at Arena MRV. The reward isn't just a star. It's a moment of connection to something he actually cares about.

The long-term rewards work the same way. Instead of generic prizes, they're built around the calendar: the next home match, the next late-night weekday game on TV. These rewards are dynamic — pulled every morning from the ESPN API and Google News by a cron job running on the same VPS. No subscription app ships that. It's not a feature you can unlock with a premium plan. It has to be built for one family, around one club.

And it costs nothing beyond the VPS I was already running.

---

## Features

- **Child view** — today's task list, star balance, reward redemption. After each task: celebration animation + Galo news card (upcoming matches, recent headlines)
- **Parent view** — approve or reject task completions and reward redemptions
- **Manage view** — add/edit tasks and rewards; one-tap add for AI-suggested Galo rewards (stadium tickets, TV game nights, static prizes)
- **PIN guard** — triple-tap the Galo badge to switch from child → parent; PIN entry to switch back
- **Real-time sync** — SSE-based invalidation; all connected devices update instantly on any write
- **PWA** — installable, fullscreen standalone on mobile

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS — Galo theme (`galoBlack: #1A1A1A`, `starGold: #FFD700`) |
| Routing | React Router v6 |
| State | Zustand — global state (auth, tasks, completions, rewards) |
| Auth | Firebase — Google sign-in only (no Firestore) |
| PWA | `manifest.json` + Vite build |
| Backend | Express + better-sqlite3 (WAL mode) |
| Real-time | SSE for real-time push |
| Process | Systemd service: `galo-routine.service` |

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
│  backend/ (Express, port 3200)                │
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

## Self-hosting

### Quick start

```bash
# 1. Clone
git clone https://github.com/andrepaim/galo-routine.git
cd galo-routine

# 2. Configure
cp .env.example .env
# Edit .env and set FAMILY_ID and DB_PATH

# Also set VITE_FAMILY_ID in the frontend env:
echo "VITE_FAMILY_ID=your-family-id" >> frontend/.env

# 3. Backend
cd backend
npm install
node src/index.js   # http://127.0.0.1:3200

# 4. Frontend
cd frontend
npm install
npm run dev         # http://localhost:5174
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `FAMILY_ID` | Yes | Unique identifier for your family |
| `DB_PATH` | Yes | Path to the SQLite database file |
| `VITE_FAMILY_ID` | Yes | Family ID for the frontend (set in `frontend/.env`) |

### Development

```bash
# Backend (port 3200, binds 127.0.0.1)
cd backend && npm install && node src/index.js

# Frontend (Vite dev server)
cd frontend && npm install && npm run dev
```

### Deploy (systemd)

Build and deploy the frontend:

```bash
bash deploy.sh
```

Builds the frontend and copies `dist/` → `/var/www/rotinadoatleticano/`.

The backend runs as a persistent systemd service:

```bash
systemctl status galo-routine.service
systemctl restart galo-routine.service
```

Service file example:

```ini
[Unit]
Description=Galo Routine API
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/galo-routine/backend
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=/path/to/galo-routine/.env

[Install]
WantedBy=multi-user.target
```

Apache reverse proxy configuration:

```apache
ProxyPreserveHost On
ProxyPass /api/ http://127.0.0.1:3200/api/
ProxyPassReverse /api/ http://127.0.0.1:3200/api/
```

---

## Galo Integration

A daily cron (`scripts/galo-matches.mjs`, 08:00 BRT) fetches:

1. **Upcoming fixtures** via ESPN public API — Brasileirão, Libertadores, Sul-Americana (no key needed)
2. **Recent news** via Google News RSS (`q=Atletico+Mineiro`, last 3 days)
3. Builds **suggested rewards** for the Manage screen:
   - 🏟️ Next home match at Arena MRV (100⭐, dynamic)
   - 📺 Next weekday night game ≥ 19:00 BRT (25⭐, dynamic)
   - 🎮 2h de FIFA (15⭐), 🕹️ 1h videogame (10⭐), 👕 Camisa do Galo (80⭐)

After a task is completed, the child sees a `GaloCelebration` animation, then a `GaloNewsCard` with the next unseen headline or fixture. Seen IDs are tracked so nothing repeats.

A Telegram alert fires if the next home match is within 7 days.

---

## Scripts

| Script | What it does |
|---|---|
| `scripts/galo-matches.mjs` | Daily cron — ESPN + News → backend; Telegram alert if home match ≤ 7 days |
| `scripts/import-tasks-admin.mjs` | One-shot admin import of the full task list |
| `scripts/migrate-from-firebase.mjs` | One-shot migration from Firebase Firestore to SQLite |

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

No blue. Cruzeiro is the arch-rival. The theme is black and gold, always.

## License

MIT
