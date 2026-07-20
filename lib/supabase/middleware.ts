import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicPaths = [
  "/login",
  "/signup",
  "/auth/callback",
  "/auth/confirm",
  "/_next",
  "/favicon.ico",
  "/icons",
  "/maps",
  "/api/validate",
  "/validate",
  "/manifest.json",
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p + "?"),
  );
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.sentry.io https://*.posthog.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://*.posthog.co;",
  );
  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { pathname } = request.nextUrl;

  // Allow public paths and static assets through without auth check
  if (isPublicPath(pathname)) {
    return addSecurityHeaders(supabaseResponse);
  }

  // API routes handle their own auth — do not refresh session here
  if (pathname.startsWith("/api/")) {
    return addSecurityHeaders(supabaseResponse);
  }

  // Refresh session — do not run between middleware and routes
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No user — redirect to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return addSecurityHeaders(NextResponse.redirect(url));
  }

  return addSecurityHeaders(supabaseResponse);
}
