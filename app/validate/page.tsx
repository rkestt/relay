"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// ──────────────────────────────────────────────
// Strip HTML tags from a string
// ──────────────────────────────────────────────
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

// ──────────────────────────────────────────────
// Parse the API HTML response to extract title & message
// ──────────────────────────────────────────────
function parseHtmlResponse(html: string): { title: string; message: string } {
  const titleMatch = html.match(/<h1>([^<]+)<\/h1>/);
  const msgMatch = html.match(/<p>([^<]+)<\/p>/);
  return {
    title: titleMatch ? titleMatch[1] : "Unknown",
    message: msgMatch ? stripHtml(msgMatch[1]) : "",
  };
}

type ValidateState =
  | { status: "loading" }
  | { status: "success"; title: string; message: string }
  | { status: "error"; title: string; message: string };

function ValidateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<ValidateState>({ status: "loading" });

  const handleValidation = useCallback(async () => {
    const token = searchParams.get("token");
    const strategyId = searchParams.get("strategyId");
    const action = searchParams.get("action");

    if (!token || !strategyId || !action) {
      setState({
        status: "error",
        title: "Invalid Request",
        message: "Missing required parameters. Please use the link from Discord.",
      });
      return;
    }

    try {
      const res = await fetch(
        `/api/validate?token=${encodeURIComponent(token)}&strategyId=${encodeURIComponent(strategyId)}&action=${encodeURIComponent(action)}`,
      );

      const html = await res.text();
      const { title, message } = parseHtmlResponse(html);

      if (res.ok) {
        setState({ status: "success", title, message });
      } else {
        setState({ status: "error", title, message });
      }
    } catch {
      setState({
        status: "error",
        title: "Connection Error",
        message: "Failed to reach the validation server. Please try again.",
      });
    }
  }, [searchParams]);

  useEffect(() => {
    handleValidation();
  }, [handleValidation]);

  // ── Loading ──────────────────────────────
  if (state.status === "loading") {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-4 bg-neutral-950 text-neutral-50 min-h-screen">
        <div className="w-10 h-10 border-2 border-neutral-700 border-t-neutral-50 rounded-full animate-spin" />
        <p className="text-neutral-400 text-sm font-medium">
          Processing validation…
        </p>
        <p className="text-neutral-600 text-xs">
          Please wait while we process your request.
        </p>
      </div>
    );
  }

  // ── Result ───────────────────────────────
  const isSuccess = state.status === "success";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-neutral-50 p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-5">
        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-full border flex items-center justify-center ${
            isSuccess
              ? "bg-green-500/20 border-green-500/30"
              : "bg-red-500/20 border-red-500/30"
          }`}
        >
          {isSuccess ? (
            <svg
              className="w-8 h-8 text-green-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <svg
              className="w-8 h-8 text-red-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          )}
        </div>

        {/* Text */}
        <div className="text-center">
          <h1 className="text-lg font-semibold text-neutral-50 mb-1">
            {state.title}
          </h1>
          {state.message && (
            <p className="text-sm text-neutral-400">{state.message}</p>
          )}
        </div>

        {/* Action */}
        <Button
          variant="outline"
          size="lg"
          className="w-full h-12 rounded-xl text-sm font-semibold border-neutral-700 text-neutral-50 hover:bg-neutral-800"
          onClick={() => router.push("/")}
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}

export default function ValidatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col flex-1 items-center justify-center gap-4 bg-neutral-950 text-neutral-50 min-h-screen">
          <div className="w-8 h-8 border-2 border-neutral-700 border-t-neutral-50 rounded-full animate-spin" />
          <p className="text-neutral-500 text-sm">Loading…</p>
        </div>
      }
    >
      <ValidateContent />
    </Suspense>
  );
}
