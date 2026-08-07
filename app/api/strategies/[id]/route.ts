import { createClient, createAdminClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/supabase/timeout";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { getProStatus } from "@/lib/pro";

// ──────────────────────────────────────────────
// GET /api/strategies/[id] — strategy detail
// Gating server-side:
//  - base (title, image, description, tags): tutti (view-only link condivisi, BUSINESS §8.1)
//  - hotspot + immagini multiple: solo Pro (o owner/creator)
//  - ?full=1 → richiede Pro (403 altrimenti)
// ──────────────────────────────────────────────
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(_request.url);
    const full = url.searchParams.get("full") === "1";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const adminClient = createAdminClient();
    const { data: strategy, error } = await withTimeout(
      adminClient
        .from("strategy_templates")
        .select(
          "id, title, description, image_url, status, map_id, site_id, operator_id, created_by, created_at, strategy_tags(*), strategy_hotspots(*), strategy_images(*), maps(name), operators(name)",
        )
        .eq("id", id)
        .eq("status", "approved")
        .maybeSingle(),
      10000,
      "fetch strategy detail",
    );

    if (error) {
      logger.error("API", "Failed to fetch strategy detail", error);
      return NextResponse.json(
        { error: "Failed to fetch strategy" },
        { status: 500 },
      );
    }

    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }

    // ── Gating ──
    let isPro = false;
    if (user) {
      const status = await getProStatus(user.id);
      isPro = status.isPro;
    }
    const isOwner = user && strategy.created_by === user.id;

    if (full && !isPro && !isOwner) {
      return NextResponse.json(
        { error: "Pro subscription required" },
        { status: 403 },
      );
    }

    const base = {
      id: strategy.id,
      title: strategy.title,
      description: strategy.description,
      image_url: strategy.image_url,
      map_id: strategy.map_id,
      site_id: strategy.site_id,
      operator_id: strategy.operator_id,
      created_by: strategy.created_by,
      created_at: strategy.created_at,
      status: strategy.status,
      map: strategy.maps,
      operator: strategy.operators,
      tags: strategy.strategy_tags ?? [],
      gated: !isPro && !isOwner,
    };

    if (!isPro && !isOwner) {
      // View-only: niente hotspot, niente immagini multiple
      return NextResponse.json({
        strategy: base,
        hotspots: [],
        images: [],
      });
    }

    return NextResponse.json({
      strategy: base,
      hotspots: strategy.strategy_hotspots ?? [],
      images: strategy.strategy_images ?? [],
    });
  } catch (error) {
    logger.error("API", "Strategy detail unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
