"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical error:", error);
    Sentry.captureException(error, {
      extra: {
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="text-center space-y-6 max-w-md px-4">
            <div className="text-8xl font-bold text-destructive/20">500</div>
            <h1 className="text-3xl font-bold text-white">Errore Critico</h1>
            <p className="text-slate-400">
              Si è verificato un errore critico dell&apos;applicazione.
            </p>
            <Button onClick={reset} variant="default">
              Ricarica Pagina
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
