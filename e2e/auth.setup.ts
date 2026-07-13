import { expect, test as setup } from "@playwright/test";
import path from "path";

const adminFile = path.join(__dirname, "playwright/.auth/admin.json");
const clientFile = path.join(__dirname, "playwright/.auth/client.json");

setup("authenticate as admin", async ({ page, context }) => {
  await context.addCookies([{ name: "is_e2e", value: "true", url: "http://localhost:3000" }]);
  // Perform authentication steps. Replace these actions with your own.
  await page.goto("/auth/v1/login");
  await page.evaluate(() => {
    document.cookie = "is_e2e=true; path=/";
    localStorage.setItem("is_e2e", "true");
  });
  await page.locator("input#email").fill("admin@prestigebox.dev");
  await page.locator("input#password").fill("password123");
  await page.locator('button[type="submit"]').click();

  // Wait until the page receives the cookies.
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  await expect(page).toHaveURL(/\/dashboard\/crm/, { timeout: 30000 });

  // End of authentication steps.

  await page.context().storageState({ path: adminFile });
});

setup("authenticate as client", async ({ page, context }) => {
  await context.addCookies([{ name: "is_e2e", value: "true", url: "http://localhost:3000" }]);
  // Perform authentication steps. Replace these actions with your own.
  await page.goto("/auth/v1/login");
  await page.evaluate(() => {
    document.cookie = "is_e2e=true; path=/";
    localStorage.setItem("is_e2e", "true");
  });
  await page.locator("input#email").fill("client1@prestigebox.dev");
  await page.locator("input#password").fill("password123");
  await page.locator('button[type="submit"]').click();

  // Wait until the page receives the cookies.
  await expect(page).toHaveURL(/\/dashboard\/default/, { timeout: 30000 });

  // End of authentication steps.

  await page.context().storageState({ path: clientFile });
});
