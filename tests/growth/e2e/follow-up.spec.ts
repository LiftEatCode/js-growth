import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test, type Page } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { SignJWT } from "jose";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

import { resolveGrowthTestDatabaseUrl } from "../db-safety";

const hasTestDb = !!resolveGrowthTestDatabaseUrl();
const fixturePath = resolve(
  process.cwd(),
  "tests/growth/.e2e-followup-fixture.json",
);

type FollowUpFixture = {
  runId: string;
  marker: string;
  fbLeadId: string;
  overdueLeadId: string;
  suppressedProspectId: string;
  campaignId: string;
  contactSubmissionId: string;
};

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
        COMMERCIAL_TEST_MOCK_EXTERNALS: "1",
        GROWTH_TEST_MOCK_AUDIT: "1",
        GROWTH_E2E_USE_DEV_DB:
          process.env.GROWTH_E2E_USE_DEV_DB ??
          process.env.ACCEPTANCE_E2E_USE_DEV_DB ??
          process.env.COMMERCIAL_E2E_USE_DEV_DB ??
          (!process.env.GROWTH_TEST_DATABASE_URL &&
          !process.env.ACCEPTANCE_TEST_DATABASE_URL &&
          !process.env.COMMERCIAL_TEST_DATABASE_URL
            ? "1"
            : undefined),
      },
    },
  );
}

function loadFixture(): FollowUpFixture {
  return JSON.parse(readFileSync(fixturePath, "utf8")) as FollowUpFixture;
}

function internalAuthCookie(token: string) {
  const base = new URL(
    process.env.GROWTH_E2E_BASE_URL ??
      process.env.COMMERCIAL_E2E_BASE_URL ??
      "http://localhost:3000",
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

async function installAnalyticsSpy(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as {
      __growthGaEvents?: Array<{ name: string; params: Record<string, unknown> }>;
      gtag?: (...args: unknown[]) => void;
      dataLayer?: unknown[];
    };
    w.__growthGaEvents = w.__growthGaEvents || [];
    w.dataLayer = w.dataLayer || [];
    const pushEvent = (...args: unknown[]) => {
      if (args[0] === "event" && typeof args[1] === "string") {
        w.__growthGaEvents!.push({
          name: args[1],
          params: (args[2] as Record<string, unknown>) || {},
        });
      }
    };
    let current: ((...args: unknown[]) => void) | undefined;
    Object.defineProperty(w, "gtag", {
      configurable: true,
      get() {
        return (...args: unknown[]) => {
          pushEvent(...args);
          if (typeof current === "function") return current(...args);
        };
      },
      set(fn: (...args: unknown[]) => void) {
        current = fn;
      },
    });
  });
}

async function assertNoPiiInGa(page: Page, fixture: FollowUpFixture) {
  const events = await page.evaluate(() => {
    const w = window as unknown as {
      __growthGaEvents?: Array<{ name: string; params: Record<string, unknown> }>;
    };
    return w.__growthGaEvents ?? [];
  });
  const blob = JSON.stringify(events).toLowerCase();
  expect(blob.includes(fixture.fbLeadId.toLowerCase())).toBeFalsy();
  expect(blob.includes("@example.com")).toBeFalsy();
  expect(blob.includes("fu-inbound")).toBeFalsy();
}

