import {
  createFinding,
  type AuditRule,
} from "../engine/types";
import { TRUST_DIVERSITY_PASS_THRESHOLD } from "../page-conversion";

export const trustSignalsRule: AuditRule = {
  id: "trust-signals",
  category: "cro",
  title: "Trust signals",

  evaluate({ pageData }) {
    const conversion = pageData.conversion;

    if (!conversion) {
      return [];
    }

    const { trust } = conversion;
    const hasSocialProof =
      trust.reviewSignals > 0 || trust.testimonialSignals > 0;

    if (trust.trustCategoryCount === 0) {
      return createFinding({
        id: "few-trust-signals",
        title: "Few trust-building signals were detected",
        description:
          "The page provides limited evidence that can help a new visitor feel confident choosing the business. Trust can be supported in several ways, including customer reviews, experience, warranties, certifications, team information, or examples of completed work. This check reports visible language and markup; it does not verify that claims are true.",
        status: "warning",
        category: "cro",
        scoreImpact: 5,
        priority: "medium",
        businessImpact: "high",
        difficulty: "medium",
        estimatedFixMinutes: 40,
        quickWin: false,
        recommendation:
          "Add authentic trust evidence that applies to the business. Avoid generic claims that cannot be supported, and do not invent testimonials, certifications, reviews, or awards.",
      });
    }

    const findings = [];

    if (trust.trustCategoryCount >= TRUST_DIVERSITY_PASS_THRESHOLD) {
      findings.push(
        createFinding({
          id: "trust-coverage-present",
          title: "Multiple trust-building signals are present",
          description: `The page includes ${trust.trustCategoryCount} kinds of trust language or related links (${trust.presentCategories.join(", ")}). These are on-page signals, not independently verified credentials.`,
          status: "pass",
          category: "cro",
          scoreImpact: 4,
        }),
      );
    }

    if (!hasSocialProof) {
      findings.push(
        createFinding({
          id: "social-proof-opportunity",
          title: "Customer evidence could strengthen trust",
          description:
            "Other trust signals were detected, but the page does not appear to include reviews or testimonials. New visitors have limited customer evidence to help them feel confident choosing the business.",
          status: "warning",
          category: "cro",
          scoreImpact: 2,
          priority: "low",
          businessImpact: "medium",
          difficulty: "medium",
          estimatedFixMinutes: 30,
          quickWin: false,
          recommendation:
            "If genuine reviews or project stories exist, feature a small number on the page. Do not fabricate testimonials or import reviews you cannot stand behind.",
        }),
      );
    }

    return findings;
  },
};
