import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { classifyDiscoveredBusinesses, countClassifications } from "./classify";
import { collectDiscoveryBusinesses } from "./collect";
import {
  GOOGLE_PLACES_TEXT_SEARCH_FIELD_MASK,
  MAX_DISCOVERY_CANDIDATES_PER_RUN,
  MAX_PLACES_PAGE_SIZE,
  MAX_PROVIDER_REQUESTS_PER_RUN,
  PROHIBITED_PLACES_FIELDS,
} from "./constants";
import { normalizeGooglePlace } from "./google-places-normalize";
import { buildImportedProspectData } from "./import-data";
import { buildPlacesTextQuery, industrySearchPhrase } from "./industries";
import { clampDiscoveryLimit } from "./limit";
import type {
  BusinessDiscoveryProvider,
  DiscoveredBusiness,
  DiscoveryDedupContext,
} from "./types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function business(
  overrides: Partial<DiscoveredBusiness> &
    Pick<DiscoveredBusiness, "providerBusinessId" | "businessName">,
): DiscoveredBusiness {
  return {
    provider: "GOOGLE_PLACES",
    website: null,
    formattedAddress: null,
    city: null,
    state: null,
    phone: null,
    category: null,
    latitude: null,
    longitude: null,
    ...overrides,
  };
}

function emptyContext(
  overrides: Partial<DiscoveryDedupContext> = {},
): DiscoveryDedupContext {
  return {
    campaignProspectHostnames: new Set(),
    campaignProspectPlaceIds: new Set(),
    prospectHostnames: new Map(),
    prospectPlaceIds: new Map(),
    leadHostnames: new Set(),
    suppressedHostnames: new Set(),
    ...overrides,
  };
}

const mockPlace = normalizeGooglePlace({
  id: "ChIJSoftLaunch1",
  displayName: { text: "Magnolia HVAC Co" },
  formattedAddress: "100 Main St, Magnolia, TX 77354, USA",
  websiteUri: "https://www.magnoliahvac.com/services",
  nationalPhoneNumber: "(281) 555-0100",
  primaryType: "hvac_contractor",
  primaryTypeDisplayName: { text: "HVAC contractor" },
  location: { latitude: 30.2104, longitude: -95.7508 },
});

assert(mockPlace !== null, "mock Google place normalizes");
assert(mockPlace?.businessName === "Magnolia HVAC Co", "name");
assert(mockPlace?.website === "https://www.magnoliahvac.com/services", "website");
assert(mockPlace?.providerBusinessId === "ChIJSoftLaunch1", "Place ID");
assert(
  mockPlace?.formattedAddress === "100 Main St, Magnolia, TX 77354, USA",
  "address",
);
assert(mockPlace?.city === "Magnolia", "parsed city");
assert(mockPlace?.state === "TX", "parsed state");
assert(mockPlace?.category === "HVAC contractor", "category");
assert(mockPlace?.phone === "(281) 555-0100", "phone");
assert(mockPlace?.latitude === 30.2104, "latitude");
assert(mockPlace?.longitude === -95.7508, "longitude");

assert(
  normalizeGooglePlace({ displayName: { text: "No ID" } }) === null,
  "places without an id are dropped",
);

assert(
  clampDiscoveryLimit(100) === MAX_DISCOVERY_CANDIDATES_PER_RUN,
  "requested limits above 25 are clamped",
);
assert(clampDiscoveryLimit(0) === 1, "zero is raised to at least 1 then usable");
assert(
  clampDiscoveryLimit(undefined) === MAX_DISCOVERY_CANDIDATES_PER_RUN,
  "missing limit uses the server constant",
);

const fieldMask = GOOGLE_PLACES_TEXT_SEARCH_FIELD_MASK;
assert(fieldMask.includes("places.id"), "field mask includes Place ID");
assert(fieldMask.includes("places.location"), "field mask includes coordinates");
assert(
  fieldMask.includes("places.nationalPhoneNumber"),
  "field mask includes national phone on the same Enterprise SKU",
);
assert(!fieldMask.includes("places.reviews"), "reviews are not requested");

for (const field of PROHIBITED_PLACES_FIELDS) {
  assert(
    !fieldMask.split(",").some((entry) => entry.includes(field)),
    `field mask must not request ${field}`,
  );
}

assert(industrySearchPhrase("HVAC") === "HVAC contractor", "HVAC mapping");
assert(industrySearchPhrase("Plumbing") === "plumber", "Plumbing mapping");
assert(industrySearchPhrase("Roofing") === "roofing contractor", "Roofing mapping");
assert(industrySearchPhrase("Electrical") === "electrician", "Electrical mapping");
assert(industrySearchPhrase("Landscaping") === "landscaper", "Landscaping mapping");
assert(
  industrySearchPhrase("Custom Cabinets") === "Custom Cabinets",
  "unknown industries fall back to the campaign text",
);

