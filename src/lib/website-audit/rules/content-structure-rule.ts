import {
  createFinding,
  type AuditRule,
} from "../engine/types";
import { CONTENT_STRUCTURE_MIN_WORDS } from "../page-content";

export const contentStructureRule: AuditRule = {
  id: "content-structure",
  category: "content",
  title: "Content scannability",

  evaluate({ pageData }) {
    const content = pageData.content;

    if (!content) {
      return [];
    }

    if (content.mainContentWordCount < CONTENT_STRUCTURE_MIN_WORDS) {
      return [];
    }

    const supportingHeadings =
      (pageData.headings?.h2Count ?? pageData.h2Count) +
      (pageData.headings?.h3Count ?? pageData.h3Count);
    const substantialParagraphs =
      content.substantialParagraphCount;
    const poorlySectioned = supportingHeadings === 0;
    const poorlyParagraphed =
      substantialParagraphs <= 1 &&
      content.nonEmptyParagraphCount <= 2;

    if (!poorlySectioned && !poorlyParagraphed) {
      return [];
    }

    const reasons = [];

    if (poorlySectioned) {
      reasons.push("no H2 or H3 subheadings");
    }

    if (poorlyParagraphed) {
      reasons.push(
        `${substantialParagraphs} substantial paragraph${substantialParagraphs === 1 ? "" : "s"}`,
      );
    }

    return createFinding({
      id: "content-hard-to-scan",
      title: "Page content may be difficult to scan",
      description: `This page contains substantial copy (${content.mainContentWordCount} words) but ${reasons.join(" and ")}. Visitors often scan service pages before deciding whether to call, request a quote, or keep reading. Breaking substantial content into clear sections can make important information easier to find, and search engines receive fewer structural clues when a long page is one unbroken block.`,
      status: "warning",
      category: "content",
      scoreImpact: 3,
      priority: "medium",
      businessImpact: "medium",
      difficulty: "easy",
      estimatedFixMinutes: 30,
      quickWin: false,
      recommendation:
        "Break the copy into short sections with descriptive subheadings and readable paragraphs. Keep the information useful; do not add headings without adding structure that helps a customer scan.",
    });
  },
};
