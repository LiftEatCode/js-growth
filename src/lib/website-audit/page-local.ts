import { normalizeWhitespace } from "./page-metadata";
import type { AuditLocalSignalSource } from "./types";

export const MAX_LOCALITY_EVIDENCE = 20;
export const MAX_SERVICE_AREA_LOCATIONS = 20;
export const MAX_LOCAL_EVIDENCE_SAMPLES = 20;
export const LOCAL_BUSINESS_EVIDENCE_THRESHOLD = 2;

export const LOCAL_BUSINESS_SCHEMA_TYPES = new Set([
  "LocalBusiness",
  "AutomotiveBusiness",
  "AutoRepair",
  "Dentist",
  "MedicalBusiness",
  "ProfessionalService",
  "HomeAndConstructionBusiness",
  "Electrician",
  "GeneralContractor",
  "HVACBusiness",
  "Plumber",
  "RoofingContractor",
  "Restaurant",
  "Store",
]);

export const STREET_ADDRESS_PATTERN =
  /\b\d{1,6}\s+[A-Za-z0-9.'#-]+(?:\s+[A-Za-z0-9.'#-]+){0,5}\s+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct|parkway|pkwy|highway|hwy|circle|cir|trail|trl|way|place|pl)\b/gi;

export const CITY_STATE_ABBREVIATION_PATTERN =
  /\b((?:The\s+)?[A-Z][a-z]+(?:[\s-][A-Z][a-z]+){0,3}),\s*([A-Z]{2})\b/g;

export const CITY_STATE_NAME_PATTERN =
  /\b((?:The\s+)?[A-Z][a-z]+(?:[\s-][A-Z][a-z]+){0,3}),\s*(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New\s+Hampshire|New\s+Jersey|New\s+Mexico|New\s+York|North\s+Carolina|North\s+Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode\s+Island|South\s+Carolina|South\s+Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West\s+Virginia|Wisconsin|Wyoming)\b/g;

export const CITY_STATE_ZIP_PATTERN =
  /\b((?:The\s+)?[A-Z][a-z]+(?:[\s-][A-Z][a-z]+){0,3}),\s*([A-Z]{2})\s+\d{5}(?:-\d{4})?\b/g;

export const US_STATE_ABBREVIATIONS = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL",
  "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
  "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
  "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
]);

export const SERVICE_AREA_PHRASES = [
  "service area",
  "areas we serve",
  "service areas",
  "proudly serving",
  "serving customers throughout",
  "serving customers in",
  "serving homeowners in",
  "serving businesses in",
  "serving the following communities",
  "we serve",
  "communities we serve",
];

const SERVING_NON_GEOGRAPHIC_FOLLOWERS =
  "(?:as|in|on|with|under|during|after|before|since|until|from)";

const SERVING_LOCATION_PATTERN = new RegExp(
  `\\b(?:[Pp]roudly\\s+)?[Ss]erving\\b(?!\\s+(?:[Aa]s|[Ii]n|[Oo]n|[Ww]ith|[Uu]nder|[Dd]uring|[Aa]fter|[Bb]efore|[Ss]ince|[Uu]ntil|[Ff]rom)\\b)(?:\\s+\\w+){0,8}\\s+[A-Z][a-zA-Z]+`,
);

const SERVICE_AREA_WINDOW_PATTERN = new RegExp(
  `\\b(?:service area|areas we serve|proudly serving|serving customers|we serve|serving(?!\\s+${SERVING_NON_GEOGRAPHIC_FOLLOWERS}\\b))\\b[^.!?]{0,180}`,
  "gi",
);

export const LOCATION_PATH_PATTERNS = [
  /\/locations?\//i,
  /\/service-areas?\//i,
  /\/areas-we-serve\//i,
];

const SAAS_PHRASES = [
  "start free trial",
  "free trial",
  "sign up",
  "pricing",
  "api documentation",
  "developer api",
  "saas",
];

