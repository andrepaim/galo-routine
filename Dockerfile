# ── Stage 1: Build frontend ──────────────────────────────────────
FROM node:22-alpine AS frontend-build

WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Runtime ─────────────────────────────────────────────
FROM node:22-alpine

# better-sqlite3 needs build tools at install time on alpine
RUN apk add --no-cache python3 make g++

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --production && apk del python3 make g++

COPY backend/ ./

# Copy the Docker entrypoint (serves frontend + binds 0.0.0.0)
COPY docker-entrypoint.js ./docker-entrypoint.js

# Copy built frontend
COPY --from=frontend-build /build/frontend/dist /app/frontend/dist

ENV NODE_ENV=production
ENV FRONTEND_DIST=/app/frontend/dist

EXPOSE 3200

CMD ["node", "docker-entrypoint.js"]
