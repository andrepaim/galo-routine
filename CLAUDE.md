# CLAUDE.md

Kids star-reward routine tracker with Google OAuth, served as a PWA at rotinadoatleticano.duckdns.org.

## Tech Stack

- **Backend:** Node.js (v24), Express, better-sqlite3, JWT (cookie-based auth), Google OAuth2
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Zustand, react-router-dom
- **Database:** SQLite (WAL mode), file at `backend/galo-routine.db` (or `DB_PATH` env var)
- **Deploy:** systemd service behind Apache reverse proxy, frontend built to `/var/www/rotinadoatleticano/`
- **Repo:** git@github.com:andrepaim/galo-routine.git

## Local Development

```bash
# Backend (port 3200, binds 127.0.0.1)
cd backend && npm install && npm run dev

# Frontend (Vite dev server)
cd frontend && npm install && npm run dev
```

Backend uses `node --watch` for auto-reload. Frontend uses Vite HMR.

## Testing

```bash
cd backend && npm test          # Jest + supertest
cd frontend && npm test         # Vitest + testing-library
cd frontend && npx playwright test  # E2E tests
```

## Deploy

```bash
./deploy.sh   # Builds frontend, rsyncs dist/ to /var/www/rotinadoatleticano/
sudo systemctl restart galo-routine   # Restart backend after changes
```

- Service: `galo-routine.service`
- Backend port: 3200 (127.0.0.1 only, behind Apache reverse proxy)
- Frontend: static files served by Apache from `/var/www/rotinadoatleticano/`

## Architecture

- `backend/src/index.js` -- entry point, starts Express on port 3200
- `backend/src/app.js` -- Express app setup, middleware, route mounting
- `backend/src/db.js` -- SQLite connection and schema (auto-creates tables)
- `backend/src/sse.js` -- Server-Sent Events for real-time family-scoped invalidation
- `backend/src/middleware/auth.js` -- JWT auth middleware, cookie-based sessions
- `backend/src/routes/` -- route handlers: auth, family, tasks, periods, completions, rewards, redemptions, galo, canguru
- `frontend/src/` -- React app (pages, components, lib, constants)

### Data Model

families -> users, tasks, periods, rewards, galo_schedule, galo_news_state, canguru_sessions
periods -> completions
rewards -> redemptions

All IDs are nanoid strings. Auth uses Google OAuth with an email allowlist.

## Environment Variables

Env file: `/etc/galo-routine.env` (mode 600, loaded via systemd `EnvironmentFile`)

- `SESSION_SECRET` -- JWT signing secret
- `GOOGLE_CLIENT_ID` -- Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` -- Google OAuth client secret
- `PUBLIC_URL` -- public base URL (default: https://rotinadoatleticano.duckdns.org)
- `ALLOWED_EMAILS` -- comma-separated list of allowed Google emails
- `DB_PATH` -- SQLite database path (default: `backend/galo-routine.db`)
- `NODE_ENV` -- set to `production` in systemd unit

## Notes

- Backend binds to 127.0.0.1 only; Apache handles TLS and proxying.
- SSE endpoint at `/api/events` broadcasts invalidation events per family.
- The `deploy.sh` script preserves the `canguru/` directory in the web root during rsync.
- SQLite DB has WAL mode and foreign keys enabled.
