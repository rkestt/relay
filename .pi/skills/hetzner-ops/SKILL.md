---
name: hetzner-ops
description: >-
  Operate the relay production VPS on Hetzner Cloud (server relay-vps,
  142.132.176.234, app in /opt/relay). Covers SSH access, Hetzner Cloud API
  (hcloud CLI + curl), deploy workflow, logs, status checks, backups, and
  troubleshooting (blocked IPs, firewall, docker). Use when the user asks to
  deploy, check server status, view logs, restart services, manage the
  firewall, take snapshots, or anything involving the Hetzner VPS.
compatibility: hcloud CLI (>=1.47), ssh, curl, docker on VPS
allowed-tools: Bash(ssh:*), Bash(hcloud:*), Bash(curl:*), Bash(docker:*), Bash(git:*), Bash(tail:*), Bash(grep:*), Bash(cat:*), Bash(ls:*), Bash(rsync:*), Bash(tar:*)
---

# hetzner-ops

## Panoramica

Infrastruttura di produzione relay su Hetzner Cloud.

| Risorsa | Valore |
|---|---|
| Server | `relay-vps` (id 142381430) |
| IP | `142.132.176.234` (IPv6 `2a01:4f8:c015:da83::/64`) |
| Tipo | CX23 (2 vCPU / 4GB / 40GB), Ubuntu 24.04, Falkenstein |
| Firewall | `relay-fw` (id 11151434) — porte 22, 80, 443/TCP, 443/UDP, 3001 |
| Path app | `/opt/relay` (repo git) |
| Servizi | docker compose: `relay-nextjs` (3000), `relay-caddy` (80/443), supabase stack |
| SSH | `ssh relay-vps` (root, chiave `~/.ssh/id_ed25519_pi_relay`) |
| Chiave Hetzner project | `pi-relay-linux` (auto-installata a rebuild) |

## Accesso

### SSH (app + sistema)

```bash
ssh relay-vps                    # host definito in ~/.ssh/config
ssh relay-vps 'docker ps'        # comando singolo
```

Config in `~/.ssh/config` (già pronto). Chiave privata: `~/.ssh/id_ed25519_pi_relay` (0600).

### Hetzner Cloud API (infra)

Due modi equivalenti:

```bash
# 1. hcloud CLI (consigliato — output JSON)
hcloud context use pi-full-access          # se non attivo
hcloud server list -o columns=name,status,ipv4
hcloud server describe relay-vps --output json

# 2. curl diretto (per cose che hcloud non espone, es. stato blocked)
TOKEN=$(cat ~/.config/hcloud/contexts/pi-full-access)
curl -s -H "Authorization: Bearer $TOKEN" https://api.hetzner.cloud/v1/servers/142381430
```

**Nota**: se `HCLOUD_TOKEN` è settato nell'ambiente, sovrascrive il context attivo.

## Decision Tree — cosa fare quando...

### "Deploy dell'app"
```bash
git push origin main                                      # push locale
ssh relay-vps 'cd /opt/relay && git pull'                 # pull sul server
ssh relay-vps 'cd /opt/relay && docker compose up -d --build nextjs'   # rebuild + restart
```
Dopo: `ssh relay-vps 'curl -s http://127.0.0.1:3000/api/health'` → atteso `{"ok":true}` o 200.

### "Il sito è giù / 502 / timeout"
1. `hcloud server describe relay-vps --output json | jq .server.status` → deve essere `running`
2. Se `blocked: true` nell'IP (API): rete Hetzner bloccata per quota traffico → **l'utente deve sbloccare dal console** (banner "Traffic quota exceeded"). Non si può sbloccare via API.
3. Se running e raggiungibile: `ssh relay-vps 'cd /opt/relay && docker compose ps'`
4. Controlla container down/crash: `ssh relay-vps 'docker compose logs --tail=100 nextjs'`
5. Health locale: `ssh relay-vps 'curl -s http://127.0.0.1:3000/api/health'`

### "Vedi i log"
```bash
ssh relay-vps 'docker compose logs --tail=200 -f nextjs'     # app (follow)
ssh relay-vps 'docker compose logs --tail=100 caddy'          # proxy/TLS
ssh relay-vps 'docker compose logs --tail=100 db'             # postgres
```

### "Restart servizio"
```bash
ssh relay-vps 'cd /opt/relay && docker compose restart nextjs'
# o rebuild completo:
ssh relay-vps 'cd /opt/relay && docker compose up -d --build'
```

### "Stato server / risorse"
```bash
hcloud server describe relay-vps --output json
ssh relay-vps 'uptime && df -h / && free -h && docker ps --format "table {{.Names}}\t{{.Status}}"'
```

### "Firewall"
```bash
hcloud firewall list -o columns=name,id
hcloud firewall describe relay-fw --output json | jq .rules
# aggiungere/rimuovere regole via API (hcloud non ha comando firewall rule edit completo:
# usare curl PUT /firewalls/{id}/actions/set_rules)
```

### "Snapshot / backup"
```bash
hcloud server create-image --type snapshot relay-vps        # snapshot manuale
hcloud image list --type snapshot
```

### "Server spento / da riavviare"
```bash
hcloud server poweron relay-vps      # accendi
hcloud server reboot relay-vps       # riavvia (se running)
hcloud server shutdown relay-vps     # spegni (graceful)
```

## Protocollo operativo (regole)

1. **Read-only prima**: prima di ogni operazione che modifica stato (deploy, restart, firewall), esegui prima i comandi di lettura (status, log, diff) e riporta cosa stai per fare.
2. **Mai `down`**: `docker compose down` elimina i container; se serve stop usa `docker compose stop`. Mai `-v` (perde volumi/DB).
3. **Token/chiave mai in git**: `~/.config/hcloud/contexts/pi-full-access` e `~/.ssh/id_ed25519_pi_relay*` non vanno committati né copiati nel repo.
4. **IP dinamico locale**: la macchina locale (pi) ha IP pubblico dinamico — se il firewall restringe per IP, l'accesso può rompersi al cambio IP.
5. **Blocked = quota traffico**: se `blocked:true` su IPv4/IPv6, la rete del server è tagliata a monte da Hetzner — non è un problema di sshd/firewall/container. Solo l'utente può sbloccare dal console (o attesa reset ciclo di fatturazione).
6. **Porta 3001 è aperta al mondo** (dev) — non esporre dati sensibili; valutare chiusura in produzione.

## Troubleshooting rapido

| Sintomo | Causa probabile | Fix |
|---|---|---|
| Tutte le porte chiuse, `blocked:true` via API | Quota traffico superata | Utente sblocca da console |
| SSH timeout ma porta 22 open nel firewall | Firewall locale/ISP o IP cambiato | Verifica IP locale, allowlist |
| 502 da caddy | nextjs down | `docker compose ps`, log nextjs |
| Cert TLS scaduto | caddy renew bloccato | `docker compose logs caddy` |
| DB lento/pieno | Disco 40GB saturo | `df -h /`, pulisci immagini docker |
