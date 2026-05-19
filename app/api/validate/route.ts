import { createAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import crypto from "crypto";

// ──────────────────────────────────────────────
// GET /api/validate — handle Discord validation links
// Query params: token, strategyId, action (approve|reject)
// ─────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    const token = searchParams.get("token");
    const strategyId = searchParams.get("strategyId");
    const action = searchParams.get("action");

    logger.info("API", "GET /api/validate start", { strategyId, action });

    // -- Validate required params ---------------------------------------
    if (!token || !strategyId || !action) {
      return new NextResponse(
        htmlPage("Invalid Request", "Missing required parameters."),
        { status: 400, headers: { "Content-Type": "text/html" } },
      );
    }

    const normalizedAction = action.toLowerCase();
    if (normalizedAction !== "approve" && normalizedAction !== "reject") {
      return new NextResponse(
        htmlPage(
          "Invalid Action",
          'Action must be "approve" or "reject".',
        ),
        { status: 400, headers: { "Content-Type": "text/html" } },
      );
    }

    // -- Verify HMAC-SHA256 signature -----------------------------------
    const secret = process.env.VALIDATION_HMAC_SECRET;
    if (!secret) {
      logger.error("API", "VALIDATION_HMAC_SECRET is not set");
      return new NextResponse(
        htmlPage("Server Error", "Validation is not configured."),
        { status: 500, headers: { "Content-Type": "text/html" } },
      );
    }

    // Look up the validation queue entry by token hash
    const { data: entry, error: queueError } = await supabase
      .from("validation_queue")
      .select("*")
      .eq("token_hash", token)
      .eq("strategy_id", strategyId)
      .eq("action", normalizedAction)
      .single();

    if (queueError || !entry) {
      return new NextResponse(
        htmlPage("Invalid Token", "Validation token not found."),
        { status: 404, headers: { "Content-Type": "text/html" } },
      );
    }

    // Recompute HMAC using the stored created_at as the timestamp
    const payload = `${strategyId}:${normalizedAction}:${entry.created_at}`;
    const computedHash = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    if (computedHash !== token) {
      return new NextResponse(
        htmlPage("Invalid Signature", "Token signature mismatch."),
        { status: 400, headers: { "Content-Type": "text/html" } },
      );
    }

    // -- Check if already used ------------------------------------------
    if (entry.used_at) {
      return new NextResponse(
        htmlPage("Link Used", "This validation link has already been used."),
        { status: 400, headers: { "Content-Type": "text/html" } },
      );
    }

    // -- Check if expired -----------------------------------------------
    if (new Date(entry.expires_at) < new Date()) {
      return new NextResponse(
        htmlPage("Link Expired", "This validation link has expired."),
        { status: 400, headers: { "Content-Type": "text/html" } },
      );
    }

    // -- Update strategy status -----------------------------------------
    const newStatus = normalizedAction === "approve" ? "approved" : "rejected";

    const { error: updateError } = await supabase
      .from("strategy_templates")
      .update({ status: newStatus })
      .eq("id", strategyId);

    if (updateError) {
      logger.error("API", "Failed to update strategy status", updateError);
      return new NextResponse(
        htmlPage("Server Error", "Failed to update strategy status."),
        { status: 500, headers: { "Content-Type": "text/html" } },
      );
    }

    // -- Mark token as used ---------------------------------------------
    const { error: markError } = await supabase
      .from("validation_queue")
      .update({ used_at: new Date().toISOString() })
      .eq("id", entry.id);

    if (markError) {
      logger.error("API", "Failed to mark validation token as used", markError);
      // Non-fatal — strategy status is already updated
    }

    // -- Return success HTML page ---------------------------------------
    const statusLabel =
      normalizedAction === "approve" ? "Approved" : "Rejected";
    const statusEmoji = normalizedAction === "approve" ? "✅" : "❌";

    return new NextResponse(
      htmlPage(
        `Strategy ${statusLabel}`,
        `The strategy has been <strong>${statusLabel.toLowerCase()}</strong>.`,
        statusEmoji,
      ),
      { status: 200, headers: { "Content-Type": "text/html" } },
    );
  } catch (error) {
    logger.error("API", "Validation unexpected error", error);
    return new NextResponse(
      htmlPage("Server Error", "An unexpected error occurred."),
      { status: 500, headers: { "Content-Type": "text/html" } },
    );
  }
}

// ──────────────────────────────────────────────
// Simple HTML page helper
// ──────────────────────────────────────────────
function htmlPage(
  title: string,
  message: string,
  emoji = "⚠️",
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #1a1a2e;
      color: #e0e0e0;
    }
    .card {
      background: #16213e;
      border-radius: 12px;
      padding: 2.5rem;
      text-align: center;
      max-width: 420px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.3);
    }
    .emoji { font-size: 3rem; margin-bottom: 1rem; }
    h1 { margin: 0 0 0.75rem; color: #ffffff; font-size: 1.5rem; }
    p { margin: 0; color: #a0a0b0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="emoji">${emoji}</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}

// ──────────────────────────────────────────────
// Escape HTML special characters
// ──────────────────────────────────────────────
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
