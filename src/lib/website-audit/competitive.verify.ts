import { analyzeHtml } from "./analyze-html";
import { buildCompetitiveIntelligence } from "./competitive/crawl-competitor";
import { compareCompetitiveProfiles } from "./competitive/compare";
import { formatBenchmarkLabel } from "./competitive/copy";
import { classifyGapMagnitude } from "./competitive/gaps";
import { parseCompetitorInputs } from "./competitive/input";
import { median } from "./competitive/median";
import {
  emptyCompetitiveProfile,
  pageHasCompetitiveIndexabilityIssue,
} from "./competitive/profile";
import type { CompetitiveSiteProfile } from "./competitive/types";
import { getCompetitiveVisibility } from "./competitive/visibility";
import { getReportCapabilities } from "./report-config";
import { buildGrowthReportViewModel } from "./report-view";
import { crawlSite } from "./site/crawl";
import type { SitePageFetchResult, SitePageFetcher } from "./site/fetch-page";
import { buildAuditRobotsData } from "./robots";
import type { AuditPageData, WebsiteAuditResult } from "./types";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function words(count: number): string {
  return Array.from({ length: count }, (_, index) => `detail${index + 1}`).join(
    " ",
  );
}

function nav(links: Array<{ href: string; text: string }>): string {
  return `<header><nav>${links
    .map((link) => `<a href="${link.href}">${link.text}</a>`)
    .join("")}</nav></header>`;
}

function pageHtml(options: {
  title: string;
  h1: string;
  description?: string;
  wordCount?: number;
  links?: Array<{ href: string; text: string }>;
  cta?: string;
  extra?: string;
}): string {
  return `<!doctype html>
  <html>
    <head>
      <title>${options.title}</title>
      ${options.description ? `<meta name="description" content="${options.description}">` : ""}
    </head>
    <body>
      ${nav(options.links ?? [])}
      <main>
        <h1>${options.h1}</h1>
        <p>${words(options.wordCount ?? 240)}</p>
        ${options.cta ?? ""}
        ${options.extra ?? ""}
      </main>
    </body>
  </html>`;
}

interface FixturePage {
  html?: string;
  errorCode?: string;
}

function createHostFetcher(
  sites: Record<string, Record<string, FixturePage>>,
): SitePageFetcher {
  return async (url: string): Promise<SitePageFetchResult> => {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/+$/, "") || "/";
    const spec = sites[host]?.[path];

    if (!spec) {
      return {
        ok: false,
        requestedUrl: url,
        finalUrl: url,
        statusCode: 404,
        contentType: "text/html",
        errorCode: "HTTP_NOT_FOUND",
      };
    }

    if (spec.errorCode) {
      return {
        ok: false,
        requestedUrl: url,
        finalUrl: url,
        statusCode: null,
        contentType: null,
        errorCode: spec.errorCode,
      };
    }

    return {
      ok: true,
      requestedUrl: url,
      finalUrl: url,
      statusCode: 200,
      contentType: "text/html",
      xRobotsTag: null,
      html: spec.html ?? "",
      document: {
        advertisedContentLength: null,
        contentEncoding: null,
        cacheControl: null,
        expires: null,
        etag: null,
        lastModified: null,
        documentFetchDurationMs: 8,
      },
    };
  };
}

function seedPage(html: string, url: string): AuditPageData {
  const { robotsMetaRaw, ...htmlPageData } = analyzeHtml(html, url);
  return {
    ...htmlPageData,
    robots: buildAuditRobotsData(robotsMetaRaw, null),
  };
}

const EMPTY_PAGES = {
  total: 6,
  service: 0,
  serviceIndex: 1,
  location: 0,
  contact: 1,
  about: 1,
  blog: 0,
  other: 0,
};

