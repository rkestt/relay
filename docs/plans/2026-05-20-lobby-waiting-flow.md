# Lobby Waiting Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "waiting room" phase to lobbies so players wait for the squad to assemble before the leader starts the game.

**Architecture:** Add a `phase` column to `lobbies` with values `'waiting' | 'playing' | 'closed'`. When a lobby is created, `phase = 'waiting'`. The leader sees a "Start Game" button that transitions to `'playing'`. The lobby hub UI adapts to the phase. Other game pages (bans, select, tasks) are only accessible in `'playing'` phase.

**Tech Stack:** Next.js App Router, Supabase (PostgreSQL + Realtime), Zustand, Tailwind CSS

---

## Task 1: Database Migration — Add `phase` to `lobbies`

**Files:**
- Create: `supabase/migrations/00010_lobby_phase.sql`

**Step 1: Write migration**

```sql
-- Add phase column to lobbies for waiting room flow
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'waiting' CHECK (phase IN ('waiting', 'playing', 'closed'));

-- Update existing active lobbies to 'playing' so they don't break
UPDATE lobbies SET phase = 'playing' WHERE status = 'active' AND phase = 'waiting';

-- Create index for phase lookups
CREATE INDEX IF NOT EXISTS idx_lobbies_phase ON lobbies (phase);
```

**Step 2: Apply migration locally**

Run: `npx supabase migration up` (or equivalent local command)
Expected: Migration applies successfully

**Step 3: Commit**

```bash
git add supabase/migrations/00010_lobby_phase.sql
git commit -m "feat(db): add lobby phase column for waiting room flow"
```

---

## Task 2: API — Create Lobby Sets `phase = 'waiting'`

**Files:**
- Modify: `app/api/lobby/route.ts:80`

**Step 1: Modify insert to include phase**

Change line 80 from:
```typescript
.insert({ room_code: roomCode, leader_id: user.id, starting_side: startingSide })
```
to:
```typescript
.insert({ room_code: roomCode, leader_id: user.id, starting_side: startingSide, phase: 'waiting' })
```

**Step 2: Verify the response includes phase**

The `.select("id, room_code, leader_id, starting_side")` on line 81 should include `phase`:
```typescript
.select("id, room_code, leader_id, starting_side, phase")
```

**Step 3: Commit**

```bash
git add app/api/lobby/route.ts
git commit -m "feat(api): set lobby phase to waiting on creation"
```

---

## Task 3: API — Add `POST /api/lobby/[id]/start` Endpoint

**Files:**
- Create: `app/api/lobby/[id]/start/route.ts`

**Step 1: Write the endpoint**

```typescript
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();

    // -- Authenticate ---------------------------------------------------
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    logger.info("API", "POST /api/lobby/[id]/start start", { lobbyId: id });

    // -- Verify user is the leader --------------------------------------
    const { data: lobby, error: lobbyError } = await supabase
      .from("lobbies")
      .select("id, leader_id, phase")
      .eq("id", id)
      .single();

    if (lobbyError || !lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    if (lobby.leader_id !== user.id) {
      return NextResponse.json({ error: "Only the leader can start the game" }, { status: 403 });
    }

    if (lobby.phase !== 'waiting') {
      return NextResponse.json({ error: "Lobby is not in waiting phase" }, { status: 400 });
    }

    // -- Update phase to playing ------------------------------------------
    const { error: updateError } = await supabase
      .from("lobbies")
      .update({ phase: 'playing', updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      logger.error("API", "Failed to start lobby", updateError);
      return NextResponse.json({ error: "Failed to start game" }, { status: 500 });
    }

    logger.debug("API", "POST /api/lobby/[id]/start success", { lobbyId: id });
    return NextResponse.json({ success: true, phase: 'playing' });
  } catch (error) {
    logger.error("API", "Lobby start unexpected error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/lobby/[id]/start/route.ts
git commit -m "feat(api): add lobby start endpoint for leader"
```

---

## Task 4: API — Include `phase` in Lobby State Response

**Files:**
- Modify: `app/api/lobby/[id]/state/route.ts:25-28`

**Step 1: Update lobby select to include phase**

Change line 27 from:
```typescript
.select("*")
```
to:
```typescript
.select("*, phase")
```

Actually `.select("*")` already includes all columns, so `phase` is already included. But let's verify the response shape. The response on line 81 returns `lobby` which now includes `phase`. No code change needed if `*` is used, but we should verify.

**Step 2: Commit**

No change needed if `*` is used. Skip commit or verify with a test.

---

## Task 5: Frontend — Update Lobby Hub for Waiting Phase

**Files:**
- Modify: `app/lobby/[code]/page.tsx`

**Step 1: Update LobbyState interface to include phase**

Add to the `LobbyState` interface:
```typescript
interface LobbyState {
  lobby: {
    id: string;
    room_code: string;
    leader_id: string;
    phase: "waiting" | "playing" | "closed";
  };
  // ... rest unchanged
}
```

**Step 2: Add start game handler**

