/**
 * Playwright — $2,050 / 50–50 payment lifecycle visible states.
 * Uses mocked Stripe via assert-cli; no LIVE Stripe.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

import { test, expect } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { SignJWT } from "jose";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

import { resolveCommercialTestDatabaseUrl } from "../db-safety";

const hasTestDb = !!resolveCommercialTestDatabaseUrl();
const fixturePath = resolve(
  process.cwd(),
  "tests/commercial/.e2e-payment-fixture.json",
);
const defaultFixturePath = resolve(
  process.cwd(),
  "tests/commercial/.e2e-fixture.json",
);

function runCli(script: string, args: string[] = []) {
  execFileSync(
    "npx",
    [
      "tsx",
      "--import",
      "./tests/commercial/shims/register.mjs",
      script,
      ...args,
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        COMMERCIAL_TEST_MOCK_RESEND: "1",
        COMMERCIAL_TEST_MOCK_STRIPE: "1",
        COMMERCIAL_E2E_USE_DEV_DB:
          process.env.COMMERCIAL_E2E_USE_DEV_DB ??
          (!process.env.COMMERCIAL_TEST_DATABASE_URL ? "1" : undefined),
      },
    },
  );
}

type Fixture = {
  runId: string;
  businessName: string;
  opportunityId: string;
  agreementId: string;
  agreementShareToken: string;
  totalInvestmentCents: number;
  depositCents: number;
  balanceCents: number;
};

function loadFixture(): Fixture {
  return JSON.parse(readFileSync(fixturePath, "utf8")) as Fixture;
}

test.describe("payment lifecycle $2050 50/50 UI", () => {
  test.skip(
    !hasTestDb,
    "COMMERCIAL_TEST_DATABASE_URL (or COMMERCIAL_E2E_USE_DEV_DB=1) required",
  );
  test.describe.configure({ mode: "serial" });

  test.beforeAll(() => {
    runCli("tests/commercial/fixtures/seed-cli.ts", ["--payment-lifecycle"]);
    expect(existsSync(fixturePath)).toBeTruthy();
  });

  test.afterAll(() => {
    if (existsSync(fixturePath)) {
      const seeded = loadFixture();
      runCli("tests/commercial/fixtures/cleanup-cli.ts", [seeded.runId]);
    }
  });

  test("browser accept → payment pending amounts → deposit paid → paid in full", async ({
    page,
  }) => {
    const seeded = loadFixture();
    expect(seeded.totalInvestmentCents).toBe(205_000);
    expect(seeded.depositCents).toBe(102_500);
    expect(seeded.balanceCents).toBe(102_500);

    // Accept via production domain path (CLI). Browser UI asserts financial states.
    // Separate commercial-workflow covers true browser Accept Agreement click.
    copyFileSync(fixturePath, defaultFixturePath);
    runCli("tests/commercial/fixtures/assert-cli.ts", ["accept-agreement"]);
    runCli("tests/commercial/fixtures/assert-cli.ts", ["assert-accepted"]);

    const secret = process.env.REPORTS_SESSION_SECRET;
    const email = process.env.REPORTS_ADMIN_EMAIL;
    test.skip(!secret || !email, "internal auth env required");

    const token = await new SignJWT({
      email: email!.trim().toLowerCase(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(secret));

    const base = new URL(
      process.env.COMMERCIAL_E2E_BASE_URL ?? "http://localhost:3000",
    );
    await page.context().addCookies([
      {
        name: "js-growth-internal-session",
        value: token,
        url: base.origin,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    await page.goto(`/reports/opportunities/${seeded.opportunityId}`);
    await expect(page.getByRole("heading", { name: /^Payment$/i })).toBeVisible();
    await expect(
      page.getByText(/Deposit due|Payment pending/i).first(),
    ).toBeVisible();
    await expect(page.getByText(/\$2,050/).first()).toBeVisible();
    await expect(page.getByText(/\$1,025/).first()).toBeVisible();
    await expect(page.getByText(/Deposit/i).first()).toBeVisible();
    await expect(page.getByText(/\bDue\b/).first()).toBeVisible();
    await expect(page.getByText(/Balance/i).first()).toBeVisible();

    try {
      runCli("tests/commercial/fixtures/assert-cli.ts", [
        "create-deposit-checkout",
      ]);

      await page.reload();
      await expect(
        page.getByText(/Checkout created|Deposit/i).first(),
      ).toBeVisible();

      runCli("tests/commercial/fixtures/assert-cli.ts", [
        "complete-deposit-webhook",
      ]);
      runCli("tests/commercial/fixtures/assert-cli.ts", ["assert-deposit-paid"]);

      await page.reload();
      await expect(
        page.getByText(/Deposit paid|balance pending/i).first(),
      ).toBeVisible();
      await expect(page.getByText(/\$1,025/).first()).toBeVisible();
      await expect(page.getByText(/Balance/i).first()).toBeVisible();

      runCli("tests/commercial/fixtures/assert-cli.ts", [
        "create-balance-checkout",
      ]);
      runCli("tests/commercial/fixtures/assert-cli.ts", [
        "complete-balance-webhook",
      ]);
      runCli("tests/commercial/fixtures/assert-cli.ts", ["assert-paid-in-full"]);

      await page.reload();
      await expect(
        page
          .getByText(/Paid in full|Payment complete — ready for onboarding/i)
          .first(),
      ).toBeVisible();
      await expect(page.getByText(/\$2,050/).first()).toBeVisible();
      await expect(
        page.getByText(/ready for onboarding/i).first(),
      ).toBeVisible();
    } finally {
      if (existsSync(defaultFixturePath)) {
        try {
          unlinkSync(defaultFixturePath);
        } catch {
          /* ignore */
        }
      }
    }
  });
});
