import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "linear-gradient(135deg, #081b3a 0%, #0f4fc5 65%, #26b7e8 100%)",
          borderRadius: 14,
          color: "white",
          display: "flex",
          fontSize: 29,
          fontWeight: 800,
          height: "100%",
          justifyContent: "center",
          letterSpacing: "-2px",
          width: "100%",
        }}
      >
        JS
      </div>
    ),
    size,
  );
}