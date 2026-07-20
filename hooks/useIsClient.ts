"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns `true` after hydration (client-side only).
 * Use to avoid hydration mismatches instead of `useEffect(() => setMounted(true), [])`.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,   // client snapshot
    () => false,  // server snapshot
  );
}
