import { expect, test } from "@playwright/test";
import { format, subDays, subMonths, subYears } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";
import { faker } from "@faker-js/faker";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Patient Age Display on Encounter Card", () => {
  const facilityId = getFacilityId();

  /**
   * Helper function to create a patient with a specific birth date
   * and verify the age display on the encounter card
   */
  async function createPatientAndVerifyAge(
    page: any,
    dateOfBirth: string,
    expectedAgePattern: RegExp,
    expectedTooltipPattern: RegExp,
  ) {
    const patientName = faker.person.fullName();
    const patientPhone = faker.string.numeric(10);

    // Navigate to patients page
    await page.goto(`/${facilityId}/patients`);

    // Create new patient
    await page.click('button:has-text("New Patient")');

    // Fill in patient details
    await page.fill('input[name="name"]', patientName);
    await page.fill('input[name="phone_number"]', patientPhone);
    await page.fill('input[name="date_of_birth"]', dateOfBirth);

    // Select gender
    await page.click('button:has-text("Select gender")');
    await page.click('text="Male"');

    // Submit patient form
    await page.click('button[type="submit"]');

    // Wait for patient to be created and redirected to patient page
    await page.waitForURL(`**/${facilityId}/patient/*`);

    // Create an encounter for this patient
    await page.click('button:has-text("New Encounter")');

    // Fill encounter details
    await page.click('button:has-text("Select encounter class")');
    await page.click('text="Ambulatory"');

    await page.click('button:has-text("Select priority")');
    await page.click('text="Routine"');

    // Submit encounter
    await page.click('button:has-text("Create Encounter")');

    // Wait for encounter to be created
    await page.waitForURL(`**/${facilityId}/encounter/*`);

    // Get the age display element
    const ageElement = page.locator("text=/\\d+\\s*[dwmoY]/").first();

    // Verify age format matches expected pattern
    const ageText = await ageElement.textContent();
    expect(ageText).toMatch(expectedAgePattern);

    // Hover over age to see tooltip
    await ageElement.hover();

    // Wait for tooltip to appear and verify it contains full breakdown
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible();

    const tooltipText = await tooltip.textContent();
    expect(tooltipText).toMatch(expectedTooltipPattern);
  }

  test("displays age in days for patient aged 0-28 days", async ({ page }) => {
    // Create patient who is 14 days old
    const dateOfBirth = format(subDays(new Date(), 14), "yyyy-MM-dd");

    await createPatientAndVerifyAge(
      page,
      dateOfBirth,
      /^\d+\s*d$/, // Expects format like "14d"
      /^\d+\s*days?$/, // Tooltip should show "14 days"
    );
  });

  test("displays age in weeks and days for patient aged 29 days to 1 year", async ({
    page,
  }) => {
    // Create patient who is 3 months old (approx 12 weeks)
    const dateOfBirth = format(subMonths(new Date(), 3), "yyyy-MM-dd");

    await createPatientAndVerifyAge(
      page,
      dateOfBirth,
      /^\d+\s*w\s+\d+\s*d$/, // Expects format like "12w 3d"
      /^\d+\s*years?\s+\d+\s*months?\s+\d+\s*days?$/, // Tooltip shows full breakdown
    );
  });

  test("displays age in months and days for patient aged 1 to 2 years", async ({
    page,
  }) => {
    // Create patient who is 18 months old
    const dateOfBirth = format(subMonths(new Date(), 18), "yyyy-MM-dd");

    await createPatientAndVerifyAge(
      page,
      dateOfBirth,
      /^\d+\s*mo\s+\d+\s*d$/, // Expects format like "18mo 15d"
      /^\d+\s*years?\s+\d+\s*months?\s+\d+\s*days?$/, // Tooltip shows full breakdown
    );
  });

  test("displays age in years and months for patient aged 2 to 18 years", async ({
    page,
  }) => {
    // Create patient who is 5 years old
    const dateOfBirth = format(
      subYears(subMonths(new Date(), 8), 5),
      "yyyy-MM-dd",
    );

    await createPatientAndVerifyAge(
      page,
      dateOfBirth,
      /^\d+\s*Y\s+\d+\s*mo$/, // Expects format like "5Y 8mo"
      /^\d+\s*years?\s+\d+\s*months?\s+\d+\s*days?$/, // Tooltip shows full breakdown
    );
  });

  test("displays age in years only for patient above 18 years", async ({
    page,
  }) => {
    // Create patient who is 42 years old
    const dateOfBirth = format(subYears(new Date(), 42), "yyyy-MM-dd");

    await createPatientAndVerifyAge(
      page,
      dateOfBirth,
      /^\d+\s*Y$/, // Expects format like "42Y"
      /^\d+\s*years?(\s+\d+\s*months?\s+\d+\s*days?)?$/, // Tooltip shows full breakdown
    );
  });
});
