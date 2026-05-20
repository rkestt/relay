# Strategy-Operator Binding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bind strategies to a single operator instead of generic tags. When submitting a strategy, you pick the operator it belongs to. When assigning tasks, we look up strategies for that specific operator.

**Architecture:** Add `operator_id` to `strategy_templates`. Update submit form to include operator selection. Update `assign-tasks` API to query by `operator_id` instead of tags.

**Tech Stack:** Next.js App Router, Supabase, Tailwind CSS

---

## Task 1: Database Migration — Add `operator_id` to `strategy_templates`

**Files:**
- Create: `supabase/migrations/00015_strategy_operator_id.sql`

**Step 1: Write migration**

```sql
-- Add operator_id to strategy_templates for per-operator strategies
ALTER TABLE strategy_templates ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES operators(id) ON DELETE SET NULL;

-- Create index for operator lookups
CREATE INDEX IF NOT EXISTS idx_strategy_templates_operator_id ON strategy_templates (operator_id);
```

**Step 2: Commit**

```bash
git add supabase/migrations/00015_strategy_operator_id.sql
git commit -m "feat(db): add operator_id to strategy_templates"
```

---

## Task 2: Types — Add `operator_id` to StrategyTemplate

**Files:**
- Modify: `types/index.ts`

**Step 1: Add operator_id to StrategyTemplate interface**

```typescript
export interface StrategyTemplate {
  id: string;
  map_id: string | null;
  site_id: string | null;
  operator_id: string | null;
  title: string;
  description: string | null;
  image_url: string;
  images?: StrategyImage[];
  status: "pending" | "approved" | "rejected";
  created_by: string | null;
  created_at: string;
}
```

**Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat(types): add operator_id to StrategyTemplate"
```

---

## Task 3: API — Update POST /api/strategies to Accept operator_id

**Files:**
- Modify: `app/api/strategies/route.ts`

**Step 1: Update body parsing and validation**

Change line 33 from:
```typescript
const { title, map_id, site_id, description, tags, image_url, hotspots, images } = body;
```
to:
```typescript
const { title, map_id, site_id, operator_id, description, tags, image_url, hotspots, images } = body;
```

Add validation after line 55:
```typescript
if (!operator_id || typeof operator_id !== "string") {
  return NextResponse.json(
    { error: "operator_id is required" },
    { status: 400 },
  );
}
```

**Step 2: Update insert to include operator_id**

Change the insert payload (around line 71-79) to include `operator_id`:
```typescript
.insert({
  title,
  map_id,
  site_id,
  operator_id,
  description: description || null,
  image_url: imageUrl,
  status: "pending",
  created_by: user.id,
})
```

**Step 3: Commit**

```bash
git add app/api/strategies/route.ts
git commit -m "feat(api): accept operator_id when creating strategy"
```

---

## Task 4: Frontend — Add Operator Selection to Submit Form

**Files:**
- Modify: `app/lobby/[code]/submit/page.tsx`

**Step 1: Add operator state and loading**

Add after line 86:
```typescript
const [operators, setOperators] = useState<Operator[]>([]);
const [selectedOperatorId, setSelectedOperatorId] = useState<string>("");
```

**Step 2: Load operators on mount**

Add after the maps loading useEffect (around line 121):
```typescript
// Load operators
useEffect(() => {
  const supabase = createBrowserClient();
  supabase
    .from("operators")
    .select("*")
    .then(({ data }) => {
      setOperators((data ?? []) as Operator[]);
    });
}, []);
```

**Step 3: Add operator validation to submit**

In `handleSubmit`, add after the site validation:
```typescript
if (!selectedOperatorId) {
  setError("Please select an operator.");
  return;
}
```

**Step 4: Include operator_id in POST body**

In the fetch body, add:
```typescript
body: JSON.stringify({
  title: title.trim(),
  map_id: selectedMapId,
  site_id: selectedSiteId,
  operator_id: selectedOperatorId,
  description: description.trim() || undefined,
  tags,
  images: imageUrls,
  hotspots: hotspots.map((h) => ({
    x_percent: h.x_percent,
    y_percent: h.y_percent,
  })),
}),
```

**Step 5: Add operator selection UI**

Add a new section after the Site Selection section (after line 550):

```tsx
{/* ── Operator Selection ─────────────────────────── */}
<section className="flex flex-col gap-2">
  <label
    htmlFor="operator"
    className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-neutral-500 uppercase"
  >
    Operator
    <span className="text-red-400">*</span>
  </label>
  <select
    id="operator"
    value={selectedOperatorId}
    onChange={(e) => {
      logger.debug("SubmitPage", "Operator selection changed", { operatorId: e.target.value });
      setSelectedOperatorId(e.target.value);
    }}
    className={cn(
      "flex h-12 w-full rounded-xl border-2 px-3 py-2 text-sm transition-all duration-200",
      "bg-neutral-900 border-neutral-800 text-neutral-200",
      "focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20",
      !selectedOperatorId && "text-neutral-500",
    )}
  >
    <option value="" disabled>
      Select an operator…
    </option>
    {operators.map((op) => (
      <option key={op.id} value={op.id}>
        {op.name} ({op.side})
      </option>
    ))}
  </select>
