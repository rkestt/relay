"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
    Sentry.captureException(error, {
      extra: {
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="text-8xl font-bold text-destructive/20">500</div>
        <h1 className="text-3xl font-bold text-white">
          Qualcosa è Andato Storto
        </h1>
        <p className="text-slate-400">
          Si è verificato un errore imprevisto. Riprova o torna alla home.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={reset} variant="default">
            Riprova
          </Button>
          <Button render={<Link href="/" />} variant="outline">
            Torna alla Home
          </Button>
        </div>
      </div>
    </div>
  );
}
