import { createClient, createAdminClient } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/supabase/timeout";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

// ──────────────────────────────────────────────
// POST /api/pro/cancel — cancella l'abbonamento Pro
// Mappa l'utente alla license key attiva e ne chiede la cancellazione.
// In assenza di API Lemon Squeezy configurata, revoca localmente
// (is_pro=false) e marca la license come cancelled: il webhook LS
// confermerà/correggerà lo stato in produzione.
// ──────────────────────────────────────────────
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Trova la license attiva più recente
    const { data: license, error: licError } = await withTimeout(
      adminClient
        .from("license_keys")
        .select("id, key, provider")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      10000,
      "fetch active license",
    );

    // Nessuna license attiva ma is_pro=true → revoca comunque
    if (!license && !licError) {
      await adminClient
        .from("profiles")
        .update({ is_pro: false, pro_expires_at: null })
        .eq("id", user.id);
      return NextResponse.json({ ok: true, note: "no-active-license" });
    }

    // Cancel via Lemon Squeezy API se configurata
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    let remoteCancelled = false;
    if (apiKey && license?.provider === "lemon-squeezy") {
      try {
        // La license key LS è nel formato <license_key_id> — usa l'API subscriptions
        // per trovare la subscription attiva dell'utente.
        const res = await fetch(
          `https://api.lemonsqueezy.com/v1/subscriptions?filter[user_email]=${encodeURIComponent(
            user.email ?? "",
          )}&filter[status]=active`,
          {
            headers: { Authorization: `Bearer ${apiKey}` },
            cache: "no-store",
          },
        );
        if (res.ok) {
          const data = await res.json();
          const sub = data?.data?.[0];
          if (sub?.id) {
            const cancelRes = await fetch(
              `https://api.lemonsqueezy.com/v1/subscriptions/${sub.id}`,
              {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/vnd.api+json",
                },
                body: JSON.stringify({
                  data: { type: "subscriptions", id: sub.id, attributes: { cancelled: true } },
                }),
              },
            );
            remoteCancelled = cancelRes.ok;
          }
        }
      } catch (e) {
        logger.error("Pro", "LS remote cancel failed", e);
      }
    }

    // Revoca locale (il webhook allineerà lo stato remoto)
    await adminClient
      .from("profiles")
      .update({ is_pro: false, pro_expires_at: null })
      .eq("id", user.id);

    if (license) {
      await adminClient
        .from("license_keys")
        .update({ status: "cancelled" })
        .eq("id", license.id);
    }

    return NextResponse.json({ ok: true, remoteCancelled });
  } catch (error) {
    logger.error("Pro", "Cancel unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
