import {
  GBP_READ_INTEGRATION_VERSION,
  type GbpPerformanceWindowV1,
  type GbpProfileSnapshotV1,
} from "@/lib/gbp/constants";
import type {
  GbpDailyMetricPoint,
  GbpRawLocation,
  GbpReviewAggregate,
} from "@/lib/gbp/provider";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function str(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function summarizeHours(raw: unknown): string | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const periods = Array.isArray(rec.periods) ? rec.periods : [];
  if (periods.length === 0) return "NO_PERIODS";
  return `${periods.length} period(s)`;
}

function summarizeSpecialHours(raw: unknown): string | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const periods = Array.isArray(rec.specialHourPeriods)
    ? rec.specialHourPeriods
    : [];
  if (periods.length === 0) return "NONE";
  return `${periods.length} special period(s)`;
}

function summarizeServiceArea(raw: unknown): {
  summary: string | null;
  isServiceArea: boolean;
} {
  const rec = asRecord(raw);
  if (!rec) return { summary: null, isServiceArea: false };
  const businessType = str(rec.businessType) ?? "";
  const isServiceArea =
    businessType.includes("CUSTOMER_LOCATION") ||
    businessType.includes("CUSTOMER_AND_BUSINESS");
  const places = asRecord(rec.places);
  const infos = Array.isArray(places?.placeInfos) ? places!.placeInfos : [];
  const names = infos
    .map((p) => str(asRecord(p)?.placeName))
    .filter((n): n is string => Boolean(n));
  const summary =
    names.length > 0
      ? `${businessType || "SERVICE_AREA"}: ${names.slice(0, 5).join(", ")}`
      : businessType || null;
  return { summary, isServiceArea: isServiceArea || names.length > 0 };
}

function extractServices(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const rec = asRecord(item);
    if (!rec) continue;
    const free = asRecord(rec.freeFormServiceItem);
    const label = asRecord(free?.label);
    const display = str(label?.displayName);
    if (display) out.push(display);
    const structured = asRecord(rec.structuredServiceItem);
    const serviceTypeId = str(structured?.serviceTypeId);
    if (serviceTypeId) out.push(serviceTypeId);
  }
  return out.slice(0, 40);
}

export function normalizeGbpLocation(
  raw: GbpRawLocation,
  reviews: GbpReviewAggregate | null,
): GbpProfileSnapshotV1 {
  const phone = asRecord(raw.phoneNumbers);
  const categories = asRecord(raw.categories);
  const primary = asRecord(categories?.primaryCategory);
  const additional = Array.isArray(categories?.additionalCategories)
    ? categories!.additionalCategories
    : [];
  const profile = asRecord(raw.profile);
  const serviceArea = summarizeServiceArea(raw.serviceArea);
  const hasStorefront = Boolean(asRecord(raw.storefrontAddress));

  return {
    version: GBP_READ_INTEGRATION_VERSION,
    locationResourceName: str(raw.name) ?? "",
    title: str(raw.title),
    primaryPhone: str(phone?.primaryPhone),
    websiteUri: str(raw.websiteUri),
    primaryCategory: primary
      ? {
          name: str(primary.name),
          displayName: str(primary.displayName),
        }
      : null,
    additionalCategories: additional
      .map((c) => {
        const rec = asRecord(c);
        return {
          name: str(rec?.name),
          displayName: str(rec?.displayName),
        };
      })
      .filter((c) => c.name || c.displayName),
    description: str(profile?.description),
    regularHoursSummary: summarizeHours(raw.regularHours),
    specialHoursSummary: summarizeSpecialHours(raw.specialHours),
    serviceAreaSummary: serviceArea.summary,
    isServiceAreaBusiness: serviceArea.isServiceArea,
    hasStorefrontAddress: hasStorefront,
    serviceItems: extractServices(raw.serviceItems),
    reviewCount: reviews?.totalReviewCount ?? null,
    averageRating: reviews?.averageRating ?? null,
    unansweredReviewCount: reviews?.unansweredCount ?? null,
    syncedAt: new Date().toISOString(),
  };
}

function sumMetric(
  points: GbpDailyMetricPoint[],
  metrics: string[],
): number | null {
  const filtered = points.filter((p) => metrics.includes(p.metric));
  if (filtered.length === 0) return null;
  return filtered.reduce((acc, p) => acc + p.value, 0);
}

export function normalizePerformanceWindow(input: {
  periodStart: string;
  periodEnd: string;
  points: GbpDailyMetricPoint[];
  keywords: Array<{ query: string; impressions: number | null }>;
}): GbpPerformanceWindowV1 {
  const searchViews = sumMetric(input.points, [
    "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
    "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  ]);
  const mapsViews = sumMetric(input.points, [
    "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
    "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
  ]);
  const profileViews =
    searchViews == null && mapsViews == null
      ? null
      : (searchViews ?? 0) + (mapsViews ?? 0);

  return {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    profileViews,
    searchViews,
    mapsViews,
    websiteClicks: sumMetric(input.points, ["WEBSITE_CLICKS"]),
    callClicks: sumMetric(input.points, ["CALL_CLICKS"]),
    directionRequests: sumMetric(input.points, [
      "BUSINESS_DIRECTION_REQUESTS",
    ]),
    messages: sumMetric(input.points, ["BUSINESS_CONVERSATIONS"]),
    bookings: sumMetric(input.points, ["BUSINESS_BOOKINGS"]),
    topSearchKeywords: input.keywords.slice(0, 20),
  };
}

export function defaultWeeklyPerformanceWindow(now = new Date()): {
  periodStart: string;
  periodEnd: string;
} {
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1),
  );
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  return {
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  };
}
