import {
  createFinding,
  type AuditRule,
} from "../engine/types";

export const localHoursRule: AuditRule = {
  id: "local-hours",
  category: "local",
  title: "Business hours",

  evaluate({ pageData }) {
    const local = pageData.local;

    if (!local || !local.likelihood.likelyLocalBusiness) {
      return [];
    }

    if (local.hours.hasHoursSignal) {
      return [];
    }

    return createFinding({
      id: "local-hours-missing",
      title: "Business hours are not clearly presented",
      description:
        "The page looks like a local business, but hours of operation are not clearly shown. Some companies work by appointment or in the field, so missing hours is not a ranking failure. When hours matter to customers, publishing them reduces unnecessary calls and confusion.",
      status: "warning",
      category: "local",
      scoreImpact: 1,
      priority: "low",
      businessImpact: "low",
      difficulty: "easy",
      estimatedFixMinutes: 15,
      quickWin: true,
      recommendation:
        "Add business hours when customers reasonably expect them, or state that service is by appointment. Include hours in LocalBusiness schema when they are publicly advertised.",
    });
  },
};
