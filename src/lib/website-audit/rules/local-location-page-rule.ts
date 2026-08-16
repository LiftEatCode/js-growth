import {
  createFinding,
  type AuditRule,
} from "../engine/types";
import { CONTENT_THIN_WARNING_THRESHOLD } from "../page-content";

export const localLocationPageRule: AuditRule = {
  id: "local-location-page",
  category: "local",
  title: "Location page completeness",

  evaluate({ pageData }) {
    const local = pageData.local;

    if (!local?.locationPage.likelyLocationPage) {
      return [];
    }

    const wordCount = pageData.content?.mainContentWordCount ?? 0;
    const hasLocalDetail =
      local.localIntent.geographicSignalCount > 0 ||
      local.nap.hasAddressSignal ||
      local.serviceArea.hasServiceAreaLanguage;
    const hasConversion =
      pageData.conversion?.ctas.count ||
      pageData.conversion?.path.hasLeadForm ||
      pageData.conversion?.path.hasClickToCall;

    if (wordCount >= CONTENT_THIN_WARNING_THRESHOLD && hasLocalDetail && hasConversion) {
      return [];
    }

    if (wordCount >= CONTENT_THIN_WARNING_THRESHOLD && hasLocalDetail) {
      return [];
    }

    return createFinding({
      id: "location-page-thin-detail",
      title: "Location page has very little local detail",
      description: `This URL looks like a dedicated location or service-area page, but it provides limited local detail${wordCount < CONTENT_THIN_WARNING_THRESHOLD ? ` (${wordCount} visible words)` : ""}. Thin location pages make it harder for visitors to confirm that the business actually serves that community.`,
      status: "warning",
      category: "local",
      scoreImpact: 4,
      priority: "medium",
      businessImpact: "medium",
      difficulty: "medium",
      estimatedFixMinutes: 40,
      quickWin: false,
      recommendation:
        "Add useful, specific information about that location or service area, such as services offered there, travel/coverage notes, and a clear way to contact the business. Do not copy the same thin paragraph across every city page.",
    });
  },
};
