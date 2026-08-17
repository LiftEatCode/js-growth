import {
  createFinding,
  type AuditRule,
} from "../engine/types";
import {
  CONTENT_THIN_STRONG_THRESHOLD,
  CONTENT_THIN_WARNING_THRESHOLD,
  THIN_CONTENT_EXTRACTION_GAP_WORDS,
  THIN_CONTENT_UNRELIABLE_MIN_HTML_BYTES,
  THIN_CONTENT_UNRELIABLE_MIN_INLINE_SCRIPT_BYTES,
  THIN_CONTENT_UNRELIABLE_MIN_SCRIPT_COUNT,
} from "../page-content";
import type { AuditPageData } from "../types";

/**
 * Static HTML extraction can undercount visible copy on JS-heavy / website-builder
 * documents. When those signals are present, a low `mainContentWordCount` is not
 * reliable evidence of a genuinely thin page, so the high-severity
 * `thin-content-strong` claim is withheld.
 *
 * Signals used (all already collected during analysis):
 * - large HTML payload vs. few extracted words
 * - high script count or large inline script bytes
 * - large gap between body-visible words and extracted main-content words
 *
 * Genuinely small static pages do not match these signals, so thin-content
 * detection still fires for them.
 */
export function isMainContentExtractionUnreliable(
  pageData: Pick<AuditPageData, "content" | "performance">,
): boolean {
  const content = pageData.content;

  if (!content) {
    return false;
  }

  const extracted = content.mainContentWordCount;
  const visible = content.totalVisibleWordCount;
  const htmlBytes = pageData.performance?.htmlBytes ?? 0;
  const scriptCount = pageData.performance?.scripts.total ?? 0;
  const inlineScriptBytes = pageData.performance?.scripts.inlineBytes ?? 0;

  if (extracted >= CONTENT_THIN_STRONG_THRESHOLD) {
    return false;
  }

  if (visible - extracted >= THIN_CONTENT_EXTRACTION_GAP_WORDS) {
    return true;
  }

  if (htmlBytes >= THIN_CONTENT_UNRELIABLE_MIN_HTML_BYTES) {
    return true;
  }

  if (scriptCount >= THIN_CONTENT_UNRELIABLE_MIN_SCRIPT_COUNT) {
    return true;
  }

  if (inlineScriptBytes >= THIN_CONTENT_UNRELIABLE_MIN_INLINE_SCRIPT_BYTES) {
    return true;
  }

  return false;
}

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
    const extractionUnreliable = isMainContentExtractionUnreliable(pageData);

    if (wordCount < CONTENT_THIN_STRONG_THRESHOLD) {
      if (extractionUnreliable) {
        return [];
      }

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
      if (extractionUnreliable) {
        return [];
      }

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
