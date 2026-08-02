#!/usr/bin/env bash
set -euo pipefail

# ─── Config ─────────────────────────────────────────────────
HOST="relay-vps"                 # ~/.ssh/config
SERVER_PATH="/opt/relay"
BRANCH="${1:-main}"              # branch da deployare (arg opzionale)

OK()   { echo -e "\033[32m   OK: $1\033[0m"; }
FAIL() { echo -e "\033[31m   FAIL: $1\033[0m"; }
INFO() { echo -e "\033[90m   -- $1\033[0m"; }

[[ -d .git ]] || { FAIL "Non sei nella root del repo git"; exit 1; }

INFO "Branch: $BRANCH"
INFO "1/4 Push locale..."
git push origin "$BRANCH"

INFO "2/4 Pull sul server ($HOST:$SERVER_PATH)..."
ssh "$HOST" "cd $SERVER_PATH && git pull origin $BRANCH"

INFO "3/4 Rebuild + restart (nextjs)..."
ssh "$HOST" "cd $SERVER_PATH && docker compose up -d --build nextjs"

INFO "4/4 Health check..."
sleep 5
if ssh "$HOST" 'curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health' | grep -q "200"; then
  OK "Deploy completato — health OK"
else
  FAIL "Health check fallito — guarda i log: ./vps-logs.sh nextjs"
  exit 1
fi
