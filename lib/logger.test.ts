import { vi } from "vitest";
vi.unmock("@/lib/logger");

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { logger } from "@/lib/logger";

describe("Logger", () => {
  beforeEach(() => {
    logger.clear();
    logger.setEnabled(true);
  });

  afterEach(() => {
    logger.clear();
  });

  it("logs messages with correct level", () => {
    logger.info("TestTag", "hello");
    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      level: "info",
      tag: "TestTag",
      message: "hello",
    });
  });

  it("does not log when disabled", () => {
    logger.setEnabled(false);
    logger.info("TestTag", "hello");
    expect(logger.getLogs()).toHaveLength(0);
  });

  it("logs errors with error object", () => {
    const err = new Error("boom");
    logger.error("TestTag", "failed", err);
    const logs = logger.getLogs();
    expect(logs[0].error).toMatchObject({
      message: "boom",
      name: "Error",
    });
  });

  it("clears all logs", () => {
    logger.info("A", "1");
    logger.info("B", "2");
    logger.clear();
    expect(logger.getLogs()).toHaveLength(0);
  });

  it("exports logs as JSON string", () => {
    logger.info("Test", "msg");
    const exported = logger.export();
    expect(() => JSON.parse(exported)).not.toThrow();
    const parsed = JSON.parse(exported);
    expect(parsed).toHaveLength(1);
  });

  it("filters logs by tag", () => {
    logger.info("TagA", "msg1");
    logger.info("TagB", "msg2");
    expect(logger.getLogsByTag("TagA")).toHaveLength(1);
    expect(logger.getLogsByTag("TagA")[0].message).toBe("msg1");
  });

  it("filters logs by level", () => {
    logger.debug("T", "d");
    logger.info("T", "i");
    logger.warn("T", "w");
    logger.error("T", "e");
    expect(logger.getLogsByLevel("warn")).toHaveLength(1);
    expect(logger.getLogsByLevel("error")).toHaveLength(1);
  });
});
