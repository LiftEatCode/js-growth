import { GBP_AUDIT_VERSION } from "./types";
import { gbpAuditRules } from "./rules";
import { runGbpRules } from "./engine";
import {
  applicableRuleCount,
  buildRecommendations,
  buildStrengths,
} from "./recommendations";
import { countFindings, getScoreBand, scoreCategories, scoreOverall } from "./score";
import { buildConfidence } from "./confidence";
import { classifyMaturity } from "./maturity";
import { isNewBusiness } from "./utils";
import type { BusinessProfileData, GbpAuditResult } from "./types";

export function runGbpAudit(profile: BusinessProfileData): GbpAuditResult {
  const asOf = profile.capturedAt;
  const newBusiness = isNewBusiness(profile, asOf);

  const findings = runGbpRules(gbpAuditRules, {
    profile,
    asOf,
    isNewBusiness: newBusiness,
  });

  const categoryScores = scoreCategories(findings);
  const overallScore = scoreOverall(categoryScores);
  const band = getScoreBand(overallScore);

  return {
    overallScore,
    scoreLabel: band.label,
    gradeOrLabel: band.label,
    scoreBandId: band.id,
    confidence: buildConfidence(findings),
    maturity: classifyMaturity(profile, asOf),
    categoryScores,
    findings,
    priorities: buildRecommendations(findings),
    strengths: buildStrengths(findings),
    metadata: {
      version: GBP_AUDIT_VERSION,
      profileName: profile.identity.name,
      locationType: profile.configuration.locationType,
      isNewBusiness: newBusiness,
      asOf,
      applicableRuleCount: applicableRuleCount(findings),
      findingCounts: countFindings(findings),
    },
  };
}
