import { buildOpportunityInsights } from "./opportunity-insights";
import type {
  AuditFinding,
  AuditOpportunity,
  WebsiteAuditResult,
} from "./types";

interface OpportunityInput {
  findings: AuditFinding[];
  overallScore: number;
  summary: WebsiteAuditResult["summary"];
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    Math.max(value, minimum),
    maximum,
  );
}

function getLevel(
  score: number,
): AuditOpportunity["level"] {
  if (score >= 80) {
    return "very-high";
  }

  if (score >= 60) {
    return "high";
  }

  if (score >= 35) {
    return "medium";
  }

  return "low";
}

function calculateOpportunityScore(
  findings: AuditFinding[],
  overallScore: number,
): number {
  const actionable = findings.filter(
    (finding) => finding.status !== "pass",
  );

  const weightedIssueScore = actionable.reduce(
    (total, finding) => {
      const priorityWeight = {
        low: 1,
        medium: 2,
        high: 3,
        critical: 4,
      }[finding.priority];

      const impactWeight = {
        low: 1,
        medium: 2,
        high: 3,
      }[finding.businessImpact];

      return (
        total +
        finding.scoreImpact *
          priorityWeight *
          impactWeight
      );
    },
    0,
  );

  const technicalGap = 100 - overallScore;

  return Math.round(
    clamp(
      technicalGap * 0.6 +
        Math.min(weightedIssueScore, 100) * 0.4,
      0,
      100,
    ),
  );
}

function calculateTrafficRange(
  score: number,
): AuditOpportunity["trafficGainPercent"] {
  const minimum = Math.round(score * 0.12);
  const maximum = Math.round(score * 0.35);

  return {
    minimum: clamp(minimum, 0, 25),
    maximum: clamp(maximum, 2, 45),
  };
}

function calculateLeadRange(
  trafficRange: AuditOpportunity["trafficGainPercent"],
): AuditOpportunity["monthlyLeadGain"] {
  return {
    minimum: Math.max(
      0,
      Math.round(trafficRange.minimum * 0.15),
    ),
    maximum: Math.max(
      1,
      Math.round(trafficRange.maximum * 0.4),
    ),
  };
}

function calculateRevenueRange(
  leadRange: AuditOpportunity["monthlyLeadGain"],
): AuditOpportunity["monthlyRevenueOpportunity"] {
  const assumedLeadValue = 250;

  return {
    minimum:
      leadRange.minimum * assumedLeadValue,

    maximum:
      leadRange.maximum * assumedLeadValue,
  };
}

function calculateConfidence(
  findings: AuditFinding[],
): AuditOpportunity["confidence"] {
  const actionableCount = findings.filter(
    (finding) => finding.status !== "pass",
  ).length;

  if (actionableCount >= 8) {
    return "high";
  }

  if (actionableCount >= 4) {
    return "medium";
  }

  return "low";
}

export function calculateAuditOpportunity({
  findings,
  overallScore,
  summary,
}: OpportunityInput): AuditOpportunity {
  const score = calculateOpportunityScore(
    findings,
    overallScore,
  );

  const trafficGainPercent =
    calculateTrafficRange(score);

  const monthlyLeadGain =
    calculateLeadRange(
      trafficGainPercent,
    );

  const monthlyRevenueOpportunity =
    calculateRevenueRange(
      monthlyLeadGain,
    );

  const insights =
    buildOpportunityInsights(findings);

  return {
    score,

    level: getLevel(score),

    trafficGainPercent,

    monthlyLeadGain,

    monthlyRevenueOpportunity,

    estimatedFixMinutes:
      summary.estimatedFixMinutes,

    confidence:
      calculateConfidence(findings),

    assumptions: [
      "Traffic estimates are modeled from the size and severity of detected website issues.",
      "Lead estimates assume the website already receives some qualified traffic.",
      "Revenue estimates use an assumed average value of $250 per lead.",
      "Actual results depend on competition, search demand, conversion rate, offer quality, and implementation.",
    ],

    insights,
  };
}