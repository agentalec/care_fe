import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Length of Stay Display", () => {
  const facilityId = getFacilityId();
  const patientId = getPatientId();
  const encounterId = getEncounterId();

  test("displays length of stay in EncounterInfoCard for inpatient encounter", async ({
    page,
  }) => {
    // Navigate to the encounter page
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}`,
    );

    // Go back to encounters list to see the card
    await page.goto(`/facility/${facilityId}/encounters/patients/all`);

    // Wait for the encounters list to load
    await page.waitForLoadState("networkidle");

    // Filter to show only inpatient encounters
    await page.getByRole("button", { name: "Encounter Class" }).click();
    await page.getByRole("checkbox", { name: "Inpatient" }).click();
    await page.getByRole("button", { name: "Apply Filters" }).click();

    // Verify at least one encounter card shows LOS (format: "(N day(s))")
    await expect(page.locator("text=/\\(\\d+ days?\\)/").first()).toBeVisible();
  });

  test("displays length of stay in encounter details tab for inpatient encounter", async ({
    page,
  }) => {
    // Navigate to the fixture encounter (which should be inpatient)
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}`,
    );

    // Click on Details tab
    await page.getByRole("tab", { name: "Details" }).click();

    // Verify "Length of Stay" label is present
    await expect(page.getByText("Length of Stay")).toBeVisible();

    // Verify days value is shown (should be a number followed by "day" or "days")
    const detailsTab = page.locator('[role="tabpanel"]');
    await expect(detailsTab.locator("text=/\\d+ days?/")).toBeVisible();
  });

  test("displays length of stay in EncounterShow header for inpatient encounter", async ({
    page,
  }) => {
    // Navigate to the fixture encounter
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}`,
    );

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Verify LOS is displayed in the header with the date range
    // Format: "DD MMM - DD MMM (N days)" or "DD MMM - ongoing (N days)"
    const header = page.locator("header").first();

    // Verify the header contains day/days pattern
    await expect(header.locator("text=/\\(\\d+ days?\\)/")).toBeVisible();
  });

  test("displays singular 'day' for 1-day stay", async ({ page }) => {
    // Create a new inpatient encounter (same-day admission should show 1 day)
    await page.goto(`/facility/${facilityId}/encounters/patients/all`);
    await page.getByRole("link", { name: "Patient Home" }).first().click();
    await page.getByRole("button", { name: "Create Encounter" }).click();
    await page.getByRole("button", { name: "Inpatient" }).click();
    await page.getByRole("button", { name: "Create Encounter" }).click();

    // Wait for success message
    await expect(
      page.getByText("Encounter created successfully"),
    ).toBeVisible();

    // Click on Details tab
    await page.getByRole("tab", { name: "Details" }).click();

    // Verify singular "day" is used for same-day admission (1 day)
    await expect(page.getByText("1 day")).toBeVisible();
    // Ensure it's not showing "1 days" (incorrect plural)
    await expect(page.getByText("1 days")).not.toBeVisible();
  });

  test("does not display length of stay for non-inpatient encounter", async ({
    page,
  }) => {
    // Create a new ambulatory (outpatient) encounter
    await page.goto(`/facility/${facilityId}/encounters/patients/all`);
    await page.getByRole("link", { name: "Patient Home" }).first().click();
    await page.getByRole("button", { name: "Create Encounter" }).click();
    await page.getByRole("button", { name: "Ambulatory" }).click();
    await page.getByRole("button", { name: "Create Encounter" }).click();

    // Wait for success message
    await expect(
      page.getByText("Encounter created successfully"),
    ).toBeVisible();

    // Click on Details tab
    await page.getByRole("tab", { name: "Details" }).click();

    // Verify "Length of Stay" is NOT displayed
    await expect(page.getByText("Length of Stay")).not.toBeVisible();
  });

  test("displays length of stay for closed inpatient encounter", async ({
    page,
  }) => {
    // Create a new inpatient encounter
    await page.goto(`/facility/${facilityId}/encounters/patients/all`);
    await page.getByRole("link", { name: "Patient Home" }).first().click();
    await page.getByRole("button", { name: "Create Encounter" }).click();
    await page.getByRole("button", { name: "Inpatient" }).click();
    await page.getByRole("button", { name: "Create Encounter" }).click();

    // Wait for success message
    await expect(
      page.getByText("Encounter created successfully"),
    ).toBeVisible();

    // Mark encounter as completed to close it
    await page.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: "Mark as Completed" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();

    // Wait for success message
    await expect(
      page.getByText("Encounter marked as completed"),
    ).toBeVisible();

    // Click on Details tab
    await page.getByRole("tab", { name: "Details" }).click();

    // Verify "Length of Stay" is still displayed for closed encounter
    await expect(page.getByText("Length of Stay")).toBeVisible();

    // Verify days value is shown
    const detailsTab = page.locator('[role="tabpanel"]');
    await expect(detailsTab.locator("text=/\\d+ days?/")).toBeVisible();
  });
});
