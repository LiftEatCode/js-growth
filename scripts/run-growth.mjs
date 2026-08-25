#!/usr/bin/env node
/**
 * Growth test runner:
 * 1) growth domain *.verify.ts (+ analytics privacy)
 * 2) growth integration (when present)
 * 3) Playwright growth E2E
 */
import { spawnSync } from "node:child_process";
import { config as loadEnv } from "dotenv";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

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

function ensureGrowthTestDbEnv() {
  if (
    process.env.ACCEPTANCE_TEST_DATABASE_URL?.trim() ||
    process.env.GROWTH_TEST_DATABASE_URL?.trim() ||
    process.env.COMMERCIAL_TEST_DATABASE_URL?.trim() ||
    process.env.TEST_DATABASE_URL?.trim()
  ) {
    return true;
  }

  const localUrl =
    process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim() || "";

  if (
    process.env.GROWTH_E2E_USE_DEV_DB === "1" ||
    process.env.ACCEPTANCE_E2E_USE_DEV_DB === "1" ||
    process.env.COMMERCIAL_E2E_USE_DEV_DB === "1"
  ) {
    if (!localUrl) {
      console.warn(
        "\n[growth-test] *_E2E_USE_DEV_DB=1 but DATABASE_URL/DIRECT_URL unset — growth DB E2E will skip.",
      );
      return false;
    }
    if (looksProductionDatabaseUrl(localUrl)) {
      console.warn(
        "\n[growth-test] Refusing *_E2E_USE_DEV_DB against a production-like DATABASE_URL.",
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
      "\n[growth-test] DATABASE_URL looks production-like; not auto-enabling. Set GROWTH_TEST_DATABASE_URL.",
    );
    return false;
  }

  process.env.GROWTH_E2E_USE_DEV_DB = "1";
  process.env.COMMERCIAL_E2E_USE_DEV_DB = "1";
  console.warn(
    "\n[growth-test] Auto-enabled GROWTH_E2E_USE_DEV_DB=1 for local DATABASE_URL. Prefer GROWTH_TEST_DATABASE_URL / ACCEPTANCE_TEST_DATABASE_URL.",
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
  return result;
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

function ensureChromiumInstalled() {
  const version = spawnSync("npx", ["playwright", "--version"], {
    encoding: "utf8",
  });
  if (version.status !== 0) {
    console.error(
      "\n[growth-test] Playwright CLI missing. Install @playwright/test.\n",
    );
    process.exit(1);
  }

  const probe = spawnSync(
    "node",
    [
      "-e",
      "try{const {chromium}=require('playwright');const fs=require('fs');const p=chromium.executablePath();process.exit(fs.existsSync(p)?0:2);}catch(e){process.exit(2)}",
    ],
    { encoding: "utf8" },
  );
  if (probe.status === 2) {
    console.error(
      "\n[growth-test] Playwright Chromium is not installed.\nRun: npx playwright install chromium\n",
    );
    process.exit(1);
  }
}

function collectGrowthVerifies(root) {
  const out = [];
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      out.push(...collectGrowthVerifies(full));
      continue;
    }
    if (full.endsWith(".verify.ts")) {
      out.push(full);
    }
  }
  return out.sort();
}

const skipVerifies = process.env.GROWTH_SKIP_VERIFIES === "1";

if (!skipVerifies) {
  const growthDir = join(process.cwd(), "src/lib/growth");
  for (const file of collectGrowthVerifies(growthDir)) {
    run("npx", ["tsx", file]);
  }
  run("npx", ["tsx", "src/lib/analytics/analytics.verify.ts"]);
} else {
  console.log("\n[growth-test] Skipping verifies (GROWTH_SKIP_VERIFIES=1)");
}

const integration = resolve(
  process.cwd(),
  "tests/growth/integration/acquisition-capture.integration.ts",
);
if (existsSync(integration)) {
  run(
    "npx",
    ["tsx", "--import", "./tests/commercial/shims/register.mjs", integration],
    {
      COMMERCIAL_TEST_MOCK_RESEND: "1",
      COMMERCIAL_TEST_MOCK_EXTERNALS: "1",
      GROWTH_TEST_MOCK_AUDIT: "1",
      GROWTH_TEST_MOCK_GBP: "1",
    },
  );
}

const hasTestDb = ensureGrowthTestDbEnv();
if (!hasTestDb && process.env.ACCEPTANCE_REQUIRE_E2E === "1") {
  console.error(
    "\n[growth-test] ACCEPTANCE_REQUIRE_E2E=1 but no usable test database. Set ACCEPTANCE_TEST_DATABASE_URL / GROWTH_TEST_DATABASE_URL or GROWTH_E2E_USE_DEV_DB=1.",
  );
  process.exit(1);
}

if (!hasTestDb) {
  console.warn(
    "\n[growth-test] No test DB configured — Playwright seeded suites will skip.",
  );
}

ensureChromiumInstalled();

const playwrightEnv = {
  COMMERCIAL_TEST_MOCK_RESEND: "1",
  COMMERCIAL_TEST_MOCK_EXTERNALS: "1",
  COMMERCIAL_TEST_MOCK_STRIPE: "1",
  GROWTH_TEST_MOCK_AUDIT: "1",
  GROWTH_TEST_MOCK_GBP: "1",
  ...(hasTestDb &&
  !process.env.GROWTH_TEST_DATABASE_URL?.trim() &&
  !process.env.ACCEPTANCE_TEST_DATABASE_URL?.trim() &&
  !process.env.COMMERCIAL_TEST_DATABASE_URL?.trim()
    ? {
        GROWTH_E2E_USE_DEV_DB: "1",
        COMMERCIAL_E2E_USE_DEV_DB: "1",
      }
    : {}),
  ...(process.env.ACCEPTANCE_TEST_DATABASE_URL?.trim()
    ? {
        ACCEPTANCE_TEST_DATABASE_URL:
          process.env.ACCEPTANCE_TEST_DATABASE_URL.trim(),
      }
    : {}),
  ...(process.env.GROWTH_TEST_DATABASE_URL?.trim()
    ? { GROWTH_TEST_DATABASE_URL: process.env.GROWTH_TEST_DATABASE_URL.trim() }
    : {}),
  ...(process.env.COMMERCIAL_TEST_DATABASE_URL?.trim()
    ? {
        COMMERCIAL_TEST_DATABASE_URL:
          process.env.COMMERCIAL_TEST_DATABASE_URL.trim(),
      }
    : {}),
  ...(process.env.GROWTH_E2E_BASE_URL ||
  process.env.COMMERCIAL_E2E_BASE_URL ||
  process.env.COMMERCIAL_E2E_SKIP_WEBSERVER === "1"
    ? {
        COMMERCIAL_E2E_SKIP_WEBSERVER: "1",
        COMMERCIAL_E2E_BASE_URL:
          process.env.GROWTH_E2E_BASE_URL ||
          process.env.COMMERCIAL_E2E_BASE_URL ||
          "http://localhost:3000",
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

mkdirSync(resolve(process.cwd(), "acceptance-results"), { recursive: true });
const jsonOut = resolve(process.cwd(), "acceptance-results/growth-e2e.json");

// Avoid CLI --reporter so config list+json reporters both apply.
run(
  "npx",
  ["playwright", "test", "tests/growth/e2e"],
  {
    ...playwrightEnv,
    ACCEPTANCE_PLAYWRIGHT_JSON: jsonOut,
  },
);

if (existsSync(jsonOut)) {
  writeFileSync(
    resolve(process.cwd(), "acceptance-results/growth-e2e-last-path.txt"),
    jsonOut,
  );
}

console.log("\ntest:growth PASS");
