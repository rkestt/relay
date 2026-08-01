#!/usr/bin/env bash
set -euo pipefail

# ─── Config ─────────────────────────────────────────────────
SERVER_NAME="r6hub-vps"
SERVER_ID="142381430"
FW_NAME="r6hub-fw"
FW_ID="11151434"
API="https://api.hetzner.cloud/v1"

# Token: ~/.config/hcloud/contexts/pi-full-access (o env HCLOUD_TOKEN)
TOKEN="${HCLOUD_TOKEN:-$(cat "${HCLOUD_TOKEN_FILE:-$HOME/.config/hcloud/contexts/pi-full-access}" 2>/dev/null || echo '')}"

OK()   { echo -e "\033[32m   OK: $1\033[0m"; }
FAIL() { echo -e "\033[31m   FAIL: $1\033[0m"; }
INFO() { echo -e "\033[90m   -- $1\033[0m"; }

usage() {
  cat <<'EOF'
Uso: hetzner-api.sh <comando> [args]

Comandi:
  status              Stato server + IP (detect blocked)
  power <on|off|reboot>  Accendi/spegni/riavvia server
  fw-rules            Regole firewall correnti
  fw-check <port>     Verifica se una porta è aperta nel firewall
  fw-close <port>     Rimuove regola di ingresso per una porta (TCP)
  snapshot [name]     Snapshot del server (default: auto-datato)
  snapshots           Lista snapshot
  keys                Lista chiavi SSH del progetto
  help                Questo help

Dipendenze: curl, jq (opzionale per formattazione)
EOF
  exit 0
}

api() { curl -s --max-time 15 -H "Authorization: Bearer $TOKEN" "$API$1"; }

cmd_status() {
  echo "== Server: $SERVER_NAME =="
  hcloud server describe "$SERVER_NAME" --output json 2>/dev/null | python3 -c "
import json,sys
d=json.load(sys.stdin)
s=d.get('server',d)  # hcloud describe: oggetto diretto
pn=s['public_net']
print('status   :', s['status'])
print('ipv4     :', pn['ipv4']['ip'], '| blocked:', pn['ipv4']['blocked'])
print('ipv6     :', pn['ipv6']['ip'], '| blocked:', pn['ipv6']['blocked'])
" || echo "(hcloud non configurato — usa HCLOUD_TOKEN o context pi-full-access)"
  if curl -s --max-time 5 -o /dev/null -w "%{http_code}" https://142.132.176.234/ 2>/dev/null | grep -q "200\|301\|302"; then
    OK "Rete raggiungibile (HTTP risponde)"
  else
    FAIL "Rete NON raggiungibile — IP probabilmente blocked (quota traffico) o servizio giu'"
  fi
}

cmd_power() {
  local action="$1"
  case "$action" in
    on)     hcloud server poweron "$SERVER_NAME" ;;
    off)    hcloud server shutdown "$SERVER_NAME" ;;
    reboot) hcloud server reboot "$SERVER_NAME" ;;
    *) FAIL "azione non valida: $action (on|off|reboot)"; exit 1 ;;
  esac
  OK "power $action inviato"
}

cmd_fw_rules() {
  echo "== Firewall: $FW_NAME =="
  hcloud firewall describe "$FW_NAME" --output json 2>/dev/null | python3 -c "
import json,sys
d=json.load(sys.stdin)
f=d.get('firewall',d)  # hcloud describe: oggetto diretto
for r in f.get('rules',[]):
    print(f\"  {r['direction']:4} {r['protocol']:3} port {str(r.get('port','any')):5} src {','.join(r.get('source_ips',[]))}\")
print('applied_to:', [a['type'] for a in f.get('applied_to',[])])
" || curl -s -H "Authorization: Bearer $TOKEN" "$API/firewalls/$FW_ID" | python3 -m json.tool
}

cmd_fw_check() {
  local port="$1"
  cmd_fw_rules | grep -q "port $port" && OK "Porta $port APERTA nel firewall" || FAIL "Porta $port NON presente nel firewall"
}

cmd_fw_close() {
  local port="$1"
  INFO "Leggo regole correnti..."
  local rules_json
  rules_json=$(api "/firewalls/$FW_ID" | python3 -c "
import json,sys
f=json.load(sys.stdin)['firewall']
keep=[r for r in f['rules'] if not (r.get('port')==str($port) and r['protocol']=='tcp')]
print(json.dumps(keep))
")
  INFO "Rimuovo porta $port (TCP) dalle regole di ingresso..."
  curl -s --max-time 15 -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    "$API/firewalls/$FW_ID/actions/set_rules" -d "{\"rules\": $rules_json}" | python3 -c "
import json,sys
d=json.load(sys.stdin)
a=d.get('action',{})
print('action:', a.get('command'), '|', a.get('status'))
" 
  OK "Porta $port chiusa (se era presente)"
}

cmd_snapshot() {
  local name="${1:-auto-$(date +%Y%m%d-%H%M)}"
  hcloud server create-image --type snapshot --description "$name" "$SERVER_NAME"
  OK "Snapshot '$name' creato"
}

cmd_snapshots() {
  hcloud image list --type snapshot -o columns=id,description,created
}

cmd_keys() {
  hcloud ssh-key list -o columns=name,fingerprint
}

[[ $# -eq 0 ]] && usage
case "$1" in
  status)    cmd_status ;;
  power)     [[ $# -eq 2 ]] && cmd_power "$2" || usage ;;
  fw-rules)  cmd_fw_rules ;;
  fw-check)  [[ $# -eq 2 ]] && cmd_fw_check "$2" || usage ;;
  fw-close)  [[ $# -eq 2 ]] && cmd_fw_close "$2" || usage ;;
  snapshot)  cmd_snapshot "${2:-}" ;;
  snapshots) cmd_snapshots ;;
  keys)      cmd_keys ;;
  help|-h)   usage ;;
  *) echo "Comando sconosciuto: $1"; usage ;;
esac
