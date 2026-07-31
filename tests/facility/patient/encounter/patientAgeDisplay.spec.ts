import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { format, subDays, subMonths, subYears } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Patient Age Display on Encounter Card", () => {
  let facilityId: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
  });

  test("displays age as days only for patient aged 0-28 days", async ({
    page,
  }) => {
    await test.step("Create patient aged 15 days", async () => {
      const dob = format(subDays(new Date(), 15), "yyyy-MM-dd");
      const patientName = `Test Patient ${faker.string.alphanumeric(6)}`;

      await page.goto(`/facility/${facilityId}/patients`);
      await page.getByRole("button", { name: "Create New Patient" }).click();

      // Fill patient details
      await page.getByRole("textbox", { name: "Name" }).fill(patientName);
      await page.getByRole("textbox", { name: "Date of Birth" }).fill(dob);
      await page.getByRole("combobox", { name: "Gender" }).click();
      await page.getByRole("option", { name: "Male" }).click();
      await page
        .getByRole("textbox", { name: "Phone Number" })
        .fill(faker.string.numeric(10));

      await page.getByRole("button", { name: "Create Patient" }).click();

      // Wait for success and navigate
      await expect(
        page.getByText("Patient created successfully"),
      ).toBeVisible();
    });

    await test.step("Create encounter and verify age display", async () => {
      await page.getByRole("button", { name: "Create Encounter" }).click();
      await page.getByRole("button", { name: "Inpatient" }).click();
      await page.getByRole("button", { name: "Create Encounter" }).click();

      await expect(
        page.getByText("Encounter created successfully"),
      ).toBeVisible();

      // Navigate to encounters list to see the patient card
      await page.goto(`/facility/${facilityId}/encounters`);

      // Verify age is displayed as days only (abbreviated format)
      await expect(page.getByText(/15 d/).first()).toBeVisible();
    });

    await test.step("Verify tooltip shows full breakdown", async () => {
      // Hover over the age to see tooltip
      const ageElement = page.getByText(/15 d/).first();
      await ageElement.hover();

      // Wait for tooltip to appear and verify it shows exact full breakdown
      await expect(
        page.getByRole("tooltip").filter({ hasText: "15 days" }),
      ).toBeVisible();
    });
  });

  test("displays age as weeks + days for patient aged 29 days to 1 year", async ({
    page,
  }) => {
    await test.step("Create patient aged 60 days (8 weeks 4 days)", async () => {
      const dob = format(subDays(new Date(), 60), "yyyy-MM-dd");
      const patientName = `Test Patient ${faker.string.alphanumeric(6)}`;

      await page.goto(`/facility/${facilityId}/patients`);
      await page.getByRole("button", { name: "Create New Patient" }).click();

      await page.getByRole("textbox", { name: "Name" }).fill(patientName);
      await page.getByRole("textbox", { name: "Date of Birth" }).fill(dob);
      await page.getByRole("combobox", { name: "Gender" }).click();
      await page.getByRole("option", { name: "Female" }).click();
      await page
        .getByRole("textbox", { name: "Phone Number" })
        .fill(faker.string.numeric(10));

      await page.getByRole("button", { name: "Create Patient" }).click();
      await expect(
        page.getByText("Patient created successfully"),
      ).toBeVisible();
    });

    await test.step("Create encounter and verify age display", async () => {
      await page.getByRole("button", { name: "Create Encounter" }).click();
      await page.getByRole("button", { name: "Ambulatory" }).click();
      await page.getByRole("button", { name: "Create Encounter" }).click();

      await expect(
        page.getByText("Encounter created successfully"),
      ).toBeVisible();

      await page.goto(`/facility/${facilityId}/encounters`);

      // Verify age is displayed as weeks + days (abbreviated: w and d)
      await expect(page.getByText(/8 w 4 d/).first()).toBeVisible();
    });

    await test.step("Verify tooltip shows full breakdown", async () => {
      const ageElement = page.getByText(/8 w 4 d/).first();
      await ageElement.hover();

      // Verify exact calculated values: 60 days = 8 weeks, 4 days
      await expect(
        page.getByRole("tooltip").filter({ hasText: "8 weeks, 4 days" }),
      ).toBeVisible();
    });
  });

  test("displays age as months + days for patient aged 1 year to 2 years", async ({
    page,
  }) => {
    await test.step("Create patient aged 13 months 10 days", async () => {
      // 13 months is approximately 395 days, plus 10 days = 405 days
      const dob = format(subDays(new Date(), 405), "yyyy-MM-dd");
      const patientName = `Test Patient ${faker.string.alphanumeric(6)}`;

      await page.goto(`/facility/${facilityId}/patients`);
      await page.getByRole("button", { name: "Create New Patient" }).click();

      await page.getByRole("textbox", { name: "Name" }).fill(patientName);
      await page.getByRole("textbox", { name: "Date of Birth" }).fill(dob);
      await page.getByRole("combobox", { name: "Gender" }).click();
      await page.getByRole("option", { name: "Male" }).click();
      await page
        .getByRole("textbox", { name: "Phone Number" })
        .fill(faker.string.numeric(10));

      await page.getByRole("button", { name: "Create Patient" }).click();
      await expect(
        page.getByText("Patient created successfully"),
      ).toBeVisible();
    });

    await test.step("Create encounter and verify age display", async () => {
      await page.getByRole("button", { name: "Create Encounter" }).click();
      await page.getByRole("button", { name: "Emergency" }).click();
      await page.getByRole("button", { name: "Create Encounter" }).click();

      await expect(
        page.getByText("Encounter created successfully"),
      ).toBeVisible();

      await page.goto(`/facility/${facilityId}/encounters`);

      // Verify age is displayed as months + days (abbreviated: mo and d)
      await expect(page.getByText(/13 mo \d+ d/).first()).toBeVisible();
    });

    await test.step("Verify tooltip shows full breakdown", async () => {
      const ageElement = page.getByText(/13 mo \d+ d/).first();
      await ageElement.hover();

      // Verify exact calculated values: 405 days = 1 year, 1 month, 10 days
      await expect(
        page
          .getByRole("tooltip")
          .filter({ hasText: "1 year, 1 month, 10 days" }),
      ).toBeVisible();
    });
  });

  test("displays age as years + months for patient aged 2 years to 18 years", async ({
    page,
  }) => {
    await test.step("Create patient aged 5 years 3 months", async () => {
      // 5 years 3 months ago
      const dob = format(subMonths(subYears(new Date(), 5), 3), "yyyy-MM-dd");
      const patientName = `Test Patient ${faker.string.alphanumeric(6)}`;

      await page.goto(`/facility/${facilityId}/patients`);
      await page.getByRole("button", { name: "Create New Patient" }).click();

      await page.getByRole("textbox", { name: "Name" }).fill(patientName);
      await page.getByRole("textbox", { name: "Date of Birth" }).fill(dob);
      await page.getByRole("combobox", { name: "Gender" }).click();
      await page.getByRole("option", { name: "Female" }).click();
      await page
        .getByRole("textbox", { name: "Phone Number" })
        .fill(faker.string.numeric(10));

      await page.getByRole("button", { name: "Create Patient" }).click();
      await expect(
        page.getByText("Patient created successfully"),
      ).toBeVisible();
    });

    await test.step("Create encounter and verify age display", async () => {
      await page.getByRole("button", { name: "Create Encounter" }).click();
      await page.getByRole("button", { name: "Observation" }).click();
      await page.getByRole("button", { name: "Create Encounter" }).click();

      await expect(
        page.getByText("Encounter created successfully"),
      ).toBeVisible();

      await page.goto(`/facility/${facilityId}/encounters`);

      // Verify age is displayed as years + months (abbreviated: Y and mo)
      await expect(page.getByText(/5 Y 3 mo/).first()).toBeVisible();
    });

    await test.step("Verify tooltip shows full breakdown", async () => {
      const ageElement = page.getByText(/5 Y 3 mo/).first();
      await ageElement.hover();

      // Verify exact calculated values
      await expect(
        page.getByRole("tooltip").filter({ hasText: "5 years, 3 months" }),
      ).toBeVisible();
    });
  });

  test("displays age as years + months for patient aged exactly 18 years with months", async ({
    page,
  }) => {
    await test.step("Create patient aged 18 years 3 months", async () => {
      // 18 years 3 months ago
      const dob = format(subMonths(subYears(new Date(), 18), 3), "yyyy-MM-dd");
      const patientName = `Test Patient ${faker.string.alphanumeric(6)}`;

      await page.goto(`/facility/${facilityId}/patients`);
      await page.getByRole("button", { name: "Create New Patient" }).click();

      await page.getByRole("textbox", { name: "Name" }).fill(patientName);
      await page.getByRole("textbox", { name: "Date of Birth" }).fill(dob);
      await page.getByRole("combobox", { name: "Gender" }).click();
      await page.getByRole("option", { name: "Male" }).click();
      await page
        .getByRole("textbox", { name: "Phone Number" })
        .fill(faker.string.numeric(10));

      await page.getByRole("button", { name: "Create Patient" }).click();
      await expect(
        page.getByText("Patient created successfully"),
      ).toBeVisible();
    });

    await test.step("Create encounter and verify age display", async () => {
      await page.getByRole("button", { name: "Create Encounter" }).click();
      await page.getByRole("button", { name: "Inpatient" }).click();
      await page.getByRole("button", { name: "Create Encounter" }).click();

      await expect(
        page.getByText("Encounter created successfully"),
      ).toBeVisible();

      await page.goto(`/facility/${facilityId}/encounters`);

      // Verify age is displayed as years + months (abbreviated: Y and mo)
      // Critical boundary: 18 years with months should show months, not years only
      await expect(page.getByText(/18 Y 3 mo/).first()).toBeVisible();
    });

    await test.step("Verify tooltip shows full breakdown", async () => {
      const ageElement = page.getByText(/18 Y 3 mo/).first();
      await ageElement.hover();

      await expect(
        page.getByRole("tooltip").filter({ hasText: "18 years, 3 months" }),
      ).toBeVisible();
    });
  });

  test("displays age as years only for patient aged above 18 years", async ({
    page,
  }) => {
    await test.step("Create patient aged 42 years", async () => {
      const dob = format(subYears(new Date(), 42), "yyyy-MM-dd");
      const patientName = `Test Patient ${faker.string.alphanumeric(6)}`;

      await page.goto(`/facility/${facilityId}/patients`);
      await page.getByRole("button", { name: "Create New Patient" }).click();

      await page.getByRole("textbox", { name: "Name" }).fill(patientName);
      await page.getByRole("textbox", { name: "Date of Birth" }).fill(dob);
      await page.getByRole("combobox", { name: "Gender" }).click();
      await page.getByRole("option", { name: "Male" }).click();
      await page
        .getByRole("textbox", { name: "Phone Number" })
        .fill(faker.string.numeric(10));

      await page.getByRole("button", { name: "Create Patient" }).click();
      await expect(
        page.getByText("Patient created successfully"),
      ).toBeVisible();
    });

    await test.step("Create encounter and verify age display", async () => {
      await page.getByRole("button", { name: "Create Encounter" }).click();
      await page.getByRole("button", { name: "Virtual" }).click();
      await page.getByRole("button", { name: "Create Encounter" }).click();

      await expect(
        page.getByText("Encounter created successfully"),
      ).toBeVisible();

      await page.goto(`/facility/${facilityId}/encounters`);

      // Verify age is displayed as years only (abbreviated: Y)
      await expect(page.getByText(/42 Y/).first()).toBeVisible();
      // Ensure no months are displayed
      await expect(page.getByText(/42 Y \d+ mo/).first()).not.toBeVisible();
    });

    await test.step("Verify tooltip shows full breakdown", async () => {
      const ageElement = page.getByText(/42 Y/).first();
      await ageElement.hover();

      // Verify exact calculated values
      await expect(
        page.getByRole("tooltip").filter({ hasText: "42 years" }),
      ).toBeVisible();
    });
  });

  test("calculates age using deceased_datetime for deceased patients", async ({
    page,
  }) => {
    await test.step("Create patient who was 25 years old at death", async () => {
      // Patient born 25 years ago, died 1 year ago
      const dob = format(subYears(new Date(), 26), "yyyy-MM-dd");
      const deceasedDate = format(subYears(new Date(), 1), "yyyy-MM-dd");
      const patientName = `Test Patient ${faker.string.alphanumeric(6)}`;

      await page.goto(`/facility/${facilityId}/patients`);
      await page.getByRole("button", { name: "Create New Patient" }).click();

      await page.getByRole("textbox", { name: "Name" }).fill(patientName);
      await page.getByRole("textbox", { name: "Date of Birth" }).fill(dob);
      await page.getByRole("combobox", { name: "Gender" }).click();
      await page.getByRole("option", { name: "Female" }).click();
      await page
        .getByRole("textbox", { name: "Phone Number" })
        .fill(faker.string.numeric(10));

      // Mark as deceased
      await page.getByRole("checkbox", { name: "Is Deceased" }).check();
      await page
        .getByRole("textbox", { name: "Date and Time of Death" })
        .fill(deceasedDate);

      await page.getByRole("button", { name: "Create Patient" }).click();
      await expect(
        page.getByText("Patient created successfully"),
      ).toBeVisible();
    });

    await test.step("Create encounter and verify age at death", async () => {
      await page.getByRole("button", { name: "Create Encounter" }).click();
      await page.getByRole("button", { name: "Inpatient" }).click();
      await page.getByRole("button", { name: "Create Encounter" }).click();

      await expect(
        page.getByText("Encounter created successfully"),
      ).toBeVisible();

      await page.goto(`/facility/${facilityId}/encounters`);

      // Verify deceased badge is shown
      await expect(page.getByText("Deceased").first()).toBeVisible();

      // Verify age is 25 years (age at death, not current age)
      await expect(page.getByText(/25 Y/).first()).toBeVisible();
      // Should not show 26 years (which would be current age if alive)
      await expect(page.getByText(/26 Y/).first()).not.toBeVisible();
    });

    await test.step("Verify tooltip uses deceased datetime", async () => {
      const ageElement = page.getByText(/25 Y/).first();
      await ageElement.hover();

      // Tooltip should show exact breakdown based on deceased_datetime
      await expect(
        page.getByRole("tooltip").filter({ hasText: "25 years" }),
      ).toBeVisible();
    });
  });
});
