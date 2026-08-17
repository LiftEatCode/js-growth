import type {
  CompetitiveFindingFamily,
  CompetitiveFindingView,
  CompetitiveGap,
  CompetitiveMetric,
  CompetitiveMetricUnit,
  CompetitiveOpportunity,
} from "./types";

export function formatBenchmarkLabel(competitorCount: number): string {
  return competitorCount <= 1
    ? "Compared competitor"
    : "Competitor median";
}

export function formatMetricValue(
  value: number,
  unit: CompetitiveMetricUnit,
): string {
  if (unit === "percent") {
    const rounded =
      Number.isInteger(value) ? String(value) : value.toFixed(1);
    return `${rounded}%`;
  }

  if (unit === "words") {
    return `${Math.round(value)} words`;
  }

  if (unit === "risk") {
    if (value <= 0) {
      return "Low";
    }

    if (value >= 2) {
      return "High";
    }

    return "Moderate";
  }

  const rounded =
    Number.isInteger(value) ? String(value) : value.toFixed(1);
  return rounded;
}

export function formatScannedCounts(values: number[]): string {
  if (values.length === 1) {
    return String(values[0]);
  }

  return values.join(", ");
}

const FAMILY_BY_METRIC: Partial<
  Record<CompetitiveMetric, CompetitiveFindingFamily>
> = {
  service_pages: "COMP_SERVICE_COVERAGE_GAP",
  location_pages: "COMP_LOCATION_COVERAGE_GAP",
  service_content_depth: "COMP_CONTENT_DEPTH_GAP",
  thin_commercial_rate: "COMP_THIN_CONTENT_GAP",
  unique_titles: "COMP_METADATA_GAP",
  unique_descriptions: "COMP_METADATA_GAP",
  unique_h1s: "COMP_METADATA_GAP",
  internal_link_support: "COMP_INTERNAL_LINKING_GAP",
  cta_coverage: "COMP_CONVERSION_GAP",
  click_to_call_coverage: "COMP_CONVERSION_GAP",
  trust_coverage: "COMP_TRUST_GAP",
  local_relevance: "COMP_LOCAL_RELEVANCE_GAP",
  schema_presence: "COMP_SCHEMA_GAP",
  indexability_issues: "COMP_TECHNICAL_GAP",
  broken_internal_links: "COMP_TECHNICAL_GAP",
  performance_risk: "COMP_PERFORMANCE_RISK_GAP",
};

interface MetricCopy {
  behindTitle: string;
  aheadTitle: string;
  behindDescription: (gap: CompetitiveGap, benchmarkLabel: string) => string;
  aheadDescription: (gap: CompetitiveGap, benchmarkLabel: string) => string;
  behindRecommendation: string;
  aheadRecommendation: string;
  opportunityTitle: string;
  opportunityDescription: string;
  effort: CompetitiveOpportunity["effort"];
  businessImpact: CompetitiveFindingView["businessImpact"];
  priorityFor: (
    magnitude: CompetitiveGap["magnitude"],
  ) => CompetitiveFindingView["priority"];
}

function countsSentence(
  gap: CompetitiveGap,
  benchmarkLabel: string,
  noun: string,
): string {
  return `Your representative scan found ${formatMetricValue(gap.customerValue, gap.unit)} ${noun}. The ${benchmarkLabel.toLowerCase()} was ${formatMetricValue(gap.benchmarkValue, gap.unit)} (competitor scans found ${formatScannedCounts(gap.competitorValues)}).`;
}

function percentSentence(
  gap: CompetitiveGap,
  benchmarkLabel: string,
  noun: string,
): string {
  return `Your scan measured ${formatMetricValue(gap.customerValue, gap.unit)} ${noun}, compared with ${formatMetricValue(gap.benchmarkValue, gap.unit)} for the ${benchmarkLabel.toLowerCase()}.`;
}

