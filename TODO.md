# r6hub — TODO

## Next Steps (Ready to Execute)

### 1. Supabase Configuration
- [x] Get `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` from project settings
- [x] Update `.env.local` with real credentials
- [x] Run migrations via Supabase CLI:
  ```
  1. supabase/migrations/00001_setup_schema.sql
  2. supabase/migrations/00002_rls_policies.sql
  3. supabase/migrations/00003_seed_reference.sql
  4. supabase/migrations/00004_seed_strategies.sql
  5. supabase/migrations/00005_auth_triggers.sql
  ```
- [ ] Enable Supabase Auth (anonymous + email providers)
- [ ] Create Storage bucket `strategies` with public read policy
- [ ] Enable Realtime on tables: `lobby_members`, `lobby_selections`, `lobby_bans`, `rounds`
- [ ] Configure `pg_cron` for lobby cleanup (24h inactive → closed, 7d → deleted)

### 2. Discord Webhook
- [x] Webhook URL received: `DISCORD_WEBHOOK_URL_REDACTED`
- [ ] Add `DISCORD_WEBHOOK_URL` to `.env.local`
- [ ] Generate `VALIDATION_HMAC_SECRET` (32+ random chars)
- [ ] Test webhook by submitting a strategy

### 3. Git & GitHub
- [x] Initialize git repo (`git init`)
- [x] Create `.gitignore` (node_modules, .env.local, .next)
- [x] Create GitHub repository (https://github.com/rkestt/r6hub)
- [x] Push initial commit

### 4. Deploy
- [x] Link GitHub repo to Vercel
- [x] Deploy to Vercel
- [x] Add environment variables in Vercel dashboard
- [x] Test live deployment

**Status**: App live and running at https://r6hub-peach.vercel.app
- Homepage loads correctly
- Supabase connection: configured
- Discord webhook: configured
- Environment variables: set on Vercel

## Blocked (Requires User Action)

### Map Assets
- [ ] Collect real 2D map images for MVP maps (Oregon, Bank, Clubhouse, Kafe, Border)
- [ ] Optimize images (WebP/AVIF, ≤200KB each)
- [ ] Add to `public/maps/` directory
- [ ] Update `maps.image_url` in database

### Device Testing
- [ ] Test PWA install on iOS Safari
- [ ] Test PWA install on Android Chrome
- [ ] Run Lighthouse audit (requires production build)

## Optional Improvements (Post-MVP)

- [ ] Profile creation/update UI (username, avatar)
- [ ] Sound effects for lobby events
- [ ] Pull-to-refresh on mobile
- [ ] Vibration feedback on lock-in
- [ ] Unit/E2E tests
- [ ] Operator icon images
- [ ] Offline fallback page refinement

## Completed

- [x] Next.js project setup with App Router + TypeScript
- [x] Tailwind CSS + shadcn/ui configuration
- [x] PWA manifest + next-pwa setup
- [x] All dependencies installed
- [x] 5 Supabase migration files (schema, RLS, seed, triggers)
- [x] TypeScript types aligned with schema
- [x] Supabase clients (browser, server, middleware)
- [x] Auth middleware + route protection
- [x] 13 API routes (lobby, join, state, leave, bans, new-round, lock, assign, strategies, validate)
- [x] Zustand store for lobby state
- [x] 8 UI pages (home, lobby, select, tasks, submit, bans, validate)
- [x] Reusable components (MapViewer, OfflineBanner, SkeletonCard, EmptyState, ErrorBoundary, LoadingSpinner)
- [x] 3 realtime sync hooks (useLobbyRealtime, useHeartbeat, usePresence)
- [x] UI polish with animations, colors, accessibility
- [x] Comprehensive README.md

## Credentials Needed

```
NEXT_PUBLIC_SUPABASE_URL=https://grgueymidlwzjdidigex.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=??? (from Supabase project settings → API)
SUPABASE_SERVICE_ROLE_KEY=??? (from Supabase project settings → API)
DISCORD_WEBHOOK_URL=DISCORD_WEBHOOK_URL_REDACTED
VALIDATION_HMAC_SECRET=??? (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```