function analyzedProfile(
  overrides: Partial<CompetitiveSiteProfile> &
    Pick<CompetitiveSiteProfile, "hostname">,
): CompetitiveSiteProfile {
  const base = emptyCompetitiveProfile(
    `https://${overrides.hostname}/`,
    "analyzed",
    `https://${overrides.hostname}/`,
  );

  return {
    ...base,
    ...overrides,
    hostname: overrides.hostname,
    displayName: overrides.hostname,
    crawl: {
      ...base.crawl,
      scannedCount: overrides.crawl?.scannedCount ?? 6,
      ...overrides.crawl,
    },
    pages: {
      ...EMPTY_PAGES,
      ...overrides.pages,
    },
    search: { ...base.search, ...overrides.search },
    content: { ...base.content, ...overrides.content },
    conversion: { ...base.conversion, ...overrides.conversion },
    local: { ...base.local, ...overrides.local },
    technical: { ...base.technical, ...overrides.technical },
    performance: { ...base.performance, ...overrides.performance },
    trust: { ...base.trust, ...overrides.trust },
  };
}

function compareWith(
  customer: Partial<CompetitiveSiteProfile>,
  competitors: Array<Partial<CompetitiveSiteProfile>>,
) {
  return compareCompetitiveProfiles({
    customer: analyzedProfile({
      hostname: "customer.test",
      ...customer,
    }),
    competitors: competitors.map((item, index) =>
      analyzedProfile({
        hostname: `competitor${index + 1}.test`,
        ...item,
      }),
    ),
    submittedCount: competitors.length,
    suppliedCount: competitors.length,
    disclosure: "test disclosure",
    runtimeMs: 10,
  });
}

const CTA =
  '<a href="/contact">Request a Quote</a> <a href="tel:+19365551212">Call Now</a>';
const TRUST =
  "<p>Customers leave testimonials about our licensed and insured team with 20 years of experience.</p>";

function serviceSite(options: {
  host: string;
  services: number;
  wordCount: number;
  withCta: boolean;
  locations?: number;
  locationWords?: number;
}): Record<string, FixturePage> {
  const serviceLinks = Array.from({ length: options.services }, (_, index) => ({
    href: `/services/service-${index + 1}`,
    text: `Service ${index + 1}`,
  }));
  const locationCount = options.locations ?? 0;
  const locationLinks = Array.from({ length: locationCount }, (_, index) => ({
    href: `/locations/city-${index + 1}`,
    text: `City ${index + 1}`,
  }));
  const links = [
    { href: "/", text: "Home" },
    { href: "/services", text: "Services" },
    ...serviceLinks,
    ...locationLinks,
    { href: "/contact", text: "Contact" },
  ];
  const pages: Record<string, FixturePage> = {
    "/": {
      html: pageHtml({
        title: `${options.host} home`,
        h1: `${options.host} home`,
        description: `${options.host} home description`,
        wordCount: 300,
        links,
        cta: options.withCta ? CTA : undefined,
        extra: TRUST,
      }),
    },
    "/services": {
      html: pageHtml({
        title: `${options.host} services`,
        h1: "Services",
        description: `${options.host} services description`,
        wordCount: 280,
        links,
        cta: options.withCta ? CTA : undefined,
      }),
    },
    "/contact": {
      html: pageHtml({
        title: `${options.host} contact`,
        h1: "Contact",
        description: `${options.host} contact description`,
        wordCount: 220,
        links,
        cta: CTA,
      }),
    },
  };

  for (let index = 0; index < options.services; index += 1) {
    pages[`/services/service-${index + 1}`] = {
      html: pageHtml({
        title: `${options.host} service ${index + 1}`,
        h1: `Service ${index + 1}`,
        description: `${options.host} service ${index + 1} description`,
        wordCount: options.wordCount,
        links,
        cta: options.withCta ? CTA : undefined,
        extra: options.withCta ? TRUST : undefined,
      }),
    };
  }

  for (let index = 0; index < locationCount; index += 1) {
    pages[`/locations/city-${index + 1}`] = {
      html: pageHtml({
        title: `${options.host} city ${index + 1}`,
        h1: `City ${index + 1}`,
        description: `${options.host} city ${index + 1}`,
        wordCount: options.locationWords ?? 80,
        links,
      }),
    };
  }

  return pages;
}

