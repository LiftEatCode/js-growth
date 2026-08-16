import {
  MAX_COMPETITIVE_OPPORTUNITIES,
  MAX_SURFACED_GAPS,
  MAX_SURFACED_STRENGTHS,
} from "./constants";
import {
  buildFindingFromGap,
  buildOpportunityFromGap,
  formatMetricValue,
} from "./copy";
import { buildGap } from "./gaps";
import { median } from "./median";
import type {
  CompetitiveData,
  CompetitiveFindingView,
  CompetitiveGap,
  CompetitiveMetric,
  CompetitiveMetricUnit,
  CompetitiveOpportunity,
  CompetitiveSiteProfile,
  CompetitiveSkip,
} from "./types";

const SAMPLE_NOTE =
  "Values come from a prioritized representative scan, not a complete website inventory.";

interface MetricSpec {
  metric: CompetitiveMetric;
  unit: CompetitiveMetricUnit;
  higherIsBetter: boolean;
  read: (profile: CompetitiveSiteProfile) => number | null;
}

const METRICS: MetricSpec[] = [
  {
    metric: "service_pages",
    unit: "count",
    higherIsBetter: true,
    read: (profile) => profile.pages.service,
  },
  {
    metric: "location_pages",
    unit: "count",
    higherIsBetter: true,
    read: (profile) => profile.local.substantiveLocationPages,
  },
  {
    metric: "service_content_depth",
    unit: "words",
    higherIsBetter: true,
    read: (profile) => profile.content.medianServiceWordCount,
  },
  {
    metric: "thin_commercial_rate",
    unit: "percent",
    higherIsBetter: false,
    read: (profile) => profile.content.thinCommercialPercent,
  },
  {
    metric: "unique_titles",
    unit: "percent",
    higherIsBetter: true,
    read: (profile) => profile.search.uniqueTitlePercent,
  },
  {
    metric: "unique_descriptions",
    unit: "percent",
    higherIsBetter: true,
    read: (profile) => profile.search.uniqueDescriptionPercent,
  },
  {
    metric: "unique_h1s",
    unit: "percent",
    higherIsBetter: true,
    read: (profile) => profile.search.uniqueH1Percent,
  },
  {
    metric: "internal_link_support",
    unit: "percent",
    higherIsBetter: false,
    read: (profile) => profile.technical.weaklyLinkedServicePercent,
  },
  {
    metric: "cta_coverage",
    unit: "percent",
    higherIsBetter: true,
    read: (profile) => profile.conversion.ctaCoveragePercent,
  },
  {
    metric: "click_to_call_coverage",
    unit: "percent",
    higherIsBetter: true,
    read: (profile) => profile.conversion.clickToCallCoveragePercent,
  },
  {
    metric: "trust_coverage",
    unit: "percent",
    higherIsBetter: true,
    read: (profile) => profile.trust.keyPageTrustPercent,
  },
  {
    metric: "local_relevance",
    unit: "percent",
    higherIsBetter: true,
    read: (profile) => profile.local.localRelevancePercent,
  },
  {
    metric: "schema_presence",
    unit: "count",
    higherIsBetter: true,
    read: (profile) => profile.technical.usefulSchemaFamilyCount,
  },
  {
    metric: "indexability_issues",
    unit: "percent",
    higherIsBetter: false,
    read: (profile) => profile.search.indexabilityIssuePercent,
  },
  {
    metric: "broken_internal_links",
    unit: "percent",
    higherIsBetter: false,
    read: (profile) => profile.technical.brokenLinkRatePercent,
  },
  {
    metric: "performance_risk",
    unit: "risk",
    higherIsBetter: false,
    read: (profile) => performanceRiskValue(profile),
  },
];

function performanceRiskValue(
  profile: CompetitiveSiteProfile,
): number | null {
  const risk = profile.performance.optimizationRisk;

  if (risk === "low") {
    return 0;
  }

  if (risk === "moderate") {
    return 1;
  }

  if (risk === "high") {
    return 2;
  }

  return null;
}

function shouldSuppressServiceCoverageBehind(
  customer: CompetitiveSiteProfile,
  competitors: CompetitiveSiteProfile[],
): boolean {
  const competitorThin = competitors
    .map((profile) => profile.content.thinCommercialPercent)
    .filter((value): value is number => value !== null);
  const competitorWords = competitors
    .map((profile) => profile.content.medianServiceWordCount)
    .filter((value): value is number => value !== null);
  const competitorThinMedian = median(competitorThin);
  const competitorWordMedian = median(competitorWords);
  const customerThin = customer.content.thinCommercialPercent;
  const customerWords = customer.content.medianServiceWordCount;

  return (
    competitorThinMedian !== null &&
    competitorThinMedian >= 60 &&
    (customerThin ?? 100) < 40 &&
    (customerWords ?? 0) > (competitorWordMedian ?? 0) + 80
  );
}

function findingSortScore(finding: CompetitiveFindingView): number {
  const magnitudeScore =
    finding.magnitude === "large" ? 3 : finding.magnitude === "moderate" ? 2 : 0;
  const impactScore =
    finding.businessImpact === "high"
      ? 3
      : finding.businessImpact === "medium"
        ? 2
        : 1;
  const priorityScore =
    finding.priority === "high" ? 3 : finding.priority === "medium" ? 2 : 1;

  return magnitudeScore * 10 + impactScore * 3 + priorityScore;
}

