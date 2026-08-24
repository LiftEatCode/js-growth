import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test, type Page } from "@playwright/test";
import { config as loadEnv } from "dotenv";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

import { resolveGrowthTestDatabaseUrl } from "../db-safety";
import {
  FACEBOOK_FOUNDER_UTM,
  FACEBOOK_PAGE_UTM,
  GBP_WEBSITE_UTM,
} from "@/lib/growth";

const hasTestDb = !!resolveGrowthTestDatabaseUrl();
const fixturePath = resolve(process.cwd(), "tests/growth/.e2e-fixture.json");

type GrowthFixture = {
  runId: string;
  historicalAuditId: string;
  emailPrefix: string;
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
        COMMERCIAL_TEST_MOCK_STRIPE: "1",
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

function loadFixture(): GrowthFixture {
  return JSON.parse(readFileSync(fixturePath, "utf8")) as GrowthFixture;
}

function utmQuery(parts: {
  source: string;
  medium: string;
  campaign: string;
  content?: string;
}): string {
  const params = new URLSearchParams({
    utm_source: parts.source,
    utm_medium: parts.medium,
    utm_campaign: parts.campaign,
  });
  if (parts.content) {
    params.set("utm_content", parts.content);
  }
  return params.toString();
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
          if (typeof current === "function") {
            return current(...args);
          }
        };
      },
      set(fn: (...args: unknown[]) => void) {
        current = fn;
      },
    });
  });
}

async function rebindAnalyticsSpy(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as {
      __growthGaEvents?: Array<{ name: string; params: Record<string, unknown> }>;
      gtag?: (...args: unknown[]) => void;
    };
    w.__growthGaEvents = w.__growthGaEvents || [];
    const prev = w.gtag;
    w.gtag = (...args: unknown[]) => {
      if (args[0] === "event" && typeof args[1] === "string") {
        w.__growthGaEvents!.push({
          name: args[1],
          params: (args[2] as Record<string, unknown>) || {},
        });
      }
      if (typeof prev === "function") {
        return prev(...args);
      }
    };
  });
}


async function assertNoPiiInGaEvents(page: Page) {
  const events = await page.evaluate(() => {
    const w = window as unknown as {
      __growthGaEvents?: Array<{ name: string; params: Record<string, unknown> }>;
    };
    return w.__growthGaEvents ?? [];
  });
  const blob = JSON.stringify(events).toLowerCase();
  for (const forbidden of [
    "@",
    "email",
    "phone",
    "message",
    "sk_live",
    "cs_test",
    "cs_live",
    "pi_",
    "opportunity",
    "reportid",
    "leadid",
  ]) {
    // Allow event names / param keys that are privacy-safe marketing labels only.
    if (forbidden === "email" || forbidden === "phone" || forbidden === "message") {
      expect(blob.includes(`"${forbidden}"`)).toBeFalsy();
      continue;
    }
    if (forbidden === "@") {
      expect(blob.includes("@")).toBeFalsy();
      continue;
    }
    expect(blob.includes(forbidden)).toBeFalsy();
  }
}

async function landWithUtms(
  page: Page,
  pathWithQuery: string,
): Promise<void> {
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
  // Ensure hidden attribution field has been populated from session.
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
    page.getByText(/Growth Acceptance Fixture|Website Growth Score|Overall score/i).first(),
  ).toBeVisible({ timeout: 90_000 });
}

async function submitContact(
  page: Page,
  email: string,
  name = "Growth Accept Tester",
) {
  await page.getByLabel("Your name").fill(name);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("What do you need help with?").selectOption("Local SEO");
  await page.getByLabel("Tell us about your project").fill(
    "Growth acceptance contact message.",
  );
  await page.getByRole("button", { name: /Send My Request/i }).click();
  await expect(page.getByText(/thank you|message has been sent/i).first()).toBeVisible({
    timeout: 45_000,
  });
}

