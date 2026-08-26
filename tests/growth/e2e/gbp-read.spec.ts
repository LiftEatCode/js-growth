import { expect, test, type Page } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { SignJWT } from "jose";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

import { resolveGrowthTestDatabaseUrl } from "../db-safety";

const hasTestDb = !!resolveGrowthTestDatabaseUrl();

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
  if (!secret || !email) return null;
  return new SignJWT({
    email: email.trim().toLowerCase(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));
}

async function auth(page: Page) {
  const token = await mintInternalSessionToken();
  test.skip(!token, "internal auth env required");
  await page.context().addCookies([internalAuthCookie(token!)]);
}

test.describe("Growth Sprint 12.1 GBP Read Integration", () => {
  test.skip(
    !hasTestDb,
    "GROWTH_TEST_DATABASE_URL / ACCEPTANCE_TEST_DATABASE_URL (or GROWTH_E2E_USE_DEV_DB=1) required",
  );

  test("A. Unconnected panel + manual baseline preserved", async ({ page }) => {
    await auth(page);
    await page.goto("/reports/growth/local");
    await expect(page.getByTestId("local-growth-page")).toBeVisible();
    await expect(page.getByTestId("gbp-connection-panel")).toBeVisible();
    const status = page.getByTestId("gbp-connection-status");
    await expect(status).toBeVisible();
    const text = (await status.textContent())?.trim() ?? "";
    expect(
      ["NOT_CONFIGURED", "NOT_CONNECTED", "DISCONNECTED", "CONNECTED", "SYNCED", "AUTH_EXPIRED", "ERROR"].includes(
        text,
      ),
    ).toBeTruthy();
    // Manual snapshot form still available
    await expect(page.getByTestId("gbp-snapshot-form")).toBeVisible();
  });

  test("B–D. Mock OAuth connect → select location → sync profile", async ({
    page,
  }) => {
    await auth(page);
    // Ensure mock mode for this browser context's server is already set by playwright env.
    await page.goto("/reports/growth/local");

    const status = await page.getByTestId("gbp-connection-status").textContent();
    if (status?.includes("NOT_CONFIGURED")) {
      test.skip(true, "OAuth env not configured and mock not active on server");
    }

    // Clear stale encrypted tokens (e.g. encryption key rotation) before mock reconnect.
    if (
      status === "ERROR" ||
      status === "AUTH_EXPIRED" ||
      status === "CONNECTED" ||
      status === "SYNCED"
    ) {
      const disconnect = page.getByTestId("gbp-disconnect-button");
      if (await disconnect.isVisible().catch(() => false)) {
        await disconnect.click();
        await expect(page.getByTestId("gbp-connection-status")).toHaveText(
          /NOT_CONNECTED|DISCONNECTED/,
          { timeout: 15_000 },
        );
      }
    }

    const statusAfter = await page
      .getByTestId("gbp-connection-status")
      .textContent();
    if (
      statusAfter === "NOT_CONNECTED" ||
      statusAfter === "DISCONNECTED" ||
      statusAfter === "AUTH_EXPIRED"
    ) {
      await Promise.all([
        page.waitForURL(/\/reports\/growth\/local\?gbp=/, { timeout: 30_000 }),
        page.getByTestId("gbp-connect-button").click(),
      ]);
      await expect(page).toHaveURL(/gbp=connected/, { timeout: 15_000 });
    }

    await page.goto("/reports/growth/local");
    await expect(page.getByTestId("gbp-connection-status")).not.toHaveText(
      "NOT_CONNECTED",
      { timeout: 15_000 },
    );

    // Location selection if needed
    const picker = page.getByTestId("gbp-location-picker");
    if (await picker.isVisible().catch(() => false)) {
      await page
        .getByTestId("gbp-select-location-mock-location-js")
        .click();
      await expect(page.getByTestId("gbp-sync-profile")).toBeVisible({
        timeout: 20_000,
      });
    }

    await page.getByTestId("gbp-sync-profile").click();
    await expect(page.getByTestId("gbp-sync-messages")).toContainText(
      /Profile synced|checklist/i,
      { timeout: 45_000 },
    );

    // No tokens in HTML
    const html = await page.content();
    expect(html.includes("mock_refresh_token")).toBeFalsy();
    expect(html.includes("ya29.")).toBeFalsy();
    expect(html.toLowerCase().includes("client_secret")).toBeFalsy();

    await page.reload();
    await expect(page.getByTestId("gbp-checklist-BUSINESS_NAME")).toContainText(
      /Source: API|JS Solutions/i,
    );
  });

  test("E–F. Sync performance + idempotency", async ({ page }) => {
    await auth(page);
    await page.goto("/reports/growth/local");
    const syncPerf = page.getByTestId("gbp-sync-performance");
    test.skip(
      !(await syncPerf.isVisible().catch(() => false)),
      "location not selected",
    );

    await syncPerf.click();
    await expect(page.getByTestId("gbp-sync-messages")).toContainText(
      /snapshot|Performance/i,
      { timeout: 45_000 },
    );
    await syncPerf.click();
    await expect(page.getByTestId("gbp-sync-messages")).toContainText(
      /already present|snapshot/i,
      { timeout: 45_000 },
    );
    await page.reload();
    await expect(page.getByTestId("latest-gbp-snapshot")).toBeVisible();
  });

  test("G. UTM detection without auto-write", async ({ page }) => {
    await auth(page);
    await page.goto("/reports/growth/local");
    await expect(page.getByTestId("gbp-utm-presets")).toBeVisible();
    await expect(page.getByTestId("gbp-connection-panel")).toContainText(
      /No automatic profile writes|READ/i,
    );
  });

  test("I. Disconnect preserves history", async ({ page }) => {
    await auth(page);
    await page.goto("/reports/growth/local");
    const disconnect = page.getByTestId("gbp-disconnect");
    test.skip(
      !(await disconnect.isVisible().catch(() => false)),
      "not connected",
    );
    await disconnect.click();
    await expect(page.getByTestId("gbp-sync-messages")).toContainText(
      /Disconnected|preserved/i,
      { timeout: 30_000 },
    );
    await page.reload();
    // Snapshot form / history still present
    await expect(page.getByTestId("gbp-snapshot-form")).toBeVisible();
  });

  test("J. Privacy — no Google IDs in static analytics path", async ({
    page,
  }) => {
    await auth(page);
    await page.goto("/reports/growth/local");
    await expect(page).toHaveURL(/\/reports\/growth\/local/);
    const html = await page.content();
    expect(html.includes("encryptedRefreshToken")).toBeFalsy();
    expect(html.includes("tokenIv")).toBeFalsy();
  });
});
