import { isCategoryScoreApplicable } from "@/lib/website-audit/scoring";
import { getScoreBand } from "@/lib/website-audit/score-bands";
import type { AuditFinding, WebsiteAuditResult } from "@/lib/website-audit/types";
import { tryNormalizeProspectHostname } from "@/lib/prospecting/hostname";

import {
  PREFERRED_GAP_CATEGORIES,
  QUALIFICATION_JSON_VERSION,
  SKIP_REASON,
} from "./constants";
import { selectOutreachFindings } from "./findings";
import type {
  QualificationContext,
  QualificationFactor,
  QualificationLabel,
  StoredQualification,
} from "./types";

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function labelFor(score: number, skipped: boolean): QualificationLabel {
  if (skipped) {
    return "SKIP";
  }
  if (score >= 70) {
    return "STRONG";
  }
  if (score >= 55) {
    return "GOOD";
  }
  if (score >= 40) {
    return "FAIR";
  }
  return "WEAK";
}

function addFactor(
  factors: QualificationFactor[],
  id: string,
  label: string,
  delta: number,
  detail: string,
): number {
  if (delta === 0) {
    return 0;
  }

  factors.push({ id, label, delta, detail });
  return delta;
}

function statesMatch(left: string | null, right: string | null): boolean {
  if (!left || !right) {
    return true;
  }

  return left.trim().toUpperCase() === right.trim().toUpperCase();
}

function crawlIsTooWeak(audit: WebsiteAuditResult): boolean {
  const crawl = audit.siteData?.crawl;
  if (!crawl) {
    return false;
  }

  const successCount = audit.siteData?.pages.filter(
    (page) => page.fetchStatus === "success",
  ).length ?? 0;

  if (successCount === 0) {
    return true;
  }

  return crawl.failedCount > successCount;
}

