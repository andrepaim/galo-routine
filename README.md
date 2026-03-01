# galo-routine

Self-hosted backend API for [Rotina do Atleticano](https://github.com/andrepaim/star-routine-pwa) — a routine and reward app for kids.

Built with Express + SQLite. Designed to run as a systemd service on a Linux VPS, proxied by Apache.

---

## Stack

- Node.js + Express
- better-sqlite3 (WAL mode)
- Server-Sent Events for real-time push
- dotenv for configuration

---

## Setup

### 1. Install

```bash
git clone https://github.com/andrepaim/galo-routine.git
cd galo-routine
npm install
```

### 2. Configure

```bash
cp .env.example .env
```

Edit `.env`:

```env
FAMILY_ID=your-family-id
```

`FAMILY_ID` is the primary key used across all tables. It's a single-family app — one value, hardcoded to your setup.

### 3. Run

```bash
node src/index.js   # listens on 127.0.0.1:3200
```

### Production (systemd)

```ini
[Unit]
Description=Galo Routine API
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/galo-routine
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now galo-routine.service
```

---

## API

All routes prefixed `/api`. No authentication — designed for localhost-only access behind a reverse proxy.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/family` | Get family data (star balance, names, streaks) |
| `PUT` | `/api/family` | Update family fields |
| `PUT` | `/api/family/increment` | Atomically increment a numeric field |
| `GET` | `/api/tasks` | List active tasks |
| `POST` | `/api/tasks` | Create task |
| `PUT` | `/api/tasks/:id` | Update task |
| `DELETE` | `/api/tasks/:id` | Delete task |
| `GET` | `/api/periods` | List periods |
| `GET` | `/api/periods/active` | Get current active period |
| `POST` | `/api/periods` | Create period |
| `PUT` | `/api/periods/:id` | Update period |
| `GET` | `/api/completions/:periodId` | List completions for a period |
| `POST` | `/api/completions/:periodId` | Record a completion |
| `PUT` | `/api/completions/:periodId/:id` | Approve / reject completion |
| `GET` | `/api/rewards` | List rewards |
| `POST` | `/api/rewards` | Create reward |
| `PUT` | `/api/rewards/:id` | Update reward |
| `DELETE` | `/api/rewards/:id` | Delete reward |
| `GET` | `/api/redemptions` | List redemptions |
| `POST` | `/api/redemptions` | Request redemption |
| `PUT` | `/api/redemptions/:id` | Fulfil / reject redemption |
| `GET` | `/api/galo/schedule` | Get latest Galo fixtures + news + suggested rewards |
| `PUT` | `/api/galo/schedule` | Write schedule data (called by daily cron) |
| `GET` | `/api/galo/news-state` | Get shown news IDs |
| `PUT` | `/api/galo/news-state` | Update shown news IDs |
| `POST` | `/api/auth/verify-pin` | Verify child PIN |
| `GET` | `/api/events` | SSE stream — broadcasts `invalidate` events on writes |
| `GET` | `/api/health` | Health check |

### SSE Events

```json
{ "type": "invalidate", "collection": "tasks" }
{ "type": "ping" }
```

The frontend uses a singleton `EventSource` on `/api/events`. Any write operation broadcasts an invalidation event for the affected collection, triggering a re-fetch on all connected clients.

---

## Schema

8 tables in SQLite:

| Table | Contents |
|---|---|
| `families` | Names, PIN, star balance, streaks |
| `tasks` | Task definitions — name, icon, star value, recurrence, time window |
| `periods` | Weekly/monthly periods with star budgets and outcomes |
| `completions` | Task completion records — pending / approved / rejected |
| `rewards` | Reward catalogue — cost, icon, availability, approval flag |
| `redemptions` | Redemption requests — pending / fulfilled / rejected |
| `galo_schedule` | Latest Atlético Mineiro fixtures, news, and suggested rewards |
| `galo_news_state` | Tracks which news IDs have been shown to the child |

---

## Tests

```bash
npm test
```

Jest test suite covering all routes.

---

## Apache Proxy

Add to your HTTPS VirtualHost:

```apache
ProxyPreserveHost On
ProxyPass /api/ http://127.0.0.1:3200/api/
ProxyPassReverse /api/ http://127.0.0.1:3200/api/
```

```bash
a2enmod proxy proxy_http
systemctl reload apache2
```
