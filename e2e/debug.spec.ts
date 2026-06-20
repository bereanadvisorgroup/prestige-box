import { expect, test } from "@playwright/test";

test.describe("Authentication Debugging", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("should login successfully as Admin", async ({ page }) => {
    // Capture console messages
    page.on("console", (msg) => console.log("BROWSER CONSOLE:", msg.type(), msg.text()));

    // Capture network responses
    page.on("response", async (response) => {
      if (response.url().includes("supabase.co")) {
        console.log("SUPABASE RESPONSE:", response.status(), response.url());
        try {
          const body = await response.json();
          console.log("SUPABASE BODY:", body);
        } catch (e) {
          // ignore
        }
      }
    });

    await page.goto("/auth/v1/login");

    await page.locator('input[type="email"]').fill("admin@prestigebox.dev");
    await page.locator('input[type="password"]').fill("password123");
    await page.locator('button[type="submit"]', { hasText: "Login" }).click();

    // Check if error message appears
    const errorMsg = page.locator(".text-destructive");
    await page.waitForTimeout(2000); // Wait a bit to let it render
    if (await errorMsg.isVisible()) {
      console.log("UI ERROR MESSAGE:", await errorMsg.textContent());
    }

    await expect(page).toHaveURL(/\/dashboard\/crm/);
  });
});
