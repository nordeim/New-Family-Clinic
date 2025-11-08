// tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication Flows", () => {
  test("should allow a patient to log in and redirect to dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "patient.lim@demo.com"); // Using dev seed user
    await page.fill('input[name="password"]', "Demo123!");
    await page.click('button[type="submit"]');

    // Wait for the dashboard URL and check for a welcome message
    await page.waitForURL("/dashboard");
    await expect(page.getByText("Your Health Dashboard")).toBeVisible();
  });

  test("should show an error for incorrect credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "patient.lim@demo.com");
    await page.fill('input[name="password"]', "WrongPassword123!");
    await page.click('button[type="submit"]');

    // Expect an error message to be visible
    await expect(page.getByText("Invalid login credentials")).toBeVisible();
    // Expect the URL to remain on the login page
    expect(page.url()).toContain("/login");
  });

  test("should protect dashboard routes from unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard");
    // Playwright will wait for the navigation, which should be a redirect
    await page.waitForURL("/login");
    await expect(page.getByText("Portal Login")).toBeVisible();
  });
});
