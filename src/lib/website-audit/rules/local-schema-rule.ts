import {
  createFinding,
  type AuditRule,
} from "../engine/types";

function missingCoreFields(options: {
  hasName: boolean;
  hasTelephone: boolean;
  hasAddress: boolean;
  serviceAreaBusiness: boolean;
}): string[] {
  const missing: string[] = [];

  if (!options.hasName) {
    missing.push("name");
  }

  if (!options.hasTelephone) {
    missing.push("phone number");
  }

  if (!options.hasAddress && !options.serviceAreaBusiness) {
    missing.push("address");
  }

  return missing;
}

export const localSchemaRule: AuditRule = {
  id: "local-schema",
  category: "local",
  title: "LocalBusiness structured data",

  evaluate({ pageData }) {
    const local = pageData.local;

    if (!local) {
      return [];
    }

    const serviceAreaBusiness =
      local.serviceArea.hasServiceAreaLanguage ||
      local.serviceArea.hasSchemaAreaServed;

    if (!local.schema.hasLocalBusinessSchema) {
      if (!local.likelihood.likelyLocalBusiness) {
        return [];
      }

      return createFinding({
        id: "local-schema-missing",
        title: "LocalBusiness structured data was not detected",
        description:
          "The page appears to represent a locally operated business, but no LocalBusiness structured data was detected. Structured data can give search engines clearer machine-readable information about the business, such as its name, location, phone number, and hours. Schema does not guarantee local rankings.",
        status: "warning",
        category: "local",
        scoreImpact: 4,
        priority: "medium",
        businessImpact: "medium",
        difficulty: "medium",
        estimatedFixMinutes: 30,
        quickWin: false,
        recommendation:
          "Add LocalBusiness structured data that includes the business name, phone number, and either a physical address or the areas served.",
      });
    }

    const missing = missingCoreFields({
      hasName: local.schema.hasName,
      hasTelephone: local.schema.hasTelephone,
      hasAddress: local.schema.hasAddress,
      serviceAreaBusiness,
    });

    if (missing.length > 0) {
      return createFinding({
        id: "local-schema-incomplete",
        title: "LocalBusiness structured data is incomplete",
        description: `LocalBusiness schema is present, but it is missing ${missing.join(" and ")}. The site's LocalBusiness structured data does not include enough information to clearly describe how customers can identify and reach the business.`,
        status: "warning",
        category: "local",
        scoreImpact: 4,
        priority: "medium",
        businessImpact: "medium",
        difficulty: "easy",
        estimatedFixMinutes: 20,
        quickWin: true,
        recommendation:
          "Complete the LocalBusiness markup with name, telephone, and address when you have a public location, or areaServed when you operate as a service-area business.",
      });
    }

    return createFinding({
      id: "local-schema-complete",
      title: "LocalBusiness structured data includes core details",
      description: `LocalBusiness schema is present (${local.schema.detectedTypes.join(", ") || "LocalBusiness"}) with name, phone, and ${local.schema.hasAddress ? "address" : "service-area"} information. Extra fields such as hours or map coordinates can help, but they are not required for this check.`,
      status: "pass",
      category: "local",
      scoreImpact: 5,
    });
  },
};
