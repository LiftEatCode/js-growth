import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { test, expect } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { SignJWT } from "jose";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

import { resolveCommercialTestDatabaseUrl } from "../db-safety";

const hasTestDb = !!resolveCommercialTestDatabaseUrl();
const fixturePath = resolve(process.cwd(), "tests/commercial/.e2e-fixture.json");

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
  proposalShareToken: string;
  agreementShareToken: string;
  proposalDeliveryId: string;
};

function internalAuthCookie(token: string) {
  const base = new URL(
    process.env.COMMERCIAL_E2E_BASE_URL ?? "http://localhost:3000",
  );
  return {
    name: "js-growth-internal-session",
    value: token,
    url: base.origin,
    httpOnly: true,
    sameSite: "Lax" as const,
  };
}

async function mintInternalSessionToken(): Promise<string | null> {
  const secret = process.env.REPORTS_SESSION_SECRET;
  const email = process.env.REPORTS_ADMIN_EMAIL;
  if (!secret || !email) {
    return null;
  }
  return new SignJWT({
    email: email.trim().toLowerCase(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));
}

function loadFixture(): Fixture {
  return JSON.parse(readFileSync(fixturePath, "utf8")) as Fixture;
}

test.describe("commercial public security", () => {
  test("invalid proposal token is rejected", async ({ page }) => {
    const response = await page.goto("/proposal/not-a-valid-token");
    expect(response?.status()).toBe(404);
  });

  test("invalid agreement token is rejected", async ({ page }) => {
    const response = await page.goto("/agreement/not-a-valid-token");
    expect(response?.status()).toBe(404);
  });

  test("sitemap excludes commercial token routes", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).not.toContain("/proposal/");
    expect(body).not.toContain("/agreement/");
  });
});

