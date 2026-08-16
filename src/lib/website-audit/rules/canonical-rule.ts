import {
  createFinding,
  type AuditRule,
} from "../engine/types";
import { isAuditCanonicalData } from "../page-metadata";

export const canonicalRule: AuditRule = {
  id: "canonical",
  category: "technical",
  title: "Canonical URL",

  evaluate({ pageData }) {
    const { canonical } = pageData;

    if (!isAuditCanonicalData(canonical)) {
      return [];
    }

    if (canonical.count === 0) {
      return createFinding({
        id: "missing-canonical",
        title: "Canonical URL is missing",
        description:
          "A canonical tag helps search engines understand which URL should be treated as the preferred version when similar or duplicate URLs exist. Not every page absolutely requires one, but adding a clear self-referencing canonical usually reduces confusion.",
        status: "warning",
        category: "technical",
        scoreImpact: 3,
        priority: "low",
        businessImpact: "low",
        difficulty: "easy",
        estimatedFixMinutes: 15,
        quickWin: true,
        recommendation:
          "Add one self-referencing canonical tag for this page unless there is a specific reason to consolidate it to another URL.",
      });
    }

    if (
      canonical.rawValues.every((value) => value.length === 0)
    ) {
      return createFinding({
        id: "empty-canonical",
        title: "Canonical URL is empty",
        description:
          "A canonical tag is present, but it does not point to a URL. That leaves search engines without a clear preferred address for this page.",
        status: "warning",
        category: "technical",
        scoreImpact: 3,
        priority: "medium",
        businessImpact: "medium",
        difficulty: "easy",
        estimatedFixMinutes: 15,
        quickWin: true,
        recommendation:
          "Set the canonical href to the preferred public URL for this page, usually the page itself.",
      });
    }

    if (canonical.count > 1) {
      return createFinding({
        id: "multiple-canonicals",
        title: "Multiple canonical tags were found",
        description: `The page includes ${canonical.count} canonical declarations, which creates conflicting signals about the preferred URL. Search engines may ignore the tags or choose unpredictably, which can split or misassign search visibility.`,
        status: "warning",
        category: "technical",
        scoreImpact: 5,
        priority: "high",
        businessImpact: "high",
        difficulty: "easy",
        estimatedFixMinutes: 20,
        quickWin: true,
        recommendation:
          "Keep a single canonical tag. Remove extras from templates, CMS settings, or SEO plugins.",
      });
    }

    if (!canonical.valid) {
      return createFinding({
        id: "invalid-canonical",
        title: "Canonical URL is invalid",
        description: `The canonical value "${canonical.value ?? ""}" is not a usable web address. Search engines need an HTTP or HTTPS URL they can treat as the preferred version of this page.`,
        status: "warning",
        category: "technical",
        scoreImpact: 5,
        priority: "high",
        businessImpact: "medium",
        difficulty: "easy",
        estimatedFixMinutes: 15,
        quickWin: true,
        recommendation:
          "Replace the canonical href with a valid HTTP or HTTPS URL. Avoid javascript:, mailto:, and incomplete values.",
      });
    }

    if (!canonical.protocolMatches && canonical.sameOrigin) {
      return createFinding({
        id: "canonical-protocol-mismatch",
        title: "Canonical protocol does not match this page",
        description: `This page is served over one protocol while the canonical points to ${canonical.resolvedUrl}. Canonical protocol inconsistencies can create conflicting URL signals and split indexing between HTTP and HTTPS.`,
        status: "warning",
        category: "technical",
        scoreImpact: 3,
        priority: "medium",
        businessImpact: "medium",
        difficulty: "easy",
        estimatedFixMinutes: 15,
        quickWin: true,
        recommendation:
          "Make the canonical URL use the same protocol as the live page, usually HTTPS throughout.",
      });
    }

    if (!canonical.sameOrigin) {
      return createFinding({
        id: "canonical-cross-domain",
        title: "Canonical URL points to another domain",
        description: `This page tells search engines that a URL on another domain is the preferred version (${canonical.resolvedUrl}). If intentional, this can be valid. If accidental, search visibility for this page may be consolidated toward the other domain.`,
        status: "warning",
        category: "technical",
        scoreImpact: 4,
        priority: "high",
        businessImpact: "high",
        difficulty: "medium",
        estimatedFixMinutes: 20,
        quickWin: false,
        recommendation:
          "Confirm that pointing to the other domain is intentional. If this page should rank on this site, change the canonical to a self-referencing URL on the same domain.",
      });
    }

    if (!canonical.selfReferencing) {
      return createFinding({
        id: "canonical-points-elsewhere",
        title: "Canonical URL points to another page on this site",
        description: `This page points search engines to another URL on the same site as the preferred version (${canonical.resolvedUrl}). Confirm that this is intentional. If it is, search engines may treat that other URL as the main page instead of this one.`,
        status: "warning",
        category: "technical",
        scoreImpact: 3,
        priority: "medium",
        businessImpact: "medium",
        difficulty: "easy",
        estimatedFixMinutes: 15,
        quickWin: true,
        recommendation:
          "If this URL should appear in search results, use a self-referencing canonical. If it is a duplicate, keep the canonical pointed at the preferred page.",
      });
    }

    return createFinding({
      id: "canonical-present",
      title: "Canonical URL is self-referencing",
      description: `The page clearly identifies itself as the preferred URL (${canonical.resolvedUrl}). That is a healthy technical signal for search engines.`,
      status: "pass",
      category: "technical",
      scoreImpact: 3,
    });
  },
};
