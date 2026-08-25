import { expect, test } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { SignJWT } from "jose";

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

test.describe("Growth Sprint 13 — Cross-Channel Intelligence", () => {
  test.skip(!hasTestDb, "Requires growth/acceptance test database URL");

  test("A: cross-channel dashboard loads without external API side effects", async ({
    page,
  }) => {
    const token = await mintInternalSessionToken();
    test.skip(!token, "REPORTS_SESSION_SECRET / REPORTS_ADMIN_EMAIL required");

    await page.context().addCookies([internalAuthCookie(token!)]);

    const externalHits: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (
        /openai\.com|graph\.facebook|googleapis\.com|searchconsole|resend\.com|api\.stripe\.com/i.test(
          url,
        )
      ) {
        externalHits.push(url);
      }
    });

    await page.goto("/reports/growth");
    await expect(
      page.getByTestId("cross-channel-compact-card"),
    ).toBeVisible({ timeout: 60_000 });
    await expect(
      page.getByTestId("cross-channel-compact-card"),
    ).toContainText(/Cross-Channel Intelligence/i);

    await page.goto("/reports/growth/intelligence");
    await expect(page.getByTestId("cross-channel-now")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("cross-channel-next")).toBeVisible();
    await expect(page.getByTestId("cross-channel-watch")).toBeVisible();
    await expect(page.getByTestId("cross-channel-bottlenecks")).toBeVisible();
    await expect(page.getByTestId("cross-channel-states")).toBeVisible();
    await expect(
      page.getByTestId("cross-channel-weekly-review"),
    ).toBeVisible();
    await expect(page.getByTestId("gbp-api-pending-note")).toBeVisible();

    expect(
      externalHits,
      `Unexpected external requests on dashboard load: ${externalHits.join(", ")}`,
    ).toEqual([]);
  });
});
