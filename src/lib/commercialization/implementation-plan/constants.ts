import type { ServiceCapabilityId } from "../capabilities/types";

/** Deterministic recommendation algorithm version. */
export const IMPLEMENTATION_PLAN_VERSION = 1;

/** Capability mapping / workstream rule version. */
export const IMPLEMENTATION_MAPPING_VERSION = 1;

export const MAX_WORKSTREAMS = 8;
export const MAX_ACTIONS_PER_WORKSTREAM = 8;
export const MAX_PRESERVATION_CONSTRAINTS = 4;
export const MAX_CRITICAL_WORKSTREAMS = 2;

/** Category percent (0–100) below which category weakness evidence is emitted. */
export const WEAK_CATEGORY_PERCENT_THRESHOLD = 70;

/** Category percent at/above which preservation may apply without competitive evidence. */
export const STRONG_CATEGORY_PERCENT_THRESHOLD = 85;

export type WorkstreamType =
  | "CONTENT_FOUNDATION"
  | "SEARCH_OPTIMIZATION"
  | "TECHNICAL_SEO"
  | "LOCAL_SEARCH_FOUNDATION"
  | "CONVERSION_OPTIMIZATION"
  | "WEBSITE_EXPERIENCE"
  | "PERFORMANCE_OPTIMIZATION";

export const WORKSTREAM_ORDER: WorkstreamType[] = [
  "TECHNICAL_SEO",
  "SEARCH_OPTIMIZATION",
  "CONTENT_FOUNDATION",
  "LOCAL_SEARCH_FOUNDATION",
  "CONVERSION_OPTIMIZATION",
  "WEBSITE_EXPERIENCE",
  "PERFORMANCE_OPTIMIZATION",
];

export const WORKSTREAM_TITLES: Record<WorkstreamType, string> = {
  CONTENT_FOUNDATION: "Content Foundation",
  SEARCH_OPTIMIZATION: "Search Optimization",
  TECHNICAL_SEO: "Technical SEO",
  LOCAL_SEARCH_FOUNDATION: "Local Search Foundation",
  CONVERSION_OPTIMIZATION: "Conversion Optimization",
  WEBSITE_EXPERIENCE: "Website Experience",
  PERFORMANCE_OPTIMIZATION: "Performance Optimization",
};

export const WORKSTREAM_DEFAULT_CAPABILITIES: Record<
  WorkstreamType,
  ServiceCapabilityId[]
> = {
  CONTENT_FOUNDATION: ["CONTENT", "SEO"],
  SEARCH_OPTIMIZATION: ["SEO"],
  TECHNICAL_SEO: ["SEO", "WEBSITE_DEVELOPMENT"],
  LOCAL_SEARCH_FOUNDATION: ["LOCAL_SEO"],
  CONVERSION_OPTIMIZATION: ["CONVERSION_OPTIMIZATION", "WEBSITE_DEVELOPMENT"],
  WEBSITE_EXPERIENCE: ["WEBSITE_DEVELOPMENT"],
  PERFORMANCE_OPTIMIZATION: ["WEBSITE_DEVELOPMENT"],
};
