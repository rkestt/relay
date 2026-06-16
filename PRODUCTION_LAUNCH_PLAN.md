# Piano di Lancio Produzione - r6hub

**Data creazione:** 2026-06-12  
**Stato attuale:** 3.5/10 production-ready  
**Obiettivo:** Raggiungere 9/10 per lancio pubblico  
**Tempo stimato totale:** 6-8 giorni lavorativi

---

## Fase 1: Emergenza Sicurezza (1-2 giorni) - PRIORITÀ CRITICA

### 1.1 Revocare Secret Leakati
**Tempo:** 2 ore  
**Skills:** Nessuna specifica

**Task:**
- [ ] Revocare `DISCORD_WEBHOOK_URL` e rigenerare nuovo webhook
- [ ] Revocare `SUPABASE_SERVICE_ROLE_KEY` e rigenerare da dashboard Supabase
- [ ] Revocare `VALIDATION_HMAC_SECRET` e rigenerare
- [ ] Aggiornare `.env.local` con nuovi secret
- [ ] Aggiornare variabili ambiente production (Vercel/docker)

**Verifica:**
- [ ] Vecchi secret non funzionano più
- [ ] Nuovi secret funzionano in dev e production

---

### 1.2 Rimuovere Secret da Git History
**Tempo:** 1 ora  
**Skills:** Nessuna specifica

**Task:**
- [ ] Aggiungere `.env` e `.env.local.bak-*` a `.gitignore`
- [ ] Rimuovere file da git tracking:
  ```bash
  git rm --cached .env .env.local.bak-20260608-131832
  ```
- [ ] Rimuovere da history con `git filter-repo` o `BFG Repo-Cleaner`:
  ```bash
  git filter-repo --invert-paths --path .env --path .env.local.bak-20260608-131832
  ```
- [ ] Force push (coordinare con team se presente)

**File:** `.gitignore`, `.env`, `.env.local.bak-20260608-131832`

**Verifica:**
- [ ] `git log --all --full-history -- .env` non restituisce nulla
- [ ] `.env` non appare in `git ls-files`

---

### 1.3 Configurare CORS Kong
**Tempo:** 30 min  
**Skills:** Nessuna specifica

**Task:**
- [ ] Modificare `volumes/api/kong.yml` per aggiungere `config.origins` specifico
- [ ] Sostituire tutte le istanze del plugin `cors` senza config con:
  ```yaml
  plugins:
    - name: cors
      config:
        origins: ["https://r6hub.yourdomain.com"]
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        headers: ["Authorization", "Content-Type", "X-Client-Info"]
        max_age: 3600
  ```
- [ ] Testare che richieste da dominio non autorizzato vengano bloccate

**File:** `volumes/api/kong.yml` (linee 47, 57, 67, 79, 108, 137, 168, 197, 226, 265)

**Verifica:**
- [ ] Richiesta da `https://r6hub.yourdomain.com` funziona
- [ ] Richiesta da `https://evil.com` viene bloccata (CORS error)

---

### 1.4 Aggiungere Security Headers
**Tempo:** 1 ora  
**Skills:** `vercel-react-best-practices`

**Task:**
- [ ] Modificare `middleware.ts` per aggiungere headers di sicurezza:
  ```typescript
  const headers = new Headers(supabaseResponse.headers);
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  ```
- [ ] Configurare CSP (Content Security Policy) in `next.config.ts`:
  ```typescript
  async headers() {
    return [{
      source: '/(.*)',
      headers: [{
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
      }]
    }]
  }
  ```
- [ ] Testare con https://securityheaders.com

**File:** `middleware.ts`, `next.config.ts`

**Verifica:**
- [ ] Security headers presenti in response (controllare DevTools Network)
- [ ] CSP non blocca funzionalità legittime (testare login, upload immagini)
- [ ] Security headers score A o A+ su securityheaders.com

---

## Fase 2: GDPR Compliance (2-3 giorni) - PRIORITÀ LEGALE

### 2.1 Creare Pagine Legali
**Tempo:** 4 ore  
**Skills:** `frontend-design`, `web-design-guidelines`

**Task:**
- [ ] Creare `app/privacy/page.tsx` - Privacy Policy completa:
  - Dati raccolti (email, username, lobby data, strategies)
  - Finalità del trattamento
  - Base giuridica (consenso, contratto)
  - Servizi terzi (Supabase, Vercel, Discord webhook)
  - Diritti utente (accesso, cancellazione, portabilità)
  - Contatti DPO (se applicabile)
- [ ] Creare `app/terms/page.tsx` - Termini di Servizio:
  - Regole comportamento
  - Proprietà intellettuale (strategie utente)
  - Limitazione responsabilità
  - Legge applicabile
