export const MAX_DISCOVERY_CANDIDATES_PER_RUN = 25;

export const MAX_PLACES_PAGE_SIZE = 20;

export const MAX_PROVIDER_REQUESTS_PER_RUN = 3;

export const DISCOVERY_PROVIDER_GOOGLE_PLACES = "GOOGLE_PLACES";

export const DISCOVERY_REQUEST_TIMEOUT_MS = 10_000;

export const STALE_DISCOVERY_RUN_MS = 90_000;

/**
 * Places API (New) Text Search field mask.
 *
 * websiteUri is required so we can drop businesses with no public site.
 * That field bills the request as Text Search Enterprise. nationalPhoneNumber
 * is the same Enterprise SKU, so including it does not add Place Details
 * calls or a higher Atmosphere SKU.
 */
export const GOOGLE_PLACES_TEXT_SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.primaryType",
  "places.primaryTypeDisplayName",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "nextPageToken",
].join(",");

export const GOOGLE_PLACES_TEXT_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchText";

export const PROHIBITED_PLACES_FIELDS = [
  "reviews",
  "reviewSummary",
  "photos",
  "editorialSummary",
  "generativeSummary",
  "regularOpeningHours",
  "currentOpeningHours",
  "accessibilityOptions",
  "paymentOptions",
  "parkingOptions",
  "evChargeOptions",
  "priceLevel",
  "rating",
  "userRatingCount",
] as const;
