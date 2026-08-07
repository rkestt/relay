import { createClient, createAdminClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/supabase/timeout";
import { isAllowed } from "@/lib/auth/roles";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

const ACTIONS = ["approve", "reject"] as const;
type Action = (typeof ACTIONS)[number];
const MAX_REASON_LENGTH = 2000;

function isAction(value: unknown): value is Action {
  return typeof value === "string" && (ACTIONS as readonly string[]).includes(value);
}

// ──────────────────────────────────────────────
// POST /api/strategies/[id]/approve — in-app moderation decision
// body: { action: 'approve' | 'reject', reason?: string }
//   - 401 unauthenticated
//   - 403 authenticated but not a moderator (MODERATOR_EMAILS)
//   - 400 invalid action / missing reason on reject
//   - 404 strategy does not exist
//   - 409 strategy already decided with a different outcome
//   - 200 success (idempotent: repeating the same decision returns 200)
// Write path uses the admin client (bypasses RLS): the only gate is the
// moderator check above (see HANDOFF — single-owner trade-off).
// ──────────────────────────────────────────────
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // -- Authenticate + authorize --------------------------------------
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAllowed(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // -- Parse + validate body ------------------------------------------
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { action, reason } = (body ?? {}) as { action?: unknown; reason?: unknown };
    if (!isAction(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    const trimmedReason = typeof reason === "string" ? reason.trim() : "";
    if (action === "reject" && !trimmedReason) {
      return NextResponse.json(
        { error: "Reason required when rejecting" },
        { status: 400 },
      );
    }
    if (trimmedReason.length > MAX_REASON_LENGTH) {
      return NextResponse.json(
        { error: `Reason too long (max ${MAX_REASON_LENGTH} chars)` },
        { status: 400 },
      );
    }

    const { id } = await params;
    const status = action === "approve" ? "approved" : "rejected";
    const admin = createAdminClient();

    // -- Atomic decision: only pending rows can be decided ----------------
    const { data: updated, error: updateError } = await withTimeout(
      admin
        .from("strategy_templates")
        .update({
          status,
          moderated_by: user.id,
          moderated_at: new Date().toISOString(),
          rejected_reason: action === "reject" ? trimmedReason : null,
        })
        .eq("id", id)
        .eq("status", "pending")
        .select("id"),
      15000,
      "approve strategy",
    );

    if (updateError) {
      logger.error("API", "Failed to moderate strategy:", updateError);
      return NextResponse.json(
        { error: "Failed to moderate strategy" },
        { status: 500 },
      );
    }

    // -- 0 rows: distinguish 404 (missing) / 200 idempotent / 409 conflict
    if (!updated || updated.length === 0) {
      const { data: existing } = await withTimeout(
        admin.from("strategy_templates").select("id, status").eq("id", id),
        10000,
        "check strategy",
      );
      if (!existing || existing.length === 0) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      if (existing[0].status === status) {
        // Same decision repeated → idempotent success
        return NextResponse.json({ success: true, idempotent: true });
      }
      return NextResponse.json(
        { error: "Strategy already decided" },
        { status: 409 },
      );
    }

    // -- Invalidate any pending Discord validation tokens (best effort) --
    const { error: tokenError } = await withTimeout(
      admin
        .from("validation_queue")
        .update({ used_at: new Date().toISOString() })
        .eq("strategy_id", id),
      10000,
      "invalidate validation token",
    );
    if (tokenError) {
      logger.warn("API", "Failed to invalidate validation tokens:", tokenError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("API", "Strategy approve unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}