- [ ] Creare `app/cookies/page.tsx` - Cookie Policy:
  - Lista cookie tecnici (sessione, auth)
  - Lista cookie analytics (se aggiunti)
  - Come gestire preferenze

**File:** `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/cookies/page.tsx`

**Verifica:**
- [ ] Pagine accessibili da `/privacy`, `/terms`, `/cookies`
- [ ] Contenuto legalmente valido (far revisionare da legale se possibile)
- [ ] Design coerente con resto app (@frontend-design per review)

---

### 2.2 Implementare Cookie Banner
**Tempo:** 3 ore  
**Skills:** `frontend-design`, `impeccable`, `web-design-guidelines`

**Task:**
- [ ] Creare componente `components/cookie/CookieBanner.tsx`:
  - Banner bottom-fixed con messaggio consenso
  - Pulsanti: "Accetta tutti", "Rifiuta", "Personalizza"
  - Modal per preferenze granulari (necessari / analytics / marketing)
  - Link a `/cookies` per dettagli
- [ ] Creare hook `lib/hooks/useCookieConsent.ts`:
  - Leggere consenso da localStorage
  - Funzioni `acceptAll()`, `rejectAll()`, `setPreferences()`
  - Stato globale (Context o Zustand)
- [ ] Integrare in `app/layout.tsx`:
  - Renderizzare `<CookieBanner />` condizionalmente (solo se no consenso)
  - Bloccare script analytics fino a consenso (conditional import)
- [ ] Creare pagina `app/settings/cookies/page.tsx` per revoca/modifica consenso

**File:** `components/cookie/CookieBanner.tsx`, `lib/hooks/useCookieConsent.ts`, `app/layout.tsx`, `app/settings/cookies/page.tsx`

**Verifica:**
- [ ] Banner appare al primo visit
- [ ] Script analytics non caricati prima del consenso
- [ ] Preferenze salvate in localStorage
- [ ] Link "Gestisci cookie" nel footer funziona
- [ ] UI accessibile (keyboard navigation, screen reader) - @web-design-guidelines

---

### 2.3 Aggiungere Checkbox Consenso in Signup
**Tempo:** 1 ora  
**Skills:** `react-components`, `web-design-guidelines`

**Task:**
- [ ] Modificare `app/signup/page.tsx`:
  - Aggiungere checkbox obbligatoria: "Accetto Privacy Policy e Termini di Servizio"
  - Aggiungere checkbox opzionale: "Voglio ricevere email di marketing"
  - Link ipertestuali a `/privacy` e `/terms`
  - Validazione: checkbox obbligatoria deve essere checked per submit
- [ ] Aggiornare logica submit per verificare consenso
- [ ] (Opzionale) Salvare timestamp consenso in tabella `profiles` o `consents`

**File:** `app/signup/page.tsx`

**Verifica:**
- [ ] Signup fallisce se checkbox obbligatoria non checked
- [ ] Link a privacy/terms funzionano
- [ ] Checkbox marketing separata e opzionale
- [ ] UI accessibile (label associati, focus visible)

---

### 2.4 Implementare Eliminazione Account
**Tempo:** 3 ore  
**Skills:** `react-components`

**Task:**
- [ ] Creare API route `app/api/user/account/route.ts`:
  ```typescript
  DELETE /api/user/account - Elimina account utente
  ```
  - Verificare autenticazione (middleware auth)
  - Eliminare da `auth.users` via `supabase.auth.admin.deleteUser()`
  - Eliminare da `profiles` (cascata o manuale)
  - Anonimizzare dati in `lobbies`, `strategies` (sostituire user_id con null o "deleted")
  - Revocare tutti i token sessione
- [ ] Creare componente `components/settings/DeleteAccount.tsx`:
  - Bottone "Elimina account" (rosso, danger zone)
  - Dialog conferma con richiesta digitazione username o password
  - Warning irreversibile
  - Redirect a homepage dopo eliminazione
- [ ] Integrare in `app/settings/page.tsx` o `app/settings/account/page.tsx`

**File:** `app/api/user/account/route.ts`, `components/settings/DeleteAccount.tsx`, `app/settings/account/page.tsx`

**Verifica:**
- [ ] Endpoint DELETE funziona e restituisce 204
- [ ] Utente eliminato non può più fare login
- [ ] Dati personali rimossi o anonimizzati (verificare DB)
- [ ] Lobby/strategies create dall'utente rimangono ma senza attribuzione
- [ ] Conferma richiesta prima di eliminazione

---

### 2.5 Implementare Export Dati
**Tempo:** 2 ore  
**Skills:** `react-components`

