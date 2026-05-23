/// <reference types="vitest/globals" />
import "@testing-library/jest-dom/vitest";
import { vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Auto-cleanup dopo ogni test
afterEach(() => {
  cleanup();
});

// Mock next/headers per API routes + middleware
vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      getAll: () => [],
      set: vi.fn(),
    }),
  ),
}));

// Silenzia logger nei test
vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    setEnabled: vi.fn(),
    isEnabled: vi.fn(() => true),
    getLogs: vi.fn(() => []),
    clear: vi.fn(),
    export: vi.fn(() => "[]"),
  },
}));
