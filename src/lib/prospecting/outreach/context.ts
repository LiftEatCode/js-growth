import { getScoreBand } from "@/lib/website-audit/score-bands";
import { isCategoryScoreApplicable } from "@/lib/website-audit/scoring";
import type { AuditFinding, WebsiteAuditResult } from "@/lib/website-audit/types";
import type { StoredQualification } from "@/lib/prospecting/qualification/types";

import {
  JS_SOLUTIONS_OUTREACH_CONTEXT,
  MAX_OUTREACH_EVIDENCE_CHARS,
} from "./constants";
import type { OutreachDraftContext, OutreachFindingContext } from "./types";

function clip(value: string, max: number): string {
  const trimmed = value.replace(/\s+/g, " ").trim();

  if (trimmed.length <= max) {
    return trimmed;
  }

  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function effortLabel(finding: AuditFinding): string {
  const minutes = finding.estimatedFixMinutes;
  return `${finding.difficulty} effort${minutes ? `, about ${minutes} minutes` : ""}`;
}

function toFindingContext(
  finding: AuditFinding | undefined,
): OutreachFindingContext | null {
  if (!finding) {
    return null;
  }

  return {
    title: finding.title,
    category: finding.category,
    whyItMatters: clip(finding.description, MAX_OUTREACH_EVIDENCE_CHARS),
    evidence: clip(
      finding.recommendation ?? finding.description,
      MAX_OUTREACH_EVIDENCE_CHARS,
    ),
    effort: effortLabel(finding),
  };
}

export function buildOutreachDraftContext(options: {
  businessName: string;
  website: string;
  city: string | null;
  state: string | null;
  industry: string | null;
  audit: WebsiteAuditResult;
  qualification: StoredQualification;
}): OutreachDraftContext | { error: string } {
  const primary = options.audit.findings.find(
    (finding) => finding.id === options.qualification.primaryFindingId,
  );

  if (!primary || !options.qualification.primaryFindingId) {
    return { error: "A credible primary outreach finding is required." };
  }

  const primaryContext = toFindingContext(primary);

  if (!primaryContext) {
    return { error: "A credible primary outreach finding is required." };
  }

  const secondary = options.qualification.secondaryFindingId
    ? options.audit.findings.find(
        (finding) => finding.id === options.qualification.secondaryFindingId,
      )
    : undefined;

  const applicable = options.audit.categoryScores.filter(isCategoryScoreApplicable);
  const strongest = [...applicable].sort((left, right) => right.score - left.score)[0];
  const weakest = options.qualification.weakestRelevantCategory
    ? applicable.find(
        (category) => category.category === options.qualification.weakestRelevantCategory,
      )
    : [...applicable].sort((left, right) => left.score - right.score)[0];

  const location = [options.city, options.state].filter(Boolean).join(", ") || null;

  return {
    businessName: options.businessName,
    website: options.website,
    location,
    industry: options.industry,
    websiteGrowthScore: options.audit.overallScore,
    scoreBand: getScoreBand(options.audit.overallScore).label,
    primaryFinding: primaryContext,
    secondaryFinding: toFindingContext(secondary),
    strongestArea: strongest?.label ?? null,
    weakestRelevantArea: weakest?.label ?? null,
    jsSolutionsContext: JS_SOLUTIONS_OUTREACH_CONTEXT,
  };
}

export function compactOutreachContextJson(context: OutreachDraftContext): string {
  return JSON.stringify(context);
}
