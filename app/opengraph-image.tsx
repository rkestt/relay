import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const alt = "Relay - Rainbow Six Siege Strategy Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Lockup reale (mark R + "elay", Anta font) generato da open-design.
// relay-lockup.svg = mark #E84A2E + testo chiaro #F4F5F7 -> per sfondi scuri.
// Inline come data URI per edge-safe rendering.
const lockup = fs.readFileSync(
  path.join(process.cwd(), "public/logo/relay-lockup.svg"),
  "utf8",
);
const lockupUri = `data:image/svg+xml;base64,${Buffer.from(lockup).toString("base64")}`;

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#12141A",
        backgroundImage: "linear-gradient(to bottom right, #12141A, #1e2430)",
      }}
    >
      <img src={lockupUri} width={660} height={320} alt="" />
      <div style={{ fontSize: 30, color: "#94a3b8", marginTop: 24 }}>
        Tactical sync for Rainbow Six Siege
      </div>
    </div>,
    { ...size },
  );
}
