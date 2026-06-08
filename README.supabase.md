# Supabase Self-Hosted - r6Hub

Stack Supabase locale con Docker per sviluppo e deploy VPS.

## Porte

| Servizio         | Porta  | Descrizione                    |
|------------------|--------|--------------------------------|
| Kong (API)       | 54321  | API Gateway (Supabase client)  |
| Studio (UI)      | 54322  | Admin Dashboard                |
| Kong HTTPS       | 54323  | API Gateway HTTPS              |
| PostgreSQL       | 54324  | Accesso diretto DB (debug)     |
| Mailpit SMTP     | 1025   | SMTP locale (dev email)        |
| Mailpit UI       | 8025   | Web UI per email catturate     |

## Quick Start (Dev Locale)

### 1. Primo setup

```powershell
.\scripts\setup-supabase.ps1
```

Questo script:
- Genera secrets casuali (POSTGRES_PASSWORD, JWT_SECRET, ecc.)
- Genera JWT keys anon/service_role valide
- Scrive `.env.supabase` e aggiorna `.env.local`
- Avvia tutti i container Docker
- Attende PostgreSQL ready
- Applica tutte le migrations da `supabase/migrations/`

### 2. Avvio successivo

```powershell
docker compose --env-file .env.supabase up -d
```

### 3. Stop

```powershell
docker compose --env-file .env.supabase down
```

### 4. Reset completo (cancella dati)

```powershell
docker compose --env-file .env.supabase down -v
# Poi ri-eseguire setup-supabase.ps1
```

## Servizi Inclusi

| Container        | Image                          | Scopo                        |
|------------------|--------------------------------|------------------------------|
| db               | supabase/postgres:15.8.1.085   | PostgreSQL 15                |
| kong             | kong/kong:3.9.1                | API Gateway                  |
| auth             | supabase/gotrue:v2.189.0       | Autenticazione               |
| rest             | postgrest/postgrest:v14.12     | REST API (PostgREST)         |
| realtime         | supabase/realtime:v2.102.3     | WebSocket                    |
| storage          | supabase/storage-api:v1.60.4   | File storage                 |
| imgproxy         | darthsim/imgproxy:v3.30.1      | Image processing             |
| meta             | supabase/postgres-meta:v0.96.6 | PG metadata API              |
| studio           | supabase/studio:2026.06.03     | Admin UI                     |
| mailpit          | axllent/mailpit:latest         | Email testing locale         |

## Applicare Migrations

```powershell
# Dopo il setup iniziale (automatico):
.\scripts\apply-migrations.ps1

# Dry run (lista senza applicare):
.\scripts\apply-migrations.ps1 -DryRun
```

Le migrations vengono applicate in ordine alfabetico da `supabase/migrations/`.

## Configurazione Next.js

Dopo il setup, `.env.local` viene aggiornato automaticamente con:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<generato>
SUPABASE_SERVICE_ROLE_KEY=<generato>
```

## Accessi

- **Studio**: http://localhost:54322 (accesso diretto, no auth)
- **Studio via Kong**: http://localhost:54321 (basic auth: supabase / password-da-env)
- **Mailpit**: http://localhost:8025 (tutte le email dev finiscono qui)
- **PostgreSQL**: `postgresql://postgres:<password>@localhost:54324/postgres`

## Deploy VPS

### Prerequisiti
- Docker + Docker Compose installati
- Dominio puntato al server (es. `supabase.tuodominio.com`)

### Steps

1. Copia i file sul VPS:
   ```bash
   scp docker-compose.yml .env.supabase volumes/ scripts/ vps:~/r6hub/
   ```

2. Modifica `.env.supabase`:
   ```env
   SUPABASE_PUBLIC_URL=https://supabase.tuodominio.com:54321
   API_EXTERNAL_URL=https://supabase.tuodominio.com:54321
   SITE_URL=https://tuodominio.com
   ADDITIONAL_REDIRECT_URLS=https://tuodominio.com/**
   ```

3. Avvia:
   ```bash
   docker compose --env-file .env.supabase up -d
   ```

4. Applica migrations:
   ```bash
   # Copia le migrations e usa psql via docker exec
   docker cp supabase/migrations/ supabase-db:/tmp/migrations
   for f in $(ls supabase/migrations/*.sql | sort); do
     docker cp "$f" supabase-db:/tmp/migration.sql
     docker exec supabase-db psql -U postgres -h localhost -d postgres -v ON_ERROR_STOP=1 -f /tmp/migration.sql
   done
   ```

5. Configura reverse proxy (Caddy/Nginx) con HTTPS verso porta 54321.

### Aggiornare .env.local per produzione

```env
NEXT_PUBLIC_SUPABASE_URL=https://supabase.tuodominio.com:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<stessa-chiave-da-env-supabase>
SUPABASE_SERVICE_ROLE_KEY=<stessa-chiave-da-env-supabase>
```

## Struttura File

```
r6Hub/
  docker-compose.yml          # Stack Supabase completo
  .env.supabase               # Configurazione + secrets (NON committare)
  scripts/
    setup-supabase.ps1        # Setup iniziale
    apply-migrations.ps1      # Applica migrations
  volumes/
    api/
      kong.yml                # Kong routing config
      kong-entrypoint.sh      # Kong entrypoint custom
    db/
      _supabase.sql           # Init DB _supabase
      jwt.sql                 # JWT settings
      logs.sql                # Analytics schema
      realtime.sql            # Realtime schema
      roles.sql               # DB roles + passwords
      webhooks.sql            # pg_net + hooks
    storage/                  # Storage data (persistente)
  supabase/
    migrations/               # Le tue migrations SQL
```

## Troubleshooting

**Porta gia' in uso:**
```powershell
netstat -ano | findstr :54321
# Cambia porta in .env.supabase
```

**Container non parte:**
```powershell
docker compose --env-file .env.supabase logs <service-name>
```

**Reset DB completo:**
```powershell
docker compose --env-file .env.supabase down -v
Remove-Item -Recurse -Force volumes/db/data
.\scripts\setup-supabase.ps1
```

**Re-apply singola migration:**
```powershell
docker cp supabase/migrations/00001_setup_schema.sql supabase-db:/tmp/m.sql
docker exec supabase-db psql -U postgres -h localhost -d postgres -v ON_ERROR_STOP=1 -f /tmp/m.sql
```