Add after `handleNewRound`:
```typescript
const handleStartGame = useCallback(async () => {
  if (!lobbyId) return;
  if (state?.members.length === 1) {
    if (!confirm("You are the only player. Start anyway?")) return;
  }
  logger.info("LobbyPage", "Start game click", { lobbyId });
  try {
    const res = await fetch(`/api/lobby/${lobbyId}/start`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    logger.debug("LobbyPage", "Start game successful, refetching state");
    await refreshState(lobbyId);
  } catch (err) {
    logger.error("LobbyPage", "Start game failed", err);
    setError(err instanceof Error ? err.message : "Failed to start game");
  }
}, [lobbyId, refreshState, state?.members.length]);
```

**Step 3: Add waiting room UI**

Replace the main content section (after the header) with conditional rendering based on `phase`.

When `state.lobby.phase === 'waiting'`, show:
- Big room code display with "Share this code with your squad"
- Member list (already exists)
- For leader: "Start Game" button (with warning if only 1 player)
- For non-leader: "Waiting for leader to start..."

When `state.lobby.phase === 'playing'`, show the existing UI (bans, selections, leader controls, Select Operator CTA).

**Step 4: Commit**

```bash
git add app/lobby/[code]/page.tsx
git commit -m "feat(lobby): add waiting room UI with start game flow"
```

---

## Task 6: Frontend — Block Game Pages in Waiting Phase

**Files:**
- Modify: `app/lobby/[code]/bans/page.tsx`
- Modify: `app/lobby/[code]/select/page.tsx`
- Modify: `app/lobby/[code]/tasks/page.tsx`

**Step 1: Add phase check to each page**

In each page, after fetching lobby state, check if `phase === 'waiting'`. If so, redirect back to `/lobby/${code}` or show a message.

Example for bans page:
```typescript
// After loading lobby state
if (lobby.phase === 'waiting') {
  router.push(`/lobby/${code}`);
  return;
}
```

**Step 2: Commit**

```bash
git add app/lobby/[code]/bans/page.tsx app/lobby/[code]/select/page.tsx app/lobby/[code]/tasks/page.tsx
git commit -m "feat(lobby): redirect game pages to hub when in waiting phase"
```

---

## Task 7: Realtime — Ensure Phase Changes Trigger Updates

**Files:**
- Modify: `hooks/useLobbyRealtime.ts`

**Step 1: Verify lobbies table is in the subscription**

Check that `useLobbyRealtime` subscribes to the `lobbies` table or at least triggers a full state refresh on any relevant change. If it already listens to `lobby_members`, `lobby_selections`, `lobby_bans`, `rounds`, but NOT `lobbies`, add `lobbies` to the channel subscription.

Look for something like:
```typescript
.channel(`lobby:${lobbyId}`)
.on('postgres_changes', { event: '*', schema: 'public', table: 'lobbies', filter: `id=eq.${lobbyId}` }, callback)
```

If not present, add it so phase changes propagate.

**Step 2: Commit**

```bash
git add hooks/useLobbyRealtime.ts
git commit -m "feat(realtime): subscribe to lobbies table for phase changes"
```

---

## Task 8: Types — Update TypeScript Types

**Files:**
- Modify: `types/index.ts`

**Step 1: Add phase to Lobby type**

Find the `Lobby` type (or `LobbyState` / `Lobby` interface) and add:
```typescript
phase: "waiting" | "playing" | "closed";
```

**Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat(types): add phase to Lobby type"
```

---

## Task 9: Testing — Manual Verification

**Step 1: Create a lobby**
- Go to home page
- Click "Create Lobby"
- Verify redirect to `/lobby/[code]`
- Verify UI shows "Waiting Room" with room code
- Verify "Start Game" button is visible (leader only)

**Step 2: Join from another browser/account**
- Join with room code
- Verify new member appears in waiting room
- Verify non-leader sees "Waiting for leader..."

**Step 3: Start game**
- Leader clicks "Start Game"
- Verify UI transitions to normal lobby (bans, selections, etc.)
- Verify other player sees the transition

**Step 4: Verify blocked pages in waiting phase**
- Try to navigate directly to `/lobby/[code]/bans` while in waiting
- Verify redirect to lobby hub

**Step 5: Commit**

```bash
git commit -m "test(lobby): verify waiting room flow manually"
```

---

## Summary of Files Changed

| File | Action |
|------|--------|
| `supabase/migrations/00010_lobby_phase.sql` | Create |
| `app/api/lobby/route.ts` | Modify |
| `app/api/lobby/[id]/start/route.ts` | Create |
| `app/api/lobby/[id]/state/route.ts` | Verify (no change needed if `*` select) |
| `app/lobby/[code]/page.tsx` | Modify |
| `app/lobby/[code]/bans/page.tsx` | Modify |
| `app/lobby/[code]/select/page.tsx` | Modify |
| `app/lobby/[code]/tasks/page.tsx` | Modify |
| `hooks/useLobbyRealtime.ts` | Modify |
| `types/index.ts` | Modify |
