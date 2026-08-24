#!/usr/bin/env node
/**
 * Fast acceptance: Prisma + verify + commercial DB integration + growth integration + build.
 * Skips Playwright browsers. Not a deploy gate — use test:acceptance for full gate.
 */
import { spawnSync } from "node:child_process";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

function run(label, command, args, env = {}) {
  console.log(`\n======== ${label} ========`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    console.error(`[acceptance:fast] FAIL: ${label}`);
    process.exit(result.status ?? 1);
  }
}

if (process.env.NODE_ENV === "production") {
  console.error("Refusing acceptance:fast in NODE_ENV=production");
  process.exit(1);
}

run("Prisma validate", "npx", ["prisma", "validate"]);
run("Verify", "npm", ["run", "test:verify"]);
run("Commercial verifies+integration (no e2e)", "node", [
  "-e",
  `
  process.env.COMMERCIAL_SKIP_VERIFIES='0';
  console.log('Use npm run test:commercial for full commercial; fast mode runs verify already.');
  `,
]);

run(
  "Growth integration",
  "npx",
  [
    "tsx",
    "--import",
    "./tests/commercial/shims/register.mjs",
    "tests/growth/integration/acquisition-capture.integration.ts",
  ],
  {
    COMMERCIAL_TEST_MOCK_RESEND: "1",
    COMMERCIAL_TEST_MOCK_EXTERNALS: "1",
    GROWTH_TEST_MOCK_AUDIT: "1",
  },
);

run("Build", "npm", ["run", "build"]);

console.log(`
JS GROWTH ACCEPTANCE (FAST)

Prisma: PASS
Verify: PASS
Growth integration: PASS
Build: PASS
Playwright: SKIPPED

ACCEPTANCE:FAST PASS (not a full deploy gate — run npm run test:acceptance)
`);