**Task:**
- [ ] Creare API route `app/api/user/export/route.ts`:
  ```typescript
  GET /api/user/export - Esporta dati utente (JSON)
  ```
  - Verificare autenticazione
  - Query tutti i dati utente:
    - `profiles` (username, email, created_at)
    - `lobbies` create
    - `lobby_members` (partecipazioni)
    - `strategy_templates` create
    - `task_assignments`
    - `task_votes`
  - Restituire JSON strutturato
  - Header `Content-Disposition: attachment; filename="r6hub-data-export.json"`
- [ ] Creare componente `components/settings/ExportData.tsx`:
  - Bottone "Esporta i miei dati"
  - Download automatico file JSON
- [ ] Integrare in `app/settings/account/page.tsx`

**File:** `app/api/user/export/route.ts`, `components/settings/ExportData.tsx`, `app/settings/account/page.tsx`

**Verifica:**
- [ ] Endpoint GET restituisce JSON con tutti i dati utente
- [ ] File download funziona
- [ ] JSON contiene tutti i dati personali (verificare completezza)
- [ ] Endpoint protetto (solo utente autenticato può export propri dati)

---

## Fase 3: Production Hardening (2 giorni) - PRIORITÀ ALTA

### 3.1 Integrare Error Tracking (Sentry)
**Tempo:** 2 ore  
**Skills:** `vercel-react-best-practices`

**Task:**
- [ ] Installare `@sentry/nextjs`:
  ```bash
  npm install @sentry/nextjs
  ```
- [ ] Configurare `next.config.ts`:
  ```typescript
  const { withSentryConfig } = require('@sentry/nextjs');
  module.exports = withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
  });
  ```
- [ ] Creare `sentry.client.config.ts`:
  ```typescript
  import * as Sentry from '@sentry/nextjs';
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
  });
  ```
- [ ] Creare `sentry.server.config.ts` (analogo per server-side)
- [ ] Creare `sentry.edge.config.ts` (per edge runtime)
- [ ] Modificare `components/ui/ErrorBoundary.tsx`:
  ```typescript
  import * as Sentry from '@sentry/nextjs';
  componentDidCatch(error, info) {
    Sentry.captureException(error, { extra: info });
  }
  ```
- [ ] Aggiungere variabili ambiente production:
  - `SENTRY_ORG`
  - `SENTRY_PROJECT`
  - `SENTRY_AUTH_TOKEN`
  - `NEXT_PUBLIC_SENTRY_DSN`