test.describe("Growth Sprint 11 follow-up acceptance", () => {
  test.skip(
    !hasTestDb,
    "GROWTH_TEST_DATABASE_URL / ACCEPTANCE_TEST_DATABASE_URL (or GROWTH_E2E_USE_DEV_DB=1) required",
  );
  test.describe.configure({ mode: "serial" });

  test.beforeAll(() => {
    runCli("tests/growth/fixtures/seed-followup-cli.ts");
    expect(existsSync(fixturePath)).toBeTruthy();
  });

  test.afterAll(() => {
    if (existsSync(fixturePath)) {
      const fixture = loadFixture();
      runCli("tests/growth/fixtures/assert-cli.ts", [
        "cleanup-followup",
        fixture.runId,
      ]);
    }
  });

  test("A/B inbound lead follow-up + overdue clearance", async ({ page }) => {
    const token = await mintInternalSessionToken();
    test.skip(!token, "internal auth env required");
    const fixture = loadFixture();
    await page.context().addCookies([internalAuthCookie(token!)]);
    await installAnalyticsSpy(page);

    await page.goto("/reports/growth/follow-up");
    await expect(page.getByTestId("follow-up-queue-heading")).toBeVisible();
    await expect(
      page.getByText(new RegExp(`Follow Inbound${fixture.runId.slice(-4)}`)),
    ).toBeVisible({ timeout: 15_000 });

    await page.goto(`/reports/leads/${fixture.fbLeadId}`);
    await expect(page.getByTestId("lead-detail-heading")).toBeVisible();
    await expect(page.getByTestId("lead-acquisition")).toContainText("FACEBOOK");
    await expect(page.getByTestId("no-recorded-activity")).toBeVisible();

    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const yyyyMmDd = tomorrow.toISOString().slice(0, 10);

    const form = page.getByTestId("record-follow-up-activity");
    await form.locator('select[name="activityType"]').selectOption("PHONE_CALL");
    await form.locator('select[name="direction"]').selectOption("OUTBOUND");
    await form.locator('select[name="outcome"]').selectOption("NO_ANSWER");
    await form.locator('textarea[name="summary"]').fill(
      "Called business owner; left voicemail.",
    );
    await form.locator('input[name="nextFollowUpAt"]').fill(yyyyMmDd);
    await form.getByRole("button", { name: /Save activity/i }).click();
    await expect(page.getByTestId("activity-success")).toBeVisible({
      timeout: 20_000,
    });

    runCli("tests/growth/fixtures/assert-cli.ts", [
      "assert-followup-activity",
      fixture.fbLeadId,
      "PHONE_CALL",
      "FACEBOOK",
    ]);

    await page.reload();
    await expect(page.getByTestId("activity-row").first()).toContainText(
      "PHONE_CALL",
    );
    await expect(page.getByTestId("lead-acquisition")).toContainText("FACEBOOK");

    // Overdue lead → record activity with future follow-up
    await page.goto(`/reports/leads/${fixture.overdueLeadId}`);
    const overdueForm = page.getByTestId("record-follow-up-activity");
    await overdueForm
      .locator('textarea[name="summary"]')
      .fill("Cleared overdue follow-up with call.");
    await overdueForm.locator('input[name="nextFollowUpAt"]').fill(yyyyMmDd);
    await overdueForm.getByRole("button", { name: /Save activity/i }).click();
    await expect(page.getByTestId("activity-success")).toBeVisible({
      timeout: 20_000,
    });
    runCli("tests/growth/fixtures/assert-cli.ts", [
      "assert-followup-not-overdue",
      fixture.overdueLeadId,
    ]);

    await assertNoPiiInGa(page, fixture);
  });

  test("C nurture moves off NOW", async ({ page }) => {
    const token = await mintInternalSessionToken();
    test.skip(!token, "internal auth env required");
    const fixture = loadFixture();
    await page.context().addCookies([internalAuthCookie(token!)]);

    await page.goto(`/reports/leads/${fixture.overdueLeadId}`);
    await page.getByTestId("nurture-schedule").getByRole("button", {
      name: /Move to nurture/i,
    }).click();
    await page.waitForTimeout(1000);
    await page.reload();
    await expect(page.getByTestId("lead-follow-up-meta")).not.toContainText(
      "No follow-up scheduled",
    );
  });

  test("D suppression blocks outbound; history remains", async ({ page }) => {
    const token = await mintInternalSessionToken();
    test.skip(!token, "internal auth env required");
    const fixture = loadFixture();
    await page.context().addCookies([internalAuthCookie(token!)]);

    await page.goto(
      `/reports/prospecting/${fixture.campaignId}/prospects/${fixture.suppressedProspectId}`,
    );
    await expect(page.getByTestId("outbound-blocked")).toBeVisible();
    await expect(page.getByTestId("prospect-activity-timeline")).toContainText(
      "Historical pre-suppression",
    );

    const form = page.getByTestId("record-follow-up-activity");
    await form.locator('select[name="direction"]').selectOption("OUTBOUND");
    await form.locator('textarea[name="summary"]').fill(
      "Should be blocked outbound attempt.",
    );
    await form.getByRole("button", { name: /Save activity/i }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: /Outbound blocked|do not contact/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("E attribution preserved after EMAIL activity", async ({ page }) => {
    const token = await mintInternalSessionToken();
    test.skip(!token, "internal auth env required");
    const fixture = loadFixture();
    await page.context().addCookies([internalAuthCookie(token!)]);

    await page.goto(`/reports/leads/${fixture.fbLeadId}`);
    const form = page.getByTestId("record-follow-up-activity");
    await form.locator('select[name="activityType"]').selectOption("EMAIL");
    await form.locator('select[name="direction"]').selectOption("OUTBOUND");
    await form.locator('select[name="outcome"]').selectOption("SENT");
    await form
      .locator('textarea[name="summary"]')
      .fill("Sent follow-up email draft manually.");
    await form.getByRole("button", { name: /Save activity/i }).click();
    await expect(page.getByTestId("activity-success")).toBeVisible({
      timeout: 20_000,
    });

    runCli("tests/growth/fixtures/assert-cli.ts", [
      "assert-followup-activity",
      fixture.fbLeadId,
      "EMAIL",
      "FACEBOOK",
    ]);
    await expect(page.getByTestId("lead-acquisition")).toContainText("FACEBOOK");
  });

  test("F contact submission create lead idempotent", async ({ page }) => {
    const token = await mintInternalSessionToken();
    test.skip(!token, "internal auth env required");
    const fixture = loadFixture();
    await page.context().addCookies([internalAuthCookie(token!)]);

    await page.goto("/reports/growth/follow-up");
    const card = page.getByTestId("create-lead-from-contact").first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole("button", { name: /Create new Lead/i }).click();
    await expect(page).toHaveURL(/\/reports\/leads\//, { timeout: 20_000 });
    const leadUrl = page.url();

    await page.goto("/reports/growth/follow-up");
    // Second create should not be available for same submission (already linked)
    runCli("tests/growth/fixtures/assert-cli.ts", [
      "assert-contact-lead-linked",
      fixture.contactSubmissionId,
    ]);

    await page.goto(leadUrl);
    await expect(page.getByTestId("lead-acquisition")).toContainText("FACEBOOK");
  });

  test("G mark qualified without auto opportunity", async ({ page }) => {
    const token = await mintInternalSessionToken();
    test.skip(!token, "internal auth env required");
    const fixture = loadFixture();
    await page.context().addCookies([internalAuthCookie(token!)]);

    await page.goto(`/reports/leads/${fixture.fbLeadId}`);
    const qualify = page.getByTestId("mark-qualified");
    if (await qualify.isVisible()) {
      await qualify.getByRole("button", { name: /Mark QUALIFIED/i }).click();
      await page.waitForTimeout(800);
      await page.reload();
    }
    runCli("tests/growth/fixtures/assert-cli.ts", [
      "assert-lead-no-auto-opportunity",
      fixture.fbLeadId,
    ]);
  });

  test("H privacy — growth follow-up paths sanitized", async ({ page }) => {
    const token = await mintInternalSessionToken();
    test.skip(!token, "internal auth env required");
    const fixture = loadFixture();
    await page.context().addCookies([internalAuthCookie(token!)]);
    await installAnalyticsSpy(page);

    await page.goto(`/reports/leads/${fixture.fbLeadId}`);
    await page.goto("/reports/growth/follow-up");
    await assertNoPiiInGa(page, fixture);
  });
});
