#!/usr/bin/env bash
set -euo pipefail

# Monitora lo sblocco rete del server Hetzner (blocked:true → false).
# Uso: hetzner-wait-unblock.sh [--timeout minuti] [--interval secondi]
# Esce 0 quando sbloccato, 1 su timeout.

TIMEOUT_MIN=60      # default 60 minuti
INTERVAL=30         # check ogni 30s

while [[ $# -gt 0 ]]; do
  case "$1" in
    --timeout)   TIMEOUT_MIN="$2"; shift 2 ;;
    --interval)  INTERVAL="$2"; shift 2 ;;
    *) echo "Uso: hetzner-wait-unblock.sh [--timeout minuti] [--interval secondi]"; exit 1 ;;
  esac
done
SERVER_ID="142381430"
API="https://api.hetzner.cloud/v1"
TOKEN="${HCLOUD_TOKEN:-$(cat "${HCLOUD_TOKEN_FILE:-$HOME/.config/hcloud/contexts/pi-full-access}")}"

start=$(date +%s)
deadline=$((start + TIMEOUT_MIN * 60))

echo "Attendo sblocco rete (timeout ${TIMEOUT_MIN}min, check ogni ${INTERVAL}s) — Ctrl+C per fermare"
while :; do
  blocked=$(curl -s --max-time 10 -H "Authorization: Bearer $TOKEN" "$API/servers/$SERVER_ID" | python3 -c "
import json,sys
try:
    pn=json.load(sys.stdin)['server']['public_net']
    print(pn['ipv4']['blocked'])
except Exception:
    print('unknown')
")
  now=$(date +%s)
  if [ "$blocked" = "False" ]; then
    echo -e "\033[32m✓ SBLOCCO AVVENUTO — rete del server di nuovo attiva!\033[0m"
    exit 0
  fi
  if [ "$blocked" = "unknown" ]; then
    echo "[$(date +%H:%M:%S)] API non risponde (token/network?)"
  else
    echo "[$(date +%H:%M:%S)] ancora bloccato..."
  fi
  if [ "$now" -ge "$deadline" ]; then
    echo -e "\033[31mTimeout dopo ${TIMEOUT_MIN}min — ancora bloccato. Riprova: ./hetzner-wait-unblock.sh\033[0m"
    exit 1
  fi
  sleep "$INTERVAL"
done
