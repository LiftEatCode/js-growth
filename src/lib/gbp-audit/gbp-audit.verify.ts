import { runGbpAudit } from "./audit";
import {
  CATEGORY_WEIGHTS,
  CONFIDENCE_THRESHOLDS,
  gbpAuditRules,
  RULE_MAX_SCORES,
} from "./index";
import { MockBusinessProfileAdapter } from "./adapters/mock-adapter";
import { googleBusinessProfileAdapter } from "./adapters/google-adapter";
import { buildConfidence } from "./confidence";
import {
  averageBusiness,
  completeButInactiveBusiness,
  excellentBusiness,
  newBusiness,
  poorBusiness,
  popularButPoorlyOptimizedBusiness,
  serviceAreaBusiness,
} from "./fixtures";
import { classifyMaturity } from "./maturity";
import { isScoredStatus } from "./engine";
import { scoreOverall } from "./score";
import { GBP_AUDIT_CATEGORIES, GBP_AUDIT_VERSION } from "./types";
import type { BusinessProfileData, GbpAuditFinding, GbpCategoryScore } from "./types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function cloneProfile(profile: BusinessProfileData): BusinessProfileData {
  return JSON.parse(JSON.stringify(profile)) as BusinessProfileData;
}

function categoryScore(
  scores: GbpCategoryScore[],
  category: GbpCategoryScore["category"],
): GbpCategoryScore {
  const found = scores.find((item) => item.category === category);
  assert(found, `missing category ${category}`);
  return found;
}

function inRange(score: number, min: number, max: number, label: string): void {
  assert(
    score >= min && score <= max,
    `${label} score ${score} outside ${min}-${max}`,
  );
}

assert(GBP_AUDIT_VERSION === "0.2", "engine version 0.2");

const excellent = runGbpAudit(excellentBusiness);
const average = runGbpAudit(averageBusiness);
const poor = runGbpAudit(poorBusiness);
const newborn = runGbpAudit(newBusiness);
const sab = runGbpAudit(serviceAreaBusiness);
const inactive = runGbpAudit(completeButInactiveBusiness);
const popular = runGbpAudit(popularButPoorlyOptimizedBusiness);

for (const result of [excellent, average, poor, newborn, sab, inactive, popular]) {
  inRange(result.overallScore, 0, 100, result.metadata.profileName);
  inRange(result.confidence.coveragePercent, 0, 100, "coverage");
}

assert(excellent.overallScore > average.overallScore, "excellent > average");
assert(average.overallScore > poor.overallScore, "average > poor");
assert(
  excellent.overallScore - poor.overallScore >= 30,
  "excellent beats poor by 30+",
);
assert(newborn.overallScore > poor.overallScore, "new is not crushed vs poor");
assert(sab.overallScore >= 75, `SAB should score well, got ${sab.overallScore}`);
assert(
  inactive.overallScore < excellent.overallScore - 10,
  "inactive scores materially below excellent",
);
assert(
  popular.overallScore < excellent.overallScore - 10,
  "popular-but-poorly-optimized scores materially below excellent",
);
inRange(inactive.overallScore, 70, 82, "complete-but-inactive calibration");
inRange(popular.overallScore, 65, 82, "popular-but-poorly-optimized calibration");

assert(excellent.scoreLabel === excellent.gradeOrLabel, "scoreLabel alias");
assert(excellent.maturity.level === "mature", "excellent maturity");
assert(newborn.maturity.level === "new", "new-business maturity");
assert(sab.maturity.level === "mature", "SAB maturity");
assert(inactive.maturity.level === "mature", "inactive is mature, not new");
assert(popular.maturity.level === "mature", "popular is mature");
assert(average.maturity.level === "mature", "average opening date is mature");
assert(poor.maturity.level === "mature", "poor opening date is mature");

assert(excellent.metadata.isNewBusiness === false, "excellent not new-business rules");
assert(newborn.metadata.isNewBusiness === true, "new uses new-business rules");
assert(
  newborn.findings.find((item) => item.id === "reviews.count")?.status !== "fail",
  "new business review count is not a mature-style fail",
);
assert(
  !/poor review history|years of reviews/i.test(
    newborn.findings.find((item) => item.id === "reviews.count")?.recommendation ?? "",
  ),
  "new-business review copy is not a mature-history scold",
);

const sabStorefront = sab.findings.find(
  (item) => item.id === "profile.storefront_address",
);
assert(sabStorefront?.status === "not_applicable", "SAB storefront is n/a");
assert(
  sab.findings.find((item) => item.id === "profile.service_areas")?.status ===
    "pass",
  "SAB service areas pass",
);

assert(
  JSON.stringify(excellent) === JSON.stringify(runGbpAudit(excellentBusiness)),
  "audit is deterministic",
);

