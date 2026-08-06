import {
    createFinding,
    type AuditRule,
  } from "../engine/types";
  
  export const canonicalRule: AuditRule = {
    id: "canonical",
    category: "technical",
    title: "Canonical URL",
  
    evaluate({ pageData, finalUrl }) {
      const canonicalUrl =
        pageData.canonicalUrl?.trim() ?? "";
  
      if (!canonicalUrl) {
        return createFinding({
          id: "missing-canonical",
          title: "Canonical URL is missing",
          description:
            "The page does not declare a preferred canonical URL.",
          status: "warning",
          category: "technical",
          scoreImpact: 3,
          recommendation:
            "Add a self-referencing canonical URL to help search engines identify the preferred version of the page.",
        });
      }
  
      let resolvedCanonical: URL;
  
      try {
        resolvedCanonical = new URL(
          canonicalUrl,
          finalUrl,
        );
      } catch {
        return createFinding({
          id: "invalid-canonical",
          title: "Canonical URL is invalid",
          description:
            "The page includes a canonical value that could not be resolved as a valid URL.",
          status: "fail",
          category: "technical",
          scoreImpact: 3,
          recommendation:
            "Replace the canonical value with a valid absolute URL that identifies the preferred version of this page.",
        });
      }
  
      const auditedUrl = new URL(finalUrl);
  
      auditedUrl.hash = "";
      resolvedCanonical.hash = "";
  
      if (
        resolvedCanonical.toString() !==
        auditedUrl.toString()
      ) {
        return createFinding({
          id: "canonical-mismatch",
          title: "Canonical URL points elsewhere",
          description: `The canonical URL points to ${resolvedCanonical.toString()} instead of the audited page.`,
          status: "warning",
          category: "technical",
          scoreImpact: 3,
          recommendation:
            "Confirm that the canonical target is intentional. Homepage audits usually benefit from a self-referencing canonical URL.",
        });
      }
  
      return createFinding({
        id: "canonical-present",
        title: "Canonical URL is configured",
        description:
          "The page includes a valid self-referencing canonical URL.",
        status: "pass",
        category: "technical",
        scoreImpact: 3,
      });
    },
  };