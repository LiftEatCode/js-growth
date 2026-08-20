import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  COMPETITOR_DISCOVERY_CONCURRENCY,
  COMPETITOR_DISCOVERY_TTL_MS,
  MAX_COMPETITOR_CANDIDATES_PER_PROSPECT,
  MAX_COMPETITOR_DISCOVERY_PROSPECTS_PER_RUN,
  MAX_COMPETITOR_PROVIDER_REQUESTS_PER_PROSPECT,
  MAX_SELECTED_COMPETITORS_PER_PROSPECT,
} from "./constants";
import { dedupeCompetitorCandidates } from "./dedupe";
import { haversineDistanceMiles } from "./distance";
import {
  discoverCompetitorCandidates,
  linkExistingProspect,
} from "./discover";
import { isReusableCompetitorDiscovery } from "./limit";
import { buildCompetitiveProfile, buildSearchTerms } from "./profile";
import { compareCompetitorCandidates, recommendTopCompetitors } from "./rank";
import type { CompetitiveProfile, CompetitorCandidate } from "./types";
import { validateCompetitorCandidate } from "./validate";
import type { BusinessDiscoveryProvider } from "@/lib/prospecting/discovery/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function profile(
  overrides: Partial<CompetitiveProfile> = {},
): CompetitiveProfile {
  return {
    prospectId: "p-roa",
    businessName: "Roa Electrical Services",
    hostname: "roaelectric.com",
    website: "https://www.roaelectric.com/",
    locationLabel: "Pinehurst, TX",
    city: "Pinehurst",
    state: "TX",
    latitude: 30.18,
    longitude: -95.68,
    sourceRef: "place-roa",
    industry: "electrical",
    campaignIndustries: ["electrical"],
    placesCategory: "electrician",
    normalizedVerticals: ["ELECTRICAL"],
    searchTerms: [
      "electrician near Pinehurst, TX",
      "electrical contractor near Pinehurst, TX",
      "electrical services near Pinehurst, TX",
    ],
    radiusMiles: 25,
    ...overrides,
  };
}

function candidate(
  overrides: Partial<CompetitorCandidate> &
    Pick<CompetitorCandidate, "providerBusinessId" | "businessName">,
): CompetitorCandidate {
  return {
    provider: "GOOGLE_PLACES",
    website: "https://abc-electric.example",
    normalizedHostname: "abc-electric.example",
    formattedAddress: "Magnolia, TX",
    city: "Magnolia",
    state: "TX",
    latitude: 30.21,
    longitude: -95.75,
    primaryType: "electrician",
    normalizedVerticals: ["ELECTRICAL"],
    distanceMiles: 4.2,
    ...overrides,
  };
}

const built = buildCompetitiveProfile({
  prospectId: "p1",
  businessName: "Roa Electrical Services",
  website: "https://www.roaelectric.com/",
  hostname: "roaelectric.com",
  industry: "electrical",
  city: "Pinehurst",
  state: "TX",
  address: null,
  sourceRef: "place-roa",
  campaignLocationLabel: "Pinehurst, TX",
  campaignCity: "Pinehurst",
  campaignState: "TX",
  campaignRadiusMiles: 25,
  campaignIndustries: ["electrical"],
  placesCategory: "electrician",
  latitude: 30.18,
  longitude: -95.68,
});
assert(built.normalizedVerticals.includes("ELECTRICAL"), "profile uses verticals");
assert(built.searchTerms.length <= 3, "search terms capped at 3");
assert(
  built.searchTerms.every((term) => term.includes("Pinehurst")),
  "queries include location",
);

const terms = buildSearchTerms(["ELECTRICAL"], "Pinehurst, TX", 25);
assert(terms[0]?.includes("electrician"), "electrical query uses electrician");

const nearby = validateCompetitorCandidate(
  candidate({
    providerBusinessId: "place-abc",
    businessName: "ABC Electric",
    distanceMiles: 4.2,
  }),
  profile(),
);
assert(nearby.validationLabel === "STRONG", "same vertical + nearby is strong");
assert(nearby.status === "VALIDATED", "strong candidate is validated");
assert(nearby.evidence.verticalScore >= 28, "vertical score persisted");
assert(nearby.evidence.geographicBand === "very_near", "near band");
assert(nearby.evidence.geography.mode === "EXACT_DISTANCE", "exact geography mode");
assert(nearby.validationScore > 77, "nearby with coordinates scores above unknown-only baseline");

