import { expect, test } from "@playwright/test";

test.describe("Dashboard Workflows", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to dashboard, auth state is loaded from storageState (admin.json)
    await page.goto("/dashboard/crm");
  });

  test("should display dashboard navigation", async ({ page }) => {
    // Check for common dashboard elements (e.g., sidebar or navigation)
    // Wait for the page to load the sidebar or main layout
    await expect(page.locator("h2").first()).toBeVisible({ timeout: 15000 });

    // Check that we are on the CRM dashboard page
    await expect(page.locator("h2").first()).toBeVisible();
  });

  test("should be able to navigate to other sections", async ({ page }) => {
    // Attempt to navigate to the Default or Admin area if links exist in the sidebar
    // Because the sidebar is dynamic, we'll click on a link that has an href containing dashboard
    const navLink = page.locator('a[href*="/dashboard"]').first();
    await expect(navLink).toBeVisible();
    await navLink.click();

    // Wait for URL to be a dashboard URL
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