const METRIC_COPY: Record<CompetitiveMetric, MetricCopy> = {
  service_pages: {
    behindTitle: "Competitors provide broader dedicated service coverage",
    aheadTitle: "Your scan found broader dedicated service coverage",
    behindDescription: (gap, label) =>
      `${countsSentence(gap, label, "dedicated service pages")} This is the number of service pages found in the representative scans, not a complete website inventory.`,
    aheadDescription: (gap, label) =>
      `${countsSentence(gap, label, "dedicated service pages")} Your scanned site already publishes more dedicated service pages than the competitor sample.`,
    behindRecommendation:
      "Review your highest-value services currently represented only on general pages and determine whether they warrant dedicated, substantial pages.",
    aheadRecommendation:
      "Keep dedicated service pages current and useful so that broader coverage continues to help visitors and search engines understand what you offer.",
    opportunityTitle: "Expand dedicated service coverage",
    opportunityDescription:
      "Consider whether high-value services that currently live only on general pages deserve their own substantial pages.",
    effort: "medium",
    businessImpact: "high",
    priorityFor: (magnitude) => (magnitude === "large" ? "high" : "medium"),
  },
  location_pages: {
    behindTitle: "Competitors provide broader useful local coverage",
    aheadTitle: "Your local pages are more substantive than the competitor sample",
    behindDescription: (gap, label) =>
      `${countsSentence(gap, label, "substantive location or service-area pages")} Only pages with enough visible content to be useful are counted, so thin duplicate city pages do not automatically win.`,
    aheadDescription: (gap, label) =>
      `${countsSentence(gap, label, "substantive location or service-area pages")} Extra thin location pages on competitor sites are not treated as stronger local coverage.`,
    behindRecommendation:
      "Add or strengthen location and service-area pages that describe a real community you serve, with unique local detail rather than doorway-page templates.",
    aheadRecommendation:
      "Continue treating local pages as useful resources rather than multiplying thin city URLs.",
    opportunityTitle: "Strengthen local service-area content",
    opportunityDescription:
      "Build or deepen location pages that explain how you serve specific communities.",
    effort: "medium",
    businessImpact: "high",
    priorityFor: (magnitude) => (magnitude === "large" ? "high" : "medium"),
  },
  service_content_depth: {
    behindTitle: "Competitors provide more detailed service information",
    aheadTitle: "Your service pages include more detailed information",
    behindDescription: (gap, label) =>
      `The competitor pages scanned generally provide more detailed service information. ${countsSentence(gap, label, "median service-page words")} Word count is a depth signal, not proof of quality or a ranking rule.`,
    aheadDescription: (gap, label) =>
      `Your scanned service pages generally provide more detailed information than the competitor sample. ${countsSentence(gap, label, "median service-page words")} Word count is a depth signal, not a ranking rule.`,
    behindRecommendation:
      "Add useful service detail—process, scope, pricing context, timelines, and expected outcomes—where pages currently stay thin.",
    aheadRecommendation:
      "Keep service pages specific and current so depth continues to help visitors understand the work.",
    opportunityTitle: "Add useful detail to service pages",
    opportunityDescription:
      "Expand thin service pages with information a buyer would actually need before contacting you.",
    effort: "medium",
    businessImpact: "medium",
    priorityFor: (magnitude) => (magnitude === "large" ? "medium" : "medium"),
  },
  thin_commercial_rate: {
    behindTitle: "More of your commercial pages look thin than the competitor sample",
    aheadTitle: "Fewer of your commercial pages look thin",
    behindDescription: (gap, label) =>
      `${percentSentence(gap, label, "of scanned service and location pages classified as thin")} Thin here means limited visible content in this scan, not a search-engine penalty score.`,
    aheadDescription: (gap, label) =>
      `${percentSentence(gap, label, "of scanned service and location pages classified as thin")}`,
    behindRecommendation:
      "Prioritize the commercial pages with the least unique information and expand them before adding more URLs.",
    aheadRecommendation:
      "Maintain distinct, useful copy on service and location pages as the site grows.",
    opportunityTitle: "Reduce thin commercial pages",
    opportunityDescription:
      "Rewrite the thinnest service and location pages so each URL has a clear reason to exist.",
    effort: "medium",
    businessImpact: "medium",
    priorityFor: () => "medium",
  },
  unique_titles: {
    behindTitle: "Competitors use more page-specific search titles",
    aheadTitle: "Your titles are more page-specific than the competitor sample",
    behindDescription: (gap, label) =>
      `${percentSentence(gap, label, "unique titles on commercial pages scanned")} Repeated titles make it harder for visitors and search engines to tell pages apart.`,
    aheadDescription: (gap, label) =>
      `${percentSentence(gap, label, "unique titles on commercial pages scanned")}`,
    behindRecommendation:
      "Write a distinct title for each important service and location page that names the service and, when relevant, the community.",
    aheadRecommendation:
      "Keep titles specific as you add pages so they do not collapse into a template.",
    opportunityTitle: "Improve page-specific search metadata",
    opportunityDescription:
      "Give important pages unique titles and descriptions that match the page content.",
    effort: "easy",
    businessImpact: "medium",
    priorityFor: () => "medium",
  },
  unique_descriptions: {
    behindTitle: "Competitors use more page-specific meta descriptions",
    aheadTitle: "Your meta descriptions are more page-specific",
    behindDescription: (gap, label) =>
      `${percentSentence(gap, label, "unique meta descriptions on commercial pages scanned")}`,
    aheadDescription: (gap, label) =>
      `${percentSentence(gap, label, "unique meta descriptions on commercial pages scanned")}`,
    behindRecommendation:
      "Write a distinct meta description for each important commercial page.",
    aheadRecommendation:
      "Keep descriptions unique as new commercial pages are added.",
    opportunityTitle: "Write unique meta descriptions",
    opportunityDescription:
      "Replace repeated descriptions on service and location pages.",
    effort: "easy",
    businessImpact: "medium",
    priorityFor: () => "medium",
  },
  unique_h1s: {
    behindTitle: "Competitors use more page-specific main headings",
    aheadTitle: "Your main headings are more page-specific",
    behindDescription: (gap, label) =>
      `${percentSentence(gap, label, "unique H1 headings on commercial pages scanned")}`,
    aheadDescription: (gap, label) =>
      `${percentSentence(gap, label, "unique H1 headings on commercial pages scanned")}`,
    behindRecommendation:
      "Give each important page a main heading that matches that page’s service or location.",
    aheadRecommendation:
      "Keep H1s unique as you publish additional commercial pages.",
    opportunityTitle: "Use more page-specific headings",
    opportunityDescription:
      "Avoid repeating the same H1 across multiple service or location pages.",
    effort: "easy",
    businessImpact: "medium",
    priorityFor: () => "low",
  },
  internal_link_support: {
    behindTitle: "Important service pages have weaker internal-link support",
    aheadTitle: "Your service pages have stronger internal-link support",
    behindDescription: (gap, label) =>
      `${percentSentence(gap, label, "of scanned service pages missing incoming internal links in this sample")} This is a bounded-scan signal, not a complete link graph.`,
    aheadDescription: (gap, label) =>
      `${percentSentence(gap, label, "of scanned service pages missing incoming internal links in this sample")}`,
    behindRecommendation:
      "Link to important service pages from the homepage, services overview, and related content so visitors can find them.",
    aheadRecommendation:
      "Keep internal links to important service pages as navigation changes.",
    opportunityTitle: "Improve internal links to important pages",
    opportunityDescription:
      "Make sure key service pages are reachable from primary navigation and related pages.",
    effort: "easy",
    businessImpact: "medium",
    priorityFor: () => "medium",
  },
  cta_coverage: {
    behindTitle: "Competitors provide clearer next steps on key pages",
    aheadTitle: "Your key pages provide stronger conversion paths",
    behindDescription: (gap, label) =>
      `${percentSentence(gap, label, "key-page CTA or contact-path coverage")} Clear next steps on service and location pages help visitors request work.`,
    aheadDescription: (gap, label) =>
      `${percentSentence(gap, label, "key-page CTA or contact-path coverage")} Your key pages provide stronger conversion paths than the competitor sites scanned.`,
    behindRecommendation:
      "Add a clear contact, quote, or call action on every important service and location page.",
    aheadRecommendation:
      "Keep conversion paths visible as templates and landing pages change.",
    opportunityTitle: "Improve service-page conversion paths",
    opportunityDescription:
      "Make the next step obvious on key commercial pages: call, form, or quote request.",
    effort: "easy",
    businessImpact: "high",
    priorityFor: (magnitude) => (magnitude === "large" ? "high" : "medium"),
  },
  click_to_call_coverage: {
    behindTitle: "Competitors make calling easier on key pages",
    aheadTitle: "Your key pages make calling easier",
    behindDescription: (gap, label) =>
      `${percentSentence(gap, label, "key pages with a click-to-call or tel link")}`,
    aheadDescription: (gap, label) =>
      `${percentSentence(gap, label, "key pages with a click-to-call or tel link")}`,
    behindRecommendation:
      "Add a tap-to-call number on mobile-friendly key pages when phone leads matter.",
    aheadRecommendation:
      "Keep click-to-call numbers accurate across key pages.",
    opportunityTitle: "Make calling easier on key pages",
    opportunityDescription:
      "Add working click-to-call links on service, location, and contact pages.",
    effort: "easy",
    businessImpact: "high",
    priorityFor: () => "medium",
  },
  trust_coverage: {
    behindTitle: "Competitors show more on-page trust evidence",
    aheadTitle: "Your key pages show stronger on-page trust evidence",
    behindDescription: (gap, label) =>
      `${percentSentence(gap, label, "key pages containing visible trust signals")} These are on-page cues such as testimonials, credentials, or experience language—not verified review ratings or Google scores.`,
    aheadDescription: (gap, label) =>
      `${percentSentence(gap, label, "key pages containing visible trust signals")} These are on-page cues, not independently verified ratings.`,
    behindRecommendation:
      "Add specific, honest trust evidence—reviews excerpts, licenses, years of experience, team, or case examples—on important pages.",
    aheadRecommendation:
      "Keep trust evidence accurate and visible on key commercial pages.",
    opportunityTitle: "Add stronger on-page trust evidence",
    opportunityDescription:
      "Surface testimonials, credentials, and experience on pages where visitors decide whether to inquire.",
    effort: "medium",
    businessImpact: "medium",
    priorityFor: () => "medium",
  },
  local_relevance: {
    behindTitle: "Competitors show stronger local relevance on key pages",
    aheadTitle: "Your key pages show stronger local relevance",
    behindDescription: (gap, label) =>
      `${percentSentence(gap, label, "key pages with observable local relevance")} This comparison uses website signals only. It does not include Google Business Profile, map-pack ranking, or citations.`,
    aheadDescription: (gap, label) =>
      `${percentSentence(gap, label, "key pages with observable local relevance")}`,
    behindRecommendation:
      "Name the communities you serve, keep NAP consistent, and give location pages unique local detail.",
    aheadRecommendation:
      "Keep local references consistent and specific across key pages.",
    opportunityTitle: "Strengthen local relevance on key pages",
    opportunityDescription:
      "Make service-area and location relevance explicit on the pages people and search engines actually see.",
    effort: "medium",
    businessImpact: "high",
    priorityFor: (magnitude) => (magnitude === "large" ? "high" : "medium"),
  },
  schema_presence: {
    behindTitle: "Competitors mark up more useful structured data types",
    aheadTitle: "Your site includes more useful structured data",
    behindDescription: (gap, label) =>
      `${countsSentence(gap, label, "useful structured-data families on the seed page (LocalBusiness, Organization, Service, FAQ, or breadcrumb)")} Quantity of schema is not rewarded; unsupported or spammy types are not recommended.`,
    aheadDescription: (gap, label) =>
      `${countsSentence(gap, label, "useful structured-data families on the seed page")}`,
    behindRecommendation:
      "Add accurate LocalBusiness, Organization, or Service schema that matches visible page content. Do not add markup the page does not support.",
    aheadRecommendation:
      "Keep structured data accurate as the business name, address, and services change.",
    opportunityTitle: "Add accurate useful structured data",
    opportunityDescription:
      "Use standard schema that matches visible business, service, or FAQ content.",
    effort: "medium",
    businessImpact: "low",
    priorityFor: () => "low",
  },
  indexability_issues: {
    behindTitle: "More important pages show indexability problems",
    aheadTitle: "Fewer important pages show indexability problems",
    behindDescription: (gap, label) =>
      `${percentSentence(gap, label, "important scanned pages with noindex or an off-site canonical")}`,
    aheadDescription: (gap, label) =>
      `${percentSentence(gap, label, "important scanned pages with noindex or an off-site canonical")}`,
    behindRecommendation:
      "Review noindex tags and off-site canonicals on service, location, and contact pages so they match the intended search visibility. A missing canonical is a separate quality recommendation, not the same as blocking indexing.",
    aheadRecommendation:
      "Keep indexability settings consistent as templates change.",
    opportunityTitle: "Fix indexability on important pages",
    opportunityDescription:
      "Correct noindex or off-site canonical problems on commercial pages that should be found. A missing canonical is not treated as a noindex issue.",
    effort: "medium",
    businessImpact: "high",
    priorityFor: (magnitude) => (magnitude === "large" ? "high" : "medium"),
  },
  broken_internal_links: {
    behindTitle: "The scan found more broken internal links on your site",
    aheadTitle: "The scan found fewer broken internal links on your site",
    behindDescription: (gap, label) =>
      `${percentSentence(gap, label, "broken-internal-link rate among scanned pages")} This is not a complete crawl of every URL.`,
    aheadDescription: (gap, label) =>
      `${percentSentence(gap, label, "broken-internal-link rate among scanned pages")}`,
    behindRecommendation:
      "Repair or remove verified broken internal links on important pages.",
    aheadRecommendation:
      "Recheck internal links when navigation or service URLs change.",
    opportunityTitle: "Repair broken internal links",
    opportunityDescription:
      "Fix verified broken links that interrupt movement between important pages.",
    effort: "easy",
    businessImpact: "medium",
    priorityFor: () => "medium",
  },
  performance_risk: {
    behindTitle: "Your homepage shows higher static performance risk",
    aheadTitle: "Your homepage shows lower static performance risk",
    behindDescription: (gap, label) =>
      `Static HTML/resource risk was ${formatMetricValue(gap.customerValue, "risk")} on your seed page versus ${formatMetricValue(gap.benchmarkValue, "risk")} for the ${label.toLowerCase()}. This is not a Lighthouse, LCP, CLS, or INP measurement.`,
    aheadDescription: (gap, label) =>
      `Static HTML/resource risk was ${formatMetricValue(gap.customerValue, "risk")} on your seed page versus ${formatMetricValue(gap.benchmarkValue, "risk")} for the ${label.toLowerCase()}. This is not a Core Web Vitals measurement.`,
    behindRecommendation:
      "Reduce render-blocking scripts, unnecessary third-party tags, and oversized HTML on the primary landing page.",
    aheadRecommendation:
      "Keep third-party tags and blocking scripts in check as marketing tools are added.",
    opportunityTitle: "Reduce static performance risk",
    opportunityDescription:
      "Trim blocking scripts and third-party overhead on the primary page.",
    effort: "hard",
    businessImpact: "low",
    priorityFor: () => "low",
  },
};

