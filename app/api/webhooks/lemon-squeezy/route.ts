import { createAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

// ──────────────────────────────────────────────
// POST /api/webhooks/lemon-squeezy — Pro subscription webhook
// Merchant of Record aggiorna lo stato Pro via eventi.
// Firma: HMAC SHA-256 del body grezzo, header X-Signature.
// ──────────────────────────────────────────────

const PRO_EXPIRY_DAYS = 30; // fallback per subscription_created senza ends_at

type LSSubscriptionAttributes = {
  user_email?: string;
  user_name?: string;
  status?: string;
  ends_at?: string | null;
  renews_at?: string | null;
  created_at?: string;
};

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  try {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("X-Signature");

  if (!verifySignature(rawBody, signature)) {
    logger.warn("LS", "Webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    meta?: { event_name?: string; custom_data?: Record<string, unknown> };
    data?: {
      id?: string;
      attributes?: LSSubscriptionAttributes;
      relationships?: Record<string, unknown>;
    };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    logger.warn("LS", "Invalid JSON in webhook body");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name ?? "";
  const attrs = payload.data?.attributes ?? {};
  const email = attrs.user_email?.toLowerCase().trim();
  const customData = payload.meta?.custom_data ?? {};

  logger.info("LS", "Webhook received", { event: eventName, email });

  if (!email) {
    logger.warn("LS", "Webhook missing user_email, cannot resolve profile");
    // 200: LS fa retry altrimenti. Nessuna azione possibile.
    return NextResponse.json({ ok: true, handled: false });
  }

  const adminClient = createAdminClient();

  // Risolvi l'utente via email (auth.users → profiles)
  const { data: authUser } = await adminClient.auth.admin.listUsers();
  const user = authUser?.users.find(
    (u) => u.email?.toLowerCase().trim() === email,
  );

  if (!user) {
    logger.warn("LS", "No r6hub user for webhook email", { email });
    return NextResponse.json({ ok: true, handled: false });
  }

  const userId = user.id;

  // License key di riferimento (se presente nel payload)
  const licenseKey =
    (attrs as Record<string, unknown>).license_key?.toString?.() ??
    (payload.data?.id ? `ls_${payload.data.id}` : `ls_${eventName}_${Date.now()}`);

  switch (eventName) {
    case "subscription_created":
    case "subscription_updated":
    case "subscription_resumed": {
      const endsAt = attrs.ends_at ?? attrs.renews_at ?? null;
      const proExpiresAt = endsAt
        ? new Date(endsAt)
        : new Date(Date.now() + PRO_EXPIRY_DAYS * 86400_000);

      await adminClient
        .from("profiles")
        .update({ is_pro: true, pro_expires_at: proExpiresAt.toISOString() })
        .eq("id", userId);

      await adminClient.from("license_keys").upsert(
        {
          user_id: userId,
          provider: "lemon-squeezy",
          key: licenseKey,
          status: "active",
          expires_at: proExpiresAt.toISOString(),
        },
        { onConflict: "key" },
      );
      break;
    }

    case "subscription_cancelled":
    case "subscription_expired":
    case "subscription_paused": {
      const endsAt =
        attrs.ends_at ?? new Date(Date.now()).toISOString();

      await adminClient
        .from("profiles")
        .update({ is_pro: false, pro_expires_at: null })
        .eq("id", userId);

      await adminClient
        .from("license_keys")
        .update({ status: "cancelled", expires_at: endsAt as string })
        .eq("user_id", userId)
        .eq("provider", "lemon-squeezy");
      break;
    }

    case "subscription_payment_success": {
      // Rinnovo riuscito: riattiva se non era già attiva
      const endsAt = attrs.renews_at ?? null;
      const proExpiresAt = endsAt
        ? new Date(endsAt)
        : new Date(Date.now() + PRO_EXPIRY_DAYS * 86400_000);

      await adminClient
        .from("profiles")
        .update({ is_pro: true, pro_expires_at: proExpiresAt.toISOString() })
        .eq("id", userId);

      await adminClient
        .from("license_keys")
        .upsert(
          {
            user_id: userId,
            provider: "lemon-squeezy",
            key: licenseKey,
            status: "active",
            expires_at: proExpiresAt.toISOString(),
          },
          { onConflict: "key" },
        );
      break;
    }

    default:
      logger.info("LS", "Unhandled event, ignored", { event: eventName });
      return NextResponse.json({ ok: true, handled: false });
  }

  // custom_data opzionale per tracciare l'utente direttamente
  if (customData.userId) {
    logger.debug("LS", "custom_data.userId presente", { userId: customData.userId });
  }

  return NextResponse.json({ ok: true, handled: true });
}

// GET non supportato — il webhook è solo POST
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