const query = buildPlacesTextQuery({
  industry: "HVAC",
  locationLabel: "Magnolia, TX",
  radiusMiles: 25,
});
assert(query.includes("HVAC contractor"), "query uses mapped industry phrase");
assert(query.includes("Magnolia, TX"), "query includes campaign location");
assert(query.includes("25 miles"), "query includes radius in text");

let providerCalls = 0;
let maxPageSizeSeen = 0;
const floodProvider: BusinessDiscoveryProvider = {
  id: "GOOGLE_PLACES",
  async search(request) {
    providerCalls += 1;
    maxPageSizeSeen = Math.max(maxPageSizeSeen, request.pageSize);
    const businesses = Array.from({ length: request.pageSize }, (_, index) =>
      business({
        providerBusinessId: `place-${providerCalls}-${index}`,
        businessName: `Business ${providerCalls}-${index}`,
        website: `https://example-${providerCalls}-${index}.com`,
      }),
    );
    return {
      businesses,
      nextPageToken: providerCalls === 1 ? "page-2" : null,
    };
  },
};

async function main(): Promise<void> {
  const collected = await collectDiscoveryBusinesses({
  provider: floodProvider,
  industries: ["HVAC"],
  locationLabel: "Magnolia, TX",
  radiusMiles: 25,
  requestedLimit: 100,
});

assert(
  collected.businesses.length === MAX_DISCOVERY_CANDIDATES_PER_RUN,
  "collect clamps to 25 candidates",
);
assert(
  collected.providerRequestCount === 2,
  "a full 25-candidate HVAC run uses two Text Search pages, not Place Details",
);
assert(maxPageSizeSeen <= MAX_PLACES_PAGE_SIZE, "Places pageSize never exceeds 20");
assert(
  collected.providerRequestCount <= MAX_PROVIDER_REQUESTS_PER_RUN,
  "provider requests stay within the hard cap",
);

const classified = classifyDiscoveredBusinesses(
  [
    business({
      providerBusinessId: "place-dup",
      businessName: "Dup Place A",
      website: "https://dup-place.com",
    }),
    business({
      providerBusinessId: "place-dup",
      businessName: "Dup Place B",
      website: "https://dup-place-b.com",
    }),
    business({
      providerBusinessId: "place-noweb",
      businessName: "No Website LLC",
    }),
    business({
      providerBusinessId: "place-host-a",
      businessName: "Host A",
      website: "https://www.same-host.com",
    }),
    business({
      providerBusinessId: "place-host-b",
      businessName: "Host B",
      website: "https://same-host.com/about",
    }),
    business({
      providerBusinessId: "place-suppressed",
      businessName: "Suppressed Co",
      website: "https://suppressed.example",
    }),
    business({
      providerBusinessId: "place-campaign",
      businessName: "Soft Launch Batch 1 HVAC",
      website: "https://www.magnoliaair.com",
    }),
    business({
      providerBusinessId: "place-lead",
      businessName: "Existing Lead Co",
      website: "https://inbound-lead.com",
    }),
    business({
      providerBusinessId: "place-prospect",
      businessName: "Existing Prospect Co",
      website: "https://existing-prospect.com",
    }),
    business({
      providerBusinessId: "place-eligible",
      businessName: "Eligible HVAC",
      website: "https://www.eligible-hvac.com/home",
      formattedAddress: "200 Oak St, Magnolia, TX 77354, USA",
      city: "Magnolia",
      state: "TX",
      phone: "(281) 555-0199",
      category: "HVAC contractor",
    }),
  ],
  emptyContext({
    campaignProspectHostnames: new Set(["magnoliaair.com"]),
    leadHostnames: new Set(["inbound-lead.com"]),
    prospectHostnames: new Map([["existing-prospect.com", "prospect-1"]]),
    suppressedHostnames: new Set(["suppressed.example"]),
  }),
);

assert(classified[0]?.status === "ELIGIBLE", "first Place ID is kept");
assert(classified[1]?.status === "DUPLICATE_PLACE", "duplicate Place ID is excluded");

const byId = new Map(
  classified
    .filter((candidate, index) => index !== 1)
    .map((candidate) => [candidate.business.providerBusinessId, candidate]),
);
assert(byId.get("place-noweb")?.status === "NO_WEBSITE", "missing website is ineligible");
assert(byId.get("place-host-a")?.status === "ELIGIBLE", "first hostname is kept");
assert(
  byId.get("place-host-b")?.status === "DUPLICATE_HOSTNAME",
  "duplicate hostname in the same run is excluded",
);
assert(byId.get("place-suppressed")?.status === "SUPPRESSED", "suppression is classified");
assert(
  byId.get("place-campaign")?.status === "ALREADY_IN_CAMPAIGN",
  "existing Soft Launch Batch 1 hostname is not a new candidate",
);
assert(byId.get("place-lead")?.status === "EXISTING_LEAD", "existing Lead website is excluded");
assert(
  byId.get("place-prospect")?.status === "EXISTING_PROSPECT",
  "existing Prospect hostname is excluded",
);
assert(byId.get("place-eligible")?.status === "ELIGIBLE", "fresh website remains eligible");
assert(byId.get("place-eligible")?.hostname === "eligible-hvac.com", "import hostname is normalized");

const counts = countClassifications(classified);
assert(counts.returnedCount === 10, "all Google rows are counted");
assert(counts.eligibleCount === 3, "eligible count excludes known and incomplete rows");
assert(counts.skippedNoWebsiteCount === 1, "no-website rows are counted");
assert(counts.skippedSuppressedCount === 1, "suppressed rows are counted");

const imported = buildImportedProspectData(byId.get("place-eligible")!);
assert(imported.sourceType === "GOOGLE_PLACES", "import source is GOOGLE_PLACES");
assert(imported.sourceRef === "place-eligible", "Place ID is stored as sourceRef");
assert(imported.hostname === "eligible-hvac.com", "imported hostname is normalized");
assert(imported.website.startsWith("https://"), "imported website stays a public URL");
assert(imported.businessName === "Eligible HVAC", "business name is preserved");

try {
  buildImportedProspectData(byId.get("place-noweb")!);
  throw new Error("no-website candidates must not import");
} catch (error) {
  assert(
    error instanceof Error && error.message.includes("eligible"),
    "no-website import is rejected",
  );
}

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(here, "../../..");

function walkTsFiles(directory: string, files: string[] = []): string[] {
  for (const entry of readdirSync(directory)) {
    if (entry === "generated" || entry === "node_modules") {
      continue;
    }

    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walkTsFiles(fullPath, files);
      continue;
    }

    if (extname(entry) === ".ts" || extname(entry) === ".tsx") {
      files.push(fullPath);
    }
  }

  return files;
}

