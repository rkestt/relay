"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

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

  useEffect(() => {
    const token = searchParams.get("token");
    const strategyId = searchParams.get("strategyId");
    const action = searchParams.get("action");

    if (!token || !strategyId || !action) {
      logger.warn("ValidatePage", "Validation mount - missing params", {
        token: !!token,
        strategyId: !!strategyId,
        action: !!action,
      });
      setState({
        status: "error",
        title: "Invalid Request",
        message:
          "Missing required parameters. Please use the link from Discord.",
      });
      return;
    }

    logger.info("ValidatePage", "Validation mount", { strategyId, action });

    (async () => {
      try {
        const res = await fetch(
          `/api/validate?token=${encodeURIComponent(token)}&strategyId=${encodeURIComponent(strategyId)}&action=${encodeURIComponent(action)}`,
        );

        const html = await res.text();
        const { title, message } = parseHtmlResponse(html);

        if (res.ok) {
          logger.info("ValidatePage", "Validation result", {
            status: "success",
            title,
            message,
          });
          setState({ status: "success", title, message });
        } else {
          logger.info("ValidatePage", "Validation result", {
            status: "error",
            title,
            message,
          });
          setState({ status: "error", title, message });
        }
      } catch (err) {
        logger.error("ValidatePage", "Validation request failed", err);
        setState({
          status: "error",
          title: "Connection Error",
          message:
            "Failed to reach the validation server. Please try again.",
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-redirect after 3s on success ──────
  useEffect(() => {
    if (state.status === "success") {
      const timer = setTimeout(() => {
        router.push("/lobby");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.status, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl p-8">
        {/* Loading */}
        {state.status === "loading" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="size-10 border-2 border-border border-t-foreground rounded-full animate-spin" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">
                Validating...
              </p>
              <p className="text-xs text-muted-foreground">
                Please wait while we process your request.
              </p>
            </div>
          </div>
        )}

        {/* Success */}
        {state.status === "success" && (
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex items-center justify-center size-16 rounded-full bg-success/10 border border-success/20 animate-in zoom-in duration-300">
              <svg
                className="size-8 text-success"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-lg font-semibold text-foreground">
                {state.title}
              </h1>
              {state.message && (
                <p className="text-sm text-muted-foreground">
                  {state.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-3">
                Redirecting to lobby in 3 seconds...
              </p>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="w-full h-11"
              onClick={() => router.push("/lobby")}
            >
              Go to Lobby
            </Button>
          </div>
        )}

        {/* Error */}
        {state.status === "error" && (
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex items-center justify-center size-16 rounded-full bg-destructive/10 border border-destructive/20 animate-in zoom-in duration-300">
              <svg
                className="size-8 text-destructive"
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
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-lg font-semibold text-foreground">
                {state.title}
              </h1>
              {state.message && (
                <p className="text-sm text-muted-foreground">
                  {state.message}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="lg"
              className="w-full h-11"
              onClick={() => router.push("/")}
            >
              Back to Home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ValidatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background px-6">
          <div className="w-full max-w-sm bg-card border border-border rounded-xl p-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="size-8 border-2 border-border border-t-foreground rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <ValidateContent />
    </Suspense>
  );
}
