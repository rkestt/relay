import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import { RealtimeClient } from "@supabase/realtime-js";

export function createBrowserClient() {
  const client = createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Bypass Kong for Realtime WebSocket connections.
  // Kong has an 8KB header buffer — Discord OAuth cookies can exceed it,
  // causing 431 on WebSocket upgrade. Connecting directly on port 4000
  // uses a different origin, so the browser never sends those cookies.
  const realtimeUrl = process.env.NEXT_PUBLIC_SUPABASE_REALTIME_URL;
  if (realtimeUrl && typeof window !== "undefined") {
    const directRealtime = new RealtimeClient(realtimeUrl, {
      params: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      accessToken: client.realtime.accessToken ?? undefined,
    });

    // Carry over any token already set on the original client
    if (client.realtime.accessTokenValue) {
      directRealtime.accessTokenValue = client.realtime.accessTokenValue;
    }

    // Replace so supabase.channel(), supabase.getChannels(), etc. use the
    // direct connection, and auth event forwarding (TOKEN_REFRESHED,
    // SIGNED_IN, SIGNED_OUT) still works via supabase._handleTokenChanged.
    (client as { realtime: RealtimeClient }).realtime = directRealtime;
  }

  return client;
}
