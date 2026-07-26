import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

import { MedicationRequestDosageInstruction } from "@/types/emr/medicationRequest/medicationRequest";

import { shouldHighlightDosage } from "./utils";

interface HighlightedDosageProps {
  instruction?: MedicationRequestDosageInstruction;
  children: React.ReactNode;
  /** Additional className for the wrapper */
  className?: string;
  /** If true, uses print-safe styling (no color dependency) */
  printSafe?: boolean;
  /** If true, includes an icon for additional visual distinction */
  showIcon?: boolean;
}

/**
 * Wraps dosage text with visual highlighting when the dose quantity is not 1.
 * Ensures nurses don't overlook non-standard dosages.
 *
 * Meets WCAG 2.1 AA by using multiple visual cues:
 * - Bold text (font-semibold)
 * - Visible border
 * - Background color
 * - Optional icon
 *
 * @example
 * <HighlightedDosage instruction={dosageInstruction}>
 *   {formatDosage(dosageInstruction)}
 * </HighlightedDosage>
 */
export function HighlightedDosage({
  instruction,
  children,
  className,
  printSafe = false,
  showIcon = false,
}: HighlightedDosageProps) {
  const shouldHighlight = shouldHighlightDosage(instruction);

  if (!shouldHighlight) {
    return <>{children}</>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded",
        "font-semibold border-2",
        printSafe
          ? // Print-safe styling: no color dependency
            "border-gray-800 print:border-black print:font-bold"
          : // Normal styling with color
            "border-yellow-600 bg-yellow-50 text-yellow-900",
        "print:border-2 print:border-black print:font-bold print:bg-transparent",
        className,
      )}
      aria-label="Non-standard dosage - requires attention"
    >
      {showIcon && (
        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
