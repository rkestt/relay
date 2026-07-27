import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ logs: [] });
  }
  return NextResponse.json({ logs: logger.getLogs() });
}
