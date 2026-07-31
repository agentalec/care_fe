import { expect, test } from "@playwright/test";

import dayjs from "../src/Utils/dayjs";
import {
  formatPatientAge,
  formatPatientAgeTooltip,
  getPatientAgeBreakdown,
} from "../src/Utils/utils";

// Helper to create a patient object with date_of_birth
const createPatient = (daysOld: number, deceased = false) => {
  const date_of_birth = dayjs().subtract(daysOld, "days").toISOString();
  return deceased
    ? {
        date_of_birth,
        deceased_datetime: dayjs().toISOString(),
        name: "Test Patient",
        gender: "Male" as const,
        phone_number: "1234567890",
        year_of_birth: parseInt(date_of_birth.split("-")[0]),
      }
    : {
        date_of_birth,
        name: "Test Patient",
        gender: "Male" as const,
        phone_number: "1234567890",
        year_of_birth: parseInt(date_of_birth.split("-")[0]),
      };
};

// Helper to create a patient with years/months/days
const createPatientWithAge = (years: number, months: number, days: number) => {
  const date_of_birth = dayjs()
    .subtract(years, "years")
    .subtract(months, "months")
    .subtract(days, "days")
    .toISOString();
  return {
    date_of_birth,
    name: "Test Patient",
    gender: "Male" as const,
    phone_number: "1234567890",
    year_of_birth: parseInt(date_of_birth.split("-")[0]),
  };
};

test.describe("getPatientAgeBreakdown", () => {
  test("should calculate age breakdown for newborn (0 days)", () => {
    const patient = createPatient(0);
    const breakdown = getPatientAgeBreakdown(patient);
    expect(breakdown.years).toBe(0);
    expect(breakdown.months).toBe(0);
    expect(breakdown.days).toBe(0);
  });

  test("should calculate age breakdown for 15 days old", () => {
    const patient = createPatient(15);
    const breakdown = getPatientAgeBreakdown(patient);
    expect(breakdown.years).toBe(0);
    expect(breakdown.months).toBe(0);
    expect(breakdown.days).toBe(15);
  });

  test("should calculate age breakdown for 28 days old", () => {
    const patient = createPatient(28);
    const breakdown = getPatientAgeBreakdown(patient);
    expect(breakdown.years).toBe(0);
    expect(breakdown.months).toBe(0);
    expect(breakdown.days).toBe(28);
  });

  test("should calculate age breakdown for 60 days old", () => {
    const patient = createPatient(60);
    const breakdown = getPatientAgeBreakdown(patient);
    expect(breakdown.years).toBe(0);
    expect(breakdown.months).toBe(1);
    expect(breakdown.days).toBeGreaterThanOrEqual(28);
  });

  test("should calculate age breakdown for 1 year old", () => {
    const patient = createPatient(365);
    const breakdown = getPatientAgeBreakdown(patient);
    expect(breakdown.years).toBe(1);
    expect(breakdown.months).toBe(0);
    expect(breakdown.days).toBeLessThanOrEqual(1);
  });

  test("should calculate age breakdown for adult (25 years 3 months 5 days)", () => {
    const patient = createPatientWithAge(25, 3, 5);
    const breakdown = getPatientAgeBreakdown(patient);
    expect(breakdown.years).toBe(25);
    expect(breakdown.months).toBe(3);
    expect(breakdown.days).toBeGreaterThanOrEqual(4);
    expect(breakdown.days).toBeLessThanOrEqual(6);
  });
});