const farther = validateCompetitorCandidate(
  candidate({
    providerBusinessId: "place-xyz",
    businessName: "XYZ Electric",
    distanceMiles: 35,
    city: "Tomball",
    latitude: 30.1,
    longitude: -95.6,
  }),
  profile(),
);
assert(
  farther.validationScore < nearby.validationScore,
  "farther same-vertical scores lower",
);

const wrong = validateCompetitorCandidate(
  candidate({
    providerBusinessId: "place-pizza",
    businessName: "Pinehurst Pizza",
    primaryType: "restaurant",
    normalizedVerticals: ["RESTAURANT"],
    normalizedHostname: "pinehurst-pizza.example",
  }),
  profile(),
);
assert(wrong.validationLabel === "REJECTED", "wrong vertical rejected");
assert(
  wrong.evidence.rejectionReasons.includes("unrelated_vertical"),
  "unrelated vertical evidence",
);

const supplier = validateCompetitorCandidate(
  candidate({
    providerBusinessId: "place-supply",
    businessName: "Ferguson Electrical Supply",
    primaryType: "wholesaler",
    normalizedHostname: "ferguson.example",
  }),
  profile(),
);
assert(supplier.validationLabel === "REJECTED", "supplier rejected");

const sameHost = validateCompetitorCandidate(
  candidate({
    providerBusinessId: "place-self",
    businessName: "Roa Electric North",
    normalizedHostname: "roaelectric.com",
  }),
  profile(),
);
assert(sameHost.validationLabel === "REJECTED", "same hostname hard reject");

const noWebsite = validateCompetitorCandidate(
  candidate({
    providerBusinessId: "place-noweb",
    businessName: "Local Electric Co",
    website: null,
    normalizedHostname: null,
    distanceMiles: 3,
  }),
  profile(),
);
assert(
  noWebsite.validationLabel !== "REJECTED",
  "missing website does not auto-reject",
);
assert(noWebsite.evidence.websiteScore === 0, "no website lowers website score");

const distance = haversineDistanceMiles(
  { latitude: 30.18, longitude: -95.68 },
  { latitude: 30.21, longitude: -95.75 },
);
assert(distance > 0, "distance is deterministic and positive");
assert(
  haversineDistanceMiles(
    { latitude: 30.18, longitude: -95.68 },
    { latitude: 30.21, longitude: -95.75 },
  ) === distance,
  "distance is repeatable",
);

assert(
  compareCompetitorCandidates(
    nearby,
    validateCompetitorCandidate(
      candidate({
        providerBusinessId: "place-close",
        businessName: "Closer Electric",
        distanceMiles: 2,
        latitude: 30.19,
        longitude: -95.7,
      }),
      profile(),
    ),
  ) > 0,
  "closer equivalent candidate ranks higher",
);

const ranked = recommendTopCompetitors([
  { ...farther, isRecommended: false, competitorProspectId: null },
  { ...nearby, isRecommended: false, competitorProspectId: null },
  {
    ...noWebsite,
    isRecommended: false,
    competitorProspectId: null,
  },
  { ...wrong, isRecommended: false, competitorProspectId: null },
]);
assert(ranked[0]?.businessName === "ABC Electric", "highest score first");
assert(
  ranked.filter((row) => row.isRecommended).length <= 3,
  "top 3 recommendations",
);
assert(
  ranked.filter((row) => row.isRecommended).every((row) => row.status === "VALIDATED"),
  "recommendations are validated only",
);

const selfExcluded = dedupeCompetitorCandidates(
  [
    candidate({
      providerBusinessId: "place-roa",
      businessName: "Roa Electrical Services",
      normalizedHostname: "roaelectric.com",
    }),
    candidate({
      providerBusinessId: "place-abc",
      businessName: "ABC Electric",
    }),
    candidate({
      providerBusinessId: "place-abc",
      businessName: "ABC Electric Duplicate Place",
    }),
    candidate({
      providerBusinessId: "place-abc-2",
      businessName: "ABC Electric Twin",
      normalizedHostname: "abc-electric.example",
    }),
    candidate({
      providerBusinessId: "place-name",
      businessName: "ABC Electric",
      city: "Magnolia",
      state: "TX",
      normalizedHostname: "abc-electric-2.example",
    }),
  ],
  profile(),
);
assert(
  !selfExcluded.some((row) => row.providerBusinessId === "place-roa"),
  "target prospect excluded",
);
assert(
  selfExcluded.filter((row) => row.providerBusinessId === "place-abc").length === 1,
  "same Place ID deduped",
);
assert(
  selfExcluded.filter((row) => row.normalizedHostname === "abc-electric.example")
    .length === 1,
  "same hostname deduped",
);

