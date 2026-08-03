import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "linear-gradient(135deg, #081b3a 0%, #0f4fc5 65%, #26b7e8 100%)",
          color: "white",
          display: "flex",
          fontSize: 82,
          fontWeight: 800,
          height: "100%",
          justifyContent: "center",
          letterSpacing: "-6px",
          width: "100%",
        }}
      >
        JS
      </div>
    ),
    size,
  );
}