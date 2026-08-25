import type {
  GoogleBusinessProfileProvider,
  GbpAccountSummary,
  GbpDailyMetricPoint,
  GbpLocationSummary,
  GbpRawLocation,
  GbpReviewAggregate,
} from "@/lib/gbp/provider";

/**
 * Deterministic fixtures for acceptance — LIVE GOOGLE = 0.
 * Simulates JS Solutions as a service-area business.
 */
export const MOCK_GBP_ACCOUNTS: GbpAccountSummary[] = [
  {
    resourceName: "accounts/mock-account-1",
    accountName: "JS Solutions",
    accountId: "mock-account-1",
  },
  {
    resourceName: "accounts/mock-account-2",
    accountName: "Other Account",
    accountId: "mock-account-2",
  },
];

export const MOCK_GBP_LOCATIONS: GbpLocationSummary[] = [
  {
    resourceName: "locations/mock-location-js",
    locationId: "mock-location-js",
    title: "JS Solutions",
    accountId: "mock-account-1",
  },
  {
    resourceName: "locations/mock-location-other",
    locationId: "mock-location-other",
    title: "Another Business",
    accountId: "mock-account-1",
  },
];

export function mockJsSolutionsLocation(opts?: {
  websiteUri?: string;
}): GbpRawLocation {
  return {
    name: "locations/mock-location-js",
    title: "JS Solutions",
    phoneNumbers: { primaryPhone: "+1 281 555 0100" },
    websiteUri:
      opts?.websiteUri ??
      "https://jsgrowth.com/?utm_source=google_business_profile&utm_medium=organic_local&utm_campaign=gbp_profile&utm_content=website",
    categories: {
      primaryCategory: {
        name: "categories/gcid:website_designer",
        displayName: "Website designer",
      },
      additionalCategories: [
        {
          name: "categories/gcid:internet_marketing_service",
          displayName: "Internet marketing service",
        },
      ],
    },
    profile: {
      description:
        "Custom websites, Local SEO, AI automation, and digital growth solutions for local businesses.",
    },
    regularHours: {
      periods: [
        {
          openDay: "MONDAY",
          openTime: { hours: 9 },
          closeDay: "MONDAY",
          closeTime: { hours: 17 },
        },
      ],
    },
    specialHours: { specialHourPeriods: [] },
    serviceArea: {
      businessType: "CUSTOMER_LOCATION_ONLY",
      places: {
        placeInfos: [{ placeName: "Magnolia, TX", placeId: "mock-place" }],
      },
    },
    serviceItems: [
      { freeFormServiceItem: { label: { displayName: "Web Design" } } },
      { freeFormServiceItem: { label: { displayName: "Local SEO" } } },
      {
        freeFormServiceItem: {
          label: { displayName: "Google Business Profile Optimization" },
        },
      },
    ],
    metadata: { canHaveFoodMenus: false },
  };
}

export function createMockGbpProvider(options?: {
  websiteWithoutUtm?: boolean;
  failAuth?: boolean;
  zeroMetrics?: boolean;
  missingWebsiteClicks?: boolean;
}): GoogleBusinessProfileProvider {
  return {
    async listAccounts() {
      if (options?.failAuth) {
        const err = new Error("Unauthorized") as Error & { code?: string };
        err.code = "AUTH_EXPIRED";
        throw err;
      }
      return MOCK_GBP_ACCOUNTS;
    },
    async listLocations(_token, accountId) {
      return MOCK_GBP_LOCATIONS.filter((l) => l.accountId === accountId);
    },
    async getLocation() {
      return mockJsSolutionsLocation({
        websiteUri: options?.websiteWithoutUtm
          ? "https://jsgrowth.com/"
          : undefined,
      });
    },
    async getReviewAggregate(): Promise<GbpReviewAggregate> {
      return {
        totalReviewCount: 4,
        averageRating: 5,
        unansweredCount: 1,
      };
    },
    async fetchPerformance(_token, _locationId, periodStart, periodEnd) {
      const days: string[] = [];
      const start = new Date(`${periodStart}T00:00:00.000Z`);
      const end = new Date(`${periodEnd}T00:00:00.000Z`);
      for (
        let d = new Date(start);
        d.getTime() <= end.getTime();
        d.setUTCDate(d.getUTCDate() + 1)
      ) {
        days.push(d.toISOString().slice(0, 10));
      }
      const points: GbpDailyMetricPoint[] = [];
      const zero = options?.zeroMetrics === true;
      for (const date of days) {
        points.push({
          metric: "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
          date,
          value: zero ? 0 : 3,
        });
        points.push({
          metric: "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
          date,
          value: zero ? 0 : 5,
        });
        points.push({
          metric: "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
          date,
          value: zero ? 0 : 1,
        });
        points.push({
          metric: "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
          date,
          value: zero ? 0 : 2,
        });
        if (!options?.missingWebsiteClicks) {
          points.push({
            metric: "WEBSITE_CLICKS",
            date,
            value: zero ? 0 : 1,
          });
        }
        points.push({ metric: "CALL_CLICKS", date, value: zero ? 0 : 0 });
        points.push({
          metric: "BUSINESS_DIRECTION_REQUESTS",
          date,
          value: zero ? 0 : 0,
        });
        points.push({
          metric: "BUSINESS_CONVERSATIONS",
          date,
          value: zero ? 0 : 0,
        });
      }
      return {
        points,
        keywords: [
          { query: "website designer magnolia", impressions: 12 },
          { query: "local seo near me", impressions: 8 },
        ],
      };
    },
  };
}
