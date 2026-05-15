<div align="center">
  <br />
  <img src="https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS%204-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Zustand-443e38?style=for-the-badge&logo=react&logoColor=white" alt="Zustand" />
  <img src="https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" />
  <br />
  <br />
</div>

# r6hub

**Second-screen tactical companion for Rainbow Six Siege.**

r6hub is a progressive web application that turns a phone or tablet into a real-time tactical command board for Rainbow Six Siege. Create lobbies, pick operators, ban opponents, assign strategies, and coordinate your squad — all synchronized instantly through Supabase Realtime.

---

## Features

- **🗺️ Lobby Creation & Join** — Generate or join lobbies with a 6-character room code (ambiguous-character-safe). Persistent rejoin via `localStorage`.
- **⚡ Real-Time Sync** — Poll-based state updates every 3 seconds keep all members in sync without a complex WebSocket infrastructure.
- **🎯 Operator Selection** — Each player picks their operator per round. Selections lock once confirmed.
- **🚫 Ban System** — Squad leaders ban operators per side per round. Bans persist across rounds with automatic carry-over.
- **📋 Task Assignment** — Smart assigner matches operator archetype tags to approved strategy templates, finds the best-fitting unassigned strategy, and allocates it per player per round.
- **🧠 UGC Strategies** — Community-driven strategy templates with map overlays, hotspots (clickable markers), tags, and a moderation pipeline.
- **✅ Discord Validation** — Strategies submitted via the app trigger a Discord webhook embed with approve/reject links secured by HMAC-SHA256 tokens. One-click moderation from Discord.
- **🔐 Authentication** — Supabase Auth with automatic profile creation, Row-Level Security on all tables, and middleware-based route protection.
- **📱 PWA** — Installable on mobile and desktop. Service worker caching via `@ducanh2912/next-pwa`. Offline-aware UI with connection status banners.
- **🎨 Dark-First UI** — Neutral-950/900 palette, Geist font, subtle shadows, and a clean tactical aesthetic.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16.2.6](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) + `tw-animate-css` |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) (base-nova style) + [Base UI React](https://base-ui.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Backend / Database** | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Row-Level Security) |
| **State Management** | [Zustand 5](https://github.com/pmndrs/zustand) |
| **PWA** | [`@ducanh2912/next-pwa`](https://github.com/DuCanh29/next-pwa) |
| **Font** | [Geist](https://vercel.com/font) (via `next/font`) |
| **CSS Utility** | `clsx` + `tailwind-merge` (via `cn()` helper) |
| **Validation** | HMAC-SHA256 (Node `crypto`) |
| **Linting** | ESLint 9 + `eslint-config-next` |

---

## Getting Started

### Prerequisites

- **Node.js 20+** (LTS recommended)
- **npm** (comes with Node.js)
- A **Supabase** account and project ([create one for free](https://supabase.com/dashboard))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/r6hub.git
cd r6hub

# Install dependencies
npm install

# Copy the environment template and fill in your values
cp .env.local.example .env.local
```

### Environment Variables

```env
# ── Supabase ────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ── Discord Webhook (optional, for strategy moderation) ──
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-id/your-webhook-token

# ── Validation HMAC Secret (required for strategy moderation) ──
VALIDATION_HMAC_SECRET=your-hmac-secret-here
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database Setup

r6hub uses 5 sequential migration files located in `supabase/migrations/`. Run them in order against your Supabase project:

| # | File | Purpose |
|---|------|---------|
| 1 | `00001_setup_schema.sql` | Creates all tables (`profiles`, `maps`, `sites`, `operators`, `operator_tags`, `lobbies`, `lobby_members`, `rounds`, `lobby_bans`, `lobby_selections`, `strategy_templates`, `strategy_tags`, `strategy_hotspots`, `task_assignments`, `validation_queue`) with foreign keys, constraints, and indexes. |
| 2 | `00002_rls_policies.sql` | Enables Row-Level Security on every table. Grants authenticated users minimal access (read own lobbies, insert own selections, etc.). Locks down `validation_queue` to server-side only. |
| 3 | `00003_seed_reference.sql` | Seeds 5 maps (Oregon, Bank, Clubhouse, Kafe, Border), 20 bomb sites, 15 operators (attackers + defenders) with archetype tags. |
| 4 | `00004_seed_strategies.sql` | Seeds 25 approved strategy templates across maps with tags and map hotspots. |
| 5 | `00005_auth_triggers.sql` | Creates auth triggers: auto-creates `profiles` row on user signup, updates `lobbies.updated_at` on member changes, marks lobby closed when leader leaves. |

### Apply Migrations via Supabase CLI

```bash
# Install Supabase CLI if you haven't
# https://supabase.com/docs/guides/cli

# Link your project
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push
```

### Apply Migrations Manually

Open your Supabase project's SQL Editor and execute the contents of each file in order (1 → 5). Enable the `pgcrypto` extension if prompted.

---

## Architecture

```
r6hub/
├── app/
│   ├── (auth)/                # Auth-related route group (login/signup placeholder)
│   ├── (main)/                # Main layout route group
│   ├── api/
│   │   ├── lobby/
│   │   │   ├── route.ts               # POST /api/lobby — Create lobby
│   │   │   ├── join/route.ts          # POST /api/lobby/join — Join by room code
│   │   │   └── [id]/
│   │   │       ├── state/route.ts     # GET  /api/lobby/[id]/state — Full lobby state
│   │   │       ├── leave/route.ts     # POST /api/lobby/[id]/leave — Leave lobby
│   │   │       ├── bans/route.ts      # GET/POST /api/lobby/[id]/bans — Ban operators
│   │   │       ├── new-round/route.ts # POST /api/lobby/[id]/new-round — Advance round
│   │   │       ├── lock-selection/route.ts # POST — Lock operator/map/site selection
│   │   │       └── assign-tasks/route.ts   # POST — Assign strategy to player
│   │   ├── strategies/
│   │   │   ├── route.ts               # GET/POST /api/strategies — List & submit
│   │   │   └── [id]/approve/route.ts  # POST /api/strategies/[id]/approve — Internal approval
│   │   └── validate/
│   │       └── route.ts               # GET /api/validate — Handle Discord validation links
│   ├── lobby/
│   │   └── [code]/
│   │       ├── page.tsx               # Lobby dashboard (members, bans, rounds)
│   │       ├── bans/page.tsx          # Ban management UI (leader only)
│   │       ├── select/page.tsx        # Operator selection UI
│   │       ├── tasks/page.tsx         # Task assignment view
│   │       └── submit/page.tsx        # Strategy submission form
│   ├── validate/
│   │   └── page.tsx                   # Validation result page (from Discord link)
│   ├── layout.tsx                     # Root layout with Geist font, PWA manifest
│   ├── page.tsx                       # Landing page (create / join lobby)
│   └── globals.css                    # Tailwind CSS v4 global styles
├── components/
│   ├── lobby/                # Lobby-specific components (stubs)
│   ├── maps/
│   │   └── MapViewer.tsx     # Interactive map with hotspot overlay & SVG markers
│   ├── tasks/                # Task-specific components (stubs)
│   ├── ugc/                  # UGC-specific components (stubs)
│   └── ui/
│       ├── badge.tsx         # Badge component (success, warning, etc.)
│       ├── button.tsx        # Button with variants (default, outline, ghost, etc.)
│       ├── card.tsx          # Card with header/title/content/footer
│       ├── dialog.tsx        # Dialog/modal component
│       ├── EmptyState.tsx    # Empty state placeholder
│       ├── ErrorBoundary.tsx # React error boundary with retry
│       ├── input.tsx         # Input component
│       ├── LoadingSpinner.tsx# Loading spinner
│       ├── OfflineBanner.tsx # Connection status banner
│       └── SkeletonCard.tsx  # Skeleton loading card
├── lib/
│   ├── utils.ts             # cn() helper (clsx + tailwind-merge)
│   └── supabase/
│       ├── client.ts        # Browser-side Supabase client
│       ├── server.ts        # Server-side Supabase client (cookies-based SSR)
│       └── middleware.ts    # Auth middleware (session refresh, route protection)
├── stores/
│   └── lobbyStore.ts        # Zustand store for lobby state (members, rounds, bans, selections)
├── types/
│   └── index.ts             # TypeScript interfaces for all database tables
├── supabase/
│   └── migrations/
│       ├── 00001_setup_schema.sql
│       ├── 00002_rls_policies.sql
│       ├── 00003_seed_reference.sql
│       ├── 00004_seed_strategies.sql
│       └── 00005_auth_triggers.sql
├── public/
│   ├── manifest.json        # PWA manifest (standalone display, theme color, icons)
│   └── icons/               # PWA app icons (192x192, 512x512)
├── middleware.ts            # Next.js middleware — session refresh + protected routes
├── next.config.ts           # Next.js config with PWA plugin
└── components.json          # shadcn/ui configuration
```

### State Flow

1. **Landing** → User creates or joins a lobby via `POST /api/lobby` or `POST /api/lobby/join`.
2. **Lobby Dashboard** → Fetches full state via `GET /api/lobby/[id]/state` and polls every 3 seconds.
3. **Selections** → Each player picks an operator/map/site. Selections are upserted via `POST /api/lobby/[id]/lock-selection`. When `operator_id` is provided, the selection is locked (`locked_at` timestamp set).
4. **Bans** → Leader bans operators per side via `POST /api/lobby/[id]/bans`. Bans carry over to the next round automatically.
5. **Rounds** → Leader advances rounds via `POST /api/lobby/[id]/new-round`. Previous round is marked completed, bans are copied forward.
6. **Task Assignment** → Each player or the leader triggers `POST /api/lobby/[id]/assign-tasks`. The server matches the player's chosen operator's tags against approved strategies for the current map/site, picks the oldest unassigned match, and creates a task assignment.

---

## API Endpoints

### Lobby Endpoints

| Method | Route | Description | Auth | Body |
|--------|-------|-------------|------|------|
| `POST` | `/api/lobby` | Create a new lobby | Required | — |
| `POST` | `/api/lobby/join` | Join by room code | Required | `{ room_code: string }` |
| `GET` | `/api/lobby/[id]/state` | Full lobby state (members, current round, selections, bans) | Required | — |
| `POST` | `/api/lobby/[id]/leave` | Remove yourself from the lobby | Required | — |
| `GET` | `/api/lobby/[id]/bans` | List all bans | Required | — |
| `POST` | `/api/lobby/[id]/bans` | Ban an operator (leader only) | Required | `{ operator_id, side }` |
| `POST` | `/api/lobby/[id]/new-round` | Advance to next round (leader only) | Required | — |
| `POST` | `/api/lobby/[id]/lock-selection` | Upsert your selection (map/site/operator) | Required | `{ map_id?, site_id?, operator_id? }` |
| `POST` | `/api/lobby/[id]/assign-tasks` | Assign a strategy to a player | Required | `{ user_id, operator_id }` |

### Strategy Endpoints

| Method | Route | Description | Auth | Body / Params |
|--------|-------|-------------|------|---------------|
| `GET` | `/api/strategies` | List strategies (filter by `map_id`, `site_id`, `status`) | Required | Query params |
| `POST` | `/api/strategies` | Submit a new strategy (sends Discord webhook) | Required | `{ title, map_id, site_id, image_url, description?, tags?, hotspots? }` |
| `POST` | `/api/strategies/[id]/approve` | Approve a strategy (internal) | Required | — |

### Validation Endpoint

| Method | Route | Description | Auth | Params |
|--------|-------|-------------|------|--------|
| `GET` | `/api/validate` | Handle Discord approve/reject links (returns HTML page) | Public | `token`, `strategyId`, `action` |

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add DISCORD_WEBHOOK_URL
vercel env add VALIDATION_HMAC_SECRET

# Deploy to production
vercel --prod
```

Make sure your Supabase project's **Row-Level Security** policies are applied (migration `00002`) and that your Supabase URL and anon key are correctly set in the production environment.

For the Discord webhook integration:
1. Create a webhook in your Discord server (Server Settings → Integrations → Webhooks).
2. Set `DISCORD_WEBHOOK_URL` in your environment.
3. Set `VALIDATION_HMAC_SECRET` to a long random string (used to sign approve/reject URLs).

### PWA Notes

- The service worker is **disabled in development** (`NODE_ENV === "development"`).
- Enable it in production builds: `npm run build && npm start`.
- The app registers the service worker and caches navigation requests for offline capability.
- The manifest is served at `/manifest.json` and declares `display: standalone` with a dark theme color.

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/my-feature`.
3. Make your changes.
4. Ensure lint passes: `npm run lint`.
5. Commit with a descriptive message following conventional commits style.
6. Open a pull request against `main`.

### Guidelines

- **Types** — All Supabase table types are defined in `types/index.ts`. Keep in sync with migrations.
- **Migrations** — Add new migration files to `supabase/migrations/` with sequential numbering. Use `IF NOT EXISTS` and `ON CONFLICT DO NOTHING` for idempotency.
- **API Routes** — Server-client separation: use `@/lib/supabase/server` for API routes, `@/lib/supabase/client` for browser-side queries.
- **State** — Use the Zustand store (`stores/lobbyStore.ts`) for shared lobby state. Avoid prop-drilling.
- **UI Components** — Follow the shadcn/ui pattern. Place reusable UI primitives in `components/ui/`, domain components in `components/<domain>/`.

---

## License

[MIT](LICENSE)

---

<div align="center">
  <sub>Built with ❤️ for the Rainbow Six Siege community.</sub>
</div>
