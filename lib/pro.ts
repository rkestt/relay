import { createAdminClient } from "@/lib/supabase/server";

export type ProStatus = {
  isPro: boolean;
  proExpiresAt: string | null;
};

/**
 * Legge lo stato Pro di un utente da profiles.
 * is_pro è considerato valido solo se pro_expires_at è nel futuro
 * (o assente: abbonamento senza scadenza esplicita).
 */
export async function isProUser(userId: string): Promise<boolean> {
  const status = await getProStatus(userId);
  return status.isPro;
}

export async function getProStatus(userId: string): Promise<ProStatus> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("profiles")
    .select("is_pro, pro_expires_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return { isPro: false, proExpiresAt: null };
  }

  const expiresAt = data.pro_expires_at as string | null;
  const expired = expiresAt ? new Date(expiresAt).getTime() < Date.now() : false;

  return {
    isPro: Boolean(data.is_pro) && !expired,
    proExpiresAt: expiresAt,
  };
}
