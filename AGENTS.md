NON CREARE CLAUDE.MD, non sei claude code

# Protocollo di Debug Runtime con Playwright

Questo protocollo è mandatorio quando viene segnalato un errore runtime (console error, fetch fallito, UI rotta, crash di pagina). L'ispezione runtime ha priorità assoluta sull'analisi del codice statico.

## Regole Tassative per l'Agent

* **No Blind Guessing:** È vietato cercare nel codice statico o fare supposizioni prima di aver verificato il comportamento runtime con Playwright.
* **No Domande Inutili:** Non chiedere all'utente screenshot o log della console. Usa Playwright per raccoglierli autonomamente.
* **Isolamento Network:** In caso di `Failed to fetch`, analizza esclusivamente il network layer (CORS, endpoint down, status 4xx/5xx). Non modificare il codice del componente prima di questa verifica.

---

## Prassi Standard di Diagnostica

Esegui questi passaggi in ordine prima di modificare qualsiasi file:

1. **Avvio:** Esegui `npx playwright test --debug` o uno script di diagnostica locale.
2. **Raccolta Evidenze:** Estrai nell'ordine:
   * Console errors (`page.on('console', ...)`)
   * Network failures (`page.on('requestfailed', ...)`)
   * Screenshot dello stato visivo (`page.screenshot()`)
   * Snapshot del DOM (`page.content()`)
3. **Risoluzione:** Identifica il problema dai log runtime e procedi al fix sul codice statico solo come ultimo step.

## Conoscenza: LLM Wiki (@evangelist)

graphify è stato sostituito dalla LLM Wiki (`@zosmaai/pi-llm-wiki`, agent `evangelist`).

Regole:
- Per domande su codebase/decisioni/progetti: `wiki_recall`/`wiki_search` prima di grep grezzi.
- Dopo lavoro significativo: `wiki_observe` per osservazioni, `wiki_retro` per insight duraturi.
- Per roba wiki: delega a `evangelist` o gestisci direttamente con i tool wiki.
- Non usare più `graphify` (rimosso dal progetto).

---

# Operazioni VPS (Hetzner) — Protocollo Agent

Il server di produzione r6hub è su Hetzner Cloud. Ogni operazione (deploy, log, status, firewall, snapshot, debug) va fatta **dall'agent, in autonomia**, usando skill + script dedicati.

## Riferimenti veloci

| Cosa | Dove |
|---|---|
| **Playbook completo** | Skill `.pi/skills/hetzner-ops/SKILL.md` — leggere PRIMA di operare |
| **Script API infra** | `scripts/hetzner-api.sh` (status, power, fw, snapshot) |
| **Deploy app** | `scripts/vps-deploy.sh` |
| **Status server** | `scripts/vps-status.sh` |
| **Log servizi** | `scripts/vps-logs.sh <service>` |
| **Backup** | `scripts/vps-backup.sh` |
| SSH | `ssh r6hub-vps` (root, chiave `~/.ssh/id_ed25519_pi_relay`) |
| Hetzner API | hcloud CLI context `pi-full-access` (token in `~/.config/hcloud/contexts/`) |

## Regole tassative

* **L'agente fa da solo**: deploy, log, status, restart, snapshot, firewall — non chiedere all'utente di farlo. Solo lo **sblocco rete** (quota traffico, `blocked:true`) richiede l'utente dal console Hetzner.
* **Read-only prima di scrivere**: prima di deploy/restart/firewall, mostra stato corrente e cosa stai per fare.
* **Mai `docker compose down -v`** sul VPS: perde volumi/DB. Usare `stop`/`restart`.
* **Token e chiavi mai in git**: `~/.config/hcloud/contexts/*`, `~/.ssh/id_ed25519_pi_relay*`.
* **`blocked:true` = quota traffico Hetzner**: rete tagliata a monte, non è sshd/firewall/container. Non perdere tempo su fix locali.
* **Deploy standard**: `scripts/vps-deploy.sh` (push → pull → rebuild → health check).

## Verifica rapida dopo ogni operazione

```bash
scripts/vps-status.sh                      # sistema + container + health
scripts/hetzner-api.sh status              # server + blocked flag
```