import { expect, test } from "@playwright/test";

/**
 * Smoke: SEO cost blog renders with key links/CTAs.
 * No live external APIs required.
 */
test("SEO cost blog renders with service and audit links", async ({ page }) => {
  await page.goto("/blog/how-much-does-seo-cost-small-business");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /How Much Does SEO Cost for a Small Business in 2026/i,
    }),
  ).toBeVisible({ timeout: 30_000 });

  const body = page.locator("article");
  await expect(
    body.getByRole("link", { name: /^SEO services$/i }).first(),
  ).toBeVisible();
  await expect(
    body.getByRole("link", { name: /Website Growth Audit/i }).first(),
  ).toBeVisible();
  await expect(body.locator('a[href="/websites"]').first()).toBeVisible();
  await expect(body.locator('a[href="/local-seo"]').first()).toBeVisible();
  await expect(body.locator('a[href="/seo"]').first()).toBeVisible();
  await expect(body.locator('a[href="/website-audit"]').first()).toBeVisible();
});
