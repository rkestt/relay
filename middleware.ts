import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { rateLimitMiddleware } from "@/middleware/rate-limit";

export async function middleware(request: NextRequest) {
  // Apply rate limiting first
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse.status === 429) {
    return rateLimitResponse;
  }

  // Then proceed with session handling
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /icons/* (PWA icons)
     * - /maps/* (map images)
     */
    "/((?!_next/static|_next/image|favicon.ico|icons/|maps/|manifest.json).*)"
  ],
};
