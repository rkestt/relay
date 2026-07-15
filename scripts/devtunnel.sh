#!/bin/sh
# devtunnel — Expose r6Hub dev server via Cloudflare quick tunnel
# Usage: ./scripts/devtunnel.sh [start|stop|status] [port]
# Default port: 4000 (r6Hub docker app)

set -e
NAME="r6hub-devtunnel"
PORT="${2:-4000}"
LOGFILE="/tmp/${NAME}.log"
PIDFILE="/tmp/${NAME}.pid"

cloudflared="$(command -v cloudflared || echo /home/andrea/.local/bin/cloudflared)"

stop_tunnel() {
  if [ -f "$PIDFILE" ]; then
    pid=$(cat "$PIDFILE")
    kill "$pid" 2>/dev/null && echo "■ tunnel fermato (pid $pid)" || echo "tunnel già fermo"
    rm -f "$PIDFILE"
  else
    pkill -f "cloudflared.*localhost:$PORT" 2>/dev/null && echo "■ tunnel fermato" || echo "nessun tunnel su :$PORT"
  fi
}

case "${1:-start}" in
  start|up)
    # check già in esecuzione
    if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
      echo "◆ tunnel già attivo per :$PORT"
      grep -oE "https://[a-z0-9-]+\.trycloudflare\.com" "$LOGFILE" 2>/dev/null | tail -1
      exit 0
    fi

    echo "▶ avvio tunnel per http://localhost:$PORT ..."
    nohup "$cloudflared" tunnel --url "http://localhost:$PORT" --no-autoupdate > "$LOGFILE" 2>&1 &
    pid=$!
    echo $pid > "$PIDFILE"

    # attendi URL (max 15s)
    url=""
    for i in $(seq 1 15); do
      url=$(grep -oE "https://[a-z0-9-]+\.trycloudflare\.com" "$LOGFILE" 2>/dev/null | tail -1)
      [ -n "$url" ] && break
      sleep 1
    done

    if [ -n "$url" ]; then
      echo "✓ tunnel attivo"
      echo "  $url"
      echo
      echo "  Usa da telefono: $url"
      echo "  Stop: \`$0 stop\`"
    else
      echo "✗ errore — URL non ricevuto dopo 15s. Log:"
      tail -5 "$LOGFILE"
      exit 1
    fi
    ;;

  stop|down)
    stop_tunnel
    ;;

  status)
    if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
      url=$(grep -oE "https://[a-z0-9-]+\.trycloudflare\.com" "$LOGFILE" 2>/dev/null | tail -1)
      echo "◆ attivo su :$PORT → $url"
    else
      echo "◇ fermo (nessun tunnel su :$PORT)"
    fi
    ;;

  *)
    echo "uso: $0 [start|stop|status] [porta]" >&2
    exit 1
    ;;
esac
