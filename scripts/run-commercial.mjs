#!/usr/bin/env node
/**
 * Commercial test runner:
 * 1) domain *.verify.ts (commercial-related subset + agreement)
 * 2) pure commercial integration
 * 3) DB integration (when test DB configured)
 * 4) Playwright E2E
 */
import { spawnSync } from "node:child_process";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

function looksProductionDatabaseUrl(url) {
  const lower = url.toLowerCase();
  return (
    /[/\-_]prod([/\-_]|$)/.test(lower) ||
    lower.includes("production") ||
    lower.includes("prod-db")
  );
}

/**
 * Ensure Playwright + DB integration see a resolvable commercial test DB.
 *
 * Prefer COMMERCIAL_TEST_DATABASE_URL / TEST_DATABASE_URL.
 * Otherwise, when COMMERCIAL_E2E_USE_DEV_DB=1 (or auto-enabled for a
 * non-production local DATABASE_URL), seeded E2E fixtures can run.
 *
 * Does not remove Playwright test.skip guards — it only sets the env those
 * guards already require so fixtures are created instead of silently skipped.
 */
function ensureCommercialTestDbEnv() {
  if (
    process.env.COMMERCIAL_TEST_DATABASE_URL?.trim() ||
    process.env.TEST_DATABASE_URL?.trim()
  ) {
    return true;
  }

  const localUrl =
    process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim() || "";

  if (process.env.COMMERCIAL_E2E_USE_DEV_DB === "1") {
    if (!localUrl) {
      console.warn(
        "\n[commercial-test] COMMERCIAL_E2E_USE_DEV_DB=1 but DATABASE_URL/DIRECT_URL is unset — DB-backed commercial tests will skip.",
      );
      return false;
    }
    if (looksProductionDatabaseUrl(localUrl)) {
      console.warn(
        "\n[commercial-test] Refusing COMMERCIAL_E2E_USE_DEV_DB against a production-like DATABASE_URL.",
      );
      return false;
    }
    return true;
  }

  if (!localUrl) {
    return false;
  }

  if (looksProductionDatabaseUrl(localUrl)) {
    console.warn(
      "\n[commercial-test] DATABASE_URL looks production-like; not auto-enabling commercial DB tests. Set COMMERCIAL_TEST_DATABASE_URL to an isolated DB.",
    );
    return false;
  }

  // Local/dev DATABASE_URL present but flag unset — enable for this runner so
  // Playwright beforeAll seeding actually executes (hasTestDb would otherwise
  // be false and all seeded suites skip without creating fixtures).
  process.env.COMMERCIAL_E2E_USE_DEV_DB = "1";
  console.warn(
    "\n[commercial-test] Auto-enabled COMMERCIAL_E2E_USE_DEV_DB=1 for local DATABASE_URL so seeded commercial E2E fixtures run. Prefer a dedicated COMMERCIAL_TEST_DATABASE_URL.",
  );
  return true;
}

