import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

import { expect, test, type Page } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { SignJWT } from "jose";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

import { resolveGrowthTestDatabaseUrl } from "../db-safety";
import {
  GBP_WEBSITE_UTM,
  buildGbpPostContent,
} from "@/lib/growth/acquisition-capture";

const hasTestDb = !!resolveGrowthTestDatabaseUrl();

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

async function landWithUtms(page: Page, pathWithQuery: string): Promise<void> {
  await page.goto(pathWithQuery);
  await page.waitForFunction(() => {
    try {
      return Boolean(sessionStorage.getItem("jsg-growth-attribution-v1"));
    } catch {
      return false;
    }
  });
}

async function runAudit(page: Page) {
  const form = page.locator("#audit-form");
  await expect(form).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => {
    const input = document.querySelector(
      'input[name="growth_attribution"]',
    ) as HTMLInputElement | null;
    return Boolean(input?.value && input.value.includes("landingPath"));
  });
  const urlInput = form.getByLabel("Website URL");
  await urlInput.fill("https://example.com/");
  await form.getByRole("button", { name: /Run My Free Website Audit/i }).click();
  await expect(
    page
      .getByText(/Growth Acceptance Fixture|Website Growth Score|Overall score/i)
      .first(),
  ).toBeVisible({ timeout: 90_000 });
}

