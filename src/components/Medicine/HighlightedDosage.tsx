import { cn } from "@/lib/utils";

import { MedicationRequestDosageInstruction } from "@/types/emr/medicationRequest/medicationRequest";

import { isNonStandardDosage } from "./utils";

interface HighlightedDosageProps {
  instruction?: MedicationRequestDosageInstruction;
  children: React.ReactNode;
  className?: string;
}

/**
 * Component that conditionally highlights dosage values when they are non-standard (not equal to 1).
 * Uses bold text weight and amber color for accessibility (WCAG 2.1 AA compliant).
 */
export const HighlightedDosage = ({
  instruction,
  children,
  className,
}: HighlightedDosageProps) => {
  const shouldHighlight = isNonStandardDosage(instruction);

  return (
    <span
      className={cn(shouldHighlight && "font-bold text-amber-600", className)}
    >
      {children}
    </span>
  );
};