function run(command, args, env = {}) {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function detectLocalNext() {
  try {
    for (const host of ["http://127.0.0.1:3000/", "http://localhost:3000/"]) {
      const result = spawnSync(
        "curl",
        ["-sf", "-o", "/dev/null", "-w", "%{http_code}", host],
        { encoding: "utf8" },
      );
      const code = String(result.stdout ?? "").trim();
      if (result.status === 0 && /^[23]\d\d$/.test(code)) {
        // Prefer localhost over 127.0.0.1 so Next.js allowedDevOrigins /
        // client hydration matches the browser origin used by Playwright.
        return host.startsWith("http://localhost")
          ? "http://localhost:3000"
          : "http://127.0.0.1:3000";
      }
    }
    return null;
  } catch {
    return null;
  }
}

const commercialVerifies = [
  "src/lib/commercialization/scope/scope.verify.ts",
  "src/lib/commercialization/pricing/pricing.verify.ts",
  "src/lib/commercialization/proposal/proposal.verify.ts",
  "src/lib/commercialization/proposal-delivery/proposal-delivery.verify.ts",
  "src/lib/commercialization/agreement/agreement.verify.ts",
  "src/lib/commercialization/payments/payments.verify.ts",
  "src/lib/commercialization/onboarding/client-project.verify.ts",
  "src/lib/commercialization/opportunities/opportunity.verify.ts",
];

if (process.env.COMMERCIAL_SKIP_VERIFIES === "1") {
  console.log("\n[commercial-test] Skipping verifies (COMMERCIAL_SKIP_VERIFIES=1)");
} else {
  for (const file of commercialVerifies) {
    run("npx", ["tsx", file]);
  }
}

run("npx", [
  "tsx",
  "tests/commercial/integration/commercial-workflow.integration.ts",
]);

const hasTestDb = ensureCommercialTestDbEnv();

if (!hasTestDb && process.env.ACCEPTANCE_REQUIRE_E2E === "1") {
  console.error(
    "\n[commercial-test] ACCEPTANCE_REQUIRE_E2E=1 but no usable test database. Set COMMERCIAL_TEST_DATABASE_URL or COMMERCIAL_E2E_USE_DEV_DB=1.",
  );
  process.exit(1);
}

if (hasTestDb) {
  run(
    "npx",
    [
      "tsx",
      "--import",
      "./tests/commercial/shims/register.mjs",
      "tests/commercial/integration/commercial-workflow.db.integration.ts",
    ],
    {
      COMMERCIAL_TEST_MOCK_RESEND: "1",
      COMMERCIAL_TEST_MOCK_EXTERNALS: "1",
      COMMERCIAL_TEST_MOCK_STRIPE: "1",
    },
  );
  // Brief pause between Neon-backed scripts to reduce websocket flakiness.
  spawnSync("node", ["-e", "setTimeout(() => {}, 1000)"], { stdio: "ignore" });
  run(
    "npx",
    [
      "tsx",
      "--import",
      "./tests/commercial/shims/register.mjs",
      "tests/commercial/integration/payment-lifecycle.integration.ts",
    ],
    {
      COMMERCIAL_TEST_MOCK_RESEND: "1",
      COMMERCIAL_TEST_MOCK_EXTERNALS: "1",
      COMMERCIAL_TEST_MOCK_STRIPE: "1",
    },
  );
  spawnSync("node", ["-e", "setTimeout(() => {}, 1000)"], { stdio: "ignore" });
  run(
    "npx",
    [
      "tsx",
      "--import",
      "./tests/commercial/shims/register.mjs",
      "tests/commercial/integration/onboarding-lifecycle.integration.ts",
    ],
    {
      COMMERCIAL_TEST_MOCK_RESEND: "1",
      COMMERCIAL_TEST_MOCK_EXTERNALS: "1",
      COMMERCIAL_TEST_MOCK_STRIPE: "1",
    },
  );
} else {
  console.warn(
    "\n[commercial-test] Skipping DB integration — set COMMERCIAL_TEST_DATABASE_URL (preferred) or COMMERCIAL_E2E_USE_DEV_DB=1 for isolated/dev DB runs.",
  );
}

const playwrightEnv = {
  COMMERCIAL_TEST_MOCK_RESEND: "1",
  COMMERCIAL_TEST_MOCK_EXTERNALS: "1",
  COMMERCIAL_TEST_MOCK_STRIPE: "1",
  // Always forward resolved commercial DB policy into Playwright workers so
  // resolveCommercialTestDatabaseUrl() matches this runner (seeded suites
  // must not skip when hasTestDb was true above).
  ...(hasTestDb && !process.env.COMMERCIAL_TEST_DATABASE_URL?.trim()
    ? { COMMERCIAL_E2E_USE_DEV_DB: "1" }
    : {}),
  ...(process.env.COMMERCIAL_TEST_DATABASE_URL?.trim()
    ? {
        COMMERCIAL_TEST_DATABASE_URL:
          process.env.COMMERCIAL_TEST_DATABASE_URL.trim(),
      }
    : {}),
  ...(process.env.TEST_DATABASE_URL?.trim()
    ? { TEST_DATABASE_URL: process.env.TEST_DATABASE_URL.trim() }
    : {}),
  // Prefer attaching to an already-running local Next server when present.
  // Next.js locks the project dir, so a second `next dev` (e.g. :3100) fails
  // while :3000 is already serving this app. Prefer localhost for hydration.
  ...(process.env.COMMERCIAL_E2E_BASE_URL ||
  process.env.COMMERCIAL_E2E_SKIP_WEBSERVER === "1"
    ? {
        COMMERCIAL_E2E_SKIP_WEBSERVER: "1",
        ...(process.env.COMMERCIAL_E2E_BASE_URL
          ? {}
          : { COMMERCIAL_E2E_BASE_URL: "http://localhost:3000" }),
      }
    : (() => {
        const live = detectLocalNext();
        return live
          ? {
              COMMERCIAL_E2E_SKIP_WEBSERVER: "1",
              COMMERCIAL_E2E_BASE_URL: live,
            }
          : {};
      })()),
};

if (hasTestDb) {
  console.log(
    "\n[commercial-test] Playwright will seed commercial fixtures (hasTestDb=true).",
  );
} else {
  console.warn(
    "\n[commercial-test] Playwright seeded suites will skip — no COMMERCIAL_TEST_DATABASE_URL / COMMERCIAL_E2E_USE_DEV_DB / usable DATABASE_URL.",
  );
}

const jsonOut =
  process.env.ACCEPTANCE_PLAYWRIGHT_JSON?.trim() ||
  process.env.PLAYWRIGHT_JSON_OUTPUT?.trim() ||
  "";

// Do not pass --reporter on CLI when JSON output is required — CLI reporters
// replace config reporters and would drop the json outputFile reporter.
const playwrightArgs = ["playwright", "test", "tests/commercial/e2e"];
if (!jsonOut) {
  playwrightArgs.push("--reporter=list");
}

run(
  "npx",
  playwrightArgs,
  {
    ...playwrightEnv,
    ...(jsonOut ? { ACCEPTANCE_PLAYWRIGHT_JSON: jsonOut } : {}),
  },
);

console.log("\ntest:commercial PASS");
