#!/bin/bash

# Configuration
BACKUP_DIR="./backups"
CONTAINER_NAME="supabase-db"
DB_NAME="postgres"
DB_USER="postgres"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

echo "Starting database backup at $(date)"

# Dump database
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.dump"
docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" -F c "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Backup created: $BACKUP_FILE"

  # Compress backup
  gzip "$BACKUP_FILE"
  echo "Backup compressed: ${BACKUP_FILE}.gz"

  # Remove old backups
  find "$BACKUP_DIR" -name "backup-*.dump.gz" -mtime +$RETENTION_DAYS -delete
  echo "Old backups removed (older than $RETENTION_DAYS days)"

  # Show backup size
  ls -lh "${BACKUP_FILE}.gz"
else
  echo "ERROR: Backup failed"
  exit 1
fi

echo "Backup completed at $(date)"
