import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

const port = Number(
  process.env.COMMERCIAL_E2E_PORT ?? process.env.GROWTH_E2E_PORT ?? 3100,
);
let baseURL =
  process.env.GROWTH_E2E_BASE_URL ??
  process.env.COMMERCIAL_E2E_BASE_URL ??
  `http://localhost:${port}`;
let skipWebServer = process.env.COMMERCIAL_E2E_SKIP_WEBSERVER === "1";

function localNextResponds(url: string): boolean {
  try {
    const code = execSync(`curl -sf -o /dev/null -w "%{http_code}" ${url}`, {
      encoding: "utf8",
      timeout: 3000,
    }).trim();
    return /^[23]\d\d$/.test(code);
  } catch {
    return false;
  }
}

// Next.js locks the project dir — a second `next dev` on :3100 fails while :3000
// already serves this app. Prefer the live server when present.
if (!skipWebServer && !process.env.COMMERCIAL_E2E_BASE_URL && !process.env.GROWTH_E2E_BASE_URL) {
  if (localNextResponds("http://localhost:3000/")) {
    skipWebServer = true;
    baseURL = "http://localhost:3000";
    process.env.COMMERCIAL_E2E_BASE_URL = baseURL;
    process.env.COMMERCIAL_E2E_SKIP_WEBSERVER = "1";
  } else if (localNextResponds("http://127.0.0.1:3000/")) {
    skipWebServer = true;
    baseURL = "http://127.0.0.1:3000";
    process.env.COMMERCIAL_E2E_BASE_URL = baseURL;
    process.env.COMMERCIAL_E2E_SKIP_WEBSERVER = "1";
  }
}

const jsonReport =
  process.env.ACCEPTANCE_PLAYWRIGHT_JSON?.trim() ||
  process.env.PLAYWRIGHT_JSON_OUTPUT?.trim() ||
  "";

export default defineConfig({
  // CLI path args (tests/commercial/e2e, tests/growth/e2e) select suites.
  testDir: "./tests",
  testMatch: /.*\/e2e\/.*\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: jsonReport
    ? [["list"], ["json", { outputFile: jsonReport }]]
    : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: skipWebServer
    ? undefined
    : {
        command: `npx next dev --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: {
          ...process.env,
          COMMERCIAL_TEST_MOCK_RESEND: "1",
          COMMERCIAL_TEST_MOCK_EXTERNALS: "1",
          COMMERCIAL_TEST_MOCK_STRIPE: "1",
          GROWTH_TEST_MOCK_AUDIT: "1",
          GROWTH_TEST_MOCK_GBP: "1",
          PORT: String(port),
          NEXT_PUBLIC_SITE_URL: baseURL,
        },
      },
});
