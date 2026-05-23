# Lobby Map Selection Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a single map selection step for the entire lobby, done by the leader right after starting the game. The map does not change during the lobby.

**Architecture:** Add `map_id` to `lobbies` table. After leader clicks "Start Game" and phase becomes `'playing'`, if `map_id` is null, redirect to `/lobby/[code]/map` where the leader picks the map. Once set, all players see the normal lobby flow.

**Tech Stack:** Next.js App Router, Supabase, Tailwind CSS

---

## Task 1: Database Migration — Add `map_id` to `lobbies`

**Files:**
- Create: `supabase/migrations/00013_lobby_map_id.sql`

**Step 1: Write migration**

```sql
-- Add map_id to lobbies for single map selection per lobby
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS map_id UUID REFERENCES maps(id) ON DELETE SET NULL;

-- Create index for map lookups
CREATE INDEX IF NOT EXISTS idx_lobbies_map_id ON lobbies (map_id);
```

**Step 2: Commit**

```bash
git add supabase/migrations/00013_lobby_map_id.sql
git commit -m "feat(db): add map_id to lobbies for single map selection"
```

---

## Task 2: Types — Add `map_id` to Lobby Type

**Files:**
- Modify: `types/index.ts`

**Step 1: Add map_id to Lobby interface**

```typescript
export interface Lobby {
  id: string;
  room_code: string;
  leader_id: string;
  status: "active" | "closed";
  phase: "waiting" | "playing" | "closed";
  map_id: string | null;
  starting_side: "attacker" | "defender" | null;
  created_at: string;
  updated_at: string;
}
```

**Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat(types): add map_id to Lobby interface"
```

---

## Task 3: API — Add `POST /api/lobby/[id]/set-map` Endpoint

**Files:**
- Create: `app/api/lobby/[id]/set-map/route.ts`

**Step 1: Write the endpoint**

```typescript
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    logger.info("API", "POST /api/lobby/[id]/set-map start", { lobbyId: id });

    // -- Verify user is the leader --------------------------------------
    const { data: lobby, error: lobbyError } = await supabase
      .from("lobbies")
      .select("id, leader_id, phase, map_id")
      .eq("id", id)
      .single();

    if (lobbyError || !lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    if (lobby.leader_id !== user.id) {
      return NextResponse.json({ error: "Only the leader can set the map" }, { status: 403 });
    }

    if (lobby.map_id) {
      return NextResponse.json({ error: "Map already selected" }, { status: 400 });
    }

    // -- Parse body -----------------------------------------------------
    let body: { map_id?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const mapId = body.map_id;
    if (!mapId || typeof mapId !== "string") {
      return NextResponse.json({ error: "map_id is required" }, { status: 400 });
    }

    // -- Verify map exists ----------------------------------------------
    const { data: mapData, error: mapError } = await supabase
      .from("maps")
      .select("id")
      .eq("id", mapId)
      .single();

    if (mapError || !mapData) {
      return NextResponse.json({ error: "Map not found" }, { status: 404 });
    }

    // -- Update lobby map_id --------------------------------------------
    const { error: updateError } = await supabase
      .from("lobbies")
      .update({ map_id: mapId, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      logger.error("API", "Failed to set lobby map", updateError);
      return NextResponse.json({ error: "Failed to set map" }, { status: 500 });
    }

    logger.debug("API", "POST /api/lobby/[id]/set-map success", { lobbyId: id, mapId });
    return NextResponse.json({ success: true, map_id: mapId });
  } catch (error) {
    logger.error("API", "Lobby set-map unexpected error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/lobby/[id]/set-map/route.ts
git commit -m "feat(api): add set-map endpoint for lobby leader"
```

---

## Task 4: Frontend — Create Map Selection Page

**Files:**
- Create: `app/lobby/[code]/map/page.tsx`

**Step 1: Write the page**

This page should:
- Load all maps from Supabase
- Show them in a grid (reuse the grid style from select page)
- Only the leader can select; non-leaders see "Waiting for leader to choose the map..."
- On selection, call `POST /api/lobby/[id]/set-map` then redirect to `/lobby/${code}`
- If map is already selected, redirect to `/lobby/${code}`

Use the same styling patterns as the existing select page (griglia di mappe con immagini, bordo evidenziato quando selezionata).

**Step 2: Commit**

```bash
git add app/lobby/[code]/map/page.tsx
git commit -m "feat(lobby): add map selection page for leader"
```

---

## Task 5: Frontend — Redirect to Map Selection When Needed

**Files:**
- Modify: `app/lobby/[code]/page.tsx`

**Step 1: Add redirect logic**

After the lobby state is loaded and `phase === 'playing'`, check if `map_id` is null. If so:
- Leader → redirect to `/lobby/${code}/map`
- Non-leader → show "Waiting for leader to choose the map..." (instead of the normal playing UI)

Add this check inside the `playing` phase branch, before showing bans/selections/etc.

**Step 2: Commit**

```bash
git add app/lobby/[code]/page.tsx
git commit -m "feat(lobby): redirect to map selection when map_id is null"
```

---

## Task 6: Realtime — Ensure Map Changes Trigger Updates

**Files:**
- Modify: `hooks/useLobbyRealtime.ts`

The `lobbies` UPDATE subscription added in Task 7 of the previous plan already handles this. No additional changes needed.

---

## Task 7: API State — Include `map_id` in Lobby State Response

**Files:**
- Modify: `app/api/lobby/[id]/state/route.ts`

The state route uses `.select("*")` on lobbies, so `map_id` is already included. Verify and confirm no changes needed.

---

## Summary of Files Changed

| File | Action |
|------|--------|
| `supabase/migrations/00013_lobby_map_id.sql` | Create |
| `types/index.ts` | Modify |
| `app/api/lobby/[id]/set-map/route.ts` | Create |
| `app/lobby/[code]/map/page.tsx` | Create |
| `app/lobby/[code]/page.tsx` | Modify |
