import { expect, test } from "@playwright/test";

/**
 * Smoke: Local SEO checklist blog renders with key links/CTAs.
 * No live external APIs required.
 */
test("local SEO checklist blog renders with service and audit links", async ({
  page,
}) => {
  await page.goto("/blog/local-seo-checklist-small-business");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /Local SEO Checklist for Small Businesses/i,
    }),
  ).toBeVisible({ timeout: 30_000 });

  const body = page.locator("article");
  await expect(
    body.getByRole("link", { name: /Local SEO services/i }).first(),
  ).toBeVisible();
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
