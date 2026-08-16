import {
  createFinding,
  type AuditRule,
} from "../engine/types";
import {
  META_DESCRIPTION_MAX_LENGTH,
  META_DESCRIPTION_MIN_LENGTH,
  isAuditMetaDescriptionData,
} from "../page-metadata";

export const metaDescriptionRule: AuditRule = {
  id: "meta-description",
  category: "seo",
  title: "Meta description",

  evaluate({ pageData }) {
    const { metaDescription } = pageData;

    if (!isAuditMetaDescriptionData(metaDescription)) {
      return [];
    }

    if (metaDescription.count === 0) {
      return createFinding({
        id: "missing-meta-description",
        title: "Meta description is missing",
        description:
          "A missing meta description gives search engines less guidance when generating the search-result snippet and may reduce control over how the business is presented to potential visitors. It does not by itself cause a ranking penalty.",
        status: "warning",
        category: "seo",
        scoreImpact: 4,
        priority: "medium",
        businessImpact: "medium",
        difficulty: "easy",
        estimatedFixMinutes: 15,
        quickWin: true,
        recommendation:
          "Add one unique meta description that summarizes the page and gives searchers a reason to click.",
      });
    }

    if (metaDescription.isEmpty) {
      return createFinding({
        id: "empty-meta-description",
        title: "Meta description is empty",
        description:
          "A description tag is present, but it does not contain useful text. That gives search engines less guidance when generating the search-result snippet and may reduce control over how the business is presented to potential visitors.",
        status: "warning",
        category: "seo",
        scoreImpact: 4,
        priority: "medium",
        businessImpact: "medium",
        difficulty: "easy",
        estimatedFixMinutes: 15,
        quickWin: true,
        recommendation:
          "Write a unique meta description that summarizes the page and encourages qualified searchers to click.",
      });
    }

    if (metaDescription.count > 1) {
      return createFinding({
        id: "multiple-meta-descriptions",
        title: "Multiple meta descriptions were found",
        description:
          "The page includes more than one meta description, which creates ambiguity about which snippet search engines should use. That can lead to inconsistent search-result wording.",
        status: "warning",
        category: "seo",
        scoreImpact: 3,
        priority: "medium",
        businessImpact: "medium",
        difficulty: "easy",
        estimatedFixMinutes: 15,
        quickWin: true,
        recommendation:
          "Keep a single meta description on the page. Remove extras from templates, SEO plugins, or duplicated head markup.",
      });
    }

    if (metaDescription.length < META_DESCRIPTION_MIN_LENGTH) {
      return createFinding({
        id: "meta-description-short",
        title: "Meta description is unusually short",
        description: `The description is unusually short and may not communicate enough value or context to searchers. Current description length: ${metaDescription.length} characters.`,
        status: "warning",
        category: "seo",
        scoreImpact: 2,
        priority: "low",
        businessImpact: "low",
        difficulty: "easy",
        estimatedFixMinutes: 10,
        quickWin: true,
        recommendation:
          "Expand the description so it briefly explains the service, location, or outcome a searcher would care about.",
      });
    }

    if (metaDescription.length > META_DESCRIPTION_MAX_LENGTH) {
      return createFinding({
        id: "meta-description-long",
        title: "Meta description may be truncated in search results",
        description: `The description is longer than the range search engines typically display in full. They may truncate or rewrite the snippet depending on the device and query. Current description length: ${metaDescription.length} characters. There is no strict maximum.`,
        status: "warning",
        category: "seo",
        scoreImpact: 2,
        priority: "low",
        businessImpact: "low",
        difficulty: "easy",
        estimatedFixMinutes: 10,
        quickWin: true,
        recommendation:
          "Lead with the most useful benefit or service in the first sentence so the snippet still makes sense if it is shortened.",
      });
    }

    return createFinding({
      id: "meta-description-present",
      title: "Meta description has a reasonable structure",
      description: `The page has a single meta description with a reasonable technical length. Current description length: ${metaDescription.length} characters. This does not guarantee the wording is fully optimized.`,
      status: "pass",
      category: "seo",
      scoreImpact: 4,
    });
  },
};