const weightSum = Object.values(CATEGORY_WEIGHTS).reduce((a, b) => a + b, 0);
assert(weightSum === 100, "weights still sum to 100");
assert(CATEGORY_WEIGHTS.profile_optimization === 25, "profile weight unchanged");
assert(CATEGORY_WEIGHTS.activity_freshness === 15, "activity weight unchanged");

const mixedOverall = scoreOverall([
  {
    category: "profile_optimization",
    label: "p",
    score: 100,
    applicable: true,
    weight: 25,
    earnedPoints: 100,
    possiblePoints: 100,
    applicableRuleCount: 1,
    notApplicableCount: 0,
    insufficientDataCount: 0,
  },
  {
    category: "reviews_reputation",
    label: "r",
    score: 0,
    applicable: true,
    weight: 25,
    earnedPoints: 0,
    possiblePoints: 100,
    applicableRuleCount: 1,
    notApplicableCount: 0,
    insufficientDataCount: 0,
  },
  {
    category: "activity_freshness",
    label: "a",
    score: 80,
    applicable: false,
    weight: 50,
    earnedPoints: 0,
    possiblePoints: 0,
    applicableRuleCount: 0,
    notApplicableCount: 1,
    insufficientDataCount: 0,
  },
  {
    category: "local_seo",
    label: "l",
    score: 0,
    applicable: false,
    weight: 0,
    earnedPoints: 0,
    possiblePoints: 0,
    applicableRuleCount: 0,
    notApplicableCount: 0,
    insufficientDataCount: 0,
  },
  {
    category: "trust_authority",
    label: "t",
    score: 0,
    applicable: false,
    weight: 0,
    earnedPoints: 0,
    possiblePoints: 0,
    applicableRuleCount: 0,
    notApplicableCount: 0,
    insufficientDataCount: 0,
  },
  {
    category: "conversion_readiness",
    label: "c",
    score: 0,
    applicable: false,
    weight: 0,
    earnedPoints: 0,
    possiblePoints: 0,
    applicableRuleCount: 0,
    notApplicableCount: 0,
    insufficientDataCount: 0,
  },
]);
assert(mixedOverall === 50, `renormalized weights should yield 50, got ${mixedOverall}`);

const sabProfileCategory = categoryScore(sab.categoryScores, "profile_optimization");
assert(
  sabStorefront && !isScoredStatus(sabStorefront.status),
  "n/a storefront is not a scored status",
);
assert(
  sabProfileCategory.possiblePoints + RULE_MAX_SCORES["profile.storefront_address"] >
    sabProfileCategory.possiblePoints,
  "n/a maxScore is excluded from the category denominator",
);

assert(excellent.confidence.level === "high", "full data is high confidence");
assert(excellent.confidence.coveragePercent === 100, "excellent coverage 100");
assert(excellent.confidence.insufficientDataRules === 0, "excellent no insuff");
assert(
  sab.confidence.coveragePercent === 100,
  "SAB n/a does not reduce coverage",
);
assert(
  sab.metadata.findingCounts.not_applicable >= 1,
  "SAB still records n/a findings",
);

const noContext = cloneProfile(excellentBusiness);
noContext.localSeoContext = null;
const noContextAudit = runGbpAudit(noContext);
assert(
  noContextAudit.findings.find((item) => item.id === "local_seo.name_consistency")
    ?.status === "insufficient_data",
  "name consistency needs external context",
);
assert(
  noContextAudit.confidence.coveragePercent < excellent.confidence.coveragePercent,
  "insufficient data lowers coverage",
);
assert(
  noContextAudit.confidence.insufficientDataRules >= 3,
  "NAP rules are insufficient without context",
);
assert(
  categoryScore(noContextAudit.categoryScores, "local_seo").score === 100,
  "remaining local SEO website pass is not diluted by insufficient_data",
);
assert(
  noContextAudit.overallScore === excellent.overallScore,
  "dropping external NAP context does not change optimization score when those rules were already passing",
);

const unknownPhotos = cloneProfile(excellentBusiness);
unknownPhotos.media.photoCount = null;
unknownPhotos.media.logoPresent = null;
unknownPhotos.media.coverPhotoPresent = null;
unknownPhotos.media.ownerUploadedPhotoCount = null;
unknownPhotos.media.mostRecentOwnerPhotoAt = null;
unknownPhotos.media.mostRecentPhotoAt = null;
const unknownMediaAudit = runGbpAudit(unknownPhotos);
for (const id of [
  "profile.photos",
  "profile.logo",
  "profile.cover",
  "activity.recent_owner_photos",
] as const) {
  assert(
    unknownMediaAudit.findings.find((item) => item.id === id)?.status ===
      "insufficient_data",
    `${id} should be insufficient_data when media is unknown`,
  );
}
assert(
  unknownMediaAudit.overallScore > poor.overallScore,
  "unknown media must not collapse an otherwise strong profile to poor",
);
assert(
  unknownMediaAudit.confidence.coveragePercent < 100,
  "unknown media reduces coverage",
);
assert(
  unknownMediaAudit.confidence.level !== "high" ||
    unknownMediaAudit.confidence.coveragePercent < 100,
  "unknown media is visible in confidence",
);

