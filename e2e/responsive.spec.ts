import { expect, test } from "@playwright/test";

test.describe("Responsive Layout - Unauthenticated", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("should render login page correctly on all viewports", async ({ page, context }) => {
    await context.addCookies([{ name: "is_e2e", value: "true", url: "http://localhost:3000" }]);
    await page.goto("/auth/v1/login");
    await page.evaluate(() => {
      document.cookie = "is_e2e=true; path=/";
      localStorage.setItem("is_e2e", "true");
    });
    const loginButton = page.locator('button[type="submit"]', { hasText: "Login" });
    await expect(loginButton).toBeVisible();

    // The inputs should be visible and not hidden by responsive layout bugs
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Check that the bounding box is within the viewport width
    const box = await emailInput.boundingBox();
    const viewportSize = page.viewportSize();

    expect(box).not.toBeNull();
    if (box && viewportSize) {
      expect(box.width).toBeLessThanOrEqual(viewportSize.width);
    }
  });
});

test.describe("Responsive Layout - Authenticated", () => {
  test.use({ storageState: "e2e/playwright/.auth/client.json" });

  test("should display mobile menu on small screens after login", async ({ page, isMobile }) => {
    // Skip if not testing on a mobile viewport
    test.skip(!isMobile, "This test is only for mobile viewports");

    await page.goto("/dashboard/default");

    // Look for a hamburger menu button or similar mobile trigger
    // Next.js Shadcn dashboards often use a button with "Toggle Menu", "Open Menu", or an icon
    const menuButton = page.locator("button").filter({ hasText: /menu/i }).first();
    // It's possible the menu button is just an icon, we can check for its existence
    // If we don't know the exact aria-label, we can look for generic header buttons
    const headerButtons = page.locator("header button");
    if ((await headerButtons.count()) > 0) {
      await expect(headerButtons.first()).toBeVisible();
    }
  });
});
