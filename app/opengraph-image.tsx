import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "r6hub - Rainbow Six Siege Strategy Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
        backgroundColor: "#0f172a",
        backgroundImage: "linear-gradient(to bottom right, #0f172a, #1e293b)",
        color: "white",
      }}
    >
      <div style={{ fontSize: 72, fontWeight: "bold", marginBottom: 20 }}>
        r6hub
      </div>
      <div style={{ fontSize: 32, color: "#94a3b8" }}>
        Rainbow Six Siege Strategy Platform
      </div>
    </div>,
    { ...size },
  );
}
