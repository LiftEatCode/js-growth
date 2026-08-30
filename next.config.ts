import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Playwright commercial E2E may use http://127.0.0.1 while `next dev`
  // prints localhost — allow both so client components hydrate.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async redirects() {
    return [
      {
        source: "/projects/tha-shop",
        destination: "/projects/tha-shop-website-redesign",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
