import "server-only";

import { GBP_PERFORMANCE_METRICS_V1 } from "@/lib/gbp/constants";
import { isGbpMockMode } from "@/lib/gbp/config";
import { createMockGbpProvider } from "@/lib/gbp/mock-provider";
import type {
  GoogleBusinessProfileProvider,
  GbpAccountSummary,
  GbpDailyMetricPoint,
  GbpLocationSummary,
  GbpRawLocation,
  GbpReviewAggregate,
} from "@/lib/gbp/provider";

const LOCATION_READ_MASK = [
  "name",
  "title",
  "phoneNumbers",
  "categories",
  "storefrontAddress",
  "websiteUri",
  "regularHours",
  "specialHours",
  "serviceArea",
  "profile",
  "serviceItems",
  "metadata",
  "openInfo",
].join(",");

async function googleGet<T>(
  url: string,
  accessToken: string,
): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = new Error(`GBP API ${res.status}`) as Error & { code?: string };
    if (res.status === 401 || res.status === 403) {
      err.code = "AUTH_EXPIRED";
    } else if (res.status === 429) {
      err.code = "QUOTA";
    } else {
      err.code = "ERROR";
    }
    throw err;
  }
  return (await res.json()) as T;
}

export function createLiveGbpProvider(): GoogleBusinessProfileProvider {
  return {
    async listAccounts(accessToken): Promise<GbpAccountSummary[]> {
      const data = await googleGet<{
        accounts?: Array<{ name?: string; accountName?: string }>;
      }>("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", accessToken);
      return (data.accounts ?? []).map((a) => {
        const resourceName = a.name ?? "";
        const accountId = resourceName.replace(/^accounts\//, "");
        return {
          resourceName,
          accountName: a.accountName ?? accountId,
          accountId,
        };
      });
    },

    async listLocations(accessToken, accountId): Promise<GbpLocationSummary[]> {
      const url =
        `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${encodeURIComponent(accountId)}/locations` +
        `?readMask=${encodeURIComponent("name,title")}&pageSize=100`;
      const data = await googleGet<{
        locations?: Array<{ name?: string; title?: string }>;
      }>(url, accessToken);
      return (data.locations ?? []).map((loc) => {
        const resourceName = loc.name ?? "";
        const locationId = resourceName.replace(/^locations\//, "");
        return {
          resourceName,
          locationId,
          title: loc.title ?? locationId,
          accountId,
        };
      });
    },

    async getLocation(accessToken, locationResourceName): Promise<GbpRawLocation> {
      const name = locationResourceName.startsWith("locations/")
        ? locationResourceName
        : `locations/${locationResourceName}`;
      const url =
        `https://mybusinessbusinessinformation.googleapis.com/v1/${name}` +
        `?readMask=${encodeURIComponent(LOCATION_READ_MASK)}`;
      return googleGet<GbpRawLocation>(url, accessToken);
    },

    async getReviewAggregate(
      accessToken,
      accountId,
      locationId,
    ): Promise<GbpReviewAggregate> {
      try {
        const url =
          `https://mybusiness.googleapis.com/v4/accounts/${encodeURIComponent(accountId)}` +
          `/locations/${encodeURIComponent(locationId)}/reviews?pageSize=1`;
        const data = await googleGet<{
          totalReviewCount?: number | string;
          averageRating?: number;
          reviews?: Array<{ reviewReply?: unknown }>;
        }>(url, accessToken);
        const total =
          typeof data.totalReviewCount === "string"
            ? Number(data.totalReviewCount)
            : data.totalReviewCount ?? null;
        // Page-size 1 list cannot compute unanswered coverage accurately.
        return {
          totalReviewCount:
            total != null && Number.isFinite(total) ? total : null,
          averageRating:
            typeof data.averageRating === "number" ? data.averageRating : null,
          unansweredCount: null,
        };
      } catch {
        return {
          totalReviewCount: null,
          averageRating: null,
          unansweredCount: null,
        };
      }
    },

    async fetchPerformance(accessToken, locationId, periodStart, periodEnd) {
      const [startY, startM, startD] = periodStart.split("-").map(Number);
      const [endY, endM, endD] = periodEnd.split("-").map(Number);
      const metricsQuery = GBP_PERFORMANCE_METRICS_V1.map(
        (m) => `dailyMetrics=${m}`,
      ).join("&");
      const url =
        `https://businessprofileperformance.googleapis.com/v1/locations/${encodeURIComponent(locationId)}` +
        `:fetchMultiDailyMetricsTimeSeries?${metricsQuery}` +
        `&dailyRange.start_date.year=${startY}&dailyRange.start_date.month=${startM}&dailyRange.start_date.day=${startD}` +
        `&dailyRange.end_date.year=${endY}&dailyRange.end_date.month=${endM}&dailyRange.end_date.day=${endD}`;

      const data = await googleGet<{
        multiDailyMetricTimeSeries?: Array<{
          dailyMetricTimeSeries?: Array<{
            dailyMetric?: string;
            timeSeries?: {
              datedValues?: Array<{
                date?: { year?: number; month?: number; day?: number };
                value?: string;
              }>;
            };
          }>;
        }>;
      }>(url, accessToken);

      const points: GbpDailyMetricPoint[] = [];
      for (const multi of data.multiDailyMetricTimeSeries ?? []) {
        for (const series of multi.dailyMetricTimeSeries ?? []) {
          const metric = series.dailyMetric ?? "UNKNOWN";
          for (const dv of series.timeSeries?.datedValues ?? []) {
            const y = dv.date?.year;
            const m = dv.date?.month;
            const d = dv.date?.day;
            if (!y || !m || !d) continue;
            const date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const value = Number(dv.value ?? 0);
            if (!Number.isFinite(value)) continue;
            points.push({ metric, date, value });
          }
        }
      }

      let keywords: Array<{ query: string; impressions: number | null }> = [];
      try {
        const kwUrl =
          `https://businessprofileperformance.googleapis.com/v1/locations/${encodeURIComponent(locationId)}` +
          `/searchkeywords/impressions/monthly?monthlyRange.start_month.year=${startY}` +
          `&monthlyRange.start_month.month=${startM}` +
          `&monthlyRange.end_month.year=${endY}` +
          `&monthlyRange.end_month.month=${endM}` +
          `&pageSize=20`;
        const kwData = await googleGet<{
          searchKeywordsCounts?: Array<{
            searchKeyword?: string;
            insightsValue?: { value?: string };
          }>;
        }>(kwUrl, accessToken);
        keywords = (kwData.searchKeywordsCounts ?? [])
          .slice(0, 20)
          .map((row) => ({
            query: (row.searchKeyword ?? "").slice(0, 120),
            impressions: row.insightsValue?.value
              ? Number(row.insightsValue.value)
              : null,
          }))
          .filter((k) => k.query);
      } catch {
        keywords = [];
      }

      return { points, keywords };
    },
  };
}

export function getGbpProvider(options?: {
  websiteWithoutUtm?: boolean;
  zeroMetrics?: boolean;
  missingWebsiteClicks?: boolean;
}): GoogleBusinessProfileProvider {
  if (isGbpMockMode()) {
    return createMockGbpProvider(options);
  }
  return createLiveGbpProvider();
}
