## Why

Rainbow Six Siege players suffer from decision paralysis during the 30–45 second Preparation Phase. Vocal callouts are imprecise, strategies are hard to coordinate in real time, and new players lack clear guidance on site setup and attack coordination. A dedicated second-screen tool can transform this chaotic window into a structured, visual execution phase, drastically lowering the knowledge curve and improving team coordination.

## What Changes

- Build **r6hub**, a mobile-first PWA that acts as a second-screen tactical companion for Rainbow Six Siege.
- Introduce a **low-friction lobby system**: room creation via 6-character codes, local-storage persistence across matches, and sub-5-second operator selection.
- Assign a **lobby leader** (the creator) with privileges to set attacker and defender bans before each round.
- Implement a **tag-based task assignment engine** that generates individual, role-specific tasks based on operator archetypes and site selection, preventing duplicate assignments.
- Deliver tasks as a **hybrid visual output**: a 2D map for macro positioning plus annotated screenshots for technical precision.
- Support **round-based reset**: operator selections and assigned tasks clear between rounds while the lobby, map, site, and bans persist.
- Enable **user-generated content (UGC)** workflow: players upload strategies (image + text + tags) that pass through a validation gateway (Discord/Telegram) before publication.
- Add **social proof mechanics** (upvote/downvote) to surface the most effective community setups.
- Optimize for **real-time synchronization** of team selections and sub-2-second task loading to remain useful during the live Preparation Phase.

## Capabilities

### New Capabilities
- `lobby-management`: Room creation, 6-character room codes, local-storage persistence for rejoining without re-entering codes.
- `lobby-leader`: Creator becomes lobby leader with privileges to set attacker/defender bans and manage round flow.
- `ban-system`: Leader selects banned operators for both attacker and defender sides before each round; banned operators are unavailable for selection.
- `operator-selection`: Rapid Map → Site → Operator selection flow with real-time sync across team members.
- `task-assignment-engine`: Tag/archetype-driven task generation, conflict prevention for duplicate tasks, and hybrid 2D-map + screenshot output.
- `round-management`: Reset operator selections and task assignments between rounds while preserving lobby, map, site, and bans.
- `content-ugc`: User upload of strategies including image, text, and tags; optimized for unstable network conditions.
- `content-validation`: External validation gateway (Discord/Telegram) for approving or rejecting community submissions before they go live.
- `realtime-sync`: Real-time database layer to synchronize lobby state, selections, and task distribution across all connected clients.
- `pwa-core`: Progressive Web App shell with mobile-first responsive design, offline resilience, and fast initial load.

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- **Frontend**: New PWA codebase (React/Vue/Svelte + TypeScript), mobile-first CSS, service worker for offline support.
- **Database & Backend**: Real-time data layer (Firebase, Supabase, or custom WebSocket) for lobby state and sync.
- **Storage**: Image upload pipeline with compression/optimization for quick uploads on poor connections.
- **External Integrations**: Discord/Telegram webhooks or bots for the validation gateway.
- **DevOps**: Hosting setup for PWA, image CDN, and real-time backend.