</section>
```

**Step 6: Update test data fill**

In `handleFillTestData`, add operator selection:
```typescript
if (operators.length > 0) {
  setSelectedOperatorId(operators[0].id);
}
```

**Step 7: Commit**

```bash
git add app/lobby/[code]/submit/page.tsx
git commit -m "feat(submit): add operator selection to strategy form"
```

---

## Task 5: API — Update assign-tasks to Query by operator_id

**Files:**
- Modify: `app/api/lobby/[id]/assign-tasks/route.ts`

**Step 1: Replace tag-based lookup with operator_id-based lookup**

The current logic (lines 97-185) fetches operator tags, then finds strategies matching those tags. Replace this entire block with a direct query by `operator_id`.

After finding the current round (line 95), replace everything from line 97 to line 185 with:

```typescript
    // -- Fetch approved strategies for this operator ---------------------
    let strategiesQuery = supabase
      .from("strategy_templates")
      .select("id, title, description, image_url, created_at")
      .eq("status", "approved")
      .eq("operator_id", operator_id);

    if (mapId) {
      strategiesQuery = strategiesQuery.eq("map_id", mapId);
    }
    if (siteId) {
      strategiesQuery = strategiesQuery.eq("site_id", siteId);
    }

    const { data: allStrategies } = await strategiesQuery;

    if (!allStrategies || allStrategies.length === 0) {
      return NextResponse.json(
        {
          error: "No approved strategies found for this operator on the current map/site",
        },
        { status: 404 },
      );
    }

    const matchingStrategies = allStrategies.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
```

**Step 2: Commit**

```bash
git add app/api/lobby/[id]/assign-tasks/route.ts
git commit -m "feat(api): assign tasks by operator_id instead of tags"
```

---

## Task 6: Fix Existing Denari Strategy in DB

**Files:**
- None (DB update via script)

**Step 1: Update the Denari strategy to have operator_id**

Run a script to set `operator_id` on the existing Denari strategy:

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(url, key);

async function main() {
  // Find Denari operator
  const { data: operator } = await supabase
    .from('operators')
    .select('id')
    .ilike('name', '%denari%')
    .single();

  if (!operator) {
    console.log('Denari operator not found');
    return;
  }

  // Update strategy
  const { error } = await supabase
    .from('strategy_templates')
    .update({ operator_id: operator.id })
    .eq('id', 'bf6adca1-fbdb-4c6c-b204-e6deab9a9914');

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Updated Denari strategy with operator_id');
  }
}

main().catch(console.error);
```

**Step 2: Commit**

No file changes for this step.

---

## Summary of Files Changed

| File | Action |
|------|--------|
| `supabase/migrations/00015_strategy_operator_id.sql` | Create |
| `types/index.ts` | Modify |
| `app/api/strategies/route.ts` | Modify |
| `app/lobby/[code]/submit/page.tsx` | Modify |
| `app/api/lobby/[id]/assign-tasks/route.ts` | Modify |