test.describe("commercial seeded workflow", () => {
  test.skip(!hasTestDb, "COMMERCIAL_TEST_DATABASE_URL (or COMMERCIAL_E2E_USE_DEV_DB=1) required");
  test.describe.configure({ mode: "serial" });

  test.beforeAll(() => {
    runCli("tests/commercial/fixtures/seed-cli.ts");
    expect(existsSync(fixturePath)).toBeTruthy();
  });

  test.afterAll(() => {
    if (existsSync(fixturePath)) {
      runCli("tests/commercial/fixtures/cleanup-cli.ts");
    }
  });

  test("public proposal link has no internal chrome and is noindex", async ({
    page,
  }) => {
    const seeded = loadFixture();
    await page.goto(`/proposal/${encodeURIComponent(seeded.proposalShareToken)}`);
    await expect(page.getByRole("article")).toBeVisible();
    await expect(
      page.getByRole("article").getByText("JS Solutions", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /Website Growth Implementation Proposal/i,
      }),
    ).toBeVisible();
    await expect(page.getByText(/Austin/i).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /reports/i })).toHaveCount(0);
    await expect(page.getByText(/Opportunity timeline/i)).toHaveCount(0);

    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots ?? "").toMatch(/noindex/i);

    const html = await page.content();
    expect(html).not.toContain(seeded.opportunityId);
    expect(html).not.toContain("workUnitKey");
    expect(html).not.toContain("sourceActionKey");
  });

  test("proposal view tracking increments without claiming read", async () => {
    runCli("tests/commercial/fixtures/assert-cli.ts", ["record-proposal-view"]);
  });

  test("revoked proposal link fails", async ({ page }) => {
    const seeded = loadFixture();
    runCli("tests/commercial/fixtures/assert-cli.ts", ["revoke-proposal"]);
    const response = await page.goto(
      `/proposal/${encodeURIComponent(seeded.proposalShareToken)}`,
    );
    expect(response?.status()).toBe(404);
    runCli("tests/commercial/fixtures/assert-cli.ts", ["unrevoke-proposal"]);
  });

  test("public agreement shows content and payment terms", async ({ page }) => {
    const seeded = loadFixture();
    await page.goto(
      `/agreement/${encodeURIComponent(seeded.agreementShareToken)}`,
    );
    const article = page.getByRole("article");
    await expect(article).toBeVisible();
    await expect(
      article.getByRole("heading", { name: /Implementation Agreement/i }),
    ).toBeVisible();
    await expect(
      article.getByText(seeded.businessName, { exact: true }),
    ).toBeVisible();
    await expect(
      article.getByRole("heading", { name: /Payment Terms/i }),
    ).toBeVisible();
    await expect(article.getByText(/\$3,000/).first()).toBeVisible();
    await expect(article.getByText(/\$1,500/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Accept Agreement/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /reports/i })).toHaveCount(0);

    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots ?? "").toMatch(/noindex/i);

    const html = await page.content();
    expect(html).not.toContain(seeded.opportunityId);
    expect(html).not.toContain("workUnitKey");
  });

  test("true browser agreement acceptance + payment collection", async ({
    page,
  }) => {
    const seeded = loadFixture();
    runCli("tests/commercial/fixtures/assert-cli.ts", [
      "assert-acceptance-gates",
    ]);

    await page.goto(
      `/agreement/${encodeURIComponent(seeded.agreementShareToken)}`,
    );
    await page.getByLabel(/Full name/i).fill("Jane Client");
    await page.getByLabel(/^Email$/i).fill("jane.client@example.com");
    await page.getByLabel(/Title/i).fill("Owner");
    await page.getByRole("checkbox").check();
    await Promise.all([
      page.waitForURL(/\/agreement\//, { timeout: 30_000 }).catch(() => null),
      page.locator("form").evaluate((form: HTMLFormElement) => {
        if (typeof form.requestSubmit === "function") {
          form.requestSubmit();
        } else {
          form.submit();
        }
      }),
    ]);

    await expect(page.getByText(/Agreement accepted/i)).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByText(/Payment status:\s*Pending/i)).toBeVisible();

    runCli("tests/commercial/fixtures/assert-cli.ts", ["assert-accepted"]);

    await page.reload();
    await expect(page.getByText(/Agreement accepted/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Pay Deposit|Complete Payment/i }),
    ).toHaveCount(0);

    runCli("tests/commercial/fixtures/assert-cli.ts", [
      "create-deposit-checkout",
    ]);

    await page.reload();
    await expect(
      page.getByRole("link", { name: /Pay Deposit Securely/i }),
    ).toBeVisible();

    runCli("tests/commercial/fixtures/assert-cli.ts", [
      "complete-deposit-webhook",
    ]);
    runCli("tests/commercial/fixtures/assert-cli.ts", ["assert-deposit-paid"]);

    await page.reload();
    await expect(
      page.getByText(/Deposit paid — balance pending/i),
    ).toBeVisible();

    runCli("tests/commercial/fixtures/assert-cli.ts", [
      "create-balance-checkout",
    ]);
    runCli("tests/commercial/fixtures/assert-cli.ts", [
      "complete-balance-webhook",
    ]);
    runCli("tests/commercial/fixtures/assert-cli.ts", ["assert-paid-in-full"]);

    await page.reload();
    await expect(page.getByText(/Paid in full/i)).toBeVisible();
  });

  test("operator opportunity shows Payment Pending / Paid in Full", async ({
    page,
  }) => {
    const seeded = loadFixture();
    const token = await mintInternalSessionToken();
    test.skip(!token, "internal auth env required");

    await page.context().addCookies([internalAuthCookie(token!)]);

    await page.goto(`/reports/opportunities/${seeded.opportunityId}`);
    await expect(
      page.getByRole("heading", { name: /^Payment$/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/Payment complete — ready for onboarding|Paid in full/i).first(),
    ).toBeVisible();
    // Stage must not auto-flip to WON (asserted in DB CLI earlier as well).
  });

  test("operator converts deposit-paid opportunity to Client / Project", async ({
    page,
  }) => {
    const token = await mintInternalSessionToken();
    test.skip(!token, "internal auth env required");

    // Fresh $2,050 / 50–50 accept + deposit path (balance unpaid).
    runCli("tests/commercial/fixtures/cleanup-cli.ts");
    runCli("tests/commercial/fixtures/seed-cli.ts", ["--payment-lifecycle"]);
    // payment-lifecycle writes .e2e-payment-fixture.json; assert-cli reads .e2e-fixture.json
    copyFileSync(
      resolve(process.cwd(), "tests/commercial/.e2e-payment-fixture.json"),
      fixturePath,
    );
    const fresh = loadFixture();

    await page.goto(
      `/agreement/${encodeURIComponent(fresh.agreementShareToken)}`,
    );
    await page.getByLabel(/Full name/i).fill("Onboard Client");
    await page.getByLabel(/^Email$/i).fill("onboard.client@example.com");
    await page.getByRole("checkbox").check();
    await Promise.all([
      page.waitForURL(/\/agreement\//, { timeout: 30_000 }).catch(() => null),
      page.locator("form").evaluate((form: HTMLFormElement) => {
        if (typeof form.requestSubmit === "function") {
          form.requestSubmit();
        } else {
          form.submit();
        }
      }),
    ]);
    await expect(page.getByText(/Agreement accepted/i)).toBeVisible({
      timeout: 45_000,
    });

    runCli("tests/commercial/fixtures/assert-cli.ts", [
      "create-deposit-checkout",
    ]);
    runCli("tests/commercial/fixtures/assert-cli.ts", [
      "complete-deposit-webhook",
    ]);
    runCli("tests/commercial/fixtures/assert-cli.ts", ["assert-deposit-paid"]);

    await page.context().addCookies([internalAuthCookie(token!)]);

    await page.goto(`/reports/opportunities/${fresh.opportunityId}`);
    await expect(
      page.getByRole("button", {
        name: /Convert to Client \/ Start Onboarding/i,
      }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByText("Ready for onboarding", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: /Convert to Client \/ Start Onboarding/i })
      .click();
    await expect(
      page.getByRole("button", { name: /View Client/i }),
    ).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("button", { name: /View Project/i }),
    ).toBeVisible();
    await expect(page.getByText(/Stage\s+Won/i)).toBeVisible();

    await page.getByRole("button", { name: /View Project/i }).click();
    await expect(page.getByText(/Onboarding/i).first()).toBeVisible();
    await expect(page.getByText(/Deposit Paid:\s*\$1,025/i)).toBeVisible();
    await expect(page.getByText(/Balance Due:\s*\$1,025/i)).toBeVisible();

    runCli("tests/commercial/fixtures/assert-cli.ts", [
      "complete-required-onboarding",
    ]);
    await page.reload();
    await expect(page.getByText(/Ready for kickoff/i).first()).toBeVisible();

    await page.getByRole("button", { name: /Start Project/i }).click();
    await expect(page.getByText(/Active\s*·\s*Owner/i)).toBeVisible({
      timeout: 30_000,
    });
  });
});
