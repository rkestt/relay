#!/usr/bin/env bash
set -euo pipefail

# ─── Config ─────────────────────────────────────────────────
HOST="r6hub-vps"
SERVER_PATH="/opt/r6hub"
SERVICE="${1:-nextjs}"           # nextjs (default) | caddy | db | auth | storage
LINES="${2:-100}"

OK()   { echo -e "\033[32m   OK: $1\033[0m"; }
INFO() { echo -e "\033[90m   -- $1\033[0m"; }

INFO "Log '$SERVICE' (ultime $LINES righe):"
ssh "$HOST" "cd $SERVER_PATH && docker compose logs --tail=$LINES $SERVICE"
