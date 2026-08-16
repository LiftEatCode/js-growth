import {
  createFinding,
  type AuditRule,
} from "../../engine/types";
import type { AuditFinding } from "../../types";
import { formatPathExamples } from "./evidence";

export const siteConversionCoverageRule: AuditRule = {
  id: "site-conversion-coverage",
  category: "cro",
  title: "Site-wide conversion coverage",

  evaluate({ siteData }) {
    if (!siteData) {
      return [];
    }

    const findings: AuditFinding[] = [];
    const conversion = siteData.conversion;
    const serviceLikeMissing = siteData.pages.filter(
      (page) =>
        page.fetchStatus === "success" &&
        (page.pageType === "service" ||
          page.pageType === "location" ||
          page.pageType === "service-area") &&
        !page.hasConversionPath,
    );
    const home = siteData.pages.find(
      (page) => page.fetchStatus === "success" && page.pageType === "home",
    );

    if (serviceLikeMissing.length >= 2) {
      findings.push(
        createFinding({
          id: "site-conversion-coverage",
          title: "Several important pages lack a clear next step",
          description: `Within this representative crawl, ${serviceLikeMissing.length} service or location pages have no clear call-to-action, form, or quoted conversion path${home?.hasConversionPath ? ", even though the homepage does" : ""}. Blog and article pages are weighted less here.\n${formatPathExamples(serviceLikeMissing.map((page) => page.path))}`,
          recommendation:
            "Repeat the primary contact action on each service and location page, using the same wording customers would actually use to request work.",
          status: "warning",
          category: "cro",
          scoreImpact: 8,
          priority: "high",
          businessImpact: "high",
          difficulty: "easy",
          estimatedFixMinutes: 45,
          quickWin: true,
        }),
      );
    } else if (
      conversion.keyPageCount >= 2 &&
      conversion.keyPagesWithConversionPath === conversion.keyPageCount
    ) {
      findings.push(
        createFinding({
          id: "site-conversion-coverage-strong",
          title: "Conversion paths appear on key scanned pages",
          description:
            "Within this representative crawl, the important pages (home, service, location, and contact) include an observable next step such as a call-to-action or lead form.",
          status: "pass",
          category: "cro",
          scoreImpact: 5,
        }),
      );
    }

    if (
      conversion.clickToCallOnHome &&
      conversion.keyPagesMissingTel.length >= 2
    ) {
      findings.push(
        createFinding({
          id: "site-click-to-call-consistency",
          title: "Click-to-call is inconsistent across key pages",
          description: `The homepage includes a phone or click-to-call signal, but ${conversion.keyPagesMissingTel.length} scanned service or location pages do not show a clickable phone path.\n${formatPathExamples(conversion.keyPagesMissingTel)}`,
          recommendation:
            "Repeat a clickable phone number or Call action on service and location templates, not only on the homepage.",
          status: "warning",
          category: "cro",
          scoreImpact: 4,
          priority: "medium",
          businessImpact: "medium",
          difficulty: "easy",
          estimatedFixMinutes: 25,
          quickWin: true,
        }),
      );
    }

    const keyPages = siteData.pages.filter(
      (page) =>
        page.fetchStatus === "success" &&
        (page.pageType === "home" ||
          page.pageType === "service" ||
          page.pageType === "location" ||
          page.pageType === "service-area"),
    );
    const withTrust = keyPages.filter((page) => page.trustCategoryCount > 0);

    if (keyPages.length >= 3 && withTrust.length === 0) {
      findings.push(
        createFinding({
          id: "site-trust-coverage",
          title: "Trust evidence is scarce across key pages",
          description:
            "Within this representative crawl, almost none of the home, service, or location pages include visible trust signals such as reviews, experience, guarantees, or team proof. This does not require repeating testimonials on every URL.",
          recommendation:
            "Add authentic trust evidence on the homepage and at least the highest-traffic service templates. Do not invent reviews or awards.",
          status: "warning",
          category: "cro",
          scoreImpact: 3,
          priority: "medium",
          businessImpact: "medium",
          difficulty: "medium",
          estimatedFixMinutes: 40,
          quickWin: false,
        }),
      );
    }

    if (
      !siteData.local.contactPageFound &&
      conversion.keyPagesWithConversionPath === 0 &&
      conversion.keyPageCount >= 2
    ) {
      findings.push(
        createFinding({
          id: "site-contact-path-coverage",
          title: "No dedicated contact page and weak conversion paths",
          description:
            "This crawl did not find a dedicated contact page, and the important pages that were scanned also lack a clear call, form, or quote path. A business can convert without a /contact URL when phone and forms are strong elsewhere — that is not the pattern here.",
          recommendation:
            "Add a clear contact or request-a-quote path on the homepage and service pages. A dedicated contact page is useful but not required if those paths are strong.",
          status: "warning",
          category: "cro",
          scoreImpact: 5,
          priority: "high",
          businessImpact: "high",
          difficulty: "easy",
          estimatedFixMinutes: 40,
          quickWin: true,
        }),
      );
    }

    return findings;
  },
};
