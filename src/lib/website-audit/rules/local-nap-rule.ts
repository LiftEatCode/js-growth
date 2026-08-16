import {
  createFinding,
  type AuditRule,
} from "../engine/types";

export const localNapRule: AuditRule = {
  id: "local-nap",
  category: "local",
  title: "Local contact and service area",

  evaluate({ pageData }) {
    const local = pageData.local;

    if (!local || !local.likelihood.likelyLocalBusiness) {
      return [];
    }

    const findings = [];
    const serviceAreaBusiness =
      local.serviceArea.hasServiceAreaLanguage ||
      local.serviceArea.hasSchemaAreaServed;
    const hasAddress = local.nap.hasAddressSignal;
    const hasPhone = local.nap.hasPhoneSignal;

    if (!hasAddress && !serviceAreaBusiness) {
      findings.push(
        createFinding({
          id: "local-service-area-unclear",
          title: "Local service area is unclear",
          description:
            "The page contains local-business signals, but it does not clearly identify either a physical business location or the areas the company serves. Visitors and search engines may have less context about where the service is available.",
          status: "warning",
          category: "local",
          scoreImpact: 4,
          priority: "medium",
          businessImpact: "medium",
          difficulty: "easy",
          estimatedFixMinutes: 25,
          quickWin: false,
          recommendation:
            "Name the primary cities or neighborhoods you serve, or display the public business address if customers visit a shop or office.",
        }),
      );
    }

    if (
      local.schema.hasTelephone &&
      !pageData.conversion?.phone.visiblePhonePresent &&
      (pageData.conversion?.phone.telLinkCount ?? 0) === 0 &&
      !pageData.conversion?.path.hasLeadForm &&
      !pageData.conversion?.path.hasContactCta
    ) {
      findings.push(
        createFinding({
          id: "local-contact-schema-only",
          title: "Local contact details are only available in structured data",
          description:
            "Search engines may receive contact details through schema, but visitors still need an easy visible way to reach the business.",
          status: "warning",
          category: "local",
          scoreImpact: 2,
          priority: "low",
          businessImpact: "medium",
          difficulty: "easy",
          estimatedFixMinutes: 15,
          quickWin: true,
          recommendation:
            "Show the same phone number or a contact action on the page that customers can use, not only in structured data.",
        }),
      );
    }

    if (
      hasAddress &&
      !serviceAreaBusiness &&
      !local.directions.hasDirectionsLink &&
      !local.directions.hasMapLink &&
      !local.directions.hasEmbeddedMap
    ) {
      findings.push(
        createFinding({
          id: "local-directions-opportunity",
          title: "Directions to a physical location are not obvious",
          description:
            "The page appears to have a physical address, but it does not include an obvious directions or map link. If customers visit a physical location, providing clear directions can make it easier for local visitors to reach the business.",
          status: "warning",
          category: "local",
          scoreImpact: 1,
          priority: "low",
          businessImpact: "low",
          difficulty: "easy",
          estimatedFixMinutes: 15,
          quickWin: true,
          recommendation:
            "Add a Get Directions link or map for the public location. Skip this if customers never visit in person.",
        }),
      );
    }

    if (
      findings.length === 0 &&
      hasPhone &&
      (hasAddress || serviceAreaBusiness)
    ) {
      findings.push(
        createFinding({
          id: "local-nap-present",
          title: "Local contact information is reasonably complete",
          description: hasAddress
            ? "The page includes phone and location information that helps customers understand how to reach the business."
            : "The page identifies how to reach the business and the area it serves, which is appropriate for a service-area company that does not publish a street address.",
          status: "pass",
          category: "local",
          scoreImpact: 4,
        }),
      );
    }

    return findings;
  },
};
