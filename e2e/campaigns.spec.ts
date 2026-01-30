import { test, expect } from "@playwright/test";

test.describe("Campaigns", () => {
  test("displays campaigns page", async ({ page }) => {
    await page.goto("/campaigns");

    await expect(page.getByRole("heading", { name: /campaigns/i })).toBeVisible();
  });

  test("shows demo campaigns", async ({ page }) => {
    await page.goto("/campaigns");
    await page.waitForLoadState("networkidle");

    // In demo mode there should be demo campaigns displayed
    const campaignElements = page.locator("table tbody tr, [data-testid*='campaign'], .card, [class*='campaign']");
    const count = await campaignElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test("can navigate to campaign detail", async ({ page }) => {
    await page.goto("/campaigns");
    await page.waitForLoadState("networkidle");

    // Click first campaign link if available
    const campaignLink = page.locator("a[href*='/campaigns/']").first();
    if (await campaignLink.isVisible()) {
      await campaignLink.click();
      await expect(page).toHaveURL(/\/campaigns\/.+/);
    }
  });
});
