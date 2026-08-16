import {
  createFinding,
  type AuditRule,
} from "../engine/types";
import type { AuditConversionData } from "../types";

function hasMeaningfulConversionPath(
  conversion: AuditConversionData,
): boolean {
  return conversion.ctas.count > 0 || conversion.path.hasLeadForm;
}

function hasWeakContactSignal(
  conversion: AuditConversionData,
): boolean {
  return (
    conversion.phone.visiblePhonePresent ||
    conversion.email.visibleEmailPresent
  );
}

export const conversionPathRule: AuditRule = {
  id: "conversion-path",
  category: "cro",
  title: "Conversion path",

  evaluate({ pageData }) {
    const conversion = pageData.conversion;

    if (!conversion) {
      return [];
    }

    const hasPath = hasMeaningfulConversionPath(conversion);

    if (!hasPath) {
      if (hasWeakContactSignal(conversion)) {
        return [];
      }

      return createFinding({
        id: "no-conversion-path",
        title: "No clear conversion path was detected",
        description:
          "The page does not appear to give visitors an obvious way to call, contact, request a quote, schedule, or submit an inquiry. Even strong search visibility can produce weak business results when visitors cannot easily take the next step.",
        status: "fail",
        category: "cro",
        scoreImpact: 8,
        priority: "high",
        businessImpact: "high",
        difficulty: "medium",
        estimatedFixMinutes: 45,
        quickWin: false,
        recommendation:
          "Add one primary conversion action that matches how customers normally contact the business, such as Call Now, Request a Quote, Schedule Service, or a short contact form.",
      });
    }

    const locations = conversion.path.locations;
    const footerOnly =
      locations.length > 0 &&
      locations.every((location) => location === "footer");

    if (footerOnly) {
      return createFinding({
        id: "conversion-path-footer-only",
        title: "Conversion options appear limited to the footer",
        description:
          "A way to get in touch was detected, but it appears in the footer rather than in the header, navigation, or primary page content. That does not prove the action is visually hidden, but visitors who scan the top of the page may not find a clear next step as quickly.",
        status: "warning",
        category: "cro",
        scoreImpact: 3,
        priority: "medium",
        businessImpact: "medium",
        difficulty: "easy",
        estimatedFixMinutes: 25,
        quickWin: true,
        recommendation:
          "Repeat the primary contact action in a prominent site area such as the header or near the main service explanation, using wording that matches how customers actually reach out.",
      });
    }

    const pathLabels = conversion.path.pathTypes.join(", ");

    return createFinding({
      id: "conversion-path-present",
      title: "A clear conversion path is available",
      description: `Visitors have at least one obvious way to take the next step (${pathLabels || "contact action"}). This check looks for observable contact methods, not persuasion quality.`,
      status: "pass",
      category: "cro",
      scoreImpact: 6,
    });
  },
};
