import {
  createFinding,
  type AuditRule,
} from "../engine/types";

export const localGeographicRelevanceRule: AuditRule = {
  id: "local-geographic-relevance",
  category: "local",
  title: "Local geographic relevance",

  evaluate({ pageData }) {
    const local = pageData.local;

    if (!local || !local.likelihood.likelyLocalBusiness) {
      return [];
    }

    const serviceAreaUnclear =
      !local.nap.hasAddressSignal &&
      !local.serviceArea.hasServiceAreaLanguage &&
      !local.serviceArea.hasSchemaAreaServed;

    if (serviceAreaUnclear) {
      return [];
    }

    if (local.localIntent.geographicSignalCount > 0) {
      return [];
    }

    return createFinding({
      id: "local-geographic-relevance-weak",
      title: "Local geographic relevance is weak",
      description:
        "The page appears to promote a local service, but it provides few clear signals about the city, region, or service area the business serves. That can make it harder for both visitors and search engines to understand where the service is available.",
      status: "warning",
      category: "local",
      scoreImpact: 4,
      priority: "medium",
      businessImpact: "medium",
      difficulty: "easy",
      estimatedFixMinutes: 20,
      quickWin: false,
      recommendation:
        "Clearly mention the primary service area in natural places such as the page heading, service copy, contact information, and structured data. Avoid repeating city names unnaturally.",
    });
  },
};
