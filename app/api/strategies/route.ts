import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import crypto from "crypto";

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
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const { title, map_id, site_id, operator_id, description, tags, image_url, hotspots, images } =
      body;

    logger.info("API", "POST /api/strategies start", { title, map_id, site_id });

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 },
      );
    }
    if (!map_id || typeof map_id !== "string") {
      return NextResponse.json(
        { error: "map_id is required" },
        { status: 400 },
      );
    }
    if (!site_id || typeof site_id !== "string") {
      return NextResponse.json(
        { error: "site_id is required" },
        { status: 400 },
      );
    }
    if (!operator_id || typeof operator_id !== "string") {
      return NextResponse.json(
        { error: "operator_id is required" },
        { status: 400 },
      );
    }
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
    const { data: strategy, error: insertError } = await adminClient
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
      .single();

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
        const { error: tagError } = await adminClient
          .from("strategy_tags")
          .insert(tagRows);

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
        const { error: hotspotError } = await adminClient
          .from("strategy_hotspots")
          .insert(hotspotRows);

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

      const { error: imageError } = await adminClient
        .from("strategy_images")
        .insert(imageRows);

      if (imageError) {
        logger.error("API", "Failed to insert images", imageError);
        // Non-fatal — strategy already created
      }
    }

    // -- Generate validation tokens & queue entries ----------------------
    const secret = process.env.VALIDATION_HMAC_SECRET;
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const validationLinks: Record<string, string> = {};

    if (secret) {
      for (const action of ["approve", "reject"] as const) {
        const timestamp = new Date().toISOString();
        const payload = `${strategy.id}:${action}:${timestamp}`;
        const token = crypto
          .createHmac("sha256", secret)
          .update(payload)
          .digest("hex");

        const expiresAt = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString();

        const { error: queueError } = await adminClient
          .from("validation_queue")
          .insert({
            strategy_id: strategy.id,
            token_hash: token,
            action,
            expires_at: expiresAt,
            created_at: timestamp,
          });

        if (queueError) {
          logger.error(
            "API",
            "Failed to insert validation queue entry",
            queueError,
          );
        } else {
          validationLinks[
            action
          ] = `${baseUrl}/api/validate?token=${token}&strategyId=${strategy.id}&action=${action}`;
        }
      }
    }

    // -- Call Discord webhook -------------------------------------------
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const tagList = Array.isArray(tags)
          ? tags.filter((t): t is string => typeof t === "string").join(", ")
          : "None";

        const description = Object.entries(validationLinks)
          .map(([action, url]) => {
            const emoji = action === "approve" ? "✅" : "❌";
            const label =
              action.charAt(0).toUpperCase() + action.slice(1);
            return `${emoji} [${label}](${url})`;
          })
          .join("\n");

        const embed: Record<string, unknown> = {
          title: "New Strategy Submitted",
          color: 0x5865f2,
          fields: [
            { name: "Title", value: String(title), inline: true },
            { name: "Status", value: "Pending", inline: true },
            { name: "Submitted by", value: user.id, inline: true },
            { name: "Tags", value: tagList || "None" },
          ],
          timestamp: new Date().toISOString(),
        };

        if (description) {
          embed.description = description;
        }

        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ embeds: [embed] }),
        });
      } catch (webhookError) {
        logger.error("API", "Failed to call Discord webhook", webhookError);
        // Non-fatal
      }
    }

    logger.debug("API", "POST /api/strategies success", { strategyId: strategy.id, status: strategy.status });
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
// ──────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const map_id = searchParams.get("map_id");
    const site_id = searchParams.get("site_id");
    const status = searchParams.get("status") || "approved";

    logger.info("API", "GET /api/strategies start", { map_id, site_id, status });

    let query = supabase
      .from("strategy_templates")
      .select(
        "id, title, description, image_url, status, map_id, site_id, created_by, created_at, strategy_tags(*), strategy_hotspots(*), strategy_images(*)",
      );

    if (map_id) query = query.eq("map_id", map_id);
    if (site_id) query = query.eq("site_id", site_id);
    query = query.eq("status", status);

    const { data: strategies, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      logger.error("API", "Failed to fetch strategies", error);
      return NextResponse.json(
        { error: "Failed to fetch strategies" },
        { status: 500 },
      );
    }

    logger.debug("API", "GET /api/strategies response", { strategyCount: strategies?.length ?? 0 });
    return NextResponse.json({ strategies: strategies ?? [] });
  } catch (error) {
    logger.error("API", "Strategy fetch unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
