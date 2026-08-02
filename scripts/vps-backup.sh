#!/usr/bin/env bash
set -euo pipefail

# ─── Config ─────────────────────────────────────────────────
HOST="relay-vps"
SERVER_PATH="/opt/relay"
BACKUP_DIR="/root/backups"
DATE="$(date +%Y%m%d-%H%M)"

OK()   { echo -e "\033[32m   OK: $1\033[0m"; }
INFO() { echo -e "\033[90m   -- $1\033[0m"; }

INFO "1/3 Dump del database (postgres, container supabase db)..."
ssh "$HOST" "mkdir -p $BACKUP_DIR && docker exec \$(docker ps -qf name=supabase_db) pg_dump -U postgres -d postgres -Fc -f /tmp/relay-$DATE.dump 2>/dev/null && docker cp \$(docker ps -qf name=supabase_db):/tmp/relay-$DATE.dump $BACKUP_DIR/ && docker exec \$(docker ps -qf name=supabase_db) rm -f /tmp/relay-$DATE.dump"
OK "DB dump: $BACKUP_DIR/relay-$DATE.dump"

INFO "2/3 Snapshot Hetzner (rete/OS level)..."
bash "$(dirname "$0")/hetzner-api.sh" snapshot "backup-$DATE" || INFO "snapshot fallito (server spento?)"

INFO "3/3 Pulizia dump locali vecchi (keep 7)..."
ssh "$HOST" "ls -t $BACKUP_DIR/relay-*.dump | tail -n +8 | xargs -r rm -f"

OK "Backup completato: $DATE"