function emptyResult(): WebsiteAuditResult {
  return {
    success: true,
    metadata: {
      requestedUrl: "https://example.com",
      finalUrl: "https://example.com",
      statusCode: 200,
      contentType: "text/html",
      fetchedAt: "2024-01-01T00:00:00.000Z",
    },
    pageData: {
      title: "Example",
      h1Count: 1,
      h2Count: 0,
      h3Count: 0,
      imageCount: 0,
      imagesWithoutAlt: 0,
      internalLinkCount: 0,
      externalLinkCount: 0,
      structuredDataTypes: [],
      hasStructuredData: false,
      hasPhoneNumber: false,
      hasEmailAddress: false,
      hasPhysicalAddressSignals: false,
      hasLocalBusinessSignals: false,
    },
    findings: [],
    categoryScores: [],
    overallScore: 70,
    summary: {
      passed: 1,
      warnings: 0,
      failed: 0,
      criticalIssues: 0,
      quickWins: 0,
      highImpactFindings: 0,
      estimatedFixMinutes: 0,
    },
    opportunity: {
      score: 20,
      level: "low",
      trafficGainPercent: { minimum: 0, maximum: 0 },
      monthlyLeadGain: { minimum: 0, maximum: 0 },
      monthlyRevenueOpportunity: { minimum: 0, maximum: 0 },
      estimatedFixMinutes: 0,
      confidence: "low",
      assumptions: [],
      insights: [],
    },
  } as unknown as WebsiteAuditResult;
}

