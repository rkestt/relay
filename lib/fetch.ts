import { logger } from "@/lib/logger";

function composeSignals(s1: AbortSignal, s2: AbortSignal): AbortSignal {
  if (s1.aborted) return s1;
  if (s2.aborted) return s2;
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  s1.addEventListener("abort", onAbort, { once: true });
  s2.addEventListener("abort", onAbort, { once: true });
  return ctrl.signal;
}

function getUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

/**
 * Wrapper around fetch with:
 * - Automatic retry (up to 2) on TypeError with "Failed to fetch" / "NetworkError"
 *   (common when browser extensions block requests)
 * - Exponential backoff: 200ms, 400ms
 * - Retry only on GET requests (mutations are never retried)
 * - Default 15s timeout via AbortController
 * - Log.warn on retry (non-alarming)
 *
 * Drop-in replacement for `fetch` — same signature.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit & { retries?: number },
): Promise<Response> {
  const { retries: maxRetries = 2, ...fetchInit } = init ?? {};
  const isGet = !fetchInit.method || fetchInit.method === "GET";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const timeoutCtrl = new AbortController();
    const timeoutId = setTimeout(() => timeoutCtrl.abort(), 15_000);

    const signal = fetchInit.signal
      ? composeSignals(fetchInit.signal, timeoutCtrl.signal)
      : timeoutCtrl.signal;

    try {
      const response = await fetch(input, { ...fetchInit, signal });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);

      if (attempt >= maxRetries || !isGet || !(err instanceof TypeError)) {
        throw err;
      }

      const msg = err.message;
      if (!/Failed to fetch/i.test(msg) && !/NetworkError/i.test(msg)) {
        throw err;
      }

      logger.warn("apiFetch", `Retry ${attempt + 1}/${maxRetries}`, {
        url: getUrl(input),
      });

      await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
    }
  }

  throw new Error("Unreachable");
}
