import { expect, test } from "@playwright/test";

import { navigateToOrganizationPatient } from "tests/organization/patient/helpers";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("PatientInfoHoverCard Conditional Rendering", () => {
  test("should NOT show Patient Home button in encounter accessed via organization route", async ({
    page,
  }) => {
    await navigateToOrganizationPatient(page);

    // Go to Encounters tab
    await page.getByRole("tab", { name: "Encounters" }).click();

    // Click "View Encounter" link
    await page.getByRole("link", { name: "View Encounter" }).first().click();

    // Verify URL contains organizationId and NOT facilityId
    expect(page.url()).toContain(`/organization/organizationId/patient/`);
    expect(page.url()).not.toContain("/facility/");

    // Wait for patient info hover card trigger
    await page
      .locator("[data-slot='patient-info-hover-card-trigger']")
      .last()
      .click();

    // Verify that Patient Home button is NOT visible (because facilityId is not available)
    await expect(
      page.getByRole("link", { name: "Patient Home" }),
    ).not.toBeVisible();

    // But View Profile button should still be visible
    await expect(page.getByRole("link", { name: "View Profile" })).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("PatientInfoHoverCard Age Display", () => {
  test("should display patient age in clinical format on hover card trigger", async ({
    page,
  }) => {
    await navigateToOrganizationPatient(page);

    // Go to Encounters tab
    await page.getByRole("tab", { name: "Encounters" }).click();

    // Click "View Encounter" link
    await page.getByRole("link", { name: "View Encounter" }).first().click();

    // Wait for patient info hover card trigger to be visible
    const trigger = page
      .locator("[data-slot='patient-info-hover-card-trigger']")
      .last();
    await expect(trigger).toBeVisible();

    // Check that age is displayed in abbreviated clinical format
    // Age should match clinical format rules (e.g., "25Y", "5Y 3mo", "18mo 5d", "8w 3d", "15d")
    const ageText = await trigger.textContent();
    expect(ageText).toMatch(/\d+[Ywmd]/); // Should contain at least one age unit
  });

  test("should show age tooltip on hover over age text in hover card", async ({
    page,
  }) => {
    await navigateToOrganizationPatient(page);

    // Go to Encounters tab
    await page.getByRole("tab", { name: "Encounters" }).click();

    // Click "View Encounter" link
    await page.getByRole("link", { name: "View Encounter" }).first().click();

    // Click patient info hover card trigger to open the hover card
    await page
      .locator("[data-slot='patient-info-hover-card-trigger']")
      .last()
      .click();

    // Wait for hover card content to be visible
    await page.waitForTimeout(500);

    // Find the age text with cursor-help class inside the hover card
    const ageElement = page.locator(".cursor-help").first();
    await expect(ageElement).toBeVisible();

    // Hover over the age text to trigger tooltip
    await ageElement.hover();

    // Wait for tooltip to appear
    await page.waitForTimeout(300);

    // Check that tooltip is visible with full age breakdown
    const tooltip = page.locator("[data-slot='tooltip-content']");
    await expect(tooltip).toBeVisible({ timeout: 2000 });

    // Tooltip should contain the full breakdown (e.g., "25 Y, 3 mo, 5 d")
    const tooltipText = await tooltip.textContent();
    expect(tooltipText).toBeTruthy();
    // Should contain at least one comma (separating age units)
    expect(tooltipText).toMatch(/,/);
  });
});