test.describe("formatPatientAge - Clinical Age Format", () => {
  test.describe("AC1: 0-28 days old - display days only", () => {
    test("should display '0 days' for newborn", () => {
      const patient = createPatient(0);
      expect(formatPatientAge(patient)).toBe("0 days");
      expect(formatPatientAge(patient, true)).toBe("0 d");
    });

    test("should display '15 days' for 15-day-old", () => {
      const patient = createPatient(15);
      expect(formatPatientAge(patient)).toBe("15 days");
      expect(formatPatientAge(patient, true)).toBe("15 d");
    });

    test("should display '1 day' (singular) for 1-day-old", () => {
      const patient = createPatient(1);
      expect(formatPatientAge(patient)).toBe("1 day");
      expect(formatPatientAge(patient, true)).toBe("1 d");
    });

    test("should display '28 days' for 28-day-old", () => {
      const patient = createPatient(28);
      expect(formatPatientAge(patient)).toBe("28 days");
      expect(formatPatientAge(patient, true)).toBe("28 d");
    });
  });

  test.describe("AC1: 29 days to 1 year - display weeks + days", () => {
    test("should display '5 weeks' for 35-day-old", () => {
      const patient = createPatient(35);
      const result = formatPatientAge(patient);
      expect(result).toContain("5 weeks");
      expect(formatPatientAge(patient, true)).toContain("5 w");
    });

    test("should display '1 week' (singular) for 7-day-old", () => {
      const patient = createPatient(7);
      expect(formatPatientAge(patient)).toBe("1 week");
      expect(formatPatientAge(patient, true)).toBe("1 w");
    });

    test("should display weeks and days for 50-day-old", () => {
      const patient = createPatient(50);
      const result = formatPatientAge(patient);
      expect(result).toContain("weeks");
      expect(result).toContain("days");
      const abbreviated = formatPatientAge(patient, true);
      expect(abbreviated).toContain("w");
      expect(abbreviated).toContain("d");
    });

    test("should display weeks for 8 weeks (56 days) old", () => {
      const patient = createPatient(56);
      const result = formatPatientAge(patient);
      expect(result).toContain("8 weeks");
    });

    test("should display weeks + days for 100-day-old", () => {
      const patient = createPatient(100);
      const result = formatPatientAge(patient);
      expect(result).toContain("weeks");
      expect(result).toContain("days");
    });

    test("should display weeks + days for 364-day-old (just under 1 year)", () => {
      const patient = createPatient(364);
      const result = formatPatientAge(patient);
      expect(result).toContain("weeks");
      expect(result).toContain("days");
    });
  });

  test.describe("AC1: 1 year to 2 years - display months + days", () => {
    test("should display '12 months 0 days' for exactly 1 year old", () => {
      const patient = createPatientWithAge(1, 0, 0);
      const result = formatPatientAge(patient);
      expect(result).toBe("12 months");
      expect(formatPatientAge(patient, true)).toBe("12 mo");
    });

    test("should display '13 months X days' for 13-month-old", () => {
      const patient = createPatientWithAge(1, 1, 5);
      const result = formatPatientAge(patient);
      expect(result).toContain("13 months");
      expect(result).toContain("days");
      const abbreviated = formatPatientAge(patient, true);
      expect(abbreviated).toContain("13mo");
      expect(abbreviated).toContain("d");
    });

    test("should display '18 months X days' for 18-month-old", () => {
      const patient = createPatientWithAge(1, 6, 10);
      const result = formatPatientAge(patient);
      expect(result).toContain("18 months");
      expect(result).toContain("days");
    });

    test("should display '23 months X days' for 23-month-old", () => {
      const patient = createPatientWithAge(1, 11, 15);
      const result = formatPatientAge(patient);
      expect(result).toContain("23 months");
      expect(result).toContain("days");
    });
  });

  test.describe("AC1: 2 years to 18 years - display years + months", () => {
    test("should display '2 years' for exactly 2 years old", () => {
      const patient = createPatientWithAge(2, 0, 0);
      const result = formatPatientAge(patient);
      expect(result).toBe("2 years");
      expect(formatPatientAge(patient, true)).toBe("2 Y");
    });

    test("should display '5 years 3 months' for 5 years 3 months old", () => {
      const patient = createPatientWithAge(5, 3, 10);
      const result = formatPatientAge(patient);
      expect(result).toContain("5 years");
      expect(result).toContain("3 months");
      const abbreviated = formatPatientAge(patient, true);
      expect(abbreviated).toContain("5 Y");
      expect(abbreviated).toContain("3 mo");
    });

    test("should display '3 years 1 month' (singular) for 3 years 1 month old", () => {
      const patient = createPatientWithAge(3, 1, 10);
      const result = formatPatientAge(patient);
      expect(result).toBe("3 years 1 month");
      expect(formatPatientAge(patient, true)).toBe("3 Y 1 mo");
    });

    test("should display '10 years 6 months' for 10 years 6 months old", () => {
      const patient = createPatientWithAge(10, 6, 5);
      const result = formatPatientAge(patient);
      expect(result).toContain("10 years");
      expect(result).toContain("6 months");
    });

    test("should display '17 years 11 months' for 17 years 11 months old", () => {
      const patient = createPatientWithAge(17, 11, 20);
      const result = formatPatientAge(patient);
      expect(result).toContain("17 years");
      expect(result).toContain("11 months");
    });
  });

  test.describe("AC1: Above 18 years - display years only", () => {
    test("should display '18 years' for exactly 18 years old", () => {
      const patient = createPatientWithAge(18, 0, 0);
      expect(formatPatientAge(patient)).toBe("18 years");
      expect(formatPatientAge(patient, true)).toBe("18 Y");
    });

    test("should display '25 years' for 25 years 3 months old", () => {
      const patient = createPatientWithAge(25, 3, 10);
      expect(formatPatientAge(patient)).toBe("25 years");
      expect(formatPatientAge(patient, true)).toBe("25 Y");
    });

    test("should display '42 years' for 42 years old", () => {
      const patient = createPatientWithAge(42, 6, 15);
      expect(formatPatientAge(patient)).toBe("42 years");
      expect(formatPatientAge(patient, true)).toBe("42 Y");
    });

    test("should display '75 years' for 75 years old", () => {
      const patient = createPatientWithAge(75, 0, 0);
      expect(formatPatientAge(patient)).toBe("75 years");
      expect(formatPatientAge(patient, true)).toBe("75 Y");
    });
  });

  test.describe("AC2: Abbreviated format", () => {
    test("should use abbreviated suffixes when abbreviated=true", () => {
      const patients = [
        { patient: createPatient(15), expected: "d" },
        { patient: createPatient(50), expected: "w" },
        { patient: createPatientWithAge(1, 6, 0), expected: "mo" },
        { patient: createPatientWithAge(5, 3, 0), expected: "Y" },
        { patient: createPatientWithAge(25, 0, 0), expected: "Y" },
      ];

      patients.forEach(({ patient, expected }) => {
        const result = formatPatientAge(patient, true);
        expect(result).toContain(expected);
      });
    });
  });

  test.describe("AC4: Deceased patients", () => {
    test("should calculate age from date_of_birth to deceased_datetime", () => {
      const date_of_birth = dayjs().subtract(10, "years").toISOString();
      const deceased_datetime = dayjs().subtract(5, "years").toISOString();
      const patient = {
        date_of_birth,
        deceased_datetime,
        name: "Test Patient",
        gender: "Male" as const,
        phone_number: "1234567890",
        year_of_birth: parseInt(date_of_birth.split("-")[0]),
      };

      const result = formatPatientAge(patient);
      expect(result).toBe("5 years");
    });
  });

  test.describe("AC5: Year-of-birth-only patients", () => {
    test("should display 'Born on YYYY' for non-abbreviated", () => {
      const patient = {
        year_of_birth: 1990,
        name: "Test Patient",
        gender: "Male" as const,
        phone_number: "1234567890",
      };
      expect(formatPatientAge(patient)).toBe("Born on 1990");
    });

    test("should display 'Born YYYY' for abbreviated", () => {
      const patient = {
        year_of_birth: 1990,
        name: "Test Patient",
        gender: "Male" as const,
        phone_number: "1234567890",
      };
      expect(formatPatientAge(patient, true)).toBe("Born 1990");
    });
  });
});