const providerSource = readFileSync(join(here, "google-places-provider.ts"), "utf8");
const constantsSource = readFileSync(join(here, "constants.ts"), "utf8");
assert(providerSource.includes('import "server-only"'), "provider is server-only");
assert(
  constantsSource.includes("places.googleapis.com/v1/places:searchText"),
  "Text Search (New) is used",
);
assert(providerSource.includes("GOOGLE_PLACES_TEXT_SEARCH_URL"), "provider calls Text Search URL");
assert(!providerSource.includes("places:get"), "no Place Details follow-up");
assert(!providerSource.includes("NEXT_PUBLIC_"), "provider does not use public env vars");
assert(
  !/console\.(log|info|error|warn)\([^)]*apiKey/.test(providerSource),
  "provider does not log the API key",
);

const actionsSource = readFileSync(
  join(here, "../../../app/reports/prospecting/discovery-actions.ts"),
  "utf8",
);
assert(actionsSource.includes("getInternalSession"), "discovery actions verify the session");
assert(!actionsSource.includes("openai"), "discovery does not call OpenAI");
assert(!actionsSource.includes("resend"), "discovery does not send email");
assert(!actionsSource.includes("stripe"), "discovery does not touch Stripe");
assert(!actionsSource.includes("auditWebsite"), "discovery does not run website audits");
assert(!actionsSource.includes("prisma.lead.create"), "import does not create Leads");
assert(
  !actionsSource.includes("prisma.auditReport.create"),
  "import does not create AuditReports",
);
assert(
  !actionsSource.includes("prisma.prospectContact.create"),
  "import does not create ProspectContacts",
);
assert(
  !actionsSource.includes("prisma.outreachMessage.create"),
  "import does not create OutreachMessages",
);
assert(
  actionsSource.includes('sourceType: "GOOGLE_PLACES"'),
  "new prospects are sourced from Google Places",
);
assert(
  actionsSource.includes("MAX_DISCOVERY_CANDIDATES_PER_RUN"),
  "discovery uses the server-side candidate cap",
);

const envExample = readFileSync(join(here, "../../../../.env.example"), "utf8");
assert(
  envExample.includes("GOOGLE_PLACES_API_KEY="),
  ".env.example documents the server-only Places key",
);
assert(
  !envExample.includes("NEXT_PUBLIC_GOOGLE_PLACES"),
  ".env.example does not expose a public Places key",
);

for (const file of walkTsFiles(srcRoot).filter(
  (path) => !path.endsWith(".verify.ts"),
)) {
  const source = readFileSync(file, "utf8");
  assert(
    !source.includes("NEXT_PUBLIC_GOOGLE"),
    `${file} must not use NEXT_PUBLIC_GOOGLE_*`,
  );
}

const schema = readFileSync(join(here, "../../../../prisma/schema.prisma"), "utf8");
assert(schema.includes("GOOGLE_PLACES"), "ProspectSourceType includes GOOGLE_PLACES");
assert(schema.includes("model ProspectDiscoveryRun"), "discovery run model exists");
assert(
  schema.includes("model ProspectDiscoveryCandidate"),
  "discovery candidate model exists",
);

console.log("discovery.verify.ts passed");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
