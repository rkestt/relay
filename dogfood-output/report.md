# Dogfood Report — r6hub

| Property | Value |
|----------|-------|
| Target | http://localhost:3000 |
| Date | 2026-05-16 |
| Tester | agent-browser |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 1 |
| Medium | 1 |
| Low | 0 |
| Trivial | 0 |

**Total Issues:** 4

---

## Findings

### ISSUE-001 — Errore JSON visibile in homepage e modal

- **Severity:** High
- **Type:** Functional / Data Fetching
- **Description:** Nella homepage, sotto i bottoni "Create Lobby" e "Join Lobby", appare il testo di errore: "Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON". Lo stesso errore compare anche nel modal "Join Lobby" dopo aver inserito un codice e cliccato Join. Indica che una chiamata fetch si aspetta JSON ma riceve HTML (probabilmente una pagina di errore o redirect).
- **Repro Steps:**
  1. Apri http://localhost:3000
  2. Osserva l'errore sotto i bottoni
  3. Clicca "Join Lobby"
  4. Inserisci un codice (es. ABC123)
  5. Clicca "Join" — l'errore appare nel modal
- **Screenshot:** `screenshots/homepage-final.png`, `screenshots/join-lobby-error.png`
- **Repro Video:** N/A (statico)

### ISSUE-002 — "Create Lobby" non ha effetto

- **Severity:** Critical
- **Type:** Functional
- **Description:** Cliccare il bottone "Create Lobby" non apre alcun modal, non naviga ad alcuna pagina e non produce alcun effetto visibile. L'azione sembra completamente non funzionante.
- **Repro Steps:**
  1. Apri http://localhost:3000
  2. Clicca "Create Lobby"
  3. Nessun cambiamento di stato o navigazione
- **Screenshot:** `screenshots/homepage-final.png`
- **Repro Video:** N/A

### ISSUE-003 — Redirect a /login (404) per tutte le pagine protette

- **Severity:** Critical
- **Type:** Routing / Authentication
- **Description:** Tutte le pagine interne (/validate, /lobby/[code], /lobby/[code]/tasks, /lobby/[code]/submit, /lobby/[code]/select, /lobby/[code]/bans) reindirizzano a /login. La pagina /login pero' non esiste e restituisce 404 "This page could not be found.". Questo rende impossibile accedere a qualsiasi funzionalità dell'app.
- **Repro Steps:**
  1. Apri http://localhost:3000/validate → redirect a /login → 404
  2. Apri http://localhost:3000/lobby/ABC123 → redirect a /login → 404
  3. Apri http://localhost:3000/login direttamente → 404
- **Screenshot:** `screenshots/login-page.png`
- **Repro Video:** N/A

### ISSUE-004 — "Join Lobby" non completa l'azione

- **Severity:** Medium
- **Type:** Functional
- **Description:** Dopo aver aperto il modal "Join Lobby", inserito un codice valido (6 caratteri) e cliccato "Join", non avviene alcuna navigazione. Il modal resta aperto e mostra l'errore JSON (ISSUE-001). L'utente non riesce a entrare in una lobby.
- **Repro Steps:**
  1. Apri http://localhost:3000
  2. Clicca "Join Lobby"
  3. Inserisci "ABC123"
  4. Clicca "Join"
  5. Il modal resta aperto con errore
- **Screenshot:** `screenshots/join-lobby-error.png`
- **Repro Video:** N/A

---

## Note aggiuntive

- Il server Next.js mostra un warning in console: `The "middleware" file convention is deprecated. Please use "proxy" instead.`
- Non sono presenti errori JavaScript visibili nella console del browser (oltre ai log HMR di sviluppo).
- L'app sembra avere un flusso di autenticazione incompleto o mal configurato (manca la pagina /login).

