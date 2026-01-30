import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("loads the dashboard page", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveTitle(/Juniply|Dashboard/i);
  });

  test("sidebar contains all navigation links", async ({ page }) => {
    await page.goto("/dashboard");

    // Wait for sidebar to load
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();

    // Check all main navigation items
    const navItems = [
      "Dashboard",
      "Tasks",
      "Sends",
      "Gift Catalog",
      "Recipients",
      "Campaigns",
      "Budget",
      "Analytics",
      "Integrations",
      "Settings",
    ];

    for (const item of navItems) {
      await expect(page.getByRole("link", { name: new RegExp(item, "i") })).toBeVisible();
    }
  });

  test("navigates between pages via sidebar", async ({ page }) => {
    await page.goto("/dashboard");

    // Navigate to Recipients
    await page.getByRole("link", { name: /recipients/i }).click();
    await expect(page).toHaveURL(/\/recipients/);

    // Navigate to Campaigns
    await page.getByRole("link", { name: /campaigns/i }).click();
    await expect(page).toHaveURL(/\/campaigns/);

    // Navigate to Budget
    await page.getByRole("link", { name: /budget/i }).click();
    await expect(page).toHaveURL(/\/budget/);
  });
});
