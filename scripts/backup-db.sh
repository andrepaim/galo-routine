#!/bin/bash
# Daily SQLite backup for galo-routine DB
# Keeps last 30 days of backups

DB="/root/galo-routine/backend/galo-routine.db"
BACKUP_DIR="/root/galo-routine/backups"
DATE=$(date +%Y-%m-%d)

mkdir -p "$BACKUP_DIR"

# Use SQLite's .backup command (safe even while DB is live)
sqlite3 "$DB" ".backup $BACKUP_DIR/galo-routine-$DATE.db"

echo "[$(date)] Backup saved: $BACKUP_DIR/galo-routine-$DATE.db"

# Prune backups older than 30 days
find "$BACKUP_DIR" -name "galo-routine-*.db" -mtime +30 -delete
