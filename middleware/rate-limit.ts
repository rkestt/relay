import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authRateLimit, apiRateLimit } from "@/lib/rate-limit";

const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_RE = /^[0-9a-fA-F:]+$/;

function isValidIp(value: string): boolean {
  return IPV4_RE.test(value) || IPV6_RE.test(value);
}

/**
 * Client IP affidabile.
 * x-forwarded-for è una lista "client, proxy1, proxy2": va preso il PRIMO
 * elemento valido, non l'intera stringa. Prima si usava la stringa intera
 * come chiave del bucket → tutti i client dietro lo stesso proxy/NAT
 * condividevano UN bucket (e chi non aveva header finiva in "unknown"
 * condiviso). Quello bloccava l'intero team di test in stage.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    for (const part of forwarded.split(",")) {
      const candidate = part.trim();
      if (isValidIp(candidate)) return candidate;
    }
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp && isValidIp(realIp)) return realIp;
  // NextRequest.ip esiste solo su alcuni runtime (es. Vercel); non è nel tipo.
  const directIp = (request as unknown as { ip?: string }).ip;
  return directIp ?? "unknown";
}

function pathStartsWith(path: string, prefix: string): boolean {
  const p = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  return path === p || path.startsWith(p + "/");
}

/**
 * Una richiesta auth "vale" se è un handoff reale (/auth/*: callback OAuth,
 * conferma email) oppure un metodo non-GET (server actions).
 * Le GET delle pagine statiche /login e /signup NON contano: il router Next
 * le prefetcha in continuazione (Next rimuove l'header next-router-prefetch
 * prima del middleware, quindi non si può distinguere) e le login/password
 * viaggiano client→Supabase, fuori dal middleware. Contarle bruciava il
 * bucket con 5/15min e bloccava utenti reali dopo 1-2 visite.
 */
export function shouldCountAuthRequest(path: string, method: string): boolean {
  const isAuth =
    pathStartsWith(path, "/auth/") ||
    pathStartsWith(path, "/login") ||
    pathStartsWith(path, "/signup");
  if (!isAuth) return false;
  const isStaticPage =
    pathStartsWith(path, "/login") || pathStartsWith(path, "/signup");
  return method !== "GET" || !isStaticPage;
}

function tooManyRequests(
  message: string,
  limit: number,
  reset: number,
): NextResponse {
  return new NextResponse(JSON.stringify({ error: message }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": reset.toString(),
      "Retry-After": Math.ceil(reset - Date.now() / 1000).toString(),
    },
  });
}

export async function rateLimitMiddleware(request: NextRequest) {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const ip = getClientIp(request);

  // Skip localhost / IP non risolvibile
  if (ip === "127.0.0.1" || ip === "::1" || ip === "unknown") {
    return NextResponse.next();
  }

  // Rate limiting auth
  if (shouldCountAuthRequest(request.nextUrl.pathname, request.method)) {
    const { success, limit, remaining, reset } =
      await authRateLimit.limit(ip);

    if (!success) {
      return tooManyRequests(
        "Too many requests. Please try again later.",
        limit,
        reset,
      );
    }

    // Add rate limit headers to successful responses
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", reset.toString());
    return response;
  }

  // API POST sensibili - medium rate limiting
  if (
    (pathStartsWith(request.nextUrl.pathname, "/api/strategies") &&
      request.method === "POST") ||
    (pathStartsWith(request.nextUrl.pathname, "/api/lobby") &&
      request.method === "POST")
  ) {
    const { success, limit, remaining, reset } =
      await apiRateLimit.limit(ip);

    if (!success) {
      return tooManyRequests(
        "Too many requests. Please slow down.",
        limit,
        reset,
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", reset.toString());
    return response;
  }

  return NextResponse.next();
}
