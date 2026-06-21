# r6hub — Dumb Human Guide

Mini istruzioni per far girare l'app in locale senza pensarci troppo.

## Prerequisiti

- **Node.js 20+** (controlla: `node --version`)
- **Docker Desktop** in esecuzione (controlla: `docker ps`)
- `npm install` fatto almeno una volta

## Setup iniziale (solo prima volta)

1. **Crea `.env.supabase`** in root (se non esiste già):
   ```env
   POSTGRES_PASSWORD=postgres
   JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
   ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjI5ODA5OTM5OTl9.CiRzMlJGlEc5oXqjnKIfe6bFyUcCgY3P6rWRyH6FJhA
   SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6Mjk4MDk5Mzk5OX0.CiRzMlJGlEc5oXqjnKIfe6bFyUcCgY3P6rWRyH6FJhA
   DASHBOARD_USERNAME=supabase
   DASHBOARD_PASSWORD=this_is_a_secure_password_123
   ```

2. **Avvia Supabase** (container Docker):
   ```powershell
   docker compose --env-file .env.supabase up -d db kong auth rest realtime storage imgproxy meta studio mailpit
   ```
   > Nota: non avviare `nextjs` e `caddy` — in dev si usa `npm run dev` locale.

3. **Applica migrations al database**:
   ```powershell
   .\scripts\apply-migrations.ps1
   ```

4. **Installa dipendenze**:
   ```powershell
   npm install
   ```

## Avvio dev (ogni volta)

```powershell
# Se non sono già attivi (solo servizi Supabase, no nextjs/caddy)
docker compose --env-file .env.supabase up -d db kong auth rest realtime storage imgproxy meta studio mailpit

# Avvia Next.js in locale
npm run dev
```

- L'app è su **http://localhost:3000**
- Se la 3000 è occupata, Next.js usa la port 3001 automaticamente
- Per stoppare: `Ctrl + C` nel terminale di `npm run dev`

## Avvio persistente (background)

Per tenere backend e frontend attivi in background, senza dover riavviare ogni volta:

**Backend (Docker Supabase)**:
```powershell
docker compose --env-file .env.supabase up -d db kong auth rest realtime storage imgproxy meta studio mailpit
```
I container restano up finché non fai `docker stop` o spegni Docker Desktop.

**Frontend (Next.js dev server)** — in background con log:
```powershell
Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm run dev -- -H 0.0.0.0 > C:\Users\andre\AppData\Local\Temp\opencode\nextjs-dev.log 2>&1" -WorkingDirectory "C:\Projects\r6Hub" -WindowStyle Hidden
```
- `-H 0.0.0.0` forza il binding su tutte le interfacce (evita problema IPv6 su Windows)
- Il log finisce in `C:\Users\andre\AppData\Local\Temp\opencode\nextjs-dev.log`
- Lo usi in combinazione col `Restart-Computer` o quando l'app muore

**Verifica stato**:
```powershell
# Tutti i container devono essere "Up (healthy)"
docker ps --filter "name=supabase" --format "table {{.Names}}\t{{.Status}}"

# Next.js deve rispondere 200
curl http://localhost:3000
# o in PowerShell: (Invoke-WebRequest http://localhost:3000 -UseBasicParsing).StatusCode
```

**Stop tutto**:
```powershell
# Stoppa i container (non rimuove i dati)
docker compose --env-file .env.supabase stop

# Killa il processo Next.js
Get-Process node | Stop-Process -Force

# Stoppa + rimuove (reset completo, ATTENZIONE: cancella volumi DB)
docker compose --env-file .env.supabase down
```

## Servizi utili

| Servizio | URL | Note |
|----------|-----|------|
| **App Next.js** | `http://localhost:3000` | Dev server |
| **Supabase Studio** | `http://localhost:54322` | Admin DB (login: `supabase` / pwd vedi `.env.supabase`) |
| **Mailpit** | `http://localhost:8025` | Email test (magic link, etc.) |
| **Mailpit API** | `http://localhost:8025/api/v1/messages` | Per fetch automatico email |
| **Kong API Gateway** | `http://localhost:54321` | Gateway Supabase |
| **DB (Postgres)** | `localhost:54324` | Direct DB access |

## Auth / Login (locale)

L'app usa **Supabase Auth** con magic link via email.

Con Supabase self-hosted, le email non partono davvero — finiscono in **Mailpit**.

1. Vai su `http://localhost:3000/login`
2. Inserisci una qualsiasi email (es. `test@test.com`)
3. Clicca "Send Magic Link"
4. Apri Mailpit su `http://localhost:8025`
5. Trova l'email con il magic link e cliccalo

**Per automazione via terminale** (es. test browser):
```powershell
# 1. Recupera messaggi da Mailpit
$messages = Invoke-RestMethod http://localhost:8025/api/v1/messages

# 2. Estrai magic link dal body HTML
$html = $messages.messages[0].body.html
$html -match '(http://localhost:54321/auth/v1/verify[^"]+)'
$magicLink = $matches[1]

# 3. Naviga il link (via curl o browser)
curl $magicLink
```

## Struttura rapida

- `app/` — pagine Next.js (App Router)
- `app/api/` — API route (lobby, strategies, validate)
- `lib/supabase/` — client/server/middleware Supabase
- `components/ui/` — componenti UI (Button, ecc.)
- `middleware.ts` — protezione route (redirect a /login se non autenticato)
- `scripts/apply-migrations.ps1` — script per applicare migration DB
- `docker-compose.yml` — Supabase self-hosted

## Problemi comuni

| Sintomo | Causa probabile | Fix |
|---------|----------------|-----|
| "Unexpected token '<', ... is not valid JSON" | Middleware redirecta API a /login | Controlla che `lib/supabase/middleware.ts` non tocchi le route `/api/*` |
| 404 su /login | Manca la pagina login | Deve esistere `app/login/page.tsx` |
| 401 "Unauthorized" su Create/Join Lobby | Non sei loggato | Vai su /login e autenticati |
| Redirect a /login da tutte le pagine | Middleware fa il suo lavoro | Normale se non sei loggato |
| `docker compose` fallisce | Docker Desktop non attivo | Avvia Docker Desktop e riprova |
| Migration fallisce | Container Supabase non ancora pronto | Aspetta 10-15 secondi e riprova |
| Magic link non arriva | Mailpit non raggiungibile | Controlla `http://localhost:8025` — il container Mailpit deve essere up |
| Porta 3000 già in uso | Altro processo occupa la porta | Next.js passa a 3001, oppure kill il processo (`npx kill-port 3000`) |
