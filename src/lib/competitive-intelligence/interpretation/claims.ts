export interface CommercialClaimViolation {
  rule: string;
  excerpt: string;
}

export interface CommercialClaimCheckResult {
  valid: boolean;
  violations: CommercialClaimViolation[];
}

const MAX_EXCERPT = 120;

function excerptAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 24);
  const end = Math.min(text.length, index + length + 24);
  return text.slice(start, end).trim().slice(0, MAX_EXCERPT);
}

/**
 * Detect unsupported commercial / causal assertions.
 * Intentionally does NOT reject safe recommendation language that merely
 * mentions conversion, contact, visitors, search, business, leads, or customers.
 */
export function detectUnsupportedCommercialClaims(
  text: string,
): CommercialClaimCheckResult {
  const violations: CommercialClaimViolation[] = [];
  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return { valid: true, violations: [] };
  }

  const rules: Array<{ rule: string; pattern: RegExp }> = [
    {
      rule: "UNSUPPORTED_LEAD_CAUSALITY",
      pattern:
        /\b(will|would|can|could|guaranteed?\s+to)\s+(generate|produce|drive|create|bring)\s+(more\s+)?(leads?|customers?|inquiries)\b/i,
    },
    {
      rule: "UNSUPPORTED_LEAD_CAUSALITY",
      pattern:
        /\b(generate|producing|driving)\s+more\s+(leads?|customers?)\b/i,
    },
    {
      rule: "UNSUPPORTED_REVENUE_CAUSALITY",
      pattern:
        /\b(will|would|can|could)\s+(increase|boost|improve|grow|raise)\s+(your\s+)?(revenue|sales|ROI|profits?)\b/i,
    },
    {
      rule: "UNSUPPORTED_REVENUE_CAUSALITY",
      pattern:
        /\b(increase|boost|improve)\s+(your\s+)?(revenue|sales|ROI)\s+by\b/i,
    },
    {
      rule: "UNSUPPORTED_REVENUE_LOSS",
      pattern:
        /\b(losing|costing)\s+(the\s+business\s+)?(\$?\d|revenue|money|sales)\b/i,
    },
    {
      rule: "UNSUPPORTED_TRAFFIC_CLAIM",
      pattern:
        /\b(receives?|gets?|has|attracts?)\s+more\s+(organic\s+)?traffic\b/i,
    },
    {
      rule: "UNSUPPORTED_TRAFFIC_CLAIM",
      pattern:
        /\b(will|would)\s+(increase|drive|attract)\s+(more\s+)?(organic\s+)?traffic\b/i,
    },
    {
      rule: "UNSUPPORTED_RANKING_CLAIM",
      pattern:
        /\b(will|would|can|could)\s+(increase|improve|boost|raise|move)\s+.{0,40}\b(google\s+)?rankings?\b/i,
    },
    {
      rule: "UNSUPPORTED_RANKING_CLAIM",
      pattern:
        /\b(rank|ranking)\s+(above|higher than)\s+(competitors?|them)\b/i,
    },
    {
      rule: "UNSUPPORTED_RANKING_CLAIM",
      pattern: /\bgoogle prefers\b/i,
    },
    {
      rule: "UNSUPPORTED_CONVERSION_RATE_CAUSALITY",
      pattern:
        /\b(will|would|can|could)\s+(increase|improve|boost|raise)\s+(your\s+)?conversion rates?\b/i,
    },
    {
      rule: "UNSUPPORTED_CUSTOMER_VOLUME_CLAIM",
      pattern:
        /\b(getting|receiving|attracting)\s+more\s+customers\b/i,
    },
    {
      rule: "UNSUPPORTED_CUSTOMER_VOLUME_CLAIM",
      pattern:
        /\bmore customers than\b/i,
    },
    {
      rule: "UNSUPPORTED_MARKET_SHARE",
      pattern: /\bmarket share\b/i,
    },
    {
      rule: "UNSUPPORTED_BACKLINK_CLAIM",
      pattern: /\bbacklinks?\b/i,
    },
    {
      rule: "UNSUPPORTED_ROI_GUARANTEE",
      pattern: /\b(guaranteed?|guarantee)\b.{0,40}\b(ROI|results?|leads?|revenue)\b/i,
    },
    {
      rule: "UNSUPPORTED_QUANTIFIED_BUSINESS_IMPACT",
      pattern:
        /\b\d+(\.\d+)?%\s+(more|increase|growth|lift)\s+(in\s+)?(leads?|revenue|customers?|traffic|conversions?)\b/i,
    },
    {
      rule: "UNSUPPORTED_ORGANIC_TRAFFIC_FACT",
      pattern: /\borganic traffic\b/i,
    },
  ];

  for (const { rule, pattern } of rules) {
    const match = pattern.exec(normalized);
    if (match) {
      violations.push({
        rule,
        excerpt: excerptAround(normalized, match.index, match[0].length),
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

export function formatCommercialClaimUserMessage(
  violation: CommercialClaimViolation,
): string {
  switch (violation.rule) {
    case "UNSUPPORTED_LEAD_CAUSALITY":
      return "Validation failed: unsupported causal lead-generation claim.";
    case "UNSUPPORTED_REVENUE_CAUSALITY":
    case "UNSUPPORTED_REVENUE_LOSS":
      return "Validation failed: unsupported revenue or financial impact claim.";
    case "UNSUPPORTED_TRAFFIC_CLAIM":
    case "UNSUPPORTED_ORGANIC_TRAFFIC_FACT":
      return "Validation failed: unsupported traffic claim.";
    case "UNSUPPORTED_RANKING_CLAIM":
      return "Validation failed: unsupported search-ranking claim.";
    case "UNSUPPORTED_CONVERSION_RATE_CAUSALITY":
      return "Validation failed: unsupported conversion-rate impact claim.";
    case "UNSUPPORTED_CUSTOMER_VOLUME_CLAIM":
      return "Validation failed: unsupported customer-volume claim.";
    case "UNSUPPORTED_MARKET_SHARE":
      return "Validation failed: unsupported market-share claim.";
    case "UNSUPPORTED_BACKLINK_CLAIM":
      return "Validation failed: unsupported backlink claim.";
    case "UNSUPPORTED_ROI_GUARANTEE":
      return "Validation failed: unsupported guaranteed-outcome claim.";
    case "UNSUPPORTED_QUANTIFIED_BUSINESS_IMPACT":
      return "Validation failed: unsupported quantified business-impact claim.";
    default:
      return "Validation failed: unsupported commercial claim.";
  }
}
