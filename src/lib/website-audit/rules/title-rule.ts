import {
  createFinding,
  type AuditRule,
} from "../engine/types";
import {
  TITLE_MAX_LENGTH,
  TITLE_MIN_LENGTH,
  isAuditTitleData,
} from "../page-metadata";

export const titleRule: AuditRule = {
  id: "title",
  category: "seo",
  title: "Page title",

  evaluate({ pageData }) {
    const { title } = pageData;

    if (!isAuditTitleData(title)) {
      return [];
    }

    if (title.count === 0) {
      return createFinding({
        id: "missing-title",
        title: "Page title is missing",
        description:
          "Search engines and potential customers rely heavily on the page title to understand what the page offers. A missing title can weaken search visibility and make the page less compelling in search results.",
        status: "fail",
        category: "seo",
        scoreImpact: 5,
        priority: "high",
        businessImpact: "high",
        difficulty: "easy",
        estimatedFixMinutes: 15,
        quickWin: true,
        recommendation:
          "Add one unique, descriptive title that names the main service or topic and the business.",
      });
    }

    if (title.isEmpty) {
      return createFinding({
        id: "empty-title",
        title: "Page title is empty",
        description:
          "A title tag is present, but it does not contain any text. Search engines and potential customers rely heavily on the page title to understand what the page offers. An empty title can weaken search visibility and make the page less compelling in search results.",
        status: "fail",
        category: "seo",
        scoreImpact: 5,
        priority: "high",
        businessImpact: "high",
        difficulty: "easy",
        estimatedFixMinutes: 15,
        quickWin: true,
        recommendation:
          "Put a unique, descriptive title inside the title tag so search results can clearly identify this page.",
      });
    }

    if (title.count > 1) {
      return createFinding({
        id: "multiple-titles",
        title: "Multiple page titles were found",
        description:
          "The page includes more than one title tag, which creates ambiguity about which title search engines should use. That can lead to unpredictable search-result wording and a weaker first impression.",
        status: "warning",
        category: "seo",
        scoreImpact: 4,
        priority: "high",
        businessImpact: "medium",
        difficulty: "easy",
        estimatedFixMinutes: 15,
        quickWin: true,
        recommendation:
          "Keep a single title tag with one clear description of the page. Remove extra title tags from templates, plugins, or duplicated head markup.",
      });
    }

    if (title.length < TITLE_MIN_LENGTH) {
      return createFinding({
        id: "title-short",
        title: "Page title is unusually short",
        description: `The title is unusually short and may not clearly communicate the page's topic or service. Current title length: ${title.length} characters.`,
        status: "warning",
        category: "seo",
        scoreImpact: 2,
        priority: "low",
        businessImpact: "low",
        difficulty: "easy",
        estimatedFixMinutes: 10,
        quickWin: true,
        recommendation:
          "Expand the title so it names the primary service or topic, while remaining concise enough for search results.",
      });
    }

    if (title.length > TITLE_MAX_LENGTH) {
      return createFinding({
        id: "title-long",
        title: "Page title is longer than typical search results",
        description: `The page title is longer than the range typically displayed cleanly in search results. Search engines may shorten or rewrite it depending on the device and query, which can reduce control over how the business appears to potential customers. Current title length: ${title.length} characters.`,
        status: "warning",
        category: "seo",
        scoreImpact: 2,
        priority: "low",
        businessImpact: "low",
        difficulty: "easy",
        estimatedFixMinutes: 10,
        quickWin: true,
        recommendation:
          "Tighten the title to lead with the most important service or location. There is no strict character cap, but shorter titles are usually displayed more completely.",
      });
    }

    return createFinding({
      id: "title-present",
      title: "Page title has a reasonable structure",
      description: `The page has a single title with a reasonable technical length for search results. Current title length: ${title.length} characters. This does not guarantee the wording is fully optimized.`,
      status: "pass",
      category: "seo",
      scoreImpact: 5,
    });
  },
};
