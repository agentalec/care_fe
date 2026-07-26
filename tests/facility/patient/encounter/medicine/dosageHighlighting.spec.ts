import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Dosage Highlighting for Non-Standard Dosages", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );
  });

  test("Non-standard dosages are visually highlighted", async ({ page }) => {
    await test.step("Navigate to Medicines tab", async () => {
      await page.getByText("View Encounter").first().click();
      await page.getByRole("tab", { name: "Medicines" }).click();
      await expect(page.getByRole("tab", { name: "Medicines" })).toBeVisible();
    });

    await test.step("Create prescription with non-standard dosage", async () => {
      await page.getByRole("link", { name: /Create/i }).click();
      await expect(
        page.getByText(/Add Medication|Add another Medication/i),
      ).toBeVisible();

      // Add medication with dosage of 2 (non-standard)
      await page.getByText(/Add Medication|Add another Medication/i).click();
      await page.getByRole("tab", { name: "Medication" }).click();
      await page
        .locator("input[data-slot='command-input']")
        .fill("paracetamol");
      await page
        .getByRole("option", { name: /paracetamol/i })
        .first()
        .click();

      // Set dosage to 2 tablets
      await page.getByLabel("Dosage").click();
      await page.getByLabel("Dosage").fill("2");

      // Set frequency
      await page.getByLabel("Frequency").click();
      await page.getByRole("option", { name: "Twice a day" }).click();

      // Set duration
      await page.getByLabel("Duration (Days)").fill("5");

      // Save prescription
      await page.getByRole("button", { name: "Save Prescription" }).click();
      await expect(
        page.getByText(/Prescription saved successfully/i),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify dosage highlighting in medications table", async () => {
      // Check that the dosage is visible
      const dosageText = await page
        .locator("text=/2.*tablet/i")
        .first()
        .textContent();
      expect(dosageText).toBeTruthy();

      // Verify that non-standard dosage has highlighting class
      // The HighlightedDosage component applies border-2 and font-semibold
      const highlightedElement = page.locator(
        ".border-2.font-semibold, .border-yellow-600",
      );
      await expect(highlightedElement.first()).toBeVisible();
    });
  });

  test("Standard dosage (1) is not highlighted", async ({ page }) => {
    await test.step("Navigate to Medicines tab", async () => {
      await page.getByText("View Encounter").first().click();
      await page.getByRole("tab", { name: "Medicines" }).click();
    });

    await test.step("Create prescription with standard dosage", async () => {
      await page.getByRole("link", { name: /Create/i }).click();
      await expect(
        page.getByText(/Add Medication|Add another Medication/i),
      ).toBeVisible();

      await page.getByText(/Add Medication|Add another Medication/i).click();
      await page.getByRole("tab", { name: "Medication" }).click();
      await page
        .locator("input[data-slot='command-input']")
        .fill("paracetamol");
      await page
        .getByRole("option", { name: /paracetamol/i })
        .first()
        .click();

      // Set dosage to 1 tablet (standard)
      await page.getByLabel("Dosage").click();
      await page.getByLabel("Dosage").fill("1");

      await page.getByLabel("Frequency").click();
      await page.getByRole("option", { name: "Twice a day" }).click();

      await page.getByLabel("Duration (Days)").fill("5");

      await page.getByRole("button", { name: "Save Prescription" }).click();
      await expect(
        page.getByText(/Prescription saved successfully/i),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify standard dosage is NOT highlighted", async () => {
      // Standard dosage of 1 should be visible but NOT have highlighting
      const dosageText = await page
        .locator("text=/1.*tablet/i")
        .first()
        .textContent();
      expect(dosageText).toBeTruthy();

      // The text "1 tablet" should exist but NOT be inside a highlighted element
      const standardDosage = page.locator("text=/1.*tablet/i").first();
      await expect(standardDosage).toBeVisible();

      // Verify it doesn't have the highlighting classes
      const hasHighlightClass = await standardDosage.evaluate((el) => {
        const parent = el.closest(".border-yellow-600, .bg-yellow-50");
        return parent !== null;
      });
      expect(hasHighlightClass).toBeFalsy();
    });
  });

  test("Dosage range highlighting", async ({ page }) => {
    await test.step("Navigate to Medicines tab", async () => {
      await page.getByText("View Encounter").first().click();
      await page.getByRole("tab", { name: "Medicines" }).click();
    });

    await test.step("Create prescription with dose range", async () => {
      await page.getByRole("link", { name: /Create/i }).click();
      await expect(
        page.getByText(/Add Medication|Add another Medication/i),
      ).toBeVisible();

      await page.getByText(/Add Medication|Add another Medication/i).click();
      await page.getByRole("tab", { name: "Medication" }).click();
      await page
        .locator("input[data-slot='command-input']")
        .fill("paracetamol");
      await page
        .getByRole("option", { name: /paracetamol/i })
        .first()
        .click();

      // Enable dose range and set non-standard values
      await page.getByLabel("Use Dose Range").check();
      await page.getByLabel("Minimum Dose").fill("0.5");
      await page.getByLabel("Maximum Dose").fill("1.5");

      await page.getByLabel("Frequency").click();
      await page.getByRole("option", { name: "Twice a day" }).click();

      await page.getByLabel("Duration (Days)").fill("5");

      await page.getByRole("button", { name: "Save Prescription" }).click();
      await expect(
        page.getByText(/Prescription saved successfully/i),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify dose range is highlighted", async () => {
      // Check that the dose range is visible (format: "0.5 tablet -> 1.5 tablet")
      const doseRangeText = await page
        .locator("text=/0.5.*1.5/i")
        .first()
        .textContent();
      expect(doseRangeText).toBeTruthy();

      // Verify highlighting (at least one value != 1 triggers highlighting)
      const highlightedElement = page.locator(
        ".border-2.font-semibold, .border-yellow-600",
      );
      await expect(highlightedElement.first()).toBeVisible();
    });
  });
});