test.describe("Growth Sprint 12 local / GBP acceptance", () => {
  test.skip(
    !hasTestDb,
    "GROWTH_TEST_DATABASE_URL / ACCEPTANCE_TEST_DATABASE_URL (or GROWTH_E2E_USE_DEV_DB=1) required",
  );

  test("A. Local dashboard — auth, unknown metrics, no APIs", async ({
    page,
  }) => {
    const token = await mintInternalSessionToken();
    test.skip(!token, "internal auth env required");
    await page.context().addCookies([internalAuthCookie(token!)]);

    await page.goto("/reports/growth/local");
    await expect(page.getByTestId("local-growth-page")).toBeVisible();
    await expect(page.getByTestId("local-growth-overview")).toBeVisible();
    await expect(page.getByTestId("gbp-snapshot-blank-hint")).toContainText(
      "NOT_CAPTURED",
    );
    await expect(page.getByText(/GBP API=0/i)).toBeVisible();
  });

  test("B. Snapshot — blank null, zero 0, persist, dedupe", async ({ page }) => {
    const token = await mintInternalSessionToken();
    test.skip(!token, "internal auth env required");
    await page.context().addCookies([internalAuthCookie(token!)]);

    await page.goto("/reports/growth/local");
    const form = page.getByTestId("gbp-snapshot-form");
    await form.locator('input[name="websiteClicks"]').fill("0");
    await form.locator('input[name="callClicks"]').fill("");
    await form.locator('input[name="reviewCount"]').fill("3");
    await form.locator('textarea[name="notes"]').fill("e2e local baseline");

    await form.locator('button[type="submit"]').click();
    await expect(page.getByTestId("gbp-snapshot-message")).toContainText(
      /Snapshot (saved|already recorded)/i,
      { timeout: 30_000 },
    );

    await form.locator('button[type="submit"]').click();
    await expect(page.getByTestId("gbp-snapshot-message")).toContainText(
      /saved|already recorded|duplicate/i,
      { timeout: 30_000 },
    );

    await page.reload();
    await expect(page.getByTestId("latest-gbp-snapshot")).toBeVisible();

    runCli("tests/growth/fixtures/assert-cli.ts", [
      "assert-gbp-snapshot-zero-vs-null",
    ]);
  });

  test("C. Checklist persists; business facts not mutated", async ({
    page,
  }) => {
    const token = await mintInternalSessionToken();
    test.skip(!token, "internal auth env required");
    await page.context().addCookies([internalAuthCookie(token!)]);

    await page.goto("/reports/growth/local");
    const item = page.getByTestId("gbp-checklist-WEBSITE_UTM");
    await item.locator('select[name="status"]').selectOption("NEEDS_ATTENTION");
    await item.locator('select[name="factMatch"]').selectOption("MISMATCH");
    await item
      .locator('input[name="observedValue"]')
      .fill("https://example.com/no-utm");
    await item.locator('button[type="submit"]').click();
    await expect(item).toContainText(/Checklist item saved|saved/i, {
      timeout: 20_000,
    });
    await page.reload();
    await expect(item.locator('select[name="status"]')).toHaveValue(
      "NEEDS_ATTENTION",
    );
    await expect(page.getByText(/Canonical: JS Solutions/i).first()).toBeVisible();
  });

  test("D. UTM presets are canonical", async ({ page }) => {
    const token = await mintInternalSessionToken();
    test.skip(!token, "internal auth env required");
    await page.context().addCookies([internalAuthCookie(token!)]);

    await page.goto("/reports/growth/local");
    const website = page.getByTestId("gbp-utm-website");
    await expect(website).toContainText(`utm_source=${GBP_WEBSITE_UTM.source}`);
    await expect(website).toContainText(`utm_medium=${GBP_WEBSITE_UTM.medium}`);
    await expect(website).toContainText(
      `utm_campaign=${GBP_WEBSITE_UTM.campaign}`,
    );
    await expect(website).toContainText(`utm_content=${GBP_WEBSITE_UTM.content}`);

    await page.getByTestId("gbp-utm-post-slug").fill("seo_services_001");
    const expected = buildGbpPostContent("seo_services_001");
    await expect(page.getByTestId("gbp-utm-post")).toContainText(
      `utm_content=${expected}`,
    );
  });

  test("E. GBP UTM → audit channel GBP; google referrer ≠ GBP", async ({
    page,
  }) => {
    const qs = new URLSearchParams({
      utm_source: GBP_WEBSITE_UTM.source,
      utm_medium: GBP_WEBSITE_UTM.medium,
      utm_campaign: GBP_WEBSITE_UTM.campaign,
      utm_content: GBP_WEBSITE_UTM.content,
    }).toString();

    await landWithUtms(page, `/website-audit?${qs}`);
    await runAudit(page);
    runCli("tests/growth/fixtures/assert-cli.ts", [
      "assert-audit-channel",
      "example.com",
      "GBP",
    ]);

    await page.addInitScript(() => {
      Object.defineProperty(document, "referrer", {
        configurable: true,
        get: () => "https://www.google.com/",
      });
      try {
        sessionStorage.clear();
        localStorage.clear();
      } catch {
        /* ignore */
      }
    });
    await page.goto("/website-audit");
    await runAudit(page);
    runCli("tests/growth/fixtures/assert-cli.ts", [
      "assert-audit-channel",
      "example.com",
      "ORGANIC_SEARCH",
    ]);
  });

  test("F. GBP_POST plan — no automatic publish", async ({ page }) => {
    const token = await mintInternalSessionToken();
    test.skip(!token, "internal auth env required");
    await page.context().addCookies([internalAuthCookie(token!)]);

    await page.goto("/reports/growth/local");
    await page.getByTestId("create-gbp-post-plan").click();
    await expect(page.getByTestId("gbp-post-plan-message")).toContainText(
      /GBP_POST plan|already exists/i,
      { timeout: 30_000 },
    );
    await expect(page.getByTestId("gbp-post-plan-message")).toContainText(
      /no automatic publish/i,
    );
  });

  test("G. GBP-001 is the current experiment", async ({ page }) => {
    const token = await mintInternalSessionToken();
    test.skip(!token, "internal auth env required");
    await page.context().addCookies([internalAuthCookie(token!)]);

    await page.goto("/reports/growth/local");
    await expect(page.getByTestId("local-experiments")).toContainText("GBP-001");
    await expect(page.getByTestId("local-experiments")).toContainText("ACTIVE");
  });

  test("H. Compact card + static route privacy smoke", async ({ page }) => {
    const token = await mintInternalSessionToken();
    test.skip(!token, "internal auth env required");
    await page.context().addCookies([internalAuthCookie(token!)]);

    await page.goto("/reports/growth");
    await expect(page.getByTestId("local-growth-compact-card")).toBeVisible();
    await page.goto("/reports/growth/local");
    await expect(page).toHaveURL(/\/reports\/growth\/local$/);
  });
});
