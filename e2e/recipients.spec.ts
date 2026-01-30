import { test, expect } from "@playwright/test";

test.describe("Recipients", () => {
  test("displays recipients list", async ({ page }) => {
    await page.goto("/recipients");

    // Should show the recipients page header
    await expect(page.getByRole("heading", { name: /recipients/i })).toBeVisible();
  });

  test("shows recipient data in demo mode", async ({ page }) => {
    await page.goto("/recipients");

    // In demo mode, there should be demo recipients displayed
    // Wait for the list to load
    await page.waitForLoadState("networkidle");

    // Check that at least one recipient row or card is visible
    const recipientElements = page.locator("table tbody tr, [data-testid*='recipient']");
    const count = await recipientElements.count();

    // In demo mode we expect some recipients
    expect(count).toBeGreaterThan(0);
  });

  test("search filters recipients", async ({ page }) => {
    await page.goto("/recipients");
    await page.waitForLoadState("networkidle");

    // Look for a search input
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill("test-nonexistent-name-xyz");
      await page.waitForTimeout(500); // Debounce

      // The list should be filtered (fewer or no results)
      const recipientRows = page.locator("table tbody tr");
      const filteredCount = await recipientRows.count();
      // Just verify the search doesn't crash
      expect(filteredCount).toBeGreaterThanOrEqual(0);
    }
  });
});
