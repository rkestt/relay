# Deploy & Rollback Guide

## Prerequisiti

### Variabili Ambiente Production
Configurare in Vercel/Docker:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
SENTRY_DSN=https://your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_your-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Discord (opzionale)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Database
- Applicare migrazioni: `.\scripts\apply-migrations.ps1`
- Verificare RLS policies attive
- Testare connessione DB

---

## Deploy su Vercel

### 1. Preparazione
```bash
# Verificare build locale
npm run build

# Verificare test
npm test

# Commit tutte le modifiche
git add -A
git commit -m "Production ready"
```

### 2. Deploy
```bash
# Installare Vercel CLI se necessario
npm i -g vercel

# Login
vercel login

# Deploy production
vercel --prod
```

### 3. Verifica Post-Deploy
- [ ] Homepage carica: `https://r6hub.vercel.app/`
- [ ] Login funziona
- [ ] API health check: `https://r6hub.vercel.app/api/health`
- [ ] Sentry non mostra errori critici
- [ ] Cookie banner appare
- [ ] Pagine legali accessibili: `/privacy`, `/terms`, `/cookies`

---

## Deploy con Docker

### 1. Build immagine
```bash
docker-compose build
```

### 2. Avvio servizi
```bash
docker-compose up -d
```

### 3. Verifica
```bash
# Controllare log
docker-compose logs -f

# Verificare health
curl http://localhost:3000/api/health
```

---

## Rollback Procedure

### Vercel

#### Opzione 1: Dashboard
1. Andare su https://vercel.com/dashboard
2. Selezionare progetto r6hub
3. Tab "Deployments"
4. Trovare deployment precedente stabile
5. Click "..." → "Promote to Production"

#### Opzione 2: CLI
```bash
# Listare deployments
vercel ls

# Rollback a deployment specifico
vercel rollback
# Seguire prompt interattivo
```

### Docker

#### Opzione 1: Tag precedente
```bash
# Fermare servizi
docker-compose down

# Checkout tag precedente
git checkout v1.0.0  # o commit hash specifico

# Rebuild e restart
docker-compose build
docker-compose up -d
```

#### Opzione 2: Immagine precedente
```bash
# Se usi registry con tag
docker-compose pull
docker-compose up -d
```

---

## Backup Database

### Prima del Deploy
```bash
# Linux/Mac
./scripts/backup-database.sh

# Windows
.\scripts\backup-database.ps1
```

### Verificare Backup
```bash
# Listare backup
ls -lh backups/

# Verificare ultimo backup
ls -lh backups/backup-*.dump.gz | tail -1
```

### Restore (se necessario)
```bash
# Linux/Mac
./scripts/restore-database.sh backups/backup-YYYYMMDD-HHMMSS.dump.gz

# Windows
.\scripts\restore-database.ps1 .\backups\backup-YYYYMMDD-HHMMSS.dump.gz
```

---

## Checklist Pre-Deploy

### Codice
- [ ] `npm run build` successo
- [ ] `npm test` tutti i test passano
- [ ] `npx tsc --noEmit` zero errori
- [ ] No `console.log` in production code
- [ ] No hardcoded secrets

### Database
- [ ] Migrazioni applicate
- [ ] RLS policies attive
- [ ] Backup eseguito
- [ ] Indici ottimizzati

### Configurazione
- [ ] Variabili ambiente production configurate
- [ ] Dominio DNS configurato
- [ ] SSL/HTTPS attivo
- [ ] CORS configurato con domini corretti

### Monitoring
- [ ] Sentry configurato e testato
- [ ] PostHog configurato
- [ ] Uptime monitoring configurato (UptimeRobot/Better Stack)
- [ ] Alert email configurati

### GDPR
- [ ] Privacy policy pubblicata
- [ ] Cookie banner funzionante
- [ ] Eliminazione account testata
- [ ] Export dati testato

### Testing
- [ ] Login/signup funzionano
- [ ] Creazione lobby funziona
- [ ] Creazione strategia funziona
- [ ] Rate limiting attivo (testare 6 login consecutivi)
- [ ] Pagine errore custom appaiono (404, 500)

---

## Post-Deploy Monitoring

### Prime 24 Ore
- [ ] Monitorare Sentry dashboard (ogni ora)
- [ ] Verificare uptime monitoring (ogni 4 ore)
- [ ] Controllare performance (LCP, FID, CLS)
- [ ] Verificare log errori

### Prima Settimana
- [ ] Review giornaliera Sentry
- [ ] Monitorare usage patterns (PostHog)
- [ ] Verificare backup automatici
- [ ] Controllare costi provider

### Primo Mese
- [ ] Audit sicurezza (CORS, headers, rate limiting)
- [ ] Review performance e ottimizzazioni
- [ ] Aggiornare dipendenze se necessario
- [ ] Testare rollback procedure

---

## Contatti Emergenza

### Supporto Tecnico
- **Sentry**: https://sentry.io/support/
- **Vercel**: https://vercel.com/support
- **Supabase**: https://supabase.com/support/

### Team Interno
- **Sviluppatore**: [email]
- **DevOps**: [email]
- **On-call**: [phone]

---

## Note Importanti

1. **Mai deployare di venerdì** senza piano di rollback testato
2. **Sempre backup prima** di deploy maggiori
3. **Testare rollback** in staging prima di production
4. **Monitorare attentamente** prime 24 ore post-deploy
5. **Documentare incidenti** per migliorare processi

---

## Risorse

- [Vercel Deployments](https://vercel.com/docs/deployments)
- [Supabase Backups](https://supabase.com/docs/guides/database/backups)
- [Sentry Documentation](https://docs.sentry.io/)
- [PostHog Documentation](https://posthog.com/docs)
