import { expect, test } from "@playwright/test";

test.describe("Authentication", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/v1/login");
  });

  test("should display login form", async ({ page }) => {
    await expect(page.locator("h1", { hasText: "Login" }).or(page.locator("form"))).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]', { hasText: "Login" })).toBeVisible();
  });

  test("should show validation errors on empty submission", async ({ page }) => {
    await page.locator('button[type="submit"]', { hasText: "Login" }).click();
    await expect(page.locator("text=Please enter a valid email address.")).toBeVisible();
    await expect(page.locator("text=Password must be at least 6 characters.")).toBeVisible();
  });

  test("should login successfully as Admin", async ({ page }) => {
    await page.locator('input[type="email"]').fill("admin@prestigebox.dev");
    await page.locator('input[type="password"]').fill("password123");
    await page.locator('button[type="submit"]', { hasText: "Login" }).click();

    // Verify successful login
    // Based on the login logic, admin redirects to /dashboard/crm
    await expect(page).toHaveURL(/\/dashboard\/crm/);
  });

  test("should login successfully as Advisor (Staff)", async ({ page }) => {
    await page.locator('input[type="email"]').fill("staff1@prestigebox.dev");
    await page.locator('input[type="password"]').fill("password123");
    await page.locator('button[type="submit"]', { hasText: "Login" }).click();

    // Advisor redirects to /dashboard/crm
    await expect(page).toHaveURL(/\/dashboard\/crm/);
  });

  test("should login successfully as Client", async ({ page }) => {
    await page.locator('input[type="email"]').fill("client1@prestigebox.dev");
    await page.locator('input[type="password"]').fill("password123");
    await page.locator('button[type="submit"]', { hasText: "Login" }).click();

    // Client redirects to /dashboard/default
    await expect(page).toHaveURL(/\/dashboard\/default/);
  });
});