**File:** `next.config.ts`, `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `components/ui/ErrorBoundary.tsx`

**Verifica:**
- [ ] Errori client-side catturati (testare con `throw new Error('test')`)
- [ ] Errori server-side catturati (testare con API route che crasha)
- [ ] Performance monitoring attivo (tracce > 100ms)
- [ ] Alert configurati per errori critici

---

### 3.2 Aggiungere Rate Limiting Auth
**Tempo:** 2 ore  
**Skills:** `vercel-react-best-practices`

**Task:**
- [ ] Installare `@upstash/ratelimit` e `@upstash/redis`:
  ```bash
  npm install @upstash/ratelimit @upstash/redis
  ```
- [ ] Creare middleware rate limiting `lib/rate-limit.ts`:
  ```typescript
  import { Ratelimit } from '@upstash/ratelimit';
  import { Redis } from '@upstash/redis';
  
  export const authRateLimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 richieste ogni 15 min
    analytics: true,
  });
  ```
- [ ] Applicare a route auth:
  - `app/api/auth/login/route.ts` (se custom)
  - `app/api/auth/register/route.ts` (se custom)
  - `app/api/auth/reset-password/route.ts` (se custom)
  ```typescript
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const { success, limit, reset, remaining } = await authRateLimit.limit(ip);
  if (!success) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }
  ```
- [ ] (Alternativa se no Upstash) Implementare rate limiting in-memory con `lru-cache`:
  ```typescript
  import LRUCache from 'lru-cache';
  const rateLimitCache = new LRUCache({ max: 1000, ttl: 15 * 60 * 1000 });
  ```
- [ ] Aggiungere header response:
  ```typescript
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', reset.toString());
  ```

**File:** `lib/rate-limit.ts`, `app/api/auth/*/route.ts`

**Verifica:**
- [ ] 6ª richiesta in 15 min restituisce 429
- [ ] Header rate limit presenti in response
- [ ] Rate limit resetta dopo 15 min
- [ ] Funziona in production (Upstash) e dev (in-memory fallback)

---

### 3.3 Implementare Validazione Server-Side
**Tempo:** 3 ore  
**Skills:** `react-components`, `vercel-react-best-practices`

**Task:**
- [ ] Installare `zod`:
  ```bash
  npm install zod
  ```
- [ ] Creare schemi validazione `lib/validations/`:
  - `auth.ts`:
    ```typescript
    export const signupSchema = z.object({
      email: z.string().email(),
      password: z.string().min(8).max(100),
      username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
    });
    ```
  - `lobby.ts`:
    ```typescript
    export const createLobbySchema = z.object({
      map_id: z.string().uuid(),
      max_players: z.number().min(2).max(10),
    });
    ```
  - `strategy.ts`:
    ```typescript
    export const createStrategySchema = z.object({
      title: z.string().min(5).max(100),
      description: z.string().max(2000).optional(),
      map_id: z.string().uuid(),
      site_id: z.string().uuid(),
    });
    ```
- [ ] Applicare validazione in API routes:
  ```typescript
  import { createStrategySchema } from '@/lib/validations/strategy';
  
  export async function POST(request: Request) {
    const body = await request.json();
    const validated = createStrategySchema.safeParse(body);
    if (!validated.success) {
      return Response.json(
        { error: 'Invalid input', details: validated.error.flatten() },
        { status: 400 }
      );
    }
    // Proceed with validated.data
  }
  ```
- [ ] Applicare a tutte le API routes:
  - `app/api/auth/signup/route.ts`
  - `app/api/lobby/route.ts`
  - `app/api/strategies/route.ts`
  - `app/api/strategies/[id]/route.ts`
  - `app/api/lobby/[code]/route.ts`

**File:** `lib/validations/*.ts`, `app/api/**/*.route.ts`

**Verifica:**
- [ ] Richiesta con dati invalidi restituisce 400
- [ ] Error message dettagliato (quale campo invalido)
- [ ] Richiesta con dati validi funziona
- [ ] Type safety mantenuta (validated.data tipizzato correttamente)

---

### 3.4 Creare Pagine Errore Custom
**Tempo:** 2 ore  
**Skills:** `frontend-design`, `impeccable`

**Task:**
- [ ] Creare `app/not-found.tsx` (404):
  - Design coerente con brand r6hub
  - Messaggio chiaro "Pagina non trovata"
  - Link a homepage
  - Illustrazione o icona tematica (Rainbow Six)
- [ ] Creare `app/error.tsx` (500):
  - Design coerente
  - Messaggio "Qualcosa è andato storto"
  - Bottone "Riprova" (reset error boundary)
  - Link a homepage
  - No stack trace esposto
- [ ] Creare `app/global-error.tsx` (errori critici):
  - Fallback per errori in layout
  - UI minimale ma funzionale
- [ ] Testare errori:
  - Navigare a URL inesistente → 404
  - Forzare errore server → 500
  - Verificare che stack trace non sia visibile

**File:** `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`

**Verifica:**
- [ ] 404 custom appare per URL inesistenti
- [ ] 500 custom appare per errori server
- [ ] No stack trace esposto
- [ ] Design coerente con app (@frontend-design review)
- [ ] Accessibile (keyboard navigation, screen reader)

---

### 3.5 Configurare Backup Database
**Tempo:** 2 ore  
**Skills:** Nessuna specifica

**Task:**
- [ ] Creare script backup `scripts/backup-database.sh`:
  ```bash
  #!/bin/bash
  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
  BACKUP_DIR="/backups"
  RETENTION_DAYS=7
  
  # Dump database
  docker exec -t supabase-db pg_dump -U postgres -F c postgres > "$BACKUP_DIR/backup-$TIMESTAMP.dump"
  
  # Compress
  gzip "$BACKUP_DIR/backup-$TIMESTAMP.dump"
  
  # Remove old backups
  find "$BACKUP_DIR" -name "backup-*.dump.gz" -mtime +$RETENTION_DAYS -delete
  
  echo "Backup completed: backup-$TIMESTAMP.dump.gz"
  ```
- [ ] Creare script restore `scripts/restore-database.sh`:
  ```bash
  #!/bin/bash
  BACKUP_FILE=$1
  docker exec -i supabase-db pg_restore -U postgres -d postgres < "$BACKUP_FILE"
  ```
- [ ] Aggiungere a `docker-compose.yml`:
  ```yaml
  services:
    backup:
      image: alpine
      volumes:
        - ./backups:/backups
        - /var/run/docker.sock:/var/run/docker.sock
      command: >
        sh -c "while true; do
          /scripts/backup-database.sh;
          sleep 86400;
        done"
  ```
- [ ] Configurare cron job su host (alternativa):
  ```bash
  0 2 * * * /path/to/scripts/backup-database.sh
  ```
- [ ] (Opzionale) Upload su storage esterno (S3, B2):
  ```bash
  aws s3 cp "$BACKUP_DIR/backup-$TIMESTAMP.dump.gz" s3://r6hub-backups/
  ```
- [ ] Testare restore:
  ```bash
  ./scripts/restore-database.sh backups/backup-20260612-020000.dump.gz
  ```

**File:** `scripts/backup-database.sh`, `scripts/restore-database.sh`, `docker-compose.yml`

**Verifica:**
- [ ] Backup creato ogni giorno (verificare cartella `/backups`)
- [ ] Backup compresso (dimensione ragionevole)
- [ ] Backup vecchi eliminati dopo 7 giorni
- [ ] Restore funziona (testare su DB locale)
- [ ] Backup testato in production (almeno 1 volta)

---

## Fase 4: Performance Optimization (1 giorno) - PRIORITÀ MEDIA

### 4.1 Aggiungere Caching API
**Tempo:** 3 ore  
**Skills:** `vercel-react-best-practices`

**Task:**
- [ ] Aggiungere Cache-Control headers a GET endpoints:
  ```typescript
  // app/api/strategies/route.ts
  export async function GET(request: Request) {
    // ... fetch data
    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  }
  ```
- [ ] Implementare Next.js caching per pagine statiche:
  ```typescript
  // app/strategies/page.tsx
  export const revalidate = 60; // Revalidate ogni 60s
  
  export default async function StrategiesPage() {
    const strategies = await fetchStrategies();
    // ...
  }
  ```
- [ ] Usare `unstable_cache` per query pesanti:
  ```typescript
  import { unstable_cache } from 'next/cache';
  
  const getCachedStrategies = unstable_cache(
    async () => { /* fetch */ },
    ['strategies'],
    { revalidate: 60 }
  );
  ```
- [ ] Implementare revalidation on-demand per mutazioni:
  ```typescript
  import { revalidatePath, revalidateTag } from 'next/cache';
  
  export async function POST(request: Request) {
    // ... create strategy
    revalidatePath('/strategies');
    revalidateTag('strategies');
  }
  ```
- [ ] Applicare caching a:
  - `GET /api/strategies` - `s-maxage=60`
  - `GET /api/strategies/[id]` - `s-maxage=300`
  - `GET /api/maps` - `s-maxage=3600` (raramente cambiano)
  - `GET /api/operators` - `s-maxage=3600`

**File:** `app/api/strategies/route.ts`, `app/api/strategies/[id]/route.ts`, `app/api/maps/route.ts`, `app/api/operators/route.ts`

**Verifica:**
- [ ] Header `Cache-Control` presente in response GET
- [ ] Richieste successive servite da cache (vedere `x-nextjs-cache: HIT`)
- [ ] Cache invalidata dopo POST/PUT/DELETE
- [ ] Dati aggiornati visibili entro 60s (o immediatamente dopo mutazione)

---

### 4.2 Implementare Lazy Loading
**Tempo:** 1 ora  
**Skills:** `vercel-react-best-practices`, `react-components`

**Task:**
- [ ] Identificare componenti pesanti:
  - `components/map/MapViewer.tsx` (123 righe, SVG complesso)
  - `components/debug/LogPanel.tsx` (debug tool)
  - `components/lobby/LobbyChat.tsx` (se presente)
- [ ] Applicare `next/dynamic`:
  ```typescript
  import dynamic from 'next/dynamic';
  
  const MapViewer = dynamic(() => import('@/components/map/MapViewer'), {
    loading: () => <p>Caricamento mappa...</p>,
    ssr: false, // Se no SSR needed
  });
  ```
- [ ] Applicare a:
  - `app/lobby/[code]/map/page.tsx` - MapViewer
  - `app/lobby/[code]/page.tsx` - LogPanel (se presente)
  - Altri componenti > 50 righe usati in pagine diverse
- [ ] Testare che bundle size ridotto:
  ```bash
  npm run build
  # Controllare .next/server/app-pages-manifest.json
  ```

**File:** `app/lobby/[code]/map/page.tsx`, `app/lobby/[code]/page.tsx`

**Verifica:**
- [ ] Componente caricato solo quando necessario (vedere Network tab)
- [ ] Loading state visibile durante caricamento
- [ ] Bundle size ridotto (confrontare prima/dopo `npm run build`)
- [ ] Funzionalità non compromessa

---

### 4.3 Aggiungere Timeout Webhook Discord
**Tempo:** 30 min  
**Skills:** Nessuna specifica

**Task:**
- [ ] Modificare `app/api/strategies/route.ts:248`:
  ```typescript
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
  
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      logger.warn('Discord webhook timeout');
    } else {
      logger.error('Discord webhook failed', error);
    }
  } finally {
    clearTimeout(timeoutId);
  }
  ```
- [ ] Applicare pattern simile ad altri fetch esterni (se presenti)

**File:** `app/api/strategies/route.ts`

**Verifica:**
- [ ] Webhook Discord funziona normalmente
- [ ] Se Discord è lento (> 5s), request non blocca
- [ ] Errore timeout loggato ma non crasha app
- [ ] Response API restituita entro timeout totale (10s)

---

## Fase 5: Monitoring & Analytics (1 giorno) - PRIORITÀ MEDIA

### 5.1 Integrare Analytics (PostHog)
**Tempo:** 2 ore  
**Skills:** `vercel-react-best-practices`

**Task:**
- [ ] Installare `posthog-js`:
  ```bash
  npm install posthog-js
  ```
- [ ] Creare `lib/analytics/posthog.ts`:
  ```typescript
  import posthog from 'posthog-js';
  
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') posthog.debug();
      },
    });
  }
  
  export default posthog;
  ```
- [ ] Integrare in `app/layout.tsx`:
  ```typescript
  import { PostHogProvider } from 'posthog-js/react';
  import posthog from '@/lib/analytics/posthog';
  
  export default function RootLayout({ children }) {
    return (
      <PostHogProvider client={posthog}>
        {children}
      </PostHogProvider>
    );
  }
  ```
- [ ] Integrare con cookie consent:
  ```typescript
  // In useCookieConsent.ts
  if (consent.analytics) {
    posthog.opt_in_capturing();
  } else {
    posthog.opt_out_capturing();
  }
  ```
- [ ] Tracciare eventi chiave:
  ```typescript
  // app/lobby/create/page.tsx
  posthog.capture('lobby_created', { map_id, max_players });
  
  // app/api/strategies/route.ts
  posthog.capture('strategy_created', { strategy_id, map_id });
  ```
- [ ] Configurare variabili ambiente:
  - `NEXT_PUBLIC_POSTHOG_KEY`
  - `NEXT_PUBLIC_POSTHOG_HOST`

**File:** `lib/analytics/posthog.ts`, `app/layout.tsx`, `lib/hooks/useCookieConsent.ts`

**Verifica:**
- [ ] PostHog inizializzato solo in production
- [ ] Eventi tracciati visibili in dashboard PostHog
- [ ] Analytics bloccati se utente rifiuta cookie
- [ ] Analytics attivati se utente accetta

---

### 5.2 Configurare Uptime Monitoring
**Tempo:** 1 ora  
**Skills:** Nessuna specifica

**Task:**
- [ ] Registrarsi a UptimeRobot (gratuito) o Better Stack
- [ ] Configurare monitor per:
  - Homepage: `https://r6hub.yourdomain.com/`
  - API health: `https://r6hub.yourdomain.com/api/health`
  - Login page: `https://r6hub.yourdomain.com/login`
