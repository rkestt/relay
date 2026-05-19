"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { logger, type LogEntry, type LogLevel } from "@/lib/logger";
import { cn } from "@/lib/utils";

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "text-neutral-400",
  info: "text-sky-400",
  warn: "text-amber-400",
  error: "text-red-400 font-semibold",
};

const LEVEL_BG: Record<LogLevel, string> = {
  debug: "bg-neutral-800",
  info: "bg-sky-900/30",
  warn: "bg-amber-900/30",
  error: "bg-red-900/30",
};

export function LogPanel() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<"all" | LogLevel>("all");
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    setLogs(logger.getLogs());
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, open]);

  const filtered = logs.filter((l) => {
    if (filter !== "all" && l.level !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        l.message.toLowerCase().includes(s) ||
        l.tag.toLowerCase().includes(s) ||
        (l.data && JSON.stringify(l.data).toLowerCase().includes(s))
      );
    }
    return true;
  });

  const handleExport = () => {
    const blob = new Blob([logger.export()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `r6hub-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    logger.clear();
    refresh();
  };

  // Toggle con triplo tap in basso a destra
  useEffect(() => {
    let taps = 0;
    let lastTap = 0;
    const handler = (e: TouchEvent) => {
      const now = Date.now();
      const touch = e.changedTouches[0];
      const x = touch.clientX;
      const y = touch.clientY;
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Area in basso a destra 100x100
      if (x > w - 100 && y > h - 100) {
        if (now - lastTap < 400) {
          taps++;
          if (taps >= 2) {
            setOpen((o) => !o);
            taps = 0;
          }
        } else {
          taps = 1;
        }
        lastTap = now;
      }
    };
    window.addEventListener("touchend", handler);
    return () => window.removeEventListener("touchend", handler);
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-2 right-2 z-[9999] rounded-full bg-neutral-800/80 px-2 py-1 text-[10px] text-neutral-400 backdrop-blur hover:bg-neutral-700/80"
        title="Triplo tap qui per aprire log"
      >
        LOG
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-end p-2 sm:p-4">
      <div
        ref={containerRef}
        className="flex h-[70vh] w-full max-w-2xl flex-col rounded-xl border border-neutral-700 bg-neutral-900/95 shadow-2xl backdrop-blur"
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-neutral-700 px-3 py-2">
          <span className="text-xs font-bold text-neutral-300">DEBUG LOGS</span>
          <span className="ml-auto text-[10px] text-neutral-500">
            {filtered.length}/{logs.length}
          </span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | LogLevel)}
            className="rounded bg-neutral-800 px-1 py-0.5 text-[10px] text-neutral-300"
          >
            <option value="all">ALL</option>
            <option value="debug">DEBUG</option>
            <option value="info">INFO</option>
            <option value="warn">WARN</option>
            <option value="error">ERROR</option>
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="cerca..."
            className="w-24 rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300 placeholder:text-neutral-600"
          />
          <button
            onClick={handleExport}
            className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-300 hover:bg-neutral-700"
          >
            EXP
          </button>
          <button
            onClick={handleClear}
            className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] text-red-400 hover:bg-neutral-700"
          >
            CLR
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-300 hover:bg-neutral-700"
          >
            X
          </button>
        </div>

        {/* Log list */}
        <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px] leading-tight">
          {filtered.length === 0 && (
            <div className="py-8 text-center text-neutral-600">Nessun log</div>
          )}
          {filtered.map((log) => (
            <div
              key={log.id}
              className={cn(
                "mb-1 rounded px-1.5 py-1",
                LEVEL_BG[log.level]
              )}
            >
              <div className="flex gap-1.5">
                <span className="text-neutral-500 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString("it-IT", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                <span className={cn("uppercase shrink-0 w-10", LEVEL_COLORS[log.level])}>
                  {log.level}
                </span>
                <span className="text-amber-500 shrink-0">[{log.tag}]</span>
                <span className="text-neutral-200 break-all">{log.message}</span>
              </div>
              {log.data !== undefined && (
                <pre className="mt-0.5 overflow-x-auto rounded bg-neutral-950/50 px-1 py-0.5 text-[9px] text-neutral-400">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              )}
              {log.error && (
                <pre className="mt-0.5 overflow-x-auto rounded bg-red-950/30 px-1 py-0.5 text-[9px] text-red-300">
                  {log.error.name}: {log.error.message}
                  {log.error.stack ? `\n${log.error.stack}` : ""}
                </pre>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