export function countGlobalMatches(
  text: string,
  pattern: RegExp,
): string[] {
  const globalPattern = new RegExp(
    pattern.source,
    pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`,
  );

  return [...text.matchAll(globalPattern)].map((match) => match[0]);
}

export function collectStreetAddresses(text: string): string[] {
  return uniqueLocalValues(
    countGlobalMatches(text, STREET_ADDRESS_PATTERN).filter(
      (match) => !/took\s+place/i.test(match),
    ),
  );
}

export function collectCityStateSignals(text: string): string[] {
  const values: string[] = [];

  for (const match of text.matchAll(
    new RegExp(CITY_STATE_ZIP_PATTERN.source, "g"),
  )) {
    const city = match[1];
    const region = match[2];

    if (city && region) {
      values.push(`${city}, ${region}`);
    }
  }

  for (const match of text.matchAll(
    new RegExp(CITY_STATE_ABBREVIATION_PATTERN.source, "g"),
  )) {
    const city = match[1];
    const region = match[2];

    if (city && region && US_STATE_ABBREVIATIONS.has(region)) {
      values.push(`${city}, ${region}`);
    }
  }

  for (const match of text.matchAll(
    /\b((?:The\s+)?[A-Z][a-z]+(?:[\s-][A-Z][a-z]+){0,3})\s+([A-Z]{2})\b/g,
  )) {
    const city = match[1];
    const region = match[2];

    if (city && region && US_STATE_ABBREVIATIONS.has(region)) {
      values.push(`${city}, ${region}`);
    }
  }

  for (const match of text.matchAll(
    new RegExp(CITY_STATE_NAME_PATTERN.source, "g"),
  )) {
    values.push(match[0]);
  }

  return uniqueLocalValues(values);
}

export function textContainsPhrase(text: string, phrase: string): boolean {
  return ` ${normalizeWhitespace(text).toLowerCase()} `.includes(
    ` ${phrase} `,
  );
}

export function hasServiceAreaLanguage(text: string): boolean {
  if (SERVICE_AREA_PHRASES.some((phrase) => textContainsPhrase(text, phrase))) {
    return true;
  }

  return SERVING_LOCATION_PATTERN.test(text);
}

export function collectServiceAreaMentions(text: string): string[] {
  const mentions: string[] = [];
  const windows = text.match(SERVICE_AREA_WINDOW_PATTERN);

  for (const window of windows ?? []) {
    mentions.push(...collectCityStateSignals(window));

    const serving = window.match(
      /\b(?:serving|we serve)\b[:\s]+([A-Z][A-Za-z\s,]+)/,
    );
    const list = serving?.[1];

    if (!list) {
      continue;
    }

    for (const part of list.split(/\s*(?:,|and|&)\s*/)) {
      const value = normalizeWhitespace(part).replace(/\.$/, "");

      if (value.length >= 3 && /^[A-Z]/.test(value) && value.split(" ").length <= 4) {
        mentions.push(value);
      }
    }
  }

  return uniqueLocalValues(mentions);
}

export function hasVisibleHoursSignal(text: string): boolean {
  const normalized = normalizeWhitespace(text).toLowerCase();

  if (
    normalized.includes("business hours") ||
    normalized.includes("opening hours") ||
    normalized.includes("hours of operation") ||
    /\bopen\s+monday\b/.test(normalized) ||
    /\bmonday\s*[-–to]+\s*friday\b/.test(normalized) ||
    /\bmon(?:day)?\s*[-–]\s*fri(?:day)?\b/.test(normalized)
  ) {
    return true;
  }

  return (
    /\b(?:hours)\b.{0,20}\b\d{1,2}\s*(?:am|pm)\b/i.test(text) ||
    /\b\d{1,2}\s*(?:am|pm)\s*[-–to]+\s*\d{1,2}\s*(?:am|pm)\b/i.test(text)
  );
}

export function hasTwentyFourSevenSignal(text: string): boolean {
  return /\b24\s*\/\s*7\b/.test(text) || /\bopen\s+24\s+hours\b/i.test(text);
}

export function isLocationPath(pathname: string): boolean {
  return LOCATION_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function isServiceAreaPath(pathname: string): boolean {
  return /\/service-areas?\//i.test(pathname) || /\/areas-we-serve\//i.test(pathname);
}

export function looksLikeSaasMarketing(text: string): boolean {
  const normalized = normalizeWhitespace(text).toLowerCase();
  const hits = SAAS_PHRASES.filter((phrase) => normalized.includes(phrase));

  return hits.length >= 2;
}

export function uniqueLocalValues(values: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const normalized = normalizeWhitespace(value);

    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(normalized);
  }

  return unique;
}

export function boundLocalEvidence(
  values: string[],
  limit = MAX_LOCAL_EVIDENCE_SAMPLES,
): { items: string[]; detailsTruncated: boolean } {
  return {
    items: values.slice(0, limit),
    detailsTruncated: values.length > limit,
  };
}

export function boundLocalitySignals(
  items: Array<{ value: string; source: AuditLocalSignalSource }>,
): {
  items: Array<{ value: string; source: AuditLocalSignalSource }>;
  detailsTruncated: boolean;
} {
  return {
    items: items.slice(0, MAX_LOCALITY_EVIDENCE),
    detailsTruncated: items.length > MAX_LOCALITY_EVIDENCE,
  };
}