- [ ] Configurare alert:
  - Email quando down
  - SMS (se critico)
  - Slack/Discord webhook
- [ ] Configurare check interval: 5 min
- [ ] Testare alert (spegnere server temporaneamente)

**Verifica:**
- [ ] Monitor attivo e funzionante
- [ ] Alert ricevuto quando sito down
- [ ] Alert ricevuto quando sito torna up
- [ ] Dashboard accessibile

---

### 5.3 Migliorare Health Check
**Tempo:** 1 ora  
**Skills:** Nessuna specifica

**Task:**
- [ ] Modificare `app/api/health/route.ts`:
  ```typescript
  import { createClient } from '@/lib/supabase/server';
  
  export async function GET() {
    const supabase = createClient();
    
    // Check DB connection
    const { error: dbError } = await supabase.from('profiles').select('count').limit(1);
    
    // Check Supabase Auth
    const { error: authError } = await supabase.auth.getUser();
    
    const healthy = !dbError && !authError;
    
    return Response.json(
      {
        status: healthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: !dbError,
          auth: !authError,
        },
      },
      { status: healthy ? 200 : 503 }
    );
  }
  ```
- [ ] Aggiungere header `Cache-Control: no-cache` per evitare caching health check

**File:** `app/api/health/route.ts`

**Verifica:**
- [ ] `/api/health` restituisce 200 con status "healthy"
- [ ] Se DB down, restituisce 503 con status "unhealthy"
- [ ] Response JSON contiene dettagli check
- [ ] Uptime monitoring usa questo endpoint

---

## Fase 6: SEO & Social (0.5 giorno) - PRIORITÀ BASSA

### 6.1 Ottimizzare Meta Tag e Open Graph
**Tempo:** 2 ore  
**Skills:** `seo-audit`, `frontend-design`

**Task:**
- [ ] Creare componente `components/seo/Metadata.tsx`:
  ```typescript
  import { Metadata } from 'next';
  
  export function generateMetadata({ title, description, image }): Metadata {
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: image, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
    };
  }
  ```
- [ ] Applicare a tutte le pagine principali:
  - `app/page.tsx` - Homepage
  - `app/lobby/[code]/page.tsx` - Lobby pubblica
  - `app/strategies/page.tsx` - Lista strategie
  - `app/strategies/[id]/page.tsx` - Singola strategia
- [ ] Generare OG image dinamica per strategie:
  ```typescript
  // app/strategies/[id]/opengraph-image.tsx
  export default async function Image({ params }) {
    const strategy = await getStrategy(params.id);
    return new ImageResponse(
      <div style={{ /* design */ }}>
        <h1>{strategy.title}</h1>
        <p>{strategy.description}</p>
      </div>,
      { width: 1200, height: 630 }
    );
  }
  ```
- [ ] Testare con:
  - Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
  - Twitter Card Validator: https://cards-dev.twitter.com/validator
  - LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

**File:** `components/seo/Metadata.tsx`, `app/*/page.tsx`, `app/strategies/[id]/opengraph-image.tsx`

**Verifica:**
- [ ] Meta tag presenti in `<head>` (vedere DevTools)
- [ ] OG image generata correttamente
- [ ] Condivisione social mostra titolo, descrizione, immagine
- [ ] Cache social invalidata (usare debugger tools)

---

## Fase 7: Testing & QA (1 giorno) - PRIORITÀ ALTA

### 7.1 Test End-to-End con Agent Browser
**Tempo:** 3 ore  
**Skills:** `agent-browser`

**Task:**
- [ ] Testare flusso completo registrazione:
  ```bash
  agent-browser --init-script test-scripts/confirm-bypass.js open http://localhost:3000/signup
  ```
  - Compilare form signup
  - Accettare privacy/terms
  - Verificare email ricevuta (Mailpit)
  - Completare login
- [ ] Testare flusso creazione lobby:
  - Login
  - Creare lobby
  - Verificare room code generato
  - Condividere link
- [ ] Testare flusso creazione strategia:
  - Login
  - Navigare a `/strategies/new`
  - Compilare form
  - Upload immagine
  - Verificare salvataggio
- [ ] Testare flusso eliminazione account:
  - Login
  - Navigare a `/settings/account`
  - Cliccare "Elimina account"
  - Confermare
  - Verificare redirect e impossibilità login
- [ ] Testare cookie banner:
  - Visitare homepage (banner appare)
  - Cliccare "Rifiuta"
  - Verificare analytics non caricati
  - Navigare a `/settings/cookies`
  - Cambiare preferenze
  - Verificare analytics caricati
- [ ] Testare rate limiting:
  - Provare 6 login consecutivi
  - Verificare 429 error
  - Attendere 15 min
  - Verificare login funziona
- [ ] Testare error pages:
  - Navigare a URL inesistente → 404
  - Forzare errore server → 500
- [ ] Documentare bug trovati

**Verifica:**
- [ ] Tutti i flussi principali funzionano
- [ ] No errori console (vedere DevTools)
- [ ] Cookie banner funziona correttamente
- [ ] Rate limiting attivo
- [ ] Error pages custom appaiono
- [ ] Eliminazione account funziona
- [ ] Export dati funziona

---

### 7.2 Code Review Finale
**Tempo:** 2 ore  
**Skills:** `code-review-excellence`, `oracle`

**Task:**
- [ ] Review sicurezza:
  - No secret hardcoded
  - CORS configurato correttamente
  - Security headers presenti
  - Rate limiting attivo
  - Validazione server-side
- [ ] Review GDPR:
  - Privacy policy presente
  - Cookie banner funzionante
  - Checkbox consenso in signup
  - Eliminazione account implementata
  - Export dati implementato
- [ ] Review performance:
  - Caching API configurato
  - Lazy loading applicato
  - Bundle size ragionevole
  - No console.log in production
- [ ] Review accessibilità:
  - Keyboard navigation funziona
  - Screen reader compatibile
  - Color contrast adeguato
  - Focus visible
- [ ] Review codice:
  - No codice duplicato
  - Naming consistente
  - Error handling presente
  - Type safety mantenuta

**Verifica:**
- [ ] Tutti i checkpoint review soddisfatti
- [ ] Bug critici fixati
- [ ] Codice pronto per produzione

---

## Fase 8: Deploy & Rollback (0.5 giorno) - PRIORITÀ CRITICA

### 8.1 Testare Rollback Procedure
**Tempo:** 1 ora  
**Skills:** Nessuna specifica

