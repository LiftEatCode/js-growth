import {
  createFinding,
  type AuditRule,
} from "../engine/types";

export const localSignalsRule: AuditRule = {
  id: "local-signals",
  category: "local",
  title: "Local SEO Signals",

  evaluate({ pageData }) {
    const local = pageData.local;

    if (!local || !local.likelihood.likelyLocalBusiness) {
      return [];
    }

    const strongSignals =
      local.localIntent.geographicSignalCount >= 2 &&
      local.nap.hasPhoneSignal &&
      (local.nap.hasAddressSignal ||
        local.serviceArea.hasServiceAreaLanguage ||
        local.serviceArea.hasSchemaAreaServed);

    if (!strongSignals) {
      return [];
    }

    return createFinding({
      id: "strong-local-signals-present",
      title: "Strong local-business signals are present",
      description:
        "The page includes multiple observable local signals such as contact details, geography, and service-area or location information. This does not estimate local-pack rankings.",
      status: "pass",
      category: "local",
      scoreImpact: 4,
    });
  },
};