test.describe("Growth Sprint 10 acquisition acceptance", () => {
  test.skip(
    !hasTestDb,
    "GROWTH_TEST_DATABASE_URL / ACCEPTANCE_TEST_DATABASE_URL / COMMERCIAL_TEST_DATABASE_URL (or GROWTH_E2E_USE_DEV_DB=1) required",
  );
  test.describe.configure({ mode: "serial" });

  test.beforeAll(() => {
    runCli("tests/growth/fixtures/seed-cli.ts");
    expect(existsSync(fixturePath)).toBeTruthy();
  });

  test.afterAll(() => {
    if (existsSync(fixturePath)) {
      const fixture = loadFixture();
      runCli("tests/growth/fixtures/assert-cli.ts", [
        "assert-historical-unknown",
        fixture.historicalAuditId,
      ]);
      runCli("tests/growth/fixtures/assert-cli.ts", ["cleanup", fixture.runId]);
    }
  });

  test("Facebook company → internal navigation → audit", async ({ page }) => {
    await installAnalyticsSpy(page);
    const fixture = loadFixture();
    const qs = utmQuery({
      ...FACEBOOK_PAGE_UTM,
      content: `company_accept_${fixture.runId}`,
    });
    await landWithUtms(page, `/?${qs}`);
    await page.goto("/seo");
    await page.waitForFunction(() => {
      try {
        const raw = sessionStorage.getItem("jsg-growth-attribution-v1");
        return Boolean(raw && raw.includes("facebook"));
      } catch {
        return false;
      }
    });
    await page.goto("/website-audit");
    await runAudit(page);
    runCli("tests/growth/fixtures/assert-cli.ts", [
      "assert-audit-channel",
      "example.com",
      "FACEBOOK",
    ]);
    await assertNoPiiInGaEvents(page);
  });

  test("Facebook founder → audit", async ({ page }) => {
    await installAnalyticsSpy(page);
    const fixture = loadFixture();
    const qs = utmQuery({
      ...FACEBOOK_FOUNDER_UTM,
      content: `founder_accept_${fixture.runId}`,
    });
    await landWithUtms(page, `/website-audit?${qs}`);
    await runAudit(page);
    runCli("tests/growth/fixtures/assert-cli.ts", [
      "assert-audit-channel",
      "example.com",
      "FACEBOOK",
    ]);
  });

  test("GBP → audit", async ({ page }) => {
    const qs = utmQuery({
      ...GBP_WEBSITE_UTM,
      content: GBP_WEBSITE_UTM.content,
    });
    await landWithUtms(page, `/website-audit?${qs}`);
    await runAudit(page);
    runCli("tests/growth/fixtures/assert-cli.ts", [
      "assert-audit-channel",
      "example.com",
      "GBP",
    ]);
  });

  test("Direct → audit", async ({ page, context }) => {
    await context.clearCookies();
    await page.addInitScript(() => {
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
      "DIRECT",
    ]);
  });

  test("Organic search referrer → audit", async ({ page }) => {
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

  test("External referral → audit", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(document, "referrer", {
        configurable: true,
        get: () => "https://partner.example.org/listing",
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
      "REFERRAL",
    ]);
  });

  test("Facebook → contact persists ContactSubmission", async ({ page }) => {
    await installAnalyticsSpy(page);
    const fixture = loadFixture();
    const email = `${fixture.emailPrefix}-fb@example.com`;
    const qs = utmQuery({
      ...FACEBOOK_PAGE_UTM,
      content: `company_contact_${fixture.runId}`,
    });
    await landWithUtms(page, `/contact?${qs}`);
    await page.waitForFunction(() => {
      const input = document.querySelector(
        'input[name="growth_attribution"]',
      ) as HTMLInputElement | null;
      return Boolean(input?.value && input.value.includes("facebook"));
    });
    await submitContact(page, email);
    runCli("tests/growth/fixtures/assert-cli.ts", [
      "assert-contact",
      email,
      "FACEBOOK",
    ]);
    await assertNoPiiInGaEvents(page);
  });

  test("GBP → contact", async ({ page }) => {
    const fixture = loadFixture();
    const email = `${fixture.emailPrefix}-gbp@example.com`;
    const qs = utmQuery({
      ...GBP_WEBSITE_UTM,
      content: "website",
    });
    await landWithUtms(page, `/contact?${qs}`);
    await page.waitForFunction(() => {
      const input = document.querySelector(
        'input[name="growth_attribution"]',
      ) as HTMLInputElement | null;
      return Boolean(input?.value && input.value.includes("google_business_profile"));
    });
    await submitContact(page, email);
    runCli("tests/growth/fixtures/assert-cli.ts", [
      "assert-contact",
      email,
      "GBP",
    ]);
  });

  test("first observed + current session storage", async ({ page }) => {
    const fixture = loadFixture();
    const qs = utmQuery({
      ...FACEBOOK_PAGE_UTM,
      content: `company_session_${fixture.runId}`,
    });
    await landWithUtms(page, `/?${qs}`);
    const stored = await page.evaluate(() => {
      return {
        session: sessionStorage.getItem("jsg-growth-attribution-v1"),
        first: localStorage.getItem("jsg-growth-first-observed-v1"),
      };
    });
    expect(stored.session).toBeTruthy();
    expect(stored.first).toBeTruthy();
    const session = JSON.parse(stored.session!);
    const first = JSON.parse(stored.first!);
    expect(session.source).toBe("facebook");
    expect(first.source).toBe("facebook");

    await page.goto("/about");
    const afterNav = await page.evaluate(() =>
      sessionStorage.getItem("jsg-growth-attribution-v1"),
    );
    expect(JSON.parse(afterNav!).source).toBe("facebook");
  });

  test("Experiment 018 soft CTA + event privacy", async ({ page }) => {
    await installAnalyticsSpy(page);
    const fixture = loadFixture();
    const qs = utmQuery({
      ...FACEBOOK_PAGE_UTM,
      content: `company_018_${fixture.runId}`,
    });
    await landWithUtms(page, `/website-audit?${qs}`);
    await runAudit(page);
    const cta = page.getByRole("link", {
      name: /Follow JS Solutions on Facebook/i,
    });
    await expect(cta).toBeVisible();
    await rebindAnalyticsSpy(page);
    // Prevent leaving the page so the click handler can be observed.
    await page.evaluate(() => {
      document.querySelectorAll('a[href*="facebook.com"]').forEach((node) => {
        node.addEventListener(
          "click",
          (event) => {
            event.preventDefault();
          },
          { capture: true },
        );
      });
    });
    await cta.click();
    const events = await page.evaluate(() => {
      const w = window as unknown as {
        __growthGaEvents?: Array<{ name: string; params: Record<string, unknown> }>;
      };
      return w.__growthGaEvents ?? [];
    });
    const follow = events.find((e) => e.name === "facebook_follow_cta_clicked");
    expect(follow).toBeTruthy();
    expect(follow?.params.experiment_id).toBe("2026-018");
    await assertNoPiiInGaEvents(page);
  });

  test("audit event cardinality smoke", async ({ page }) => {
    await installAnalyticsSpy(page);
    await page.goto("/website-audit");
    await runAudit(page);
    const events = await page.evaluate(() => {
      const w = window as unknown as {
        __growthGaEvents?: Array<{ name: string; params: Record<string, unknown> }>;
      };
      return (w.__growthGaEvents ?? []).map((e) => e.name);
    });
    const completed = events.filter((n) => n === "audit_completed").length;
    expect(completed).toBeLessThanOrEqual(1);
  });

  test("Sprint 9/10 growth dashboard pages", async ({ page }) => {
    const secret = process.env.REPORTS_SESSION_SECRET;
    const email = process.env.REPORTS_ADMIN_EMAIL;
    if (!secret || !email) {
      throw new Error(
        "REPORTS_SESSION_SECRET and REPORTS_ADMIN_EMAIL are required for growth acceptance dashboard coverage (do not skip).",
      );
    }

    const { SignJWT } = await import("jose");
    const token = await new SignJWT({
      email: email.trim().toLowerCase(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(secret));

    const base = new URL(
      process.env.COMMERCIAL_E2E_BASE_URL ??
        process.env.GROWTH_E2E_BASE_URL ??
        "http://localhost:3000",
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

    await page.goto("/reports/growth");
    await expect(page.getByText(/Acquisition Coverage/i)).toBeVisible({
      timeout: 30_000,
    });
    await page.goto("/reports/growth/attribution");
    await expect(page.getByText(/attribution|acquisition/i).first()).toBeVisible();
    await page.goto("/reports/growth/conversion");
    await expect(page.getByText(/Lead Conversion|inbound|outbound/i).first()).toBeVisible();
  });

  test("historical UNKNOWN remains unchanged", async () => {
    const fixture = loadFixture();
    runCli("tests/growth/fixtures/assert-cli.ts", [
      "assert-historical-unknown",
      fixture.historicalAuditId,
    ]);
  });
});
