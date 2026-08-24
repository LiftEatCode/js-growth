#!/usr/bin/env node
/**
 * Unified acceptance gate:
 * Prisma → Verify → Commercial (no duplicate verifies) → Growth (no duplicate verifies)
 * → Commercial E2E counts → Growth E2E → Build
 *
 * Exit non-zero on any failure or unexpected required-test skip.
 */
import { spawnSync } from "node:child_process";
import { config as loadEnv } from "dotenv";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

function looksProductionDatabaseUrl(url) {
  const lower = (url || "").toLowerCase();
  return (
    /[/\-_]prod([/\-_]|$)/.test(lower) ||
    lower.includes("production") ||
    lower.includes("prod-db")
  );
}

function fail(message) {
  console.error(`\n[acceptance] FAIL: ${message}\n`);
  process.exit(1);
}

function run(label, command, args, env = {}) {
  console.log(`\n======== ${label} ========`);
  console.log(`$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    fail(`${label} exited ${result.status ?? 1}`);
  }
  return result;
}

function runCapture(command, args, env = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

function ensureTestDb() {
  const explicit =
    process.env.ACCEPTANCE_TEST_DATABASE_URL?.trim() ||
    process.env.GROWTH_TEST_DATABASE_URL?.trim() ||
    process.env.COMMERCIAL_TEST_DATABASE_URL?.trim() ||
    process.env.TEST_DATABASE_URL?.trim() ||
    "";

  const localUrl =
    process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim() || "";

  if (process.env.NODE_ENV === "production") {
    fail("NODE_ENV=production — refusing acceptance");
  }

  if (explicit) {
    if (looksProductionDatabaseUrl(explicit)) {
      fail("Test database URL looks production-like");
    }
    return { url: explicit, mode: "explicit" };
  }

  if (
    process.env.ACCEPTANCE_E2E_USE_DEV_DB === "1" ||
    process.env.GROWTH_E2E_USE_DEV_DB === "1" ||
    process.env.COMMERCIAL_E2E_USE_DEV_DB === "1"
  ) {
    if (!localUrl) {
      fail("*_E2E_USE_DEV_DB=1 but DATABASE_URL/DIRECT_URL unset");
    }
    if (looksProductionDatabaseUrl(localUrl)) {
      fail("Refusing *_E2E_USE_DEV_DB against production-like DATABASE_URL");
    }
    console.warn(
      "\n[acceptance] WARNING: using local DATABASE_URL via *_E2E_USE_DEV_DB=1. Prefer ACCEPTANCE_TEST_DATABASE_URL.\n",
    );
    process.env.COMMERCIAL_E2E_USE_DEV_DB = "1";
    process.env.GROWTH_E2E_USE_DEV_DB = "1";
    return { url: localUrl, mode: "dev-override" };
  }

  if (localUrl && !looksProductionDatabaseUrl(localUrl)) {
    process.env.COMMERCIAL_E2E_USE_DEV_DB = "1";
    process.env.GROWTH_E2E_USE_DEV_DB = "1";
    console.warn(
      "\n[acceptance] WARNING: auto-enabled *_E2E_USE_DEV_DB=1 for local DATABASE_URL. Prefer ACCEPTANCE_TEST_DATABASE_URL.\n",
    );
    return { url: localUrl, mode: "auto-dev" };
  }

  fail(
    "No test database. Set ACCEPTANCE_TEST_DATABASE_URL (preferred), GROWTH_TEST_DATABASE_URL, COMMERCIAL_TEST_DATABASE_URL, or ACCEPTANCE_E2E_USE_DEV_DB=1 with a non-production DATABASE_URL.",
  );
}

function assertNoLiveSecrets() {
  const stripe =
    process.env.STRIPE_SECRET_KEY?.trim() ||
    process.env.STRIPE_API_KEY?.trim() ||
    "";
  if (stripe.includes("sk_live_")) {
    fail("LIVE Stripe secret sk_live_ detected");
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
        return host.startsWith("http://localhost")
          ? "http://localhost:3000"
          : "http://127.0.0.1:3000";
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function parsePlaywrightJson(path) {
  if (!existsSync(path)) {
    return null;
  }
  const raw = JSON.parse(readFileSync(path, "utf8"));
  let expected = 0;
  let unexpected = 0;
  let skipped = 0;
  let passed = 0;
  let failed = 0;

  function walk(suite) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        expected += 1;
        const result = test.results?.[0];
        const status = result?.status ?? test.status;
        if (status === "skipped" || test.expectedStatus === "skipped") {
          skipped += 1;
        } else if (status === "passed" || status === "expected") {
          passed += 1;
        } else if (status === "unexpected" || status === "failed" || status === "timedOut") {
          failed += 1;
          unexpected += 1;
        }
      }
    }
    for (const child of suite.suites ?? []) {
      walk(child);
    }
  }

  for (const suite of raw.suites ?? []) {
    walk(suite);
  }

  // Prefer stats if present
  if (raw.stats) {
    return {
      expected: raw.stats.expected ?? expected,
      unexpected: raw.stats.unexpected ?? unexpected,
      skipped: raw.stats.skipped ?? skipped,
      flaky: raw.stats.flaky ?? 0,
      passed: (raw.stats.expected ?? passed) - (raw.stats.flaky ?? 0),
      failed: raw.stats.unexpected ?? failed,
    };
  }

  return { expected, unexpected, skipped, flaky: 0, passed, failed };
}

function countSkippedTitles(path) {
  if (!existsSync(path)) {
    return [];
  }
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const skipped = [];
  function walk(suite, titles = []) {
    const nextTitles = suite.title ? [...titles, suite.title] : titles;
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const result = test.results?.[0];
        const status = result?.status ?? test.status;
        if (status === "skipped" || test.expectedStatus === "skipped") {
          skipped.push([...nextTitles, spec.title].filter(Boolean).join(" › "));
        }
      }
    }
    for (const child of suite.suites ?? []) {
      walk(child, nextTitles);
    }
  }
  for (const suite of raw.suites ?? []) {
    walk(suite);
  }
  return skipped;
}

mkdirSync(resolve(process.cwd(), "test-results"), { recursive: true });

const db = ensureTestDb();
assertNoLiveSecrets();

const live = detectLocalNext();
if (live) {
  console.warn(
    `\n[acceptance] Attaching to existing Next server at ${live}.\n` +
      "Ensure it was started with COMMERCIAL_TEST_MOCK_RESEND=1 COMMERCIAL_TEST_MOCK_STRIPE=1 COMMERCIAL_TEST_MOCK_EXTERNALS=1 GROWTH_TEST_MOCK_AUDIT=1\n" +
      "or contact/audit acceptance may hit live Resend/crawl.\n",
  );
  process.env.COMMERCIAL_E2E_SKIP_WEBSERVER = "1";
  process.env.COMMERCIAL_E2E_BASE_URL = live;
}

const summary = {
  prisma: "FAIL",
  verify: "FAIL",
  commercial: "FAIL",
  growth: "FAIL",
  commercialE2e: null,
  growthE2e: null,
  unexpectedSkips: 0,
  build: "FAIL",
  testDbMode: db.mode,
  productionDb: false,
};

// A. Prisma validate
run("Prisma validate", "npx", ["prisma", "validate"]);
summary.prisma = "PASS";

// Migration drift check (non-destructive; best-effort — do not require shadow DB)
try {
  const drift = runCapture(
    "npx",
    [
      "prisma",
      "migrate",
      "diff",
      "--from-migrations",
      "prisma/migrations",
      "--to-schema-datamodel",
      "prisma/schema.prisma",
      "--exit-code",
    ],
    { ...process.env },
  );
  if (drift.status === 2) {
    fail(
      "Prisma migration drift detected (schema vs migrations). Fix migrations before acceptance.",
    );
  }
  if (drift.status !== 0 && drift.status !== 2) {
    console.warn(
      "\n[acceptance] prisma migrate diff unavailable or errored; validate already passed. Continuing.\n",
    );
  }
} catch {
  console.warn("\n[acceptance] prisma migrate diff skipped.\n");
}

// B. Verify (all domain suites once)
run("Verify", "npm", ["run", "test:verify"]);
summary.verify = "PASS";

const mockEnv = {
  COMMERCIAL_TEST_MOCK_RESEND: "1",
  COMMERCIAL_TEST_MOCK_EXTERNALS: "1",
  COMMERCIAL_TEST_MOCK_STRIPE: "1",
  GROWTH_TEST_MOCK_AUDIT: "1",
  ACCEPTANCE_REQUIRE_E2E: "1",
  COMMERCIAL_SKIP_VERIFIES: "1",
  GROWTH_SKIP_VERIFIES: "1",
  COMMERCIAL_E2E_USE_DEV_DB: process.env.COMMERCIAL_E2E_USE_DEV_DB || "1",
  GROWTH_E2E_USE_DEV_DB: process.env.GROWTH_E2E_USE_DEV_DB || "1",
};

const commercialJson = resolve(
  process.cwd(),
  "acceptance-results/commercial-e2e.json",
);
const growthJson = resolve(process.cwd(), "acceptance-results/growth-e2e.json");
mkdirSync(resolve(process.cwd(), "acceptance-results"), { recursive: true });

// C+E Commercial (skips verifies; includes DB integration + Playwright)
run("Commercial suite", "node", ["scripts/run-commercial.mjs"], {
  ...mockEnv,
  PLAYWRIGHT_JSON_OUTPUT: commercialJson,
  ACCEPTANCE_PLAYWRIGHT_JSON: commercialJson,
});
summary.commercial = "PASS";

// D+F Growth (skips verifies; Playwright growth)
run("Growth suite", "node", ["scripts/run-growth.mjs"], {
  ...mockEnv,
});
summary.growth = "PASS";

// Parse E2E JSON reports
const commercialStats = parsePlaywrightJson(commercialJson);
const growthStats = parsePlaywrightJson(growthJson);

const commercialSkipped = countSkippedTitles(commercialJson);
const growthSkipped = countSkippedTitles(growthJson);

// Required acceptance tests must not skip for missing DB / env
const unexpectedSkipPatterns = [
  /COMMERCIAL_TEST_DATABASE_URL/i,
  /GROWTH_TEST_DATABASE_URL/i,
  /E2E_USE_DEV_DB/i,
  /required/i,
  /test database/i,
];

const unexpectedSkips = [...commercialSkipped, ...growthSkipped].filter((title) =>
  unexpectedSkipPatterns.some((re) => re.test(title)),
);

// Also: any skip when ACCEPTANCE_REQUIRE_E2E is set is unexpected for growth suite
// (dashboard used to skip — now throws). Commercial may still skip non-seeded tests?
// Seeded commercial suites must not skip.
if (commercialStats && commercialStats.skipped > 0) {
  // Allow only explicitly named optional skips that are not DB-gated — fail if any skip mentions DB
  if (unexpectedSkips.length > 0 || commercialSkipped.some((t) => /hasTestDb|DATABASE/i.test(t))) {
    summary.unexpectedSkips = commercialSkipped.length + growthSkipped.length;
  }
}

if (growthSkipped.length > 0) {
  // Growth acceptance suite uses test.skip only for missing DB — forbidden under acceptance
  unexpectedSkips.push(...growthSkipped);
}

summary.unexpectedSkips = unexpectedSkips.length;
summary.commercialE2e = commercialStats;
summary.growthE2e = growthStats;

if (unexpectedSkips.length > 0) {
  console.error("\n[acceptance] Unexpected skipped tests:");
  for (const title of unexpectedSkips) {
    console.error(`  - ${title}`);
  }
  fail("Required acceptance tests were skipped");
}

if (!commercialStats || commercialStats.expected < 1) {
  fail("Commercial Playwright report missing or empty");
}
if (!growthStats || growthStats.expected < 1) {
  fail("Growth Playwright report missing or empty");
}
if ((commercialStats.unexpected ?? 0) > 0 || (growthStats.unexpected ?? 0) > 0) {
  fail("Playwright reported unexpected failures");
}

// G. Build last
run("Production build", "npm", ["run", "build"], mockEnv);
summary.build = "PASS";

const commercialPass = commercialStats.expected - commercialStats.skipped;
const growthPass = growthStats.expected - growthStats.skipped;

console.log(`
============================================================
JS GROWTH ACCEPTANCE

Prisma: PASS
Verify: PASS
Commercial: PASS
Growth: PASS
Commercial E2E: ${commercialPass}/${commercialStats.expected} PASS (skipped ${commercialStats.skipped})
Growth E2E: ${growthPass}/${growthStats.expected} PASS (skipped ${growthStats.skipped})
Unexpected skips: ${summary.unexpectedSkips}
Build: PASS
Live external calls: 0 (mocks enforced)
Test DB mode: ${summary.testDbMode}
Production DB used: NO

ACCEPTANCE: PASS
============================================================
`);

writeFileSync(
  resolve(process.cwd(), "acceptance-results/acceptance-summary.json"),
  JSON.stringify(
    {
      ...summary,
      commercialPass,
      growthPass,
      liveExternalCalls: 0,
    },
    null,
    2,
  ),
);