test.describe("formatPatientAgeTooltip", () => {
  test.describe("AC3: Full age breakdown tooltip", () => {
    test("should show 'X years, Y months, Z days' for adults", () => {
      const patient = createPatientWithAge(25, 3, 5);
      const tooltip = formatPatientAgeTooltip(patient);
      expect(tooltip).toContain("25 years");
      expect(tooltip).toContain("3 months");
      expect(tooltip).toContain("days");
      expect(tooltip).toMatch(/,/g);
    });

    test("should show full breakdown for children", () => {
      const patient = createPatientWithAge(5, 6, 10);
      const tooltip = formatPatientAgeTooltip(patient);
      expect(tooltip).toContain("5 years");
      expect(tooltip).toContain("6 months");
      expect(tooltip).toContain("days");
    });

    test("should show full breakdown for toddlers", () => {
      const patient = createPatientWithAge(1, 6, 15);
      const tooltip = formatPatientAgeTooltip(patient);
      expect(tooltip).toContain("1 year");
      expect(tooltip).toContain("6 months");
      expect(tooltip).toContain("days");
    });

    test("should show full breakdown for infants", () => {
      const patient = createPatient(100);
      const tooltip = formatPatientAgeTooltip(patient);
      expect(tooltip).toContain("months");
      expect(tooltip).toContain("days");
    });

    test("should show days for newborns", () => {
      const patient = createPatient(15);
      const tooltip = formatPatientAgeTooltip(patient);
      expect(tooltip).toContain("15 days");
    });

    test("should show '0 days' for newborn born today", () => {
      const patient = createPatient(0);
      const tooltip = formatPatientAgeTooltip(patient);
      expect(tooltip).toBe("0 days");
    });

    test("should use abbreviated format when requested", () => {
      const patient = createPatientWithAge(25, 3, 5);
      const tooltip = formatPatientAgeTooltip(patient, true);
      expect(tooltip).toContain("Y");
      expect(tooltip).toContain("mo");
      expect(tooltip).toContain("d");
    });
  });

  test.describe("Year-of-birth-only patients tooltip", () => {
    test("should display 'Born on YYYY' for non-abbreviated", () => {
      const patient = {
        year_of_birth: 1990,
        name: "Test Patient",
        gender: "Male" as const,
        phone_number: "1234567890",
      };
      expect(formatPatientAgeTooltip(patient)).toBe("Born on 1990");
    });

    test("should display 'Born YYYY' for abbreviated", () => {
      const patient = {
        year_of_birth: 1990,
        name: "Test Patient",
        gender: "Male" as const,
        phone_number: "1234567890",
      };
      expect(formatPatientAgeTooltip(patient, true)).toBe("Born 1990");
    });
  });
});

test.describe("Edge Cases", () => {
  test("should handle patient born exactly 1 year ago", () => {
    const patient = createPatient(365);
    const result = formatPatientAge(patient);
    // Should show months + days (1-2 years range)
    expect(result).toContain("months");
  });

  test("should handle patient born exactly 2 years ago", () => {
    const patient = createPatient(730);
    const result = formatPatientAge(patient);
    // Should show years (2-18 years range, 0 months should just show years)
    expect(result).toContain("2 years");
  });

  test("should handle patient born exactly 18 years ago", () => {
    const patient = createPatientWithAge(18, 0, 0);
    const result = formatPatientAge(patient);
    // Should show years only (18+ range)
    expect(result).toBe("18 years");
  });
});