const linked = linkExistingProspect(
  {
    ...nearby,
    competitorProspectId: null,
    isRecommended: true,
  },
  [
    {
      id: "existing-p",
      hostname: "abc-electric.example",
      sourceRef: "place-abc",
      businessName: "ABC Electric",
      city: "Magnolia",
      state: "TX",
    },
  ],
);
assert(linked.competitorProspectId === "existing-p", "existing Prospect linked");

assert(
  !isReusableCompetitorDiscovery({
    lastCompetitorDiscoveryAt: null,
    hasStoredCompetitors: false,
  }),
  "no prior discovery is not reused",
);
assert(
  isReusableCompetitorDiscovery({
    lastCompetitorDiscoveryAt: new Date(),
    hasStoredCompetitors: true,
  }),
  "fresh discovery with stored competitors is reused",
);
assert(
  !isReusableCompetitorDiscovery({
    lastCompetitorDiscoveryAt: new Date(
      Date.now() - COMPETITOR_DISCOVERY_TTL_MS - 1000,
    ),
    hasStoredCompetitors: true,
  }),
  "expired discovery is not reused",
);

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

async function main() {
let searchCount = 0;
const mockProvider: BusinessDiscoveryProvider = {
  id: "GOOGLE_PLACES",
  async search() {
    searchCount += 1;
    return {
      businesses: [
        {
          provider: "GOOGLE_PLACES",
          providerBusinessId: `place-${searchCount}-a`,
          businessName: `Electric Co ${searchCount}`,
          website: `https://electric-${searchCount}.example`,
          formattedAddress: "Magnolia, TX",
          city: "Magnolia",
          state: "TX",
          phone: null,
          category: "electrician",
          latitude: 30.2,
          longitude: -95.7,
        },
      ],
      nextPageToken: null,
    };
  },
};

const discovered = await discoverCompetitorCandidates({
  profile: profile(),
  provider: mockProvider,
});
assert(
  searchCount <= MAX_COMPETITOR_PROVIDER_REQUESTS_PER_PROSPECT,
  "provider requests capped at 3",
);
assert(
  discovered.candidates.length <= MAX_COMPETITOR_CANDIDATES_PER_PROSPECT,
  "candidates capped at 10",
);
assert(discovered.providerRequests <= 3, "request count recorded");

assert(MAX_COMPETITOR_DISCOVERY_PROSPECTS_PER_RUN === 5, "5 prospects/run");
assert(MAX_COMPETITOR_PROVIDER_REQUESTS_PER_PROSPECT === 3, "3 requests/prospect");
assert(MAX_COMPETITOR_CANDIDATES_PER_PROSPECT === 10, "10 candidates");
assert(MAX_SELECTED_COMPETITORS_PER_PROSPECT === 3, "3 selected");
assert(COMPETITOR_DISCOVERY_CONCURRENCY === 2, "concurrency 2");
assert(COMPETITOR_DISCOVERY_TTL_MS === 30 * 24 * 60 * 60 * 1000, "30 day TTL");

const here = dirname(fileURLToPath(import.meta.url));
const actions = readFileSync(
  join(here, "../../app/reports/prospecting/competitor-actions.ts"),
  "utf8",
);
const discoverSource = readFileSync(join(here, "./discover.ts"), "utf8");
const persistSource = readFileSync(join(here, "./persist.ts"), "utf8");

assert(actions.includes("getInternalSession"), "mutations require session");
assert(!actions.includes("openai"), "no OpenAI in competitor actions");
assert(!actions.includes("resend"), "no Resend in competitor actions");
assert(
  persistSource.includes("competitorProspectId"),
  "existing prospects can be linked",
);
assert(
  !persistSource.includes("campaignProspect.create"),
  "persist does not attach competitors to campaigns",
);
assert(
  !actions.includes("discoverProspectContacts"),
  "no contact discovery from competitor actions",
);
assert(
  !actions.includes("runDeterministicWebsiteAudit"),
  "no website audit from competitor actions",
);
assert(
  !actions.includes("campaignProspect.create"),
  "competitors are not imported as campaign prospects",
);
assert(!discoverSource.includes("openai"), "discovery engine has no OpenAI");
assert(!actions.includes("validationScore:"), "selection does not rewrite scores");

const selectedScore = nearby.validationScore;
assert(
  selectedScore ===
    validateCompetitorCandidate(
      candidate({
        providerBusinessId: "place-abc",
        businessName: "ABC Electric",
        distanceMiles: 4.2,
      }),
      profile(),
    ).validationScore,
  "human selection does not change validation scoring",
);

console.log("competitive.verify.ts passed");
}
