import { ImageResponse } from "next/og";

export const alt =
  "JS Solutions — Websites, Local SEO, AI Automation, and Business Growth";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const services = [
  "WEBSITES",
  "LOCAL SEO",
  "AI AUTOMATION",
  "BUSINESS GROWTH",
] as const;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background:
            "radial-gradient(circle at 85% 15%, rgba(38, 183, 232, 0.28), transparent 32%), linear-gradient(135deg, #06152d 0%, #0a2449 55%, #0f4fc5 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "70px 80px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 20,
          }}
        >
          <div
            style={{
              alignItems: "center",
              background:
                "linear-gradient(135deg, #135fd4 0%, #2ac1ec 100%)",
              borderRadius: 18,
              display: "flex",
              fontSize: 42,
              fontWeight: 800,
              height: 82,
              justifyContent: "center",
              letterSpacing: "-4px",
              width: 82,
            }}
          >
            JS
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span
              style={{
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: 2,
              }}
            >
              JS SOLUTIONS
            </span>

            <span
              style={{
                color: "#9cc8f7",
                fontSize: 20,
                marginTop: 4,
              }}
            >
              Software engineering meets business growth
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 940,
          }}
        >
          <h1
            style={{
              fontSize: 70,
              fontWeight: 800,
              letterSpacing: "-4px",
              lineHeight: 1.03,
              margin: 0,
            }}
          >
            Grow your business.
          </h1>

          <div
            style={{
              color: "#55cff3",
              fontSize: 70,
              fontWeight: 800,
              letterSpacing: "-4px",
              lineHeight: 1.03,
              marginTop: 6,
            }}
          >
            We build the systems.
          </div>

          <p
            style={{
              color: "#c8d8eb",
              fontSize: 27,
              lineHeight: 1.45,
              margin: "28px 0 0",
              maxWidth: 940,
            }}
          >
            Modern websites, Local SEO, AI automation, and connected workflows
            designed to generate leads and support growth.
          </p>
        </div>

        <div
          style={{
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.16)",
            display: "flex",
            justifyContent: "space-between",
            paddingTop: 26,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 26,
            }}
          >
            {services.map((service) => (
              <span
                key={service}
                style={{
                  color: "#b8cce3",
                  fontSize: 17,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                }}
              >
                {service}
              </span>
            ))}
          </div>

          <span
            style={{
              color: "#55cff3",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            js-growth.com
          </span>
        </div>
      </div>
    ),
    size,
  );
}