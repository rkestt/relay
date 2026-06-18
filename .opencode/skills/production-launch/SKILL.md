---
name: production-launch
description: Production launch readiness audit and implementation. Run full checklist of security, GDPR, hardening, performance, monitoring, SEO pre-deploy.
---

# Production Launch Readiness

Audita e implementa checklist di produzione completa per app Next.js/React.

**Attivazione**: "production launch", "go live", "we need to launch", "checklist produzione", "lancio produzione", "production readiness"

## Workflow: 8 Fasi

Sempre delegare ai subagent specializzati. Non eseguire direttamente.

### Fase 1: Audit Iniziale
Lancia 4 audit paralleli via `@explorer`:

1. **sicurezza-credenziali**: Cerca secret hardcoded, NEXT_PUBLIC_ leak, CORS, security headers, RLS
2. **database-serverless**: Migrazioni, connection pooling, timeout, indici, backup
3. **gdpr-auth**: Cookie banner, privacy policy, consenso, eliminazione account, rate limiting, validazione input
4. **performance-monitoring**: Error tracking, analytics, logging, asset optimization, caching, lazy loading

**Output**: File audit con score 1-10 per area + gap critici prioritizzati.

### Fase 2: Emergenza Sicurezza (P0)
Delegare a `@fixer` in parallelo:

1. **Secret leakati**: `git rm --cached` + `.gitignore` + `git filter-branch`
2. **CORS**: Configurare domini specifici (kong.yml / middleware)
3. **Security headers**: `middleware.ts` (X-Frame-Options, CSP, HSTS, Referrer-Policy)
4. **Variabili d'ambiente**: .gitignore, .env.example, prefissi NEXT_PUBLIC_

### Fase 3: GDPR Compliance (P0)
Delegare a `@fixer` in parallelo:

1. **Pagine legali**: privacy, terms, cookies (`@frontend-design` per UI)
2. **Cookie banner**: Componente con preferenze localStorage, hook useCookieConsent
3. **Consenso signup**: Checkbox obbligatoria privacy/terms + opzionale marketing
4. **Eliminazione account**: `DELETE /api/user/account` + UI conferma
5. **Export dati**: `GET /api/user/export` + download JSON

### Fase 4: Production Hardening (P1)
Delegare a `@fixer` in parallelo:

1. **Error tracking**: Sentry (`sentry.client|server|edge.config.ts`, wrappare next.config)
2. **Rate limiting**: Auth endpoints (5 req/15min), API POST (60 req/min) (`lru-cache` o Upstash)
3. **Validazione server-side**: Zod schemas per ogni API route con `validateRequest()` helper
4. **Error pages**: `not-found.tsx`, `error.tsx`, `global-error.tsx` (`@frontend-design`)
5. **Backup database**: Script pg_dump + retention + restore + cron

### Fase 5: Performance (P1)
Delegare a `@fixer` in parallelo:

1. **Caching API**: Cache-Control headers su GET, revalidatePath su POST
2. **Lazy loading**: `next/dynamic` con named export syntax per componenti pesanti
3. **Timeout esterni**: AbortController per webhook/fetch esterni (5s)

### Fase 6: Monitoring (P2)
Delegare a `@fixer` in parallelo:

1. **Analytics**: PostHog con gate cookie consent
2. **Health check**: Endpoint `/api/health` verifica DB + Auth
3. **Uptime monitoring**: Documentare configurazione UptimeRobot/Better Stack

### Fase 7: SEO (P2)
Delegare a `@fixer`:

1. **Metadata helper**: `lib/seo/metadata.ts` con Open Graph + Twitter card
2. **OG image dinamica**: `app/opengraph-image.tsx`
3. **Sitemap + robots.txt**: `app/sitemap.ts`, `app/robots.ts`
4. **meta tags**: layout.tsx e pagine specifiche

### Fase 8: Code Review Finale
Delegare a `@oracle`:

1. Review sicurezza, GDPR, performance, type safety, accessibilità
2. Output: 5 blocchi critici (P0) + fix minori (P1)
3. Fixare blocchi critici via `@fixer`
4. Build finale + test

## Output Finale
- **Score production readiness** (es. "3.5/10 → 9/10")
- **Riepilogo commits** con messaggi significativi
- **Checklist azioni manuali** (dominio, variabili ambiente, force push)
- **Deploy guide** (`docs/DEPLOY_GUIDE.md`)

## Regole
- SEMPRE parallelizzare audit e fix via subagents
- Non deployare senza code review via @oracle
- Non saltare Fase 2-3 (blocchi legali/sicurezza)
- Build production deve passare prima di deploy
- Documentare procedura rollback