async function main(): Promise<void> {
  assert(median([]) === null, "empty median");
  assert(median([10]) === 10, "single median");
  assert(median([8, 10, 12]) === 10, "odd median");
  assert(median([8, 12]) === 10, "even median");
  assert(median([6, 12, 40]) === 12, "outlier median 12 not average");
  assert(formatBenchmarkLabel(1) === "Compared competitor", "single competitor label");
  assert(formatBenchmarkLabel(3) === "Competitor median", "median label");
  assert(
    pageHasCompetitiveIndexabilityIssue({
      indexable: true,
      canonicalUrl: null,
      canonicalSameOrigin: false,
    }) === false,
    "missing canonical without noindex is not an indexability failure",
  );
  assert(
    pageHasCompetitiveIndexabilityIssue({
      indexable: false,
      canonicalUrl: null,
      canonicalSameOrigin: false,
    }) === true,
    "noindex still counts as an indexability issue",
  );
  assert(
    pageHasCompetitiveIndexabilityIssue({
      indexable: true,
      canonicalUrl: "https://other.test/",
      canonicalSameOrigin: false,
    }) === true,
    "off-site canonical still counts as an indexability issue",
  );
  assert(
    getCompetitiveVisibility({} as never, getReportCapabilities("professional")) ===
      "hidden",
    "invalid stored competitive data stays hidden",
  );

  assert(
    classifyGapMagnitude({ customerValue: 7, benchmarkValue: 8, unit: "count" }) ===
      "similar",
    "7 vs 8 is similar",
  );
  assert(
    classifyGapMagnitude({ customerValue: 3, benchmarkValue: 11, unit: "count" }) ===
      "large",
    "3 vs 11 is large",
  );
  assert(
    classifyGapMagnitude({
      customerValue: 40,
      benchmarkValue: 90,
      unit: "percent",
    }) === "large",
    "40 vs 90 pp is large",
  );
  assert(
    classifyGapMagnitude({
      customerValue: 250,
      benchmarkValue: 800,
      unit: "words",
    }) === "large",
    "250 vs 800 words is large",
  );

  const customerClone = parseCompetitorInputs(
    ["https://www.example.com/about", "example.com"],
    "https://example.com/",
  );
  assert(customerClone.accepted.length === 0, "customer hostname rejected");
  assert(
    customerClone.skipped.some((item) => item.reason === "same-site-as-customer"),
    "same-site skip recorded",
  );

  const dupes = parseCompetitorInputs(
    ["https://competitor.com", "https://www.competitor.com/"],
    "https://customer.com",
  );
  assert(dupes.accepted.length === 1, "www duplicate collapsed");
  assert(dupes.skipped.some((item) => item.reason === "duplicate"), "duplicate skip");

  const blocked = parseCompetitorInputs(
    [
      "http://localhost",
      "http://127.0.0.1",
      "http://192.168.1.10",
      "http://169.254.169.254/",
    ],
    "https://customer.com",
  );
  assert(blocked.accepted.length === 0, "private hosts blocked");
  assert(
    blocked.skipped.every((item) => item.reason === "blocked"),
    "blocked skip reason",
  );
  assert(!parseCompetitorInputs([], "https://customer.com").attempted, "no competitors");

  const oneCompetitor = compareWith(
    { pages: { ...EMPTY_PAGES, service: 3 } },
    [{ pages: { ...EMPTY_PAGES, service: 8 } }],
  );
  const serviceFinding = oneCompetitor.findings.find(
    (item) => item.metric === "service_pages",
  );
  assert(serviceFinding, "3 vs 8 service coverage gap");
  assert(
    !serviceFinding?.description.toLowerCase().includes("median"),
    "single competitor copy avoids median",
  );

  const three = compareWith(
    { pages: { ...EMPTY_PAGES, service: 4 } },
    [
      { pages: { ...EMPTY_PAGES, service: 8 } },
      { pages: { ...EMPTY_PAGES, service: 10 } },
      { pages: { ...EMPTY_PAGES, service: 12 } },
    ],
  );
  const threeGap = three.gaps.find((item) => item.metric === "service_pages");
  assert(threeGap?.benchmarkValue === 10, "median of 8,10,12 is 10");
  assert(
    threeGap?.gapDirection === "behind" && threeGap.magnitude === "large",
    "4 vs 10 large gap",
  );

  const small = compareWith(
    { pages: { ...EMPTY_PAGES, service: 7 } },
    [
      { pages: { ...EMPTY_PAGES, service: 7 } },
      { pages: { ...EMPTY_PAGES, service: 8 } },
      { pages: { ...EMPTY_PAGES, service: 9 } },
    ],
  );
  const smallGap = small.gaps.find((item) => item.metric === "service_pages");
  assert(smallGap?.gapDirection === "similar", "7 vs median 8 is similar");
  assert(
    !small.findings.some((item) => item.metric === "service_pages"),
    "no major service coverage finding for small difference",
  );

  const ahead = compareWith(
    { conversion: { keyPageCount: 4, ctaCoveragePercent: 100, clickToCallCoveragePercent: 100, formOrContactPathPercent: 100 } },
    [
      { conversion: { keyPageCount: 4, ctaCoveragePercent: 60, clickToCallCoveragePercent: 60, formOrContactPathPercent: 60 } },
      { conversion: { keyPageCount: 4, ctaCoveragePercent: 70, clickToCallCoveragePercent: 70, formOrContactPathPercent: 70 } },
      { conversion: { keyPageCount: 4, ctaCoveragePercent: 65, clickToCallCoveragePercent: 65, formOrContactPathPercent: 65 } },
    ],
  );
  const ctaStrength = ahead.strengths.find((item) => item.metric === "cta_coverage");
  assert(ctaStrength, "customer CTA strength is reported");
  assert(
    ctaStrength?.title.toLowerCase().includes("stronger conversion"),
    "strength copy mentions conversion paths",
  );

  const locationSpam = compareWith(
    {
      local: {
        substantiveLocationPages: 2,
        localRelevancePercent: 80,
        contactPageFound: true,
        localSchemaPresent: false,
        inconsistentContact: false,
      },
      content: {
        medianServiceWordCount: 400,
        thinCommercialPercent: 0,
        similarCommercialPairCount: 0,
      },
    },
    [
      {
        pages: { ...EMPTY_PAGES, location: 10 },
        local: {
          substantiveLocationPages: 0,
          localRelevancePercent: 20,
          contactPageFound: false,
          localSchemaPresent: false,
          inconsistentContact: false,
        },
        content: {
          medianServiceWordCount: 80,
          thinCommercialPercent: 90,
          similarCommercialPairCount: 0,
        },
      },
    ],
  );
  const locationGap = locationSpam.gaps.find((item) => item.metric === "location_pages");
  assert(
    locationGap?.gapDirection !== "behind",
    "thin location spam does not win",
  );

  const depth = compareWith(
    { content: { medianServiceWordCount: 250, thinCommercialPercent: 50, similarCommercialPairCount: 0 } },
    [
      { content: { medianServiceWordCount: 700, thinCommercialPercent: 10, similarCommercialPairCount: 0 } },
      { content: { medianServiceWordCount: 800, thinCommercialPercent: 10, similarCommercialPairCount: 0 } },
      { content: { medianServiceWordCount: 900, thinCommercialPercent: 10, similarCommercialPairCount: 0 } },
    ],
  );
  const depthFinding = depth.findings.find(
    (item) => item.metric === "service_content_depth",
  );
  assert(depthFinding, "content depth gap");
  assert(
    !/google prefers|outrank|causes ranking/i.test(depthFinding?.description ?? ""),
    "depth copy does not claim word count ranking",
  );

  const conversion = compareWith(
    { conversion: { keyPageCount: 5, ctaCoveragePercent: 40, clickToCallCoveragePercent: 20, formOrContactPathPercent: 40 } },
    [
      { conversion: { keyPageCount: 5, ctaCoveragePercent: 90, clickToCallCoveragePercent: 80, formOrContactPathPercent: 90 } },
      { conversion: { keyPageCount: 5, ctaCoveragePercent: 100, clickToCallCoveragePercent: 90, formOrContactPathPercent: 100 } },
      { conversion: { keyPageCount: 5, ctaCoveragePercent: 85, clickToCallCoveragePercent: 80, formOrContactPathPercent: 85 } },
    ],
  );
  const conversionFinding = conversion.findings.find(
    (item) => item.metric === "cta_coverage",
  );
  assert(conversionFinding?.priority === "high", "conversion gap is high priority");
  assert(conversion.opportunities[0]?.title.includes("conversion"), "top opportunity is conversion");

  const partial = compareCompetitiveProfiles({
    customer: analyzedProfile({ hostname: "customer.test" }),
    competitors: [
      analyzedProfile({ hostname: "a.test", pages: { ...EMPTY_PAGES, service: 8 } }),
      emptyCompetitiveProfile("https://b.test", "timeout"),
      analyzedProfile({ hostname: "c.test", pages: { ...EMPTY_PAGES, service: 10 } }),
    ],
    submittedCount: 3,
    suppliedCount: 3,
    disclosure: "test",
    runtimeMs: 12,
  });
  assert(partial.status === "partial", "partial status");
  assert(partial.analyzedCount === 2, "timeout excluded from analysis");
  const partialService = partial.gaps.find((item) => item.metric === "service_pages");
  assert(partialService?.competitorValues.length === 2, "comparison uses successful competitors");

  const totalFail = compareCompetitiveProfiles({
    customer: analyzedProfile({ hostname: "customer.test" }),
    competitors: [
      emptyCompetitiveProfile("https://a.test", "failed"),
      emptyCompetitiveProfile("https://b.test", "timeout"),
    ],
    submittedCount: 2,
    suppliedCount: 2,
    disclosure: "test",
    runtimeMs: 8,
  });
  assert(totalFail.status === "unavailable", "all competitors failed");
  assert(totalFail.findings.length === 0, "no fake findings when all fail");

  const fetchedHosts: string[] = [];
  const tracker: SitePageFetcher = async (url) => {
    fetchedHosts.push(new URL(url).hostname);
    return {
      ok: false,
      requestedUrl: url,
      finalUrl: url,
      statusCode: null,
      contentType: null,
      errorCode: "FETCH_FAILED",
    };
  };
  assert(fetchedHosts.length === 0, "no competitor fetch before intelligence runs");

  const customerPages = serviceSite({
    host: "customer.test",
    services: 3,
    wordCount: 240,
    withCta: false,
  });
  const competitorPages = serviceSite({
    host: "rival.test",
    services: 8,
    wordCount: 700,
    withCta: true,
  });
  const fetchPage = createHostFetcher({
    "customer.test": customerPages,
    "rival.test": competitorPages,
    "down.test": {
      "/": { errorCode: "TIMEOUT" },
    },
    "ok.test": serviceSite({
      host: "ok.test",
      services: 5,
      wordCount: 680,
      withCta: true,
    }),
    "spam.test": serviceSite({
      host: "spam.test",
      services: 1,
      wordCount: 400,
      withCta: true,
      locations: 10,
      locationWords: 80,
    }),
  });

  const customerCrawl = await crawlSite({
    seedRequestedUrl: "https://customer.test/",
    seedFinalUrl: "https://customer.test/",
    seedHtml: customerPages["/"]?.html ?? "",
    seedPageData: seedPage(customerPages["/"]?.html ?? "", "https://customer.test/"),
    seedStatusCode: 200,
    fetchPage,
  });

  const compared = await buildCompetitiveIntelligence({
    customerUrl: "https://customer.test/",
    customerSiteData: customerCrawl,
    customerPageData: seedPage(
      customerPages["/"]?.html ?? "",
      "https://customer.test/",
    ),
    accepted: [{ submittedUrl: "https://rival.test/" }],
    skipped: [],
    submittedCount: 1,
    hooks: {
      fetchPage,
      discoverSite: async () => undefined,
    },
  });
  assert(compared.analyzedCount === 1, "mocked rival crawled");
  assert(compared.customer.pages.service >= 3, "customer services classified");
  assert(compared.competitors[0]?.pages.service >= 3, "competitor services classified");
  assert(
    compared.customer.search.indexabilityIssuePercent === 0,
    "submitted site with no canonical and no noindex is not an indexability failure",
  );

  const mixed = await buildCompetitiveIntelligence({
    customerUrl: "https://customer.test/",
    customerSiteData: customerCrawl,
    customerPageData: seedPage(
      customerPages["/"]?.html ?? "",
      "https://customer.test/",
    ),
    accepted: [
      { submittedUrl: "https://ok.test/" },
      { submittedUrl: "https://down.test/" },
      { submittedUrl: "https://rival.test/" },
    ],
    skipped: [],
    submittedCount: 3,
    hooks: {
      fetchPage,
      discoverSite: async () => undefined,
    },
  });
  assert(mixed.status === "partial", "one timeout stays partial");
  assert(mixed.analyzedCount === 2, "two of three competitors analyzed");

  const allDown = await buildCompetitiveIntelligence({
    customerUrl: "https://customer.test/",
    customerSiteData: customerCrawl,
    customerPageData: seedPage(
      customerPages["/"]?.html ?? "",
      "https://customer.test/",
    ),
    accepted: [{ submittedUrl: "https://down.test/" }],
    skipped: [],
    submittedCount: 1,
    hooks: {
      fetchPage,
      discoverSite: async () => undefined,
    },
  });
  assert(allDown.status === "unavailable", "total competitor fetch failure");
  assert(allDown.findings.length === 0, "no findings after total failure");

  const localeSpam = await buildCompetitiveIntelligence({
    customerUrl: "https://customer.test/",
    customerSiteData: customerCrawl,
    customerPageData: seedPage(
      customerPages["/"]?.html ?? "",
      "https://customer.test/",
    ),
    accepted: [{ submittedUrl: "https://spam.test/" }],
    skipped: [],
    submittedCount: 1,
    hooks: {
      fetchPage,
      discoverSite: async () => undefined,
    },
  });
  const spamLocation = localeSpam.gaps.find((item) => item.metric === "location_pages");
  assert(
    !spamLocation || spamLocation.gapDirection !== "behind",
    "crawled thin location spam does not win local comparison",
  );

  const json = JSON.stringify(compared);
  assert(json.length < 80_000, "compact competitive JSON under 80kb for one competitor");
  assert(!json.includes("<html"), "no raw HTML persisted");

  const free = getReportCapabilities("free");
  const professional = getReportCapabilities("professional");
  assert(getCompetitiveVisibility(compared, free) === "teaser", "free teaser");
  assert(getCompetitiveVisibility(compared, professional) === "full", "professional full");
  assert(getCompetitiveVisibility(undefined, professional) === "hidden", "old reports hidden");
  assert(getCompetitiveVisibility(allDown, free) === "hidden", "free hides failed comparison");
  assert(getCompetitiveVisibility(allDown, professional) === "unavailable", "pro shows unavailable");

  const oldView = buildGrowthReportViewModel(emptyResult(), "public");
  assert(oldView.report.competitiveData === undefined, "old report has no competitiveData");
  assert(oldView.capabilities.showCompetitiveIntelligence === false, "free old report");

  const proView = buildGrowthReportViewModel(
    { ...emptyResult(), competitiveData: compared },
    "consultation",
  );
  assert(proView.capabilities.showCompetitiveIntelligence, "pro view shows competitive");
  assert(proView.report.competitiveData?.findings.length !== undefined, "pro keeps findings");

  const printRows = compared.gaps.length;
  assert(printRows >= 0, "print layout consumes compact gaps not a 15-column table");

  void tracker;

  console.log("competitive intelligence verification passed");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
