#!/usr/bin/env bash
set -euo pipefail

# ─── Config ─────────────────────────────────────────────────
HOST="relay-vps"
SERVER_PATH="/opt/relay"

OK()   { echo -e "\033[32m   OK: $1\033[0m"; }
INFO() { echo -e "\033[90m   -- $1\033[0m"; }

echo "═══ relay VPS Status ═══"
INFO "Sistema:"
ssh "$HOST" 'uptime; echo; df -h / | tail -1; echo; free -h | head -2'
echo
INFO "Container docker:"
ssh "$HOST" 'cd '$SERVER_PATH' && docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"'
echo
INFO "Health app (locale):"
ssh "$HOST" 'curl -s -o /dev/null -w "  HTTP %{http_code}\n" http://127.0.0.1:3000/api/health' || FAIL "health non raggiungibile"
