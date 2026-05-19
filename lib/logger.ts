type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  tag: string;
  message: string;
  data?: unknown;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

const MAX_LOGS = 500;
const STORAGE_KEY = "r6hub_logs";
const ENABLED_KEY = "r6hub_logs_enabled";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isClient(): boolean {
  return typeof window !== "undefined";
}

function getStoredLogs(): LogEntry[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLogs(logs: LogEntry[]) {
  if (!isClient()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // localStorage pieno, svuota
    localStorage.removeItem(STORAGE_KEY);
  }
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("it-IT", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
}

class Logger {
  private logs: LogEntry[] = [];
  private enabled = true;

  constructor() {
    if (isClient()) {
      this.logs = getStoredLogs();
      const stored = localStorage.getItem(ENABLED_KEY);
      this.enabled = stored === null ? true : stored === "true";
    }
  }

  setEnabled(v: boolean) {
    this.enabled = v;
    if (isClient()) {
      localStorage.setItem(ENABLED_KEY, String(v));
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private push(entry: LogEntry) {
    if (!this.enabled) return;
    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(-MAX_LOGS);
    }
    if (isClient()) {
      saveLogs(this.logs);
    }
  }

  private toConsole(entry: LogEntry) {
    if (!this.enabled) return;
    const prefix = `[${formatTime(entry.timestamp)}] [${entry.level.toUpperCase()}] [${entry.tag}]`;
    const style = {
      debug: "color: #888",
      info: "color: #0ea5e9",
      warn: "color: #f59e0b",
      error: "color: #ef4444; font-weight: bold",
    }[entry.level];

    if (isClient()) {
      if (entry.error) {
        console.error(`%c${prefix}`, style, entry.message, entry.error, entry.data ?? "");
      } else if (entry.level === "warn") {
        console.warn(`%c${prefix}`, style, entry.message, entry.data ?? "");
      } else if (entry.level === "debug") {
        console.debug(`%c${prefix}`, style, entry.message, entry.data ?? "");
      } else {
        console.log(`%c${prefix}`, style, entry.message, entry.data ?? "");
      }
    } else {
      // Server: plain text per Vercel logs
      const dataStr = entry.data ? ` | data=${JSON.stringify(entry.data)}` : "";
      const errStr = entry.error ? ` | error=${entry.error.message}` : "";
      const line = `${prefix} ${entry.message}${dataStr}${errStr}`;
      if (entry.level === "error") console.error(line);
      else if (entry.level === "warn") console.warn(line);
      else if (entry.level === "debug") console.debug(line);
      else console.log(line);
    }
  }

  log(level: LogLevel, tag: string, message: string, data?: unknown, error?: unknown) {
    const entry: LogEntry = {
      id: generateId(),
      timestamp: Date.now(),
      level,
      tag,
      message,
      data: data ?? undefined,
      error: error instanceof Error
        ? { message: error.message, stack: error.stack, name: error.name }
        : typeof error === "string"
          ? { message: error }
          : undefined,
    };
    this.push(entry);
    this.toConsole(entry);
  }

  debug(tag: string, message: string, data?: unknown) {
    this.log("debug", tag, message, data);
  }

  info(tag: string, message: string, data?: unknown) {
    this.log("info", tag, message, data);
  }

  warn(tag: string, message: string, data?: unknown, error?: unknown) {
    this.log("warn", tag, message, data, error);
  }

  error(tag: string, message: string, error?: unknown, data?: unknown) {
    this.log("error", tag, message, data, error);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByTag(tag: string): LogEntry[] {
    return this.logs.filter((l) => l.tag === tag);
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((l) => l.level === level);
  }

  clear() {
    this.logs = [];
    if (isClient()) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();
export type { LogEntry, LogLevel };