function opportunitySortScore(item: CompetitiveOpportunity): number {
  const magnitudeScore = item.magnitude === "large" ? 3 : 2;
  const impactScore =
    item.businessImpact === "high"
      ? 3
      : item.businessImpact === "medium"
        ? 2
        : 1;
  const effortScore =
    item.effort === "easy" ? 3 : item.effort === "medium" ? 2 : 1;

  return magnitudeScore * 10 + impactScore * 4 + effortScore;
}

function dedupeByFamily(
  findings: CompetitiveFindingView[],
): CompetitiveFindingView[] {
  const seen = new Set<string>();
  const result: CompetitiveFindingView[] = [];

  for (const finding of findings) {
    if (seen.has(finding.id)) {
      continue;
    }

    seen.add(finding.id);
    result.push(finding);
  }

  return result;
}

export function compareCompetitiveProfiles(options: {
  customer: CompetitiveSiteProfile;
  competitors: CompetitiveSiteProfile[];
  skipped?: CompetitiveSkip[];
  submittedCount: number;
  suppliedCount: number;
  disclosure: string;
  runtimeMs: number;
}): CompetitiveData {
  const analyzed = options.competitors.filter(
    (profile) => profile.status === "analyzed",
  );
  const analyzedCount = analyzed.length;
  const status =
    analyzedCount === 0
      ? "unavailable"
      : analyzedCount < options.suppliedCount
        ? "partial"
        : "compared";

  if (analyzedCount === 0) {
    return {
      status,
      submittedCount: options.submittedCount,
      suppliedCount: options.suppliedCount,
      analyzedCount: 0,
      customer: options.customer,
      competitors: options.competitors,
      skipped: options.skipped ?? [],
      gaps: [],
      findings: [],
      strengths: [],
      opportunities: [],
      disclosure: options.disclosure,
      runtimeMs: options.runtimeMs,
    };
  }

  const suppressServiceBehind = shouldSuppressServiceCoverageBehind(
    options.customer,
    analyzed,
  );
  const gaps: CompetitiveGap[] = [];

  for (const spec of METRICS) {
    const customerValue = spec.read(options.customer);
    const competitorValues = analyzed
      .map((profile) => spec.read(profile))
      .filter((value): value is number => value !== null);

    if (customerValue === null || competitorValues.length === 0) {
      continue;
    }

    const benchmarkValue = median(competitorValues);

    if (benchmarkValue === null) {
      continue;
    }

    let gap = buildGap({
      metric: spec.metric,
      unit: spec.unit,
      customerValue,
      competitorValues,
      benchmarkValue,
      higherIsBetter: spec.higherIsBetter,
      sampleNote: SAMPLE_NOTE,
    });

    if (
      spec.metric === "service_pages" &&
      gap.gapDirection === "behind" &&
      suppressServiceBehind
    ) {
      gap = {
        ...gap,
        gapDirection: "similar",
        magnitude: "small",
      };
    }

    gaps.push(gap);
  }

  const findings = dedupeByFamily(
    gaps
      .map((gap) => buildFindingFromGap(gap, analyzedCount))
      .filter((finding): finding is CompetitiveFindingView => finding !== null)
      .filter((finding) => finding.direction === "behind")
      .sort((left, right) => findingSortScore(right) - findingSortScore(left)),
  ).slice(0, MAX_SURFACED_GAPS);

  const strengths = dedupeByFamily(
    gaps
      .map((gap) => buildFindingFromGap(gap, analyzedCount))
      .filter((finding): finding is CompetitiveFindingView => finding !== null)
      .filter((finding) => finding.direction === "ahead")
      .sort((left, right) => findingSortScore(right) - findingSortScore(left)),
  ).slice(0, MAX_SURFACED_STRENGTHS);

  const opportunities = gaps
    .map((gap) => buildOpportunityFromGap(gap))
    .filter((item): item is CompetitiveOpportunity => item !== null)
    .sort(
      (left, right) =>
        opportunitySortScore(right) - opportunitySortScore(left),
    )
    .filter(
      (item, index, list) =>
        list.findIndex((candidate) => candidate.title === item.title) === index,
    )
    .slice(0, MAX_COMPETITIVE_OPPORTUNITIES);

  return {
    status,
    submittedCount: options.submittedCount,
    suppliedCount: options.suppliedCount,
    analyzedCount,
    customer: options.customer,
    competitors: options.competitors,
    skipped: options.skipped ?? [],
    gaps,
    findings,
    strengths,
    opportunities,
    disclosure: options.disclosure,
    runtimeMs: options.runtimeMs,
  };
}

export function comparisonTableRows(data: CompetitiveData): Array<{
  metric: string;
  customer: string;
  benchmark: string;
}> {
  const looks = [
    { key: "service_pages" as const, label: "Service pages found" },
    { key: "location_pages" as const, label: "Substantive location pages" },
    { key: "service_content_depth" as const, label: "Median service-page depth" },
    { key: "thin_commercial_rate" as const, label: "Thin commercial pages" },
    { key: "cta_coverage" as const, label: "Key-page CTA coverage" },
    { key: "unique_titles" as const, label: "Unique titles" },
    { key: "trust_coverage" as const, label: "Trust-signal coverage" },
  ];

  return looks.flatMap((row) => {
    const gap = data.gaps.find((item) => item.metric === row.key);

    if (!gap) {
      return [];
    }

    return [
      {
        metric: row.label,
        customer: formatMetricValue(gap.customerValue, gap.unit),
        benchmark: formatMetricValue(gap.benchmarkValue, gap.unit),
      },
    ];
  });
}
