import {
  createFinding,
  type AuditRule,
} from "../engine/types";
import {
  CONTENT_THIN_STRONG_THRESHOLD,
  CONTENT_THIN_WARNING_THRESHOLD,
} from "../page-content";

export const contentDepthRule: AuditRule = {
  id: "content-depth",
  category: "content",
  title: "Visible content depth",

  evaluate({ pageData }) {
    const content = pageData.content;

    if (!content) {
      return [];
    }

    const wordCount = content.mainContentWordCount;
    const source = content.usedMainElement
      ? "main content"
      : "visible page copy";

    if (wordCount < CONTENT_THIN_STRONG_THRESHOLD) {
      return createFinding({
        id: "thin-content-strong",
        title: "Page has very little visible content",
        description: `The page contains relatively little visible copy explaining its topic, service, or value. Word count alone does not determine search rankings, but very thin pages can make it harder for visitors and search engines to understand what the business offers. Main content: ${wordCount} words (measured from ${source}).`,
        status: "warning",
        category: "content",
        scoreImpact: 5,
        priority: "high",
        businessImpact: "high",
        difficulty: "medium",
        estimatedFixMinutes: 45,
        quickWin: false,
        recommendation:
          "Add useful information that answers the questions a potential customer would have about the service, process, benefits, location, pricing factors, or next steps. Avoid adding filler solely to increase word count.",
      });
    }

    if (wordCount < CONTENT_THIN_WARNING_THRESHOLD) {
      return createFinding({
        id: "thin-content",
        title: "Page content looks thin",
        description: `The ${source} is relatively short (${wordCount} words). That is a heuristic, not a ranking penalty by itself, but visitors may still need more detail before they feel ready to contact the business.`,
        status: "warning",
        category: "content",
        scoreImpact: 3,
        priority: "medium",
        businessImpact: "medium",
        difficulty: "medium",
        estimatedFixMinutes: 30,
        quickWin: false,
        recommendation:
          "Add concrete details a customer would ask about. Do not pad the page with repeated phrases just to raise the word count.",
      });
    }

    return [];
  },
};
