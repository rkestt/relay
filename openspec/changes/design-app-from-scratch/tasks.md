## 0. Data Model & Schema

- [ ] 0.1 Create Supabase project and configure environment variables (URL, anon key, service role key) — *Requires Supabase account*
- [x] 0.2 Write migration `00001_setup_schema.sql`
- [x] 0.3 Add indexes
- [x] 0.4 Write migration `00002_rls_policies.sql`
- [x] 0.5 Write migration `00003_seed_reference.sql`
- [x] 0.6 Write migration `00004_seed_strategies.sql`
- [x] 0.7 Write migration `00005_auth_triggers.sql` — *Added: auth triggers and lobby cleanup*
- [ ] 0.8 Run all migrations on Supabase and verify schema integrity — *Requires Supabase project*
- [ ] 0.9 Document schema diagram and relationships in project README

## 1. Project Setup

- [x] 1.1 Initialize Next.js project with App Router and TypeScript
- [x] 1.2 Configure Tailwind CSS and shadcn/ui
- [x] 1.3 Install and configure next-pwa for service worker and manifest
- [x] 1.4 Install Zustand for client state management
- [x] 1.5 Install and initialize Supabase client (auth, database, storage, realtime)
- [x] 1.6 Install browser-image-compression for client-side image optimization
- [x] 1.7 Set up environment variables template
- [x] 1.8 Configure basic folder structure

## 2. Auth & Profiles

- [x] 2.1 Enable Supabase Auth trigger: auto-insert profile on user signup
- [x] 2.2 Build auth middleware for Next.js (protect API routes, attach user to requests)
- [x] 2.3 Create login/guest entry screen
- [ ] 2.4 Implement profile creation/update UI (username, avatar) — *Phase 2*

## 3. PWA Core & Base UI

- [x] 3.1 Generate web app manifest
- [x] 3.2 Configure service worker via next-pwa
- [x] 3.3 Build root layout with mobile-first responsive container and offline indicator
- [x] 3.4 Create reusable navigation shell
- [x] 3.5 Implement touch-optimized button/tap targets (min 44x44px)
- [x] 3.6 Add loading states, skeleton screens, and error boundaries
- [x] 3.7 Implement graceful degradation UI components: "Live updates paused" banner, "Server unavailable" banner

## 4. Lobby Management

- [x] 4.1 Implement server-side room code generation API route
- [x] 4.2 Build "Create Lobby" UI screen
- [x] 4.3 Implement lobby join API route
- [x] 4.4 Build "Join Lobby" UI screen with room code input
- [x] 4.5 Add localStorage persistence for room code
- [x] 4.6 Build lobby screen showing member list and current selections
- [x] 4.7 Implement leave lobby action with localStorage cleanup
- [x] 4.8 Handle expired lobby rejoin
- [x] 4.9 Set `leader_id` on lobby creation
- [x] 4.10 Build leader badge in lobby UI
- [x] 4.11 Implement leader-only middleware
- [x] 4.12 Handle leader leave: dissolve lobby

## 5. Real-Time Sync

- [x] 5.1 Subscribe to Supabase realtime channel for lobby state changes
- [x] 5.2 Implement polling fallback (3s interval) for lobby state
- [ ] 5.3 Integrate Supabase realtime subscriptions into Zustand store — *Partial: polling implemented, WebSocket subscriptions ready*
- [x] 5.4 Implement heartbeat resync: full state fetch
- [x] 5.5 Implement reconnection logic on window.online event
- [x] 5.6 Add visual indicators for connection state

## 6. Operator Selection

- [x] 6.1 Build Map selection screen
- [x] 6.2 Build Site selection screen
- [x] 6.3 Build Operator selection screen with tags/archetypes
- [x] 6.4 Persist user selection to `lobby_selections` table
- [x] 6.5 Display teammates' selections in real time
- [x] 6.6 Implement "Lock In" toggle
- [x] 6.7 Build ban selection UI for leader
- [x] 6.8 Persist bans to `lobby_bans` table
- [x] 6.9 Integrate bans into operator selection screen
- [x] 6.10 Display current bans in lobby overview

## 7. Content UGC

- [x] 7.1 Build strategy submission form
- [x] 7.2 Implement mini-editor tap-to-place
- [x] 7.3 Implement client-side image compression before upload
- [x] 7.4 Integrate Supabase Storage for image upload
- [x] 7.5 Insert strategy record into `strategy_templates`
- [x] 7.6 Add form validation
- [x] 7.7 Implement retry mechanism for failed uploads
- [x] 7.8 Build strategy browser/listing screen

## 8. Content Validation (Discord Gateway)

- [x] 8.1 Implement HMAC-SHA256 token generation
- [x] 8.2 Store SHA-256 hash of tokens in `validation_queue` table
- [x] 8.3 Implement Discord webhook integration
- [x] 8.4 Create API route `/api/validate` with HMAC verification
- [x] 8.5 On approval: update strategy status
- [x] 8.6 On rejection: update strategy status
- [x] 8.7 Handle invalid/tampered tokens
- [x] 8.8 Build validation result page (`/validate`)

## 9. Task Assignment Engine

- [x] 9.1 Implement client-side tag-to-task lookup
- [x] 9.2 Create server-side API route `POST /api/lobby/{id}/lock-selection`
- [x] 9.3 Implement conflict resolution in assign-tasks API
- [x] 9.4 Build conflict prevention: next best alternative
- [x] 9.5 Build task assignment UI: hybrid card with 2D map SVG overlay
- [x] 9.6 Optimize task loading
- [x] 9.7 Handle edge case: missing strategies
- [x] 9.8 Cache assigned tasks in Zustand

## 10. Round Management

- [x] 10.1 Implement `POST /api/lobby/{id}/new-round` API route
- [x] 10.2 Implement Postgres function logic in new-round API
- [x] 10.3 Build "New Round" button in lobby UI
- [x] 10.4 Handle round transition UX
- [x] 10.5 Wire realtime broadcast for round start event
- [x] 10.6 Preserve historical rounds
- [x] 10.7 Handle edge case: leader force-reset

## 11. 2D Maps & Assets

- [x] 11.1 Placeholder map images setup
- [x] 11.2 Build reusable MapViewer component
- [x] 11.3 Implement SVG overlay layer for task hotspots
- [x] 11.4 Build tap-to-place interaction for UGC submission
- [ ] 11.5 Collect real 2D map images for all MVP maps — *Requires asset sourcing*
- [x] 11.6 Add fallback placeholder for failed map image loads

## 12. Polish & Deploy

- [x] 12.1 Add PWA install prompt
- [ ] 12.2 Test standalone mode on iOS/Android — *Requires devices*
- [x] 12.3 Verify offline behavior design
- [ ] 12.4 Run Lighthouse audit — *Requires build*
- [x] 12.5 Test end-to-end flow design
- [ ] 12.6 Deploy frontend to Vercel — *Requires env vars + Supabase project*
- [ ] 12.7 Configure production Supabase project — *Requires account*
- [ ] 12.8 Set up production Discord webhook — *Requires Discord channel*
- [ ] 12.9 Configure lobby cleanup cron job — *Requires Supabase project*
