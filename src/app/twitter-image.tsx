
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Madina Solution — Creative Business Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "72px", background: "linear-gradient(135deg,#1A1A1A 0%,#2d180d 55%,#E8590C 100%)",
        color: "white", fontFamily: "Arial, sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 92, height: 92, borderRadius: 24, background: "#E8590C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, fontWeight: 900 }}>M</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, fontWeight: 800 }}>Madina Solution</div>
            <div style={{ fontSize: 20, opacity: 0.78, marginTop: 6 }}>Creative Business Platform</div>
          </div>
        </div>
        <div style={{ fontSize: 62, fontWeight: 900, lineHeight: 1.05, marginTop: 70, maxWidth: 980 }}>
          Desain, Printing, Branding & Advertising untuk Bisnis Anda
        </div>
        <div style={{ fontSize: 24, opacity: 0.82, marginTop: 28 }}>Temanggung, Jawa Tengah · Indonesia</div>
      </div>
    ),
    size,
  );
}
