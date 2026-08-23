import { test, expect } from "@playwright/test";

test.describe("Audit funnel — mobile UX", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("landing page form is usable without horizontal overflow", async ({
    page,
  }) => {
    await page.goto("/website-audit");

    const auditForm = page.locator("#audit-form");

    await expect(
      page.getByRole("heading", {
        name: /Find out what's holding your website back/i,
      }),
    ).toBeVisible();

    const urlInput = auditForm.getByLabel("Website URL");
    await expect(urlInput).toBeVisible();

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 1;
    });
    expect(overflow).toBe(false);

    await urlInput.focus();
    await expect(urlInput).toBeFocused();

    const submit = auditForm.getByRole("button", {
      name: /Run My Free Website Audit/i,
    });
    await expect(submit).toBeVisible();
    await expect(submit).toBeDisabled();

    await urlInput.fill("example.com");
    await expect(submit).toBeEnabled();
  });
});
