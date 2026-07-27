import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Relay - Tactical Team Sync for Rainbow Six Siege";
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
        Relay
      </div>
      <div style={{ fontSize: 32, color: "#94a3b8" }}>
        Tactical Team Sync
      </div>
    </div>,
    { ...size },
  );
}
