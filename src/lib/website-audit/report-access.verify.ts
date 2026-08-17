import { resolveReportTier } from "./report-access";
import { getAuditTierComparison, getReportCapabilities } from "./report-config";
import {
  listNonEmptyFieldValues,
  toClientWebsiteAuditResult,
} from "./report-free-payload";
import { buildGrowthReportViewModel } from "./report-view";
import type { AuditFinding, WebsiteAuditResult } from "./types";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const unpaidPublic = resolveReportTier({
  mode: "public",
  professionallyUnlocked: false,
});
assert(unpaidPublic === "free", "unpaid public reports stay free");
assert(
  getReportCapabilities(unpaidPublic).showUpgradeCta === true,
  "free reports show upgrade",
);
assert(
  getReportCapabilities(unpaidPublic).showActionPlan === false,
  "free reports hide action plan",
);

const paidPublic = resolveReportTier({
  mode: "public",
  professionallyUnlocked: true,
});
assert(paidPublic === "professional", "paid public reports become professional");
assert(
  getReportCapabilities(paidPublic).showUpgradeCta === false,
  "paid reports hide unlock CTA",
);
assert(
  getReportCapabilities(paidPublic).showActionPlan === true,
  "paid reports show action plan",
);

const consultation = resolveReportTier({
  mode: "consultation",
  professionallyUnlocked: false,
});
assert(consultation === "professional", "consultation remains professional without payment");

const client = resolveReportTier({
  mode: "client",
  professionallyUnlocked: false,
});
assert(client === "professional", "client remains professional without payment");

const comparison = getAuditTierComparison();
assert(
  comparison.some(
    (row) =>
      row.feature === "30–90 day action plan" &&
      row.free === "Not included" &&
      row.professional === "Included",
  ),
  "comparison reflects action plan capabilities",
);
assert(
  comparison.some(
    (row) =>
      row.feature === "Executive growth analysis" &&
      row.free === "Not included" &&
      row.professional === "Included",
  ),
  "comparison reflects AI interpretation capability",
);

function finding(
  partial: Partial<AuditFinding> & Pick<AuditFinding, "id" | "title">,
): AuditFinding {
  return {
    description: partial.description ?? `${partial.title} detail`,
    recommendation: partial.recommendation ?? "Do the recommended fix.",
    status: "warning",
    category: "seo",
    scoreImpact: 4,
    priority: "medium",
    businessImpact: "medium",
    difficulty: "medium",
    estimatedFixMinutes: 20,
    quickWin: false,
    ...partial,
  };
}

const payloadResult: WebsiteAuditResult = {
  success: true,
  metadata: {
    requestedUrl: "https://example.com",
    finalUrl: "https://example.com",
    statusCode: 200,
    contentType: "text/html",
    fetchedAt: "2024-01-01T00:00:00.000Z",
  },
  pageData: {
    title: "Example",
    h1Count: 1,
    h2Count: 0,
    h3Count: 0,
    imageCount: 0,
    imagesWithoutAlt: 0,
    internalLinkCount: 0,
    externalLinkCount: 0,
    structuredDataTypes: [],
    hasStructuredData: false,
    hasPhoneNumber: false,
    hasEmailAddress: false,
    hasPhysicalAddressSignals: false,
    hasLocalBusinessSignals: false,
  } as unknown as WebsiteAuditResult["pageData"],
  findings: [
    finding({
      id: "top-issue",
      title: "Primary conversion path is missing",
      description: "FREE_SURFACED_DESCRIPTION",
      recommendation: "GATED_RECOMMENDATION",
      status: "fail",
      category: "cro",
      priority: "critical",
      businessImpact: "high",
      scoreImpact: 12,
    }),
    finding({
      id: "second-issue",
      title: "Indexability is blocked",
      description: "FREE_SURFACED_DESCRIPTION_2",
      recommendation: "GATED_RECOMMENDATION_2",
      status: "fail",
      category: "technical",
      priority: "critical",
      businessImpact: "high",
      scoreImpact: 11,
    }),
    finding({
      id: "third-issue",
      title: "Local schema is missing",
      description: "FREE_SURFACED_DESCRIPTION_3",
      recommendation: "GATED_RECOMMENDATION_3",
      status: "fail",
      category: "local",
      priority: "high",
      businessImpact: "high",
      scoreImpact: 10,
    }),
    finding({
      id: "hidden-issue",
      title: "Secondary metadata detail",
      description: "GATED_FINDING_DESCRIPTION",
      recommendation: "ANOTHER_GATED_RECOMMENDATION",
      status: "warning",
      category: "seo",
      priority: "low",
      businessImpact: "low",
      scoreImpact: 1,
    }),
  ],
  categoryScores: [
    { category: "cro", label: "Conversion", score: 6, maxScore: 15 },
    { category: "technical", label: "Technical", score: 12, maxScore: 20 },
    { category: "local", label: "Local", score: 8, maxScore: 15 },
    { category: "seo", label: "Search", score: 10, maxScore: 20 },
  ],
  overallScore: 55,
  summary: {
    passed: 0,
    warnings: 1,
    failed: 1,
    criticalIssues: 1,
    quickWins: 0,
    highImpactFindings: 1,
    estimatedFixMinutes: 40,
  },
  opportunity: {
    score: 40,
    level: "medium",
    trafficGainPercent: { minimum: 5, maximum: 15 },
    monthlyLeadGain: { minimum: 2, maximum: 8 },
    monthlyRevenueOpportunity: { minimum: 100, maximum: 400 },
    estimatedFixMinutes: 40,
    confidence: "medium",
    assumptions: ["modeled"],
    insights: [
      {
        id: "insight-1",
        title: "Hidden insight",
        description: "GATED_INSIGHT_DESCRIPTION",
        businessValue: "leads",
        priority: "high",
        category: "cro",
        icon: "conversion",
      },
    ],
  },
};

const freeView = buildGrowthReportViewModel(payloadResult, "public");
const freePayload = toClientWebsiteAuditResult(payloadResult, freeView);
assert(freeView.tier === "free", "payload fixture is free");
assert(
  freePayload.findings.some((item) => item.description === "FREE_SURFACED_DESCRIPTION"),
  "free payload keeps limited priority details",
);
assert(
  listNonEmptyFieldValues(freePayload, "recommendation").length === 0,
  "free HTML/client payload omits recommendations",
);
assert(
  !JSON.stringify(freePayload).includes("GATED_FINDING_DESCRIPTION"),
  "free payload omits gated finding descriptions",
);
assert(
  !JSON.stringify(freePayload).includes("GATED_RECOMMENDATION"),
  "free payload omits gated recommendation strings",
);
assert(
  !JSON.stringify(freePayload).includes("GATED_INSIGHT_DESCRIPTION"),
  "free payload omits opportunity insight details",
);

const entitledView = buildGrowthReportViewModel(payloadResult, "public", {
  professionallyUnlocked: true,
});
const entitledPayload = toClientWebsiteAuditResult(payloadResult, entitledView);
assert(entitledView.tier === "professional", "paid public payload is professional");
assert(
  entitledPayload === payloadResult,
  "professional entitled reports keep the complete audit result",
);
assert(
  JSON.stringify(entitledPayload).includes("GATED_RECOMMENDATION"),
  "professional payload still contains recommendations",
);

console.log("report access verification passed");
process.exit(0);