export function qualifyProspectAudit(
  audit: WebsiteAuditResult | null,
  context: QualificationContext,
): StoredQualification {
  const auditedAt = context.auditedAt ?? new Date().toISOString();
  const factors: QualificationFactor[] = [];

  const skipped = (
    skipReason: string,
    overallScore = audit?.overallScore ?? 0,
  ): StoredQualification => ({
    version: QUALIFICATION_JSON_VERSION,
    score: 0,
    label: "SKIP",
    factors,
    primaryFindingId: null,
    primaryFindingTitle: null,
    secondaryFindingId: null,
    secondaryFindingTitle: null,
    skipReason,
    overallScore,
    scoreBandId: getScoreBand(overallScore).id,
    weakestRelevantCategory: null,
    auditedAt,
    reusedAudit: Boolean(context.reusedAudit),
  });

  if (!context.website || !tryNormalizeProspectHostname(context.website)) {
    return skipped(SKIP_REASON.WEBSITE_INVALID);
  }

  if (context.customerSuppressed) {
    return skipped(SKIP_REASON.CUSTOMER);
  }

  if (context.suppressed) {
    return skipped(SKIP_REASON.SUPPRESSED);
  }

  if (context.existingLead) {
    return skipped(SKIP_REASON.EXISTING_LEAD);
  }

  if (!statesMatch(context.state, context.campaignState)) {
    return skipped(SKIP_REASON.OUTSIDE_TARGETING);
  }

  if (!audit) {
    return skipped(SKIP_REASON.AUDIT_FAILED);
  }

  if (crawlIsTooWeak(audit)) {
    return skipped(SKIP_REASON.WEAK_EVIDENCE, audit.overallScore);
  }

  const selected = selectOutreachFindings(audit.findings);

  if (!selected.primary) {
    return skipped(SKIP_REASON.NO_CREDIBLE_FINDING, audit.overallScore);
  }

  let score = 18;
  addFactor(
    factors,
    "credible-primary",
    "Credible outreach finding",
    18,
    `${selected.primary.title} is suitable for a specific, evidence-based conversation.`,
  );

  const impactDelta =
    selected.primary.businessImpact === "high"
      ? 16
      : selected.primary.businessImpact === "medium"
        ? 10
        : 5;
  score += addFactor(
    factors,
    "finding-impact",
    "Finding business impact",
    impactDelta,
    `Primary finding impact is ${selected.primary.businessImpact}.`,
  );

  const priorityDelta =
    selected.primary.priority === "critical" || selected.primary.priority === "high"
      ? 12
      : selected.primary.priority === "medium"
        ? 7
        : 3;
  score += addFactor(
    factors,
    "finding-priority",
    "Finding priority",
    priorityDelta,
    `Primary finding priority is ${selected.primary.priority}.`,
  );

  if (selected.secondary) {
    score += addFactor(
      factors,
      "credible-secondary",
      "Secondary outreach finding",
      10,
      selected.secondary.title,
    );
  }

  const extraCount = Math.min(2, selected.extras.length);
  if (extraCount > 0) {
    score += addFactor(
      factors,
      "additional-findings",
      "Additional allowlisted findings",
      extraCount * 4,
      `${extraCount} extra concrete finding${extraCount === 1 ? "" : "s"} beyond the primary hook.`,
    );
  }

  const gapScores = audit.categoryScores
    .filter(
      (item) =>
        isCategoryScoreApplicable(item) &&
        PREFERRED_GAP_CATEGORIES.includes(
          item.category as (typeof PREFERRED_GAP_CATEGORIES)[number],
        ) &&
        item.maxScore > 0,
    )
    .map((item) => ({
      category: item.category,
      label: item.label,
      gap: 1 - item.score / item.maxScore,
    }))
    .filter((item) => item.gap >= 0.25)
    .sort((left, right) => right.gap - left.gap)
    .slice(0, 2);

  for (const gap of gapScores) {
    const delta = gap.gap >= 0.5 ? 8 : 4;
    score += addFactor(
      factors,
      `category-gap-${gap.category}`,
      `${gap.label} gap`,
      delta,
      `${gap.label} is a meaningful category gap. It is not used as the outreach hook.`,
    );
  }

  const performance = audit.categoryScores.find(
    (item) => item.category === "performance" && isCategoryScoreApplicable(item),
  );
  if (performance && performance.maxScore > 0) {
    const gap = 1 - performance.score / performance.maxScore;
    if (gap >= 0.5) {
      score += addFactor(
        factors,
        "performance-context",
        "Performance context",
        3,
        "Performance issues can support the case but do not drive ranking.",
      );
    }
  }

  const quickWinCount = Math.min(
    3,
    [selected.primary, selected.secondary, ...selected.extras].filter(
      (finding): finding is AuditFinding =>
        Boolean(finding?.quickWin),
    ).length,
  );
  if (quickWinCount > 0) {
    score += addFactor(
      factors,
      "quick-wins",
      "Concrete quick wins",
      quickWinCount * 3,
      `${quickWinCount} lower-effort improvement${quickWinCount === 1 ? "" : "s"} (capped).`,
    );
  }

  if (audit.overallScore >= 65 && audit.overallScore <= 92) {
    score += addFactor(
      factors,
      "healthy-fit",
      "Healthy-but-improvable site",
      8,
      "Overall score is in a range where outreach can still be useful. High scores are not rejected.",
    );
  } else if (audit.overallScore >= 50 && audit.overallScore <= 64) {
    score += addFactor(
      factors,
      "moderate-fit",
      "Moderate overall score",
      3,
      "Overall score is used only as context.",
    );
  } else if (audit.overallScore >= 93) {
    score += addFactor(
      factors,
      "very-healthy-fit",
      "Already-strong site",
      2,
      "A strong overall score does not block qualification when a credible finding exists.",
    );
  } else if (audit.overallScore <= 39) {
    score += addFactor(
      factors,
      "broken-site-penalty",
      "Very low overall score",
      -8,
      "Broken or extremely weak sites are not ranked highest automatically.",
    );
  }

  if (!audit.siteData) {
    score += addFactor(
      factors,
      "evidence-quality",
      "Limited site crawl evidence",
      -6,
      "Qualification relies on homepage evidence only.",
    );
  } else if (
    audit.siteData.crawl.truncated &&
    audit.siteData.crawl.crawledCount <= 2
  ) {
    score += addFactor(
      factors,
      "evidence-quality",
      "Thin crawl evidence",
      -4,
      "The representative crawl collected little additional evidence.",
    );
  }

  const weakest =
    gapScores[0]?.category ??
    audit.categoryScores
      .filter(
        (item) =>
          isCategoryScoreApplicable(item) &&
          PREFERRED_GAP_CATEGORIES.includes(
            item.category as (typeof PREFERRED_GAP_CATEGORIES)[number],
          ) &&
          item.maxScore > 0,
      )
      .sort((left, right) => left.score / left.maxScore - right.score / right.maxScore)[0]
      ?.category ??
    null;

  const finalScore = clamp(score);

  return {
    version: QUALIFICATION_JSON_VERSION,
    score: finalScore,
    label: labelFor(finalScore, false),
    factors,
    primaryFindingId: selected.primary.id,
    primaryFindingTitle: selected.primary.title,
    secondaryFindingId: selected.secondary?.id ?? null,
    secondaryFindingTitle: selected.secondary?.title ?? null,
    skipReason: null,
    overallScore: audit.overallScore,
    scoreBandId: getScoreBand(audit.overallScore).id,
    weakestRelevantCategory: weakest,
    auditedAt,
    reusedAudit: Boolean(context.reusedAudit),
  };
}
