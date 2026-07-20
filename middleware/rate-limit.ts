import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authRateLimit, apiRateLimit } from "@/lib/rate-limit";

export async function rateLimitMiddleware(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const path = request.nextUrl.pathname;
  const method = request.method;

  // Skip rate limiting in development or for localhost
  if (
    process.env.NODE_ENV === "development" ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "unknown"
  ) {
    return NextResponse.next();
  }

  // Apply strict rate limiting to auth-related paths
  if (
    path.startsWith("/auth/") ||
    path.startsWith("/login") ||
    path.startsWith("/signup")
  ) {
    const { success, limit, remaining, reset } =
      await authRateLimit.limit(ip);

    if (!success) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil(
              reset - Date.now() / 1000,
            ).toString(),
          },
        },
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
    (path.startsWith("/api/strategies") && method === "POST") ||
    (path.startsWith("/api/lobby") && method === "POST")
  ) {
    const { success, limit, remaining, reset } =
      await apiRateLimit.limit(ip);

    if (!success) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please slow down." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil(
              reset - Date.now() / 1000,
            ).toString(),
          },
        },
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
