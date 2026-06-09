# Graph Report - r6Hub  (2026-06-09)

## Corpus Check
- 157 files · ~223,814 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1122 nodes · 1537 edges · 87 communities (80 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a801900a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 66 edges
2. `Logger` - 48 edges
3. `createClient()` - 31 edges
4. `Button()` - 17 edges
5. `compilerOptions` - 16 edges
6. `Decisions` - 16 edges
7. `What You Must Do When Invoked` - 15 edges
8. `createBrowserClient()` - 14 edges
9. `/graphify` - 14 edges
10. `Test Autonomia Agente - Report Finale` - 13 edges

## Surprising Connections (you probably didn't know these)
- `cn()` --calls--> `clsx`  [INFERRED]
  lib/utils.ts → package.json
- `LobbyMapPage()` --calls--> `cn()`  [EXTRACTED]
  app/lobby/[code]/map/page.tsx → lib/utils.ts
- `SubmitStrategyPage()` --calls--> `cn()`  [EXTRACTED]
  app/lobby/[code]/submit/page.tsx → lib/utils.ts
- `LoginPage()` --calls--> `cn()`  [EXTRACTED]
  app/login/page.tsx → lib/utils.ts
- `SignupPage()` --calls--> `cn()`  [EXTRACTED]
  app/signup/page.tsx → lib/utils.ts

## Communities (87 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.15
Nodes (19): BackArrowIcon(), DetailData, FeedTask, LobbyState, SortMode, getFirstImage(), StrategyCard(), StrategyCardProps (+11 more)

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (6): formatTime(), generateId(), getStoredLogs(), isClient(), Logger, saveLogs()

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (44): code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash (mkdir -p graphify-out), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c ") (+36 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (34): code:block1 (/graphify                                             # full), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash (if [ ! -f graphify-out/.graphify_extract.json ]; then), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c "), code:bash ($(cat graphify-out/.graphify_python) -c ") (+26 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (40): dependencies, @base-ui/react, browser-image-compression, class-variance-authority, clsx, @ducanh2912/next-pwa, lucide-react, next (+32 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (31): code:sql (-- Add phase column to lobbies for waiting room flow), code:typescript (.select("*, phase")), code:typescript (interface LobbyState {), code:typescript (const handleStartGame = useCallback(async () => {), code:bash (git add app/lobby/[code]/page.tsx), code:typescript (// After loading lobby state), code:bash (git add app/lobby/[code]/bans/page.tsx app/lobby/[code]/sele), code:typescript (.channel(`lobby:${lobbyId}`)) (+23 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (29): API Endpoints, Apply Migrations Manually, Apply Migrations via Supabase CLI, Architecture, code:bash (# Clone the repository), code:env (# ── Supabase ────────────────────────────────────), code:bash (npm run dev), code:bash (# Install Supabase CLI if you haven't) (+21 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (27): code:sql (-- Add operator_id to strategy_templates for per-operator st), code:typescript (const [operators, setOperators] = useState<Operator[]>([]);), code:typescript (// Load operators), code:typescript (if (!selectedOperatorId) {), code:typescript (body: JSON.stringify({), code:tsx ({/* ── Operator Selection ─────────────────────────── */}), code:typescript (if (operators.length > 0) {), code:bash (git add app/lobby/[code]/submit/page.tsx) (+19 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (21): Context, Decisions, Frontend Framework: Next.js (App Router), Goals / Non-Goals, Image Optimization: Client-side compression + Supabase Storage, Lobby Cleanup: pg_cron, Lobby Leader, Ban & Round Management, Mappe 2D: SVG overlay su immagini statiche (+13 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (17): Check for context, code:block1 (┌─────────────────────────────────────────┐), code:bash (openspec list --json), code:block3 (User: I'm thinking about adding real-time collaboration), code:block4 (User: The auth system is a mess), code:block5 (User: /opsx-explore add-auth-system), code:block6 (User: Should we use Postgres or SQLite?), code:block7 (## What We Figured Out) (+9 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (17): code:sql (-- Add map_id to lobbies for single map selection per lobby), code:bash (git add supabase/migrations/00013_lobby_map_id.sql), code:typescript (export interface Lobby {), code:bash (git add types/index.ts), code:typescript (import { createClient } from "@/lib/supabase/server";), code:bash (git add app/api/lobby/[id]/set-map/route.ts), code:bash (git add app/lobby/[code]/map/page.tsx), code:bash (git add app/lobby/[code]/page.tsx) (+9 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (15): ADDED Requirements, Requirement: App is installable as PWA, Requirement: App is optimized for mobile, Requirement: App works offline, Requirement: Graceful degradation when API is unavailable, Requirement: Graceful degradation when images fail to load, Requirement: Graceful degradation when realtime disconnects, Scenario: API down (+7 more)

### Community 14 - "Community 14"
Cohesion: 0.13
Nodes (14): 1. Supabase Configuration, 2. Discord Webhook, 3. Git & GitHub, 4. Deploy, Blocked (Requires User Action), code:block1 (1. supabase/migrations/00001_setup_schema.sql), code:block2 (NEXT_PUBLIC_SUPABASE_URL=https://grgueymidlwzjdidigex.supaba), Completed (+6 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (13): 0. Data Model & Schema, 10. Round Management, 11. 2D Maps & Assets, 12. Polish & Deploy, 1. Project Setup, 2. Auth & Profiles, 3. PWA Core & Base UI, 4. Lobby Management (+5 more)

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (12): ADDED Requirements, Requirement: Lobby persists across sessions, Requirement: Stale lobbies are cleaned up, Requirement: User can create a lobby, Requirement: User can join a lobby with room code, Requirement: User can leave a lobby, Scenario: Auto-rejoin on app launch, Scenario: Invalid room code (+4 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (12): ADDED Requirements, Requirement: Operator selections reset between rounds, Requirement: Selections synchronize in real time, Requirement: User can select a map, Requirement: User can select a site, Requirement: User can select an operator, Scenario: Banned operator selection blocked, Scenario: Map selection (+4 more)

### Community 18 - "Community 18"
Cohesion: 0.17
Nodes (11): Check for context, code:block1 (┌─────────────────────────────────────────┐), code:bash (openspec list --json), Ending Discovery, Guardrails, OpenSpec Awareness, The Stance, What You Don't Have To Do (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (14): geistMono, geistSans, metadata, viewport, LEVEL_BG, LEVEL_COLORS, LogPanel(), mockLogs (+6 more)

### Community 20 - "Community 20"
Cohesion: 0.17
Nodes (11): ADDED Requirements, Requirement: Strategy includes image, text, tags, and hotspot, Requirement: Upload works on unstable networks, Requirement: User can place hotspot via tap-to-place, Requirement: User can upload a strategy, Scenario: Invalid submission missing hotspot, Scenario: Move hotspot, Scenario: Strategy submission (+3 more)

### Community 21 - "Community 21"
Cohesion: 0.17
Nodes (11): ADDED Requirements, Requirement: System assigns tasks based on operator tags, Requirement: System prevents duplicate task assignments via server-side conflict resolution, Requirement: Task output includes 2D map and screenshot, Requirement: Tasks load within 2 seconds, Scenario: Conflict prevention, Scenario: Hybrid task display, Scenario: Performance under normal network (+3 more)

### Community 22 - "Community 22"
Cohesion: 0.18
Nodes (10): background_color, description, display, icons, name, orientation, scope, short_name (+2 more)

### Community 23 - "Community 23"
Cohesion: 0.18
Nodes (10): 1. Visione del Prodotto, 2. Il Problema (The "Pain"), 3. Perimetro dell'MVP (Core Features), 4. Architettura Tecnica Suggerita, 5. Matrice delle Priorità (Cosa NON fare nell'MVP), 6. Considerazioni Critiche del PM, A. Flusso utente "Low-Friction", B. Motore di Assegnazione Task (Logica Bottom-Up) (+2 more)

### Community 24 - "Community 24"
Cohesion: 0.18
Nodes (10): ADDED Requirements, Requirement: Client recovers from disconnection with resync, Requirement: Lobby state synchronizes in real time, Requirement: Periodic heartbeat resync, Requirement: Team selections synchronize in real time, Scenario: Heartbeat resync, Scenario: Member join broadcast, Scenario: Member leave broadcast (+2 more)

### Community 25 - "Community 25"
Cohesion: 0.24
Nodes (12): Dialog(), DialogClose(), DialogContent(), DialogContext, DialogContextValue, DialogDescription, DialogProps, DialogTitle (+4 more)

### Community 26 - "Community 26"
Cohesion: 0.20
Nodes (9): ADDED Requirements, Requirement: Approved strategies become visible to users, Requirement: Submitted strategies enter validation queue with secure tokens, Requirement: Validator can approve or reject via signed URL, Scenario: Approve strategy with valid token, Scenario: Approved content availability, Scenario: Discord gateway notification, Scenario: Invalid or tampered token (+1 more)

### Community 27 - "Community 27"
Cohesion: 0.22
Nodes (8): Dogfood Report — r6hub, Findings, ISSUE-001 — Errore JSON visibile in homepage e modal, ISSUE-002 — "Create Lobby" non ha effetto, ISSUE-003 — Redirect a /login (404) per tutte le pagine protette, ISSUE-004 — "Join Lobby" non completa l'azione, Note aggiuntive, Summary

### Community 28 - "Community 28"
Cohesion: 0.22
Nodes (8): Auth / Login, code:block1 (NEXT_PUBLIC_SUPABASE_URL=https://tuo-progetto.supabase.co), Comandi base, Come stoppare, Prerequisiti, Problemi comuni, r6hub — Dumb Human Guide, Struttura rapida

### Community 29 - "Community 29"
Cohesion: 0.29
Nodes (6): code:bash (mkdir -p openspec/changes/archive), code:bash (mv openspec/changes/<name> openspec/changes/archive/YYYY-MM-), code:block3 (## Archive Complete), code:block4 (## Archive Complete), code:block5 (## Archive Complete (with warnings)), code:block6 (## Archive Failed)

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (6): Capabilities, Impact, Modified Capabilities, New Capabilities, What Changes, Why

### Community 31 - "Community 31"
Cohesion: 0.43
Nodes (5): config, middleware(), isPublicPath(), publicPaths, updateSession()

### Community 32 - "Community 32"
Cohesion: 0.46
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 33 - "Community 33"
Cohesion: 0.32
Nodes (6): labelMap, LoadingScreen(), LoadingSpinner(), LoadingSpinnerProps, sizeMap, { rerender }

### Community 34 - "Community 34"
Cohesion: 0.33
Nodes (5): code:bash (openspec status --change "<name>" --json), code:bash (openspec instructions apply --change "<name>" --json), code:block3 (## Implementing: <change-name> (schema: <schema-name>)), code:block4 (## Implementation Complete), code:block5 (## Implementation Paused)

### Community 35 - "Community 35"
Cohesion: 0.33
Nodes (5): code:bash (openspec status --change "<name>" --json), code:bash (openspec instructions apply --change "<name>" --json), code:block3 (## Implementing: <change-name> (schema: <schema-name>)), code:block4 (## Implementation Complete), code:block5 (## Implementation Paused)

### Community 36 - "Community 36"
Cohesion: 0.17
Nodes (11): Browser Testing (agent-browser), code:bash (agent-browser --init-script test-scripts/confirm-bypass.js o), DELEGA SEMPRE AI SUBAGENTS, Flow Login Test, For @explorer, graphify, Local Project Info, Setup Infrastruttura Locale (+3 more)

### Community 37 - "Community 37"
Cohesion: 0.40
Nodes (3): parseHtmlResponse(), stripHtml(), ValidateState

### Community 38 - "Community 38"
Cohesion: 0.40
Nodes (4): code:bash (openspec new change "<name>"), code:bash (openspec status --change "<name>" --json), code:bash (openspec instructions <artifact-id> --change "<name>" --json), code:bash (openspec status --change "<name>")

### Community 39 - "Community 39"
Cohesion: 0.40
Nodes (4): code:bash (openspec new change "<name>"), code:bash (openspec status --change "<name>" --json), code:bash (openspec instructions <artifact-id> --change "<name>" --json), code:bash (openspec status --change "<name>")

### Community 40 - "Community 40"
Cohesion: 0.50
Nodes (3): code:bash (mkdir -p openspec/changes/archive), code:bash (mv openspec/changes/<name> openspec/changes/archive/YYYY-MM-), code:block3 (## Archive Complete)

### Community 48 - "Community 48"
Cohesion: 0.06
Nodes (33): 1. Primo setup, 2. Avvio successivo, 3. Stop, 4. Reset completo (cancella dati), Accessi, Aggiornare .env.local per produzione, Applicare Migrations, code:powershell (.\scripts\setup-supabase.ps1) (+25 more)

### Community 49 - "Community 49"
Cohesion: 0.06
Nodes (30): 1. Login Flow ✅, 1. Migrations Incomplete (CRITICO) ✅ FIXATO, 2. Agent-Browser Instabilità (MEDIO) ⚠️ PARZIALE, 2. Home Page ✅, 3. Create Lobby ✅ (dopo fix), 4. Lobby Waiting Page ✅, 5. Migrations System ✅, Autonomia Complessiva: **75%** (+22 more)

### Community 50 - "Community 50"
Cohesion: 0.18
Nodes (10): CheckIcon(), LobbyMapPage(), Button(), buttonVariants, btn, EmptyState(), EmptyStateProps, svg (+2 more)

### Community 51 - "Community 51"
Cohesion: 0.16
Nodes (20): BansPage(), LobbyBanWithOperator, LobbyState, LobbyPage(), LobbyStateResponse, useHeartbeat(), useLobbyRealtime(), usePresence() (+12 more)

### Community 52 - "Community 52"
Cohesion: 0.09
Nodes (21): 1. Migrations Incomplete (CRITICO), 2. Agent-Browser Instabile, 3. Start Game Problema, ⏸️ Ban/Vote System, Bug Trovati, Conclusioni, ⚠️ Create Lobby, Dati Seed Applicati (+13 more)

### Community 53 - "Community 53"
Cohesion: 0.14
Nodes (14): POST(), mockSupabaseClient, params, updateQuery, POST(), GET(), POST(), deleteQuery (+6 more)

### Community 54 - "Community 54"
Cohesion: 0.15
Nodes (15): getTeamSide(), actual, expected, rounds, generateRoomCode(), getTeamSide(), POST(), POST() (+7 more)

### Community 55 - "Community 55"
Cohesion: 0.12
Nodes (15): calls, delay, fakeBan, fakeMember, fakeRound, fakeSelection, handler, mockChannel (+7 more)

### Community 56 - "Community 56"
Cohesion: 0.17
Nodes (11): XIcon(), MapViewer(), MapViewerProps, HotspotItem, SubmitStrategyPage(), uid(), uploadImage(), Site (+3 more)

### Community 57 - "Community 57"
Cohesion: 0.15
Nodes (12): insertProfileQuery, lobbyInsert, lobbyQuery, membersInsert, membersQuery, mockSupabaseClient, profileInsertQuery, profileMock (+4 more)

### Community 58 - "Community 58"
Cohesion: 0.22
Nodes (5): LoginPage(), SignupPage(), createBrowserClient(), Input, ref

### Community 59 - "Community 59"
Cohesion: 0.17
Nodes (11): assignInsert, existingQuery, existingResult, lobbyQuery, mockSupabaseClient, params, roundQuery, selectionsQuery (+3 more)

### Community 60 - "Community 60"
Cohesion: 0.17
Nodes (8): mockMemberNoProfile, mockMemberWithProfile, mockStateResponse, removeEventListenerSpy, { rerender }, { result }, storeActions, { unmount }

### Community 61 - "Community 61"
Cohesion: 0.18
Nodes (12): GET(), POST(), adminHotspotsInsert, adminImagesInsert, adminQueueInsert, adminStrategyInsert, adminTagsInsert, mockAdminClient (+4 more)

### Community 62 - "Community 62"
Cohesion: 0.25
Nodes (7): bansQuery, lobbyQuery, membersQuery, mockSupabaseClient, params, roundQuery, selectionsQuery

### Community 63 - "Community 63"
Cohesion: 0.20
Nodes (9): assignmentQuery, downCountQuery, membershipQuery, mockSupabaseClient, params, upCountQuery, voteDelete, voteTableMock (+1 more)

### Community 64 - "Community 64"
Cohesion: 0.20
Nodes (9): assignmentWithMultipleImages, baseAssignment, card, img, noImageAssignment, onClick, placeholderSvg, removedAssignment (+1 more)

### Community 65 - "Community 65"
Cohesion: 0.20
Nodes (5): ErrorBoundary, onRetry, { rerender }, ThrowsOnRender, user

### Community 66 - "Community 66"
Cohesion: 0.31
Nodes (7): escapeHtml(), GET(), htmlPage(), markUsed, mockAdminClient, queueQuery, strategyUpdate

### Community 67 - "Community 67"
Cohesion: 0.29
Nodes (6): POST(), lobbyQuery, mockSupabaseClient, params, roundQuery, selectionUpsert

### Community 68 - "Community 68"
Cohesion: 0.29
Nodes (6): POST(), lobbyQuery, mapQuery, mockSupabaseClient, params, updateQuery

### Community 69 - "Community 69"
Cohesion: 0.29
Nodes (6): POST(), lobbyQuery, memberError, membersQuery, mockQuery, mockSupabaseClient

### Community 70 - "Community 70"
Cohesion: 0.40
Nodes (4): Hotspot, hotspots, img, onPlaceHotspot

### Community 71 - "Community 71"
Cohesion: 0.19
Nodes (10): ArrowRightIcon(), UsersIcon(), LobbyState, SelectionStep, SkeletonCard(), SkeletonCardProps, SkeletonGrid(), avatar (+2 more)

### Community 73 - "Community 73"
Cohesion: 0.24
Nodes (8): GET(), POST(), banInsert, bansQuery, lobbyQuery, mockSupabaseClient, params, roundQuery

### Community 74 - "Community 74"
Cohesion: 0.40
Nodes (4): lobbyQuery, mockSupabaseClient, params, updateQuery

### Community 75 - "Community 75"
Cohesion: 0.08
Nodes (25): Accessibility, Background & Surface, Border Radius, Buttons, Cards, Color Strategy, Component Patterns, Dark Mode Only (+17 more)

### Community 76 - "Community 76"
Cohesion: 0.40
Nodes (4): OfflineBanner(), OfflineBannerProps, onDismiss, user

### Community 78 - "Community 78"
Cohesion: 0.40
Nodes (3): MockChannel, MockQueryBuilder, MockSupabaseClient

### Community 79 - "Community 79"
Cohesion: 0.25
Nodes (7): Anti-References, Brand Tone, Product Purpose, r6Hub — Product Context, Register, Strategic Principles, Users

### Community 80 - "Community 80"
Cohesion: 0.50
Nodes (3): LUA_AUTH_EXPR, LUA_RT_WS_EXPR, kong-entrypoint.sh script

### Community 84 - "Community 84"
Cohesion: 0.23
Nodes (16): HomePage(), LobbyState, AlertIcon(), CopyIcon(), CrownIcon(), IconProps, LockIcon(), MapIcon() (+8 more)

### Community 85 - "Community 85"
Cohesion: 0.40
Nodes (4): err, exported, logs, parsed

## Knowledge Gaps
- **658 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+653 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Logger` connect `Community 1` to `Community 0`, `Community 66`, `Community 67`, `Community 68`, `Community 69`, `Community 37`, `Community 71`, `Community 73`, `Community 50`, `Community 51`, `Community 84`, `Community 53`, `Community 54`, `Community 19`, `Community 56`, `Community 85`, `Community 58`, `Community 61`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 84` to `Community 0`, `Community 32`, `Community 33`, `Community 65`, `Community 4`, `Community 37`, `Community 71`, `Community 76`, `Community 50`, `Community 51`, `Community 19`, `Community 56`, `Community 25`, `Community 58`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _658 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._