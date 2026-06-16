import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authRateLimit, apiRateLimit } from "@/lib/rate-limit";

export function rateLimitMiddleware(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const path = request.nextUrl.pathname;
  const method = request.method;

  // Apply strict rate limiting to auth-related paths
  if (
    path.startsWith("/auth/") ||
    path.startsWith("/login") ||
    path.startsWith("/signup")
  ) {
    const { success, remaining, resetTime } = authRateLimit.check(ip);

    if (!success) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": resetTime.toString(),
            "Retry-After": Math.ceil(
              (resetTime - Date.now()) / 1000,
            ).toString(),
          },
        },
      );
    }

    // Add rate limit headers to successful responses
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", "5");
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", resetTime.toString());
    return response;
  }

  // API POST sensibili - medium rate limiting
  if (
    (path.startsWith("/api/strategies") && method === "POST") ||
    (path.startsWith("/api/lobby") && method === "POST")
  ) {
    const { success, remaining, resetTime } = apiRateLimit.check(ip);

    if (!success) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please slow down." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": "60",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": resetTime.toString(),
            "Retry-After": Math.ceil(
              (resetTime - Date.now()) / 1000,
            ).toString(),
          },
        },
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", "60");
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", resetTime.toString());
    return response;
  }

  return NextResponse.next();
}