export function findingFamilyFor(
  metric: CompetitiveMetric,
): CompetitiveFindingFamily | null {
  return FAMILY_BY_METRIC[metric] ?? null;
}

export function metricCopy(metric: CompetitiveMetric): MetricCopy {
  return METRIC_COPY[metric];
}

export function buildFindingFromGap(
  gap: CompetitiveGap,
  competitorCount: number,
): CompetitiveFindingView | null {
  if (gap.gapDirection === "similar" || gap.magnitude === "small") {
    return null;
  }

  const family = findingFamilyFor(gap.metric);

  if (!family) {
    return null;
  }

  const copy = METRIC_COPY[gap.metric];
  const benchmarkLabel = formatBenchmarkLabel(competitorCount);
  const behind = gap.gapDirection === "behind";

  return {
    id: family,
    metric: gap.metric,
    direction: gap.gapDirection,
    magnitude: gap.magnitude,
    priority: copy.priorityFor(gap.magnitude),
    businessImpact: copy.businessImpact,
    title: behind ? copy.behindTitle : copy.aheadTitle,
    description: behind
      ? copy.behindDescription(gap, benchmarkLabel)
      : copy.aheadDescription(gap, benchmarkLabel),
    recommendation: behind
      ? copy.behindRecommendation
      : copy.aheadRecommendation,
    customerValue: gap.customerValue,
    benchmarkValue: gap.benchmarkValue,
    competitorValues: gap.competitorValues,
    unit: gap.unit,
  };
}

export function buildOpportunityFromGap(
  gap: CompetitiveGap,
): CompetitiveOpportunity | null {
  if (gap.gapDirection !== "behind" || gap.magnitude === "small") {
    return null;
  }

  const copy = METRIC_COPY[gap.metric];

  return {
    id: `opportunity-${gap.metric}`,
    metric: gap.metric,
    title: copy.opportunityTitle,
    description: copy.opportunityDescription,
    magnitude: gap.magnitude,
    businessImpact: copy.businessImpact,
    priority: copy.priorityFor(gap.magnitude),
    effort: copy.effort,
  };
}

export function coverageLabel(percent: number | null): string {
  if (percent === null) {
    return "Not enough data";
  }

  if (percent >= 80) {
    return "Strong";
  }

  if (percent >= 50) {
    return "Moderate";
  }

  return "Limited";
}

export function depthLabel(wordCount: number | null): string {
  if (wordCount === null) {
    return "Not enough data";
  }

  if (wordCount >= 500) {
    return "Substantial";
  }

  if (wordCount >= 250) {
    return "Moderate";
  }

  return "Limited";
}
