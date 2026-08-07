import { createClient, createAdminClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/supabase/timeout";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { createStrategySchema, validateRequest } from "@/lib/validations";

// ──────────────────────────────────────────────
// POST /api/strategies — submit a new strategy
// ──────────────────────────────────────────────
export async function POST(request: Request) {
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

    // -- Parse & validate body ------------------------------------------
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const validation = validateRequest(createStrategySchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const { title, map_id, site_id, operator_id, description, tags, image_url, hotspots, images } =
      validation.data;

    logger.info("API", "POST /api/strategies start", { title, map_id, site_id });

    const imageUrl = Array.isArray(images) && images.length > 0
      ? images[0]
      : image_url;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "image_url is required" },
        { status: 400 },
      );
    }

    // -- Insert strategy template (use admin client to bypass RLS) ------
    const adminClient = createAdminClient();
    const { data: strategy, error: insertError } = await withTimeout(
      adminClient
        .from("strategy_templates")
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
        .select("id, status")
        .single(),
      15000,
      "insert strategy"
    );

    if (insertError || !strategy) {
      logger.error("API", "Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create strategy" },
        { status: 500 },
      );
    }

    // -- Insert tags ----------------------------------------------------
    if (Array.isArray(tags)) {
      const tagRows = tags
        .filter((t): t is string => typeof t === "string")
        .map((tag) => ({ strategy_id: strategy.id, tag }));

      if (tagRows.length > 0) {
        const { error: tagError } = await withTimeout(
          adminClient
            .from("strategy_tags")
            .insert(tagRows),
          15000,
          "insert strategy tags"
        );

        if (tagError) {
          logger.error("API", "Failed to insert tags", tagError);
          // Non-fatal — strategy already created
        }
      }
    }

    // -- Insert hotspots -------------------------------------------------
    if (Array.isArray(hotspots)) {
      const hotspotRows = hotspots
        .filter(
          (
            h,
          ): h is {
            x_percent: number;
            y_percent: number;
            label?: string;
            image_id?: string;
          } =>
            typeof h === "object" &&
            h !== null &&
            typeof (h as Record<string, unknown>).x_percent === "number" &&
            typeof (h as Record<string, unknown>).y_percent === "number",
        )
        .map((h) => ({
          strategy_id: strategy.id,
          x_percent: h.x_percent,
          y_percent: h.y_percent,
          label: h.label || null,
          image_id: h.image_id || null,
        }));

      if (hotspotRows.length > 0) {
        const { error: hotspotError } = await withTimeout(
          adminClient
            .from("strategy_hotspots")
            .insert(hotspotRows),
          15000,
          "insert strategy hotspots"
        );

        if (hotspotError) {
          logger.error("API", "Failed to insert hotspots", hotspotError);
          // Non-fatal
        }
      }
    }

    // -- Insert images ----------------------------------------------------
    const strategyImages = images as string[] | undefined;
    if (Array.isArray(strategyImages) && strategyImages.length > 0) {
      const imageRows = strategyImages.map((url, index) => ({
        strategy_id: strategy.id,
        image_url: url,
        sort_order: index,
      }));

      const { error: imageError } = await withTimeout(
        adminClient
          .from("strategy_images")
          .insert(imageRows),
        15000,
        "insert strategy images"
      );

      if (imageError) {
        logger.error("API", "Failed to insert images", imageError);
        // Non-fatal — strategy already created
      }
    }

    // -- Generate validation tokens & queue entries ----------------------
    logger.debug("API", "POST /api/strategies success", { strategyId: strategy.id, status: strategy.status });

    // Invalidate cache so new strategy appears immediately
    revalidatePath("/strategies");
    revalidateTag("strategies", "max");

    return NextResponse.json(
      { strategy: { id: strategy.id, status: strategy.status } },
      { status: 201 },
    );
  } catch (error) {
    logger.error("API", "Strategy creation unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ──────────────────────────────────────────────
// GET /api/strategies — list strategies
// Filtri: map_id, site_id, operator_id, tag, q (search), status
// Paginazione: page (default 1), page_size (default 20, max 100)
// ──────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const map_id = searchParams.get("map_id");
    const site_id = searchParams.get("site_id");
    const operator_id = searchParams.get("operator_id");
    const tag = searchParams.get("tag");
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status") || "approved";

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("page_size") || "20", 10) || 20),
    );
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    logger.info("API", "GET /api/strategies start", {
      map_id, site_id, operator_id, tag, q, status, page, pageSize,
    });

    let query = supabase
      .from("strategy_templates")
      .select(
        "id, title, description, image_url, status, map_id, site_id, operator_id, created_by, created_at, strategy_tags(*), strategy_hotspots(*), strategy_images(*)",
        { count: "exact" },
      );

    if (tag) {
      // Filtro su relazione to-many: inner join + eq per count corretto
      query = supabase
        .from("strategy_templates")
        .select(
          "id, title, description, image_url, status, map_id, site_id, operator_id, created_by, created_at, strategy_tags!inner(*), strategy_hotspots(*), strategy_images(*)",
          { count: "exact" },
        )
        .eq("strategy_tags.tag", tag);
    }

    if (map_id) query = query.eq("map_id", map_id);
    if (site_id) query = query.eq("site_id", site_id);
    if (operator_id) query = query.eq("operator_id", operator_id);
    if (q && q.length <= 100) {
      const pattern = `%${q}%`;
      query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`);
    }
    query = query.eq("status", status).order("created_at", {
      ascending: false,
    }).range(from, to);

    const { data: strategies, error, count } = await withTimeout(
      query,
      10000,
      "fetch strategies"
    );

    if (error) {
      logger.error("API", "Failed to fetch strategies", error);
      return NextResponse.json(
        { error: "Failed to fetch strategies" },
        { status: 500 },
      );
    }

    const total = count ?? strategies?.length ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    logger.debug("API", "GET /api/strategies response", {
      strategyCount: strategies?.length ?? 0, total, page, totalPages,
    });
    return NextResponse.json(
      {
        strategies: strategies ?? [],
        pagination: { page, pageSize, total, totalPages },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          "CDN-Cache-Control": "public, s-maxage=60",
        },
      },
    );
  } catch (error) {
    logger.error("API", "Strategy fetch unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
