export const DEFAULT_DESIRED_QUALIFIED_COUNT = 5;

export const MIN_DESIRED_QUALIFIED_COUNT = 1;

export const MAX_DESIRED_QUALIFIED_COUNT = 50;

export const MAX_CAMPAIGN_NAME_LENGTH = 120;

export const MAX_LOCATION_LABEL_LENGTH = 160;

export const MAX_NOTES_LENGTH = 4000;

export const MAX_SKIP_REASON_LENGTH = 2000;

export const MIN_SKIP_REASON_LENGTH = 3;

export const MAX_BUSINESS_NAME_LENGTH = 160;

export const MAX_INDUSTRY_LENGTH = 80;

export const MAX_CITY_LENGTH = 80;

export const MAX_STATE_LENGTH = 40;

export const MAX_ADDRESS_LENGTH = 240;

export const MAX_PHONE_LENGTH = 40;

export const MAX_RADIUS_MILES = 500;

export const SUGGESTED_INDUSTRIES = [
  "HVAC",
  "Plumbing",
  "Roofing",
  "Electrical",
  "Landscaping",
] as const;

export const DUPLICATE_WARNING_NOTICE =
  "This hostname already exists in prospecting, the inbound lead pipeline, or the suppression list. Sprint 1 allows adding anyway after confirmation. Later sprints will treat prior outreach, customers, and suppression entries as hard blocks.";
