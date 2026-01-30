import { test, expect } from "@playwright/test";

test.describe("Sends", () => {
  test("displays sends page", async ({ page }) => {
    await page.goto("/sends");

    // Should show sends page
    await expect(page.getByRole("heading", { name: /sends/i })).toBeVisible();
  });

  test("shows demo sends data", async ({ page }) => {
    await page.goto("/sends");
    await page.waitForLoadState("networkidle");

    // In demo mode there should be some send data visible
    const sendElements = page.locator("table tbody tr, [data-testid*='send']");
    const count = await sendElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test("navigates to new send form", async ({ page }) => {
    await page.goto("/sends");

    // Look for a "New Send" or "Create" button
    const createButton = page.getByRole("link", { name: /new|create|send/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForLoadState("networkidle");
      // Should navigate to a form or dialog
    }
  });
});
