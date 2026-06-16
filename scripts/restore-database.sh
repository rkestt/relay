#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: $0 <backup-file.dump.gz>"
  exit 1
fi

BACKUP_FILE=$1
CONTAINER_NAME="supabase-db"
DB_NAME="postgres"
DB_USER="postgres"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "Starting database restore from $BACKUP_FILE"

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo "Decompressing backup..."
  gunzip -k "$BACKUP_FILE"
  BACKUP_FILE="${BACKUP_FILE%.gz}"
fi

# Restore database
docker exec -i "$CONTAINER_NAME" pg_restore -U "$DB_USER" -d "$DB_NAME" --clean --if-exists < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Database restored successfully"
else
  echo "ERROR: Restore failed"
  exit 1
fi
