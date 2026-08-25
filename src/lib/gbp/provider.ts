import type {
  GbpPerformanceWindowV1,
  GbpProfileSnapshotV1,
} from "@/lib/gbp/constants";

export type GbpAccountSummary = {
  resourceName: string;
  accountName: string;
  accountId: string;
};

export type GbpLocationSummary = {
  resourceName: string;
  locationId: string;
  title: string;
  accountId: string;
};

export type GbpRawLocation = Record<string, unknown>;

export type GbpReviewAggregate = {
  totalReviewCount: number | null;
  averageRating: number | null;
  unansweredCount: number | null;
};

export type GbpDailyMetricPoint = {
  metric: string;
  date: string;
  value: number;
};

export interface GoogleBusinessProfileProvider {
  listAccounts(accessToken: string): Promise<GbpAccountSummary[]>;
  listLocations(
    accessToken: string,
    accountId: string,
  ): Promise<GbpLocationSummary[]>;
  getLocation(
    accessToken: string,
    locationResourceName: string,
  ): Promise<GbpRawLocation>;
  getReviewAggregate(
    accessToken: string,
    accountId: string,
    locationId: string,
  ): Promise<GbpReviewAggregate>;
  fetchPerformance(
    accessToken: string,
    locationId: string,
    periodStart: string,
    periodEnd: string,
  ): Promise<{
    points: GbpDailyMetricPoint[];
    keywords: Array<{ query: string; impressions: number | null }>;
  }>;
}

export type { GbpProfileSnapshotV1, GbpPerformanceWindowV1 };
