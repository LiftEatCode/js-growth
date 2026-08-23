/**
 * Growth Sprint 1 — North Star / KPI hierarchy.
 *
 * Do not celebrate Level 5 visibility growth if Levels 3–1 do not improve.
 */

export const KPI_HIERARCHY_VERSION = "kpi-hierarchy-v1";

export const KPI_HIERARCHY = [
  {
    level: 1,
    name: "Business",
    kpis: ["New Clients", "Qualified Opportunities", "Revenue"],
  },
  {
    level: 2,
    name: "Conversion",
    kpis: [
      "Agreements",
      "Proposals",
      "Audit Purchases",
      "Qualified Leads",
    ],
  },
  {
    level: 3,
    name: "Intent",
    kpis: [
      "Audit Starts",
      "Audit Completions",
      "Contact Actions",
      "Service Page Engagement",
    ],
  },
  {
    level: 4,
    name: "Acquisition",
    kpis: [
      "Qualified Website Traffic",
      "Organic Search Clicks",
      "Facebook Link Traffic",
      "GBP Website Traffic",
    ],
  },
  {
    level: 5,
    name: "Visibility",
    kpis: [
      "Search Impressions",
      "Facebook Reach",
      "Video Views",
      "GBP Visibility",
    ],
  },
] as const;

export type KpiLevel = (typeof KPI_HIERARCHY)[number]["level"];