const sparse: GbpAuditFinding[] = [
  {
    id: "a",
    category: "profile_optimization",
    title: "a",
    status: "pass",
    severity: "info",
    score: 10,
    maxScore: 10,
    evidence: {},
    summary: "",
    whyItMatters: "",
    recommendation: "",
  },
  {
    id: "b",
    category: "profile_optimization",
    title: "b",
    status: "insufficient_data",
    severity: "info",
    score: 0,
    maxScore: 10,
    evidence: {},
    summary: "",
    whyItMatters: "",
    recommendation: "",
  },
  {
    id: "c",
    category: "profile_optimization",
    title: "c",
    status: "not_applicable",
    severity: "info",
    score: 0,
    maxScore: 10,
    evidence: {},
    summary: "",
    whyItMatters: "",
    recommendation: "",
  },
];
const halfCoverage = buildConfidence(sparse);
assert(halfCoverage.evaluatedRules === 1, "evaluated counts pass/warn/fail");
assert(halfCoverage.insufficientDataRules === 1, "insuff counted");
assert(halfCoverage.applicableRules === 2, "n/a excluded from coverage denom");
assert(halfCoverage.coveragePercent === 50, "1/2 = 50%");
assert(halfCoverage.level === "medium", "50% is medium");
assert(CONFIDENCE_THRESHOLDS.highMinCoveragePercent === 80, "high band");
assert(CONFIDENCE_THRESHOLDS.mediumMinCoveragePercent === 50, "medium band");

const unknownMaturityProfile = cloneProfile(excellentBusiness);
unknownMaturityProfile.configuration.openingDate = null;
unknownMaturityProfile.reviews.reviews = [];
unknownMaturityProfile.reviews.mostRecentReviewAt = null;
unknownMaturityProfile.reviews.totalCount = 0;
const unknownMaturity = classifyMaturity(
  unknownMaturityProfile,
  unknownMaturityProfile.capturedAt,
);
assert(unknownMaturity.level === "unknown", "no date and no reviews → unknown");

assert(newborn.overallScore >= 90, "a well-optimized new listing can still score Excellent");
assert(
  newborn.maturity.level === "new" && newborn.overallScore >= 90,
  "new maturity does not cap optimization at a lower band",
);

assert(gbpAuditRules.length === Object.keys(RULE_MAX_SCORES).length, "every rule has points");
assert(
  GBP_AUDIT_CATEGORIES.every((category) =>
    gbpAuditRules.some((rule) => rule.category === category),
  ),
  "every category has rules",
);

const adapter = new MockBusinessProfileAdapter();
assert(
  adapter.toBusinessProfileData("complete-but-inactive-business").identity.name ===
    completeButInactiveBusiness.identity.name,
  "mock adapter loads new fixture",
);

let googleThrew = false;
try {
  googleBusinessProfileAdapter.toBusinessProfileData({});
} catch {
  googleThrew = true;
}
assert(googleThrew, "google adapter is not implemented");

assert(
  poor.priorities.length > 0 && poor.priorities[0]?.severity === "high",
  "poor priorities start at high severity",
);

for (let i = 1; i < poor.priorities.length; i += 1) {
  const prev = poor.priorities[i - 1];
  const next = poor.priorities[i];
  const rank = { high: 0, medium: 1, low: 2, info: 3 };
  assert(rank[prev.severity] <= rank[next.severity], "priorities sorted by severity");
}

console.log(
  [
    "gbp-audit.verify.ts PASS",
    `excellent=${excellent.overallScore}/${excellent.maturity.level}/${excellent.confidence.level}`,
    `average=${average.overallScore}/${average.maturity.level}/${average.confidence.level}`,
    `poor=${poor.overallScore}/${poor.maturity.level}/${poor.confidence.level}`,
    `new=${newborn.overallScore}/${newborn.maturity.level}/${newborn.confidence.level}`,
    `sab=${sab.overallScore}/${sab.maturity.level}/${sab.confidence.level}`,
    `inactive=${inactive.overallScore}/${inactive.maturity.level}/${inactive.confidence.level}`,
    `popular=${popular.overallScore}/${popular.maturity.level}/${popular.confidence.level}`,
  ].join(" "),
);
