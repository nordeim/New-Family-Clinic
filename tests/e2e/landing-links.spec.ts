import { test, expect } from "@playwright/test";

/**
 * E2E: Landing Page Link & CTA Integrity
 *
 * Goals:
 * - Ensure the new landing page at `/` aligns with the "Healthcare with Heart" vision:
 *   - Warm, trustworthy, simple, accessible.
 * - Verify key CTAs and nav links are present and clickable.
 * - Verify that "Book an Appointment" and related CTAs perform the expected action:
 *   - Scroll/focus to quick booking card (`#hero-book`) or contact section.
 * - Guard against regressions where elements silently disappear or lose linkage.
 *
 * NOTE:
 * - This suite asserts DOM behavior and navigation/scroll targets.
 * - It does NOT yet assert backend booking behavior (intentionally out of scope).
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("Landing page — core CTAs & navigation", () => {
  test("renders core hero content and aligns with vision cues", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    await expect(
      page.getByRole("heading", {
        name: /Healthcare with Heart,? right in your neighborhood\./i,
      }),
    ).toBeVisible();

    await expect(
      page.getByText(/Same-day family care, senior-friendly service/i),
    ).toBeVisible();

    await expect(
      page.getByText(/Healthier SG Ready/i),
    ).toBeVisible();
  });

  test("header navigation buttons exist and can be clicked", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const navLabels = [
      ["Home", "#top"],
      ["Why Us", "#why-us"],
      ["Services", "#services"],
      ["Our Doctors", "#doctors"],
      ["For Patients", "#for-patients"],
      ["Contact", "#contact"],
    ] as const;

    for (const [label, target] of navLabels) {
      const button = page.getByRole("button", { name: label });
      await expect(button).toBeVisible();
      await button.click();
      // We do not assert exact scroll offset (Playwright limitation without JS tap),
      // but we ensure the target section exists to prevent broken anchors.
      const targetEl = page.locator(target);
      await expect(targetEl).toHaveCount(1);
    }
  });

  test("top-right Call Now link is present and clickable", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const callNow = page.locator('a[href^="tel:+65"]', { hasText: "Call Now" });
    await expect(callNow).toBeVisible();
    await callNow.click({ trial: true });
  });

  test("hero 'Book an Appointment' button scrolls to booking card", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const bookingCard = page.locator("#hero-book");
    await expect(bookingCard).toBeVisible();

    // Get initial Y position
    const initialBox = await bookingCard.boundingBox();
    if (!initialBox) throw new Error("Booking card bounding box not found before click");
    const initialY = initialBox.y;

    // Click primary CTA
    const primaryCta = page.getByRole("button", { name: "Book an Appointment" });
    await expect(primaryCta).toBeVisible();
    await primaryCta.click();

    // Wait briefly for scroll effect
    await page.waitForTimeout(400);

    const afterBox = await bookingCard.boundingBox();
    if (!afterBox) throw new Error("Booking card bounding box not found after click");

    // Assert the card moved closer to the top (scroll occurred).
    expect(afterBox.y).toBeLessThan(initialY);
  });

  test("hero 'View Clinic Hours' button scrolls to contact section", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const contactSection = page.locator("#contact");
    await expect(contactSection).toBeVisible();

    const initialBox = await contactSection.boundingBox();
    if (!initialBox) throw new Error("Contact section bounding box not found before click");
    const initialY = initialBox.y;

    const viewHours = page.getByRole("button", { name: "View Clinic Hours" });
    await expect(viewHours).toBeVisible();
    await viewHours.click();

    await page.waitForTimeout(400);

    const afterBox = await contactSection.boundingBox();
    if (!afterBox) throw new Error("Contact section bounding box not found after click");
    expect(afterBox.y).toBeLessThan(initialY);
  });

  test("nav 'Contact' button scrolls to contact section", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const contactSection = page.locator("#contact");
    await expect(contactSection).toBeVisible();

    const initialBox = await contactSection.boundingBox();
    if (!initialBox) throw new Error("Contact section bounding box not found before click");
    const initialY = initialBox.y;

    const contactNav = page.getByRole("button", { name: "Contact" });
    await expect(contactNav).toBeVisible();
    await contactNav.click();

    await page.waitForTimeout(400);

    const afterBox = await contactSection.boundingBox();
    if (!afterBox) throw new Error("Contact section bounding box not found after nav click");
    expect(afterBox.y).toBeLessThan(initialY);
  });

  test("quick booking form and contact form controls are present (non-breaking UX)", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Quick booking form core fields
    await expect(page.locator("#quick-booking-form")).toBeVisible();
    await expect(page.locator("#qb-name")).toBeVisible();
    await expect(page.locator("#qb-phone")).toBeVisible();
    await expect(page.locator("#qb-reason")).toBeVisible();
    await expect(page.locator("#qb-slot")).toBeVisible();

    // Contact form core fields
    await expect(page.locator("#contact-form")).toBeVisible();
    await expect(page.locator("#cf-name")).toBeVisible();
    await expect(page.locator("#cf-email")).toBeVisible();
    await expect(page.locator("#cf-message")).toBeVisible();
  });
});

/**
 * Notes:
 * - These tests validate that:
 *   - All primary calls-to-action and navigation links are present.
 *   - They are interactive (visible + clickable).
 *   - They correctly reference existing sections/IDs in the landing page.
 * - This directly guards against regressions such as:
 *   - "Book an Appointment" not wired to any behavior.
 *   - Nav labels pointing to missing sections.
 * - Future extensions (not implemented here, by design):
 *   - Assert toast behavior after form submissions.
 *   - Assert senior-mode toggle persists preference.
 *   - Assert that internal links (e.g., login/register) navigate to expected routes.
 */