/**
 * Shared error handling for fetch responses.
 *
 * - 401 → redirect to /login (session expired/invalid)
 * - 403 → log warning (RBAC / permission denied)
 * - other → re-throw as Error with parsed message
 *
 * Use this in client components instead of `throw new Error(data.error)`
 * so that 401s automatically bounce the user to the login screen.
 *
 * @example
 *   const res = await apiFetch("/api/lobby");
 *   await handleApiError(res);
 *   const data = await res.json();
 */
export async function handleApiError(res: Response): Promise<void> {
  if (res.ok) return;

  let data: { error?: string } = {};
  try {
    data = await res.json();
  } catch {
    // response wasn't JSON — use statusText
  }

  const message = data.error ?? res.statusText ?? "Request failed";

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      // Avoid infinite loop if already on /login
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return;
  }

  if (res.status === 403) {
    // Don't throw — let the caller decide. Just log a warning.
    if (typeof window !== "undefined") {
      console.warn(`[handleApiError] 403 Forbidden:`, message);
    }
    return;
  }

  throw new Error(message);
}

/**
 * Heuristic: is this message useless to show users?
 * - Empty string
 * - "{}", "[]", or any other bare JS literal
 * - Just whitespace
 */
function isUselessMessage(msg: unknown): boolean {
  if (typeof msg !== "string") return false;
  const trimmed = msg.trim();
  if (trimmed.length === 0) return true;
  if (/^[{}\[\]]+$/.test(trimmed)) return true;
  return false;
}

/**
 * Extract a user-facing message from any thrown value.
 * Handles Error instances, strings, plain objects, null/undefined.
 * Falls back when the extracted message is empty or a useless literal like "{}".
 */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    return isUselessMessage(err.message) ? fallback : err.message;
  }
  if (typeof err === "string") {
    return isUselessMessage(err) ? fallback : err;
  }
  if (err && typeof err === "object") {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === "string" && !isUselessMessage(obj.message)) {
      return obj.message;
    }
    if (typeof obj.error === "string" && !isUselessMessage(obj.error)) {
      return obj.error;
    }
  }
  return fallback;
}