**Task:**
- [ ] Identificare procedura rollback:
  - Se Vercel: `vercel rollback` o dashboard
  - Se Docker: `docker-compose down && docker-compose up -d` con tag precedente
  - Se manuale: git checkout tag precedente + rebuild
- [ ] Testare rollback in staging:
  ```bash
  # Esempio Vercel
  vercel rollback --yes
  
  # Esempio Docker
  git checkout v1.0.0
  docker-compose build
  docker-compose up -d
  ```
- [ ] Verificare che rollback funzioni:
  - App torna a versione precedente
  - Database non corrotto
  - Utenti possono ancora fare login
- [ ] Documentare procedura rollback in `docs/rollback.md`

**Verifica:**
- [ ] Rollback testato con successo
- [ ] Procedura documentata
- [ ] Team sa come eseguire rollback

---

### 8.2 Deploy Produzione
**Tempo:** 1 ora  
**Skills:** `deploy-to-vercel` (se Vercel)

**Task:**
- [ ] Verificare checklist pre-deploy:
  - [ ] Tutti i test passano (`npm test`)
  - [ ] Build produzione funziona (`npm run build`)
  - [ ] No TypeScript errors (`npx tsc --noEmit`)
  - [ ] No ESLint errors (`npx eslint .`)
  - [ ] Variabili ambiente production configurate
  - [ ] Database migrazioni applicate
  - [ ] Secret revocati e rigenerati
- [ ] Deploy:
  ```bash
  # Se Vercel
  vercel --prod
  
  # Se Docker
  git tag v1.0.0
  git push origin v1.0.0
  docker-compose build
  docker-compose up -d
  ```
- [ ] Verificare post-deploy:
  - [ ] Homepage carica
  - [ ] Login funziona
  - [ ] API health check OK
  - [ ] No errori Sentry
  - [ ] Uptime monitoring verde
- [ ] Monitorare per 1 ora:
  - Sentry dashboard (no errori critici)
  - Uptime monitoring (no downtime)
  - Performance (no rallentamenti)

**Verifica:**
- [ ] Deploy completato con successo
- [ ] App funzionante in produzione
- [ ] No errori critici
- [ ] Team notificato

---

## Riepilogo Timeline

| Fase | Durata | Priorità |
|------|--------|----------|
| 1. Emergenza Sicurezza | 1-2 giorni | 🔴 CRITICA |
| 2. GDPR Compliance | 2-3 giorni | 🔴 CRITICA |
| 3. Production Hardening | 2 giorni | 🟡 ALTA |
| 4. Performance Optimization | 1 giorno | 🟡 MEDIA |
| 5. Monitoring & Analytics | 1 giorno | 🟡 MEDIA |
| 6. SEO & Social | 0.5 giorno | 🟢 BASSA |
| 7. Testing & QA | 1 giorno | 🟡 ALTA |
| 8. Deploy & Rollback | 0.5 giorno | 🔴 CRITICA |

**Totale:** 8-10 giorni lavorativi

---

## Skills da Utilizzare

| Skill | Fasi | Scopo |
|-------|------|-------|
| `frontend-design` | 2.1, 3.4, 6.1 | UI pagine legali, error pages, OG images |
| `impeccable` | 2.2, 3.4 | Review UI cookie banner, error pages |
| `web-design-guidelines` | 2.2, 2.3 | Accessibilità cookie banner, form |
| `react-components` | 2.3, 2.4, 2.5, 3.3, 4.2 | Pattern componenti React |
| `vercel-react-best-practices` | 1.4, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1 | Caching, performance, best practices |
| `seo-audit` | 6.1 | Meta tag, Open Graph |
| `agent-browser` | 7.1 | Test end-to-end |
| `code-review-excellence` | 7.2 | Code review finale |
| `oracle` | 7.2 | Review architettura |
| `deploy-to-vercel` | 8.2 | Deploy production (se Vercel) |

---

## Criteri di Successo

**Production readiness score target:** 9/10

**Checklist finale:**
- [ ] Sicurezza: A+ su securityheaders.com
- [ ] GDPR: Cookie banner, privacy policy, eliminazione account funzionanti
- [ ] Monitoring: Sentry attivo, uptime monitoring verde
- [ ] Performance: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] Testing: Tutti i flussi principali testati con agent-browser
- [ ] Deploy: Rollback testato e documentato

---

## Note Finali

- **Priorità assoluta:** Fase 1 e 2 non sono negoziabili per lancio pubblico
- **GDPR:** Senza compliance, app illegale in UE
- **Sicurezza:** Secret leakati richiedono azione immediata
- **Testing:** Non saltare Fase 7, anche se stretti su tempo
- **Rollback:** Testare prima di deploy, non dopo

**Buon lancio! 🚀**
