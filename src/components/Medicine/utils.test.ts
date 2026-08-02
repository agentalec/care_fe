import { describe, expect, it } from "vitest";

import {
  DosageQuantity,
  DoseRange,
  MedicationRequestDosageInstruction,
} from "@/types/emr/medicationRequest/medicationRequest";

import { isNonStandardDosage } from "./utils";

// Helper to create a mock dosage quantity
function createDosageQuantity(value: string): DosageQuantity {
  return {
    value,
    unit: {
      code: "{tbl}",
      display: "tablets",
      system: "http://unitsofmeasure.org",
    },
  };
}

// Helper to create a mock dose range
function createDoseRange(lowValue: string, highValue: string): DoseRange {
  return {
    low: createDosageQuantity(lowValue),
    high: createDosageQuantity(highValue),
  };
}

// Helper to create a mock dosage instruction
function createDosageInstruction(
  doseQuantity?: DosageQuantity,
  doseRange?: DoseRange,
): MedicationRequestDosageInstruction {
  return {
    as_needed_boolean: false,
    dose_and_rate:
      doseQuantity || doseRange
        ? {
            type: "ordered" as const,
            dose_quantity: doseQuantity,
            dose_range: doseRange,
          }
        : undefined,
  };
}

describe("isNonStandardDosage", () => {
  describe("standard dosage (value = 1)", () => {
    it("returns false for dose_quantity with value '1'", () => {
      const instruction = createDosageInstruction(createDosageQuantity("1"));
      expect(isNonStandardDosage(instruction)).toBe(false);
    });

    it("returns false for dose_quantity with value '1.0' (numeric equality)", () => {
      const instruction = createDosageInstruction(createDosageQuantity("1.0"));
      expect(isNonStandardDosage(instruction)).toBe(false);
    });

    it("returns false for dose_quantity with value '1.00' (numeric equality)", () => {
      const instruction = createDosageInstruction(createDosageQuantity("1.00"));
      expect(isNonStandardDosage(instruction)).toBe(false);
    });

    it("returns false for dose_range with both low and high = 1", () => {
      const instruction = createDosageInstruction(
        undefined,
        createDoseRange("1", "1"),
      );
      expect(isNonStandardDosage(instruction)).toBe(false);
    });
  });

  describe("non-standard dosage (value != 1)", () => {
    it("returns true for dose_quantity with value '2'", () => {
      const instruction = createDosageInstruction(createDosageQuantity("2"));
      expect(isNonStandardDosage(instruction)).toBe(true);
    });

    it("returns true for dose_quantity with value '0.5'", () => {
      const instruction = createDosageInstruction(createDosageQuantity("0.5"));
      expect(isNonStandardDosage(instruction)).toBe(true);
    });

    it("returns true for dose_quantity with value '1.5'", () => {
      const instruction = createDosageInstruction(createDosageQuantity("1.5"));
      expect(isNonStandardDosage(instruction)).toBe(true);
    });

    it("returns true for dose_quantity with value '3'", () => {
      const instruction = createDosageInstruction(createDosageQuantity("3"));
      expect(isNonStandardDosage(instruction)).toBe(true);
    });

    it("returns true for dose_range where low != 1", () => {
      const instruction = createDosageInstruction(
        undefined,
        createDoseRange("0.5", "1"),
      );
      expect(isNonStandardDosage(instruction)).toBe(true);
    });

    it("returns true for dose_range where high != 1", () => {
      const instruction = createDosageInstruction(
        undefined,
        createDoseRange("1", "2"),
      );
      expect(isNonStandardDosage(instruction)).toBe(true);
    });

    it("returns true for dose_range where both low and high != 1", () => {
      const instruction = createDosageInstruction(
        undefined,
        createDoseRange("0.5", "2"),
      );
      expect(isNonStandardDosage(instruction)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("returns false for undefined instruction", () => {
      expect(isNonStandardDosage(undefined)).toBe(false);
    });

    it("returns false for instruction without dose_and_rate", () => {
      const instruction: MedicationRequestDosageInstruction = {
        as_needed_boolean: false,
      };
      expect(isNonStandardDosage(instruction)).toBe(false);
    });

    it("returns false for instruction with empty dose_and_rate", () => {
      const instruction: MedicationRequestDosageInstruction = {
        as_needed_boolean: false,
        dose_and_rate: {
          type: "ordered",
        },
      };
      expect(isNonStandardDosage(instruction)).toBe(false);
    });
  });
});
