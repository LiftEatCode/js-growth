import { analyzeHtml } from "./analyze-html";
import { buildAuditRobotsData } from "./robots";
import { scoreWebsiteAudit } from "./scoring";
import { crawlSite } from "./site/crawl";
import type { SitePageFetchResult, SitePageFetcher } from "./site/fetch-page";
import type { AuditSiteData } from "./site/types";
import { buildGrowthReportViewModel } from "./report-view";
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

interface FixturePage {
  html?: string;
  status?: number;
  redirectTo?: string;
  errorCode?: string;
  contentType?: string;
  xRobotsTag?: string | null;
}

const ORIGIN = "https://example.com";

function absolute(path: string): string {
  if (path.startsWith("http")) {
    return path;
  }

  return new URL(path, ORIGIN).toString();
}

function pathKey(url: string): string {
  const parsed = new URL(url, ORIGIN);
  const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
  return pathname;
}

function nav(links: Array<{ href: string; text: string }>): string {
  return `<header><nav>${links
    .map((link) => `<a href="${link.href}">${link.text}</a>`)
    .join("")}</nav></header>`;
}

function pageHtml(options: {
  path: string;
  title: string;
  description?: string;
  h1: string;
  wordCount?: number;
  links?: Array<{ href: string; text: string }>;
  canonical?: string | null;
  robots?: string;
  cta?: string;
  extra?: string;
}): string {
  const links = options.links ?? [];
  const canonical =
    options.canonical === null
      ? ""
      : `<link rel="canonical" href="${options.canonical ?? absolute(options.path)}">`;
  const description = options.description
    ? `<meta name="description" content="${options.description}">`
    : "";
  const robots = options.robots
    ? `<meta name="robots" content="${options.robots}">`
    : "";
  const cta = options.cta ?? "";

  return `<!doctype html>
  <html>
    <head>
      <title>${options.title}</title>
      ${description}
      ${canonical}
      ${robots}
    </head>
    <body>
      ${nav(links)}
      <main>
        <h1>${options.h1}</h1>
        <p>${words(options.wordCount ?? 240)}</p>
        ${cta}
        ${options.extra ?? ""}
      </main>
    </body>
  </html>`;
}

const HEALTHY_LINKS = [
  { href: "/", text: "Home" },
  { href: "/services", text: "Services" },
  { href: "/services/plumbing", text: "Plumbing" },
  { href: "/services/drain-cleaning", text: "Drain cleaning" },
  { href: "/about", text: "About" },
  { href: "/contact", text: "Contact" },
  { href: "/locations/magnolia", text: "Magnolia" },
];

const HEALTHY_CTA =
  '<a href="/contact">Request a Quote</a> <a href="tel:+19365551212">Call Now</a>';

function createFetcher(pages: Record<string, FixturePage>): SitePageFetcher {
  return async (url: string): Promise<SitePageFetchResult> => {
    const key = pathKey(url);
    const spec = pages[key];

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
        statusCode: spec.status ?? null,
        contentType: spec.contentType ?? "text/html",
        errorCode: spec.errorCode,
      };
    }

    if (spec.redirectTo) {
      const destination = pages[spec.redirectTo];
      const finalUrl = absolute(spec.redirectTo);

      if (!destination?.html) {
        return {
          ok: false,
          requestedUrl: url,
          finalUrl,
          statusCode: 500,
          contentType: "text/html",
          errorCode: "HTTP_ERROR",
        };
      }

      return {
        ok: true,
        requestedUrl: url,
        finalUrl,
        statusCode: 200,
        contentType: "text/html",
        xRobotsTag: destination.xRobotsTag ?? null,
        html: destination.html,
        document: {
          advertisedContentLength: null,
          contentEncoding: null,
          cacheControl: null,
          expires: null,
          etag: null,
          lastModified: null,
          documentFetchDurationMs: 12,
        },
      };
    }

    const status = spec.status ?? 200;

    if (status < 200 || status >= 300) {
      return {
        ok: false,
        requestedUrl: url,
        finalUrl: url,
        statusCode: status,
        contentType: spec.contentType ?? "text/html",
        errorCode: status === 404 || status === 410 ? "HTTP_NOT_FOUND" : "HTTP_ERROR",
        nonHtml: spec.contentType ? !spec.contentType.includes("html") : false,
      };
    }

    if (spec.contentType && !spec.contentType.includes("html")) {
      return {
        ok: false,
        requestedUrl: url,
        finalUrl: url,
        statusCode: status,
        contentType: spec.contentType,
        errorCode: "INVALID_CONTENT_TYPE",
        nonHtml: true,
      };
    }

    if (!spec.html) {
      return {
        ok: false,
        requestedUrl: url,
        finalUrl: url,
        statusCode: 500,
        contentType: "text/html",
        errorCode: "HTTP_ERROR",
      };
    }

    return {
      ok: true,
      requestedUrl: url,
      finalUrl: url,
      statusCode: status,
      contentType: spec.contentType ?? "text/html",
      xRobotsTag: spec.xRobotsTag ?? null,
      html: spec.html,
      document: {
        advertisedContentLength: null,
        contentEncoding: null,
        cacheControl: null,
        expires: null,
        etag: null,
        lastModified: null,
        documentFetchDurationMs: 10,
      },
    };
  };
}

function seedPageData(html: string, url: string): AuditPageData {
  const { robotsMetaRaw, ...htmlPageData } = analyzeHtml(html, url);

  return {
    ...htmlPageData,
    robots: buildAuditRobotsData(robotsMetaRaw, null),
  };
}

async function runSite(
  pages: Record<string, FixturePage>,
  seedPath = "/",
): Promise<{ siteData: AuditSiteData; seedPage: AuditPageData; seedUrl: string }> {
  const seedUrl = absolute(seedPath);
  const seed = pages[seedPath] ?? pages[pathKey(seedUrl)];

  if (!seed?.html) {
    throw new Error(`Missing seed html for ${seedPath}`);
  }

  const seedPage = seedPageData(seed.html, seedUrl);
  const siteData = await crawlSite({
    seedRequestedUrl: seedUrl,
    seedFinalUrl: seedUrl,
    seedHtml: seed.html,
    seedPageData: seedPage,
    seedStatusCode: 200,
    fetchPage: createFetcher(pages),
  });

  return { siteData, seedPage, seedUrl };
}

function siteIssueIds(seedPage: AuditPageData, seedUrl: string, siteData: AuditSiteData): string[] {
  return scoreWebsiteAudit(seedPage, seedUrl, undefined, siteData)
    .findings.filter(
      (finding) =>
        finding.id.startsWith("site-") && finding.status !== "pass",
    )
    .map((finding) => finding.id);
}

function healthyPages(): Record<string, FixturePage> {
  const make = (
    path: string,
    title: string,
    h1: string,
    extra?: string,
  ): FixturePage => ({
    html: pageHtml({
      path,
      title,
      description: `${title} description for search and visitors.`,
      h1,
      links: HEALTHY_LINKS,
      cta: HEALTHY_CTA,
      extra:
        extra ??
        "<p>Licensed and insured with customer reviews from local homeowners.</p>",
    }),
  });

  return {
    "/": make("/", "ABC Plumbing | Houston home service", "Plumbing in Houston"),
    "/services": make(
      "/services",
      "Plumbing services | ABC Plumbing",
      "Our plumbing services",
    ),
    "/services/plumbing": make(
      "/services/plumbing",
      "Plumbing repair | ABC Plumbing",
      "Plumbing repair",
    ),
    "/services/drain-cleaning": make(
      "/services/drain-cleaning",
      "Drain cleaning | ABC Plumbing",
      "Drain cleaning",
    ),
    "/about": make("/about", "About ABC Plumbing", "About our team"),
    "/contact": make("/contact", "Contact ABC Plumbing", "Contact us"),
    "/locations/magnolia": make(
      "/locations/magnolia",
      "Plumber in Magnolia TX | ABC Plumbing",
      "Plumbing in Magnolia",
      "<p>We serve Magnolia homeowners. Call for service in the Magnolia area.</p>",
    ),
  };
}

async function main(): Promise<void> {
const healthy = await runSite(healthyPages());
const healthyIssues = siteIssueIds(
  healthy.seedPage,
  healthy.seedUrl,
  healthy.siteData,
);

assert(healthy.siteData.crawl.crawledCount >= 6, "healthy site crawled 6+ pages");
assert(healthy.siteData.crawl.crawledCount <= 12, "healthy site respects cap");
assert(
  healthyIssues.every(
    (id) =>
      id !== "site-duplicate-titles" &&
      id !== "site-duplicate-descriptions" &&
      id !== "site-broken-internal-links",
  ),
  `healthy site should not warn on duplicates or broken links: ${healthyIssues.join(",")}`,
);

const duplicatePages = {
  "/": {
    html: pageHtml({
      path: "/",
      title: "ABC Plumbing | Home",
      description: "Unique home description for the plumbing company homepage.",
      h1: "ABC Plumbing",
      links: [
        { href: "/services", text: "Services" },
        { href: "/services/plumbing", text: "Plumbing" },
        { href: "/services/drain-cleaning", text: "Drain cleaning" },
        { href: "/services/water-heaters", text: "Water heaters" },
      ],
      cta: HEALTHY_CTA,
    }),
  },
  "/services": {
    html: pageHtml({
      path: "/services",
      title: "ABC Plumbing | Home",
      description: "Same boiler description reused on service pages.",
      h1: "Services",
      links: [
        { href: "/services/plumbing", text: "Plumbing" },
        { href: "/services/drain-cleaning", text: "Drain cleaning" },
        { href: "/services/water-heaters", text: "Water heaters" },
      ],
      cta: HEALTHY_CTA,
    }),
  },
  "/services/plumbing": {
    html: pageHtml({
      path: "/services/plumbing",
      title: "ABC Plumbing | Home",
      description: "Same boiler description reused on service pages.",
      h1: "Plumbing",
      cta: HEALTHY_CTA,
    }),
  },
  "/services/drain-cleaning": {
    html: pageHtml({
      path: "/services/drain-cleaning",
      title: "ABC Plumbing | Home",
      description: "Same boiler description reused on service pages.",
      h1: "Drain cleaning",
      cta: HEALTHY_CTA,
    }),
  },
  "/services/water-heaters": {
    html: pageHtml({
      path: "/services/water-heaters",
      title: "ABC Plumbing | Home",
      description: "Same boiler description reused on service pages.",
      h1: "Water heaters",
      cta: HEALTHY_CTA,
    }),
  },
};

const duplicates = await runSite(duplicatePages);
const duplicateIds = siteIssueIds(
  duplicates.seedPage,
  duplicates.seedUrl,
  duplicates.siteData,
);
const duplicateTitleHits = duplicateIds.filter((id) => id === "site-duplicate-titles");
const duplicateDescriptionHits = duplicateIds.filter(
  (id) => id === "site-duplicate-descriptions",
);

assert(duplicateTitleHits.length === 1, "one aggregated duplicate-title finding");
assert(
  duplicateDescriptionHits.length === 1,
  "one aggregated duplicate-description finding",
);

const brokenPages = {
  "/": {
    html: pageHtml({
      path: "/",
      title: "Services home",
      description: "A unique home description with enough length for metadata.",
      h1: "Home",
      links: [{ href: "/services", text: "Services" }],
      cta: HEALTHY_CTA,
    }),
  },
  "/services": {
    html: pageHtml({
      path: "/services",
      title: "Services index",
      description: "Unique services overview description for this plumbing site.",
      h1: "Services",
      links: [
        { href: "/services/plumbing", text: "Plumbing" },
        { href: "/services/old-service", text: "Old service" },
      ],
      cta: HEALTHY_CTA,
    }),
  },
  "/services/plumbing": {
    html: pageHtml({
      path: "/services/plumbing",
      title: "Plumbing service",
      description: "Unique plumbing description used on this service page.",
      h1: "Plumbing",
      cta: HEALTHY_CTA,
    }),
  },
  "/services/old-service": { status: 404 },
};

const broken = await runSite(brokenPages);
assert(
  siteIssueIds(broken.seedPage, broken.seedUrl, broken.siteData).includes(
    "site-broken-internal-links",
  ),
  "verified 404 becomes a broken internal-link finding",
);
assert(
  broken.siteData.links.brokenExamples.some(
    (item) => item.destinationPath === "/services/old-service",
  ),
  "broken example names the 404 destination",
);

const thinPages = {
  "/": {
    html: pageHtml({
      path: "/",
      title: "ABC Plumbing home page title",
      description: "Home description for a plumbing company in Houston Texas.",
      h1: "Home",
      links: [
        { href: "/services/plumbing", text: "Plumbing" },
        { href: "/services/drain-cleaning", text: "Drain cleaning" },
        { href: "/services/water-heaters", text: "Water heaters" },
      ],
      cta: HEALTHY_CTA,
    }),
  },
  "/services/plumbing": {
    html: pageHtml({
      path: "/services/plumbing",
      title: "Plumbing service page title",
      description: "Plumbing service description unique to this URL path.",
      h1: "Plumbing",
      wordCount: 80,
      cta: HEALTHY_CTA,
    }),
  },
  "/services/drain-cleaning": {
    html: pageHtml({
      path: "/services/drain-cleaning",
      title: "Drain cleaning service page title",
      description: "Drain cleaning description unique to this URL path.",
      h1: "Drain cleaning",
      wordCount: 90,
      cta: HEALTHY_CTA,
    }),
  },
  "/services/water-heaters": {
    html: pageHtml({
      path: "/services/water-heaters",
      title: "Water heater service page title",
      description: "Water heater description unique to this URL path.",
      h1: "Water heaters",
      wordCount: 110,
      cta: HEALTHY_CTA,
    }),
  },
};

const thin = await runSite(thinPages);
const thinIds = siteIssueIds(thin.seedPage, thin.seedUrl, thin.siteData);
assert(
  thinIds.includes("site-thin-service-pages"),
  "thin service pages produce one site pattern finding",
);
assert(
  thin.siteData.content.thinServicePageCount >= 3,
  "three thin service pages counted",
);

const conversionPages = {
  "/": {
    html: pageHtml({
      path: "/",
      title: "ABC Plumbing homepage title text",
      description: "Homepage description inviting visitors to request plumbing help.",
      h1: "Home",
      links: [
        { href: "/services/plumbing", text: "Plumbing" },
        { href: "/services/drain-cleaning", text: "Drain cleaning" },
        { href: "/services/water-heaters", text: "Water heaters" },
      ],
      cta: '<a href="/contact">Request a Quote</a>',
    }),
  },
  "/services/plumbing": {
    html: pageHtml({
      path: "/services/plumbing",
      title: "Plumbing only page title text",
      description: "Plumbing page without a conversion action for visitors.",
      h1: "Plumbing",
    }),
  },
  "/services/drain-cleaning": {
    html: pageHtml({
      path: "/services/drain-cleaning",
      title: "Drain cleaning only page title",
      description: "Drain cleaning page without a conversion action listed.",
      h1: "Drain cleaning",
    }),
  },
  "/services/water-heaters": {
    html: pageHtml({
      path: "/services/water-heaters",
      title: "Water heaters only page title",
      description: "Water heater page without a conversion action listed.",
      h1: "Water heaters",
    }),
  },
};

const conversion = await runSite(conversionPages);
assert(
  siteIssueIds(
    conversion.seedPage,
    conversion.seedUrl,
    conversion.siteData,
  ).includes("site-conversion-coverage"),
  "service pages without CTAs produce conversion coverage finding",
);

const noindexPages = {
  "/": {
    html: pageHtml({
      path: "/",
      title: "ABC Plumbing home unique title",
      description: "Home description pointing at plumbing services in Houston.",
      h1: "Home",
      links: [{ href: "/services/service-a", text: "Service A" }],
      cta: HEALTHY_CTA,
    }),
  },
  "/services/service-a": {
    html: pageHtml({
      path: "/services/service-a",
      title: "Service A unique title text",
      description: "Service A description for this commercial service page.",
      h1: "Service A",
      robots: "noindex",
      cta: HEALTHY_CTA,
    }),
  },
};

const noindex = await runSite(noindexPages);
assert(
  siteIssueIds(noindex.seedPage, noindex.seedUrl, noindex.siteData).includes(
    "site-indexability-pattern",
  ),
  "noindex service page produces site indexability finding",
);

const canonicalPages = {
  "/": {
    html: pageHtml({
      path: "/",
      title: "ABC Plumbing home canonical title",
      description: "Home page description that stays unique from service URLs.",
      h1: "Home",
      links: [
        { href: "/services/plumbing", text: "Plumbing" },
        { href: "/services/drain-cleaning", text: "Drain cleaning" },
        { href: "/services/water-heaters", text: "Water heaters" },
      ],
      cta: HEALTHY_CTA,
    }),
  },
  "/services/plumbing": {
    html: pageHtml({
      path: "/services/plumbing",
      title: "Plumbing canonical page title",
      description: "Plumbing description unique while canonicalizing to home.",
      h1: "Plumbing",
      canonical: `${ORIGIN}/`,
      cta: HEALTHY_CTA,
    }),
  },
  "/services/drain-cleaning": {
    html: pageHtml({
      path: "/services/drain-cleaning",
      title: "Drain cleaning canonical page title",
      description: "Drain description unique while canonicalizing to home.",
      h1: "Drain cleaning",
      canonical: `${ORIGIN}/`,
      cta: HEALTHY_CTA,
    }),
  },
  "/services/water-heaters": {
    html: pageHtml({
      path: "/services/water-heaters",
      title: "Water heater canonical page title",
      description: "Heater description unique while canonicalizing to home.",
      h1: "Water heaters",
      canonical: `${ORIGIN}/`,
      cta: HEALTHY_CTA,
    }),
  },
};

const canonical = await runSite(canonicalPages);
assert(
  siteIssueIds(
    canonical.seedPage,
    canonical.seedUrl,
    canonical.siteData,
  ).includes("site-canonical-pattern"),
  "service pages canonicalizing to home produce a site pattern",
);

const serviceAreaPages = {
  "/": {
    html: pageHtml({
      path: "/",
      title: "ABC Plumbing service area home",
      description: "We serve Magnolia Tomball and Conroe homeowners every week.",
      h1: "Home",
      links: [
        { href: "/locations/magnolia", text: "Magnolia" },
        { href: "/locations/tomball", text: "Tomball" },
        { href: "/locations/conroe", text: "Conroe" },
      ],
      cta: HEALTHY_CTA,
      extra:
        "<p>Proudly serving Magnolia, Tomball, and Conroe. Areas we serve across Montgomery County.</p><p>Licensed and insured plumbing team.</p>",
    }),
  },
  "/locations/magnolia": {
    html: pageHtml({
      path: "/locations/magnolia",
      title: "Plumber in Magnolia TX",
      description: "Plumbing for Magnolia homeowners without a storefront listed.",
      h1: "Magnolia plumbing",
      cta: HEALTHY_CTA,
      extra:
        "<p>Proudly serving Magnolia. We travel to Magnolia homeowners for service-area plumbing work.</p>",
    }),
  },
  "/locations/tomball": {
    html: pageHtml({
      path: "/locations/tomball",
      title: "Plumber in Tomball TX",
      description: "Plumbing for Tomball homeowners without a storefront listed.",
      h1: "Tomball plumbing",
      cta: HEALTHY_CTA,
      extra:
        "<p>Proudly serving Tomball. We travel to Tomball homeowners for service-area plumbing work.</p>",
    }),
  },
  "/locations/conroe": {
    html: pageHtml({
      path: "/locations/conroe",
      title: "Plumber in Conroe TX",
      description: "Plumbing for Conroe homeowners without a storefront listed.",
      h1: "Conroe plumbing",
      cta: HEALTHY_CTA,
      extra:
        "<p>Proudly serving Conroe. We travel to Conroe homeowners for service-area plumbing work.</p>",
    }),
  },
};

const serviceArea = await runSite(serviceAreaPages);
const serviceAreaIds = siteIssueIds(
  serviceArea.seedPage,
  serviceArea.seedUrl,
  serviceArea.siteData,
);
assert(
  serviceArea.siteData.local.locationPageCount +
    serviceArea.siteData.local.serviceAreaPageCount >=
    3,
  "three location pages inventoried",
);
assert(
  !serviceAreaIds.some((id) => id.toLowerCase().includes("address")),
  "service-area sites are not penalized for missing street address",
);

const blogLinks = Array.from({ length: 50 }, (_, index) => ({
  href: `/blog/post-${index + 1}`,
  text: `Post ${index + 1}`,
}));
const blogPages: Record<string, FixturePage> = {
  "/": {
    html: pageHtml({
      path: "/",
      title: "Blog heavy plumbing company home",
      description: "Home description that still highlights plumbing services.",
      h1: "Home",
      links: [
        { href: "/services", text: "Services" },
        { href: "/services/plumbing", text: "Plumbing" },
        { href: "/services/drain-cleaning", text: "Drain cleaning" },
        { href: "/contact", text: "Contact" },
        { href: "/about", text: "About" },
        ...blogLinks,
      ],
      cta: HEALTHY_CTA,
    }),
  },
  "/services": {
    html: pageHtml({
      path: "/services",
      title: "Services overview unique title",
      description: "Services overview description for this commercial website.",
      h1: "Services",
      cta: HEALTHY_CTA,
    }),
  },
  "/services/plumbing": {
    html: pageHtml({
      path: "/services/plumbing",
      title: "Plumbing service unique title",
      description: "Plumbing service description for this commercial website.",
      h1: "Plumbing",
      cta: HEALTHY_CTA,
    }),
  },
  "/services/drain-cleaning": {
    html: pageHtml({
      path: "/services/drain-cleaning",
      title: "Drain cleaning unique title",
      description: "Drain cleaning description for this commercial website.",
      h1: "Drain cleaning",
      cta: HEALTHY_CTA,
    }),
  },
  "/contact": {
    html: pageHtml({
      path: "/contact",
      title: "Contact unique title here",
      description: "Contact page description for calling the plumbing company.",
      h1: "Contact",
      cta: HEALTHY_CTA,
    }),
  },
  "/about": {
    html: pageHtml({
      path: "/about",
      title: "About unique title here",
      description: "About page description for the plumbing company team.",
      h1: "About",
      cta: HEALTHY_CTA,
    }),
  },
};

for (const link of blogLinks) {
  blogPages[link.href] = {
    html: pageHtml({
      path: link.href,
      title: `${link.text} article unique title`,
      description: `${link.text} article description with enough characters.`,
      h1: link.text,
    }),
  };
}

const blogHeavy = await runSite(blogPages);
const blogCrawled = blogHeavy.siteData.pages.filter(
  (page) => page.pageType === "blog" || page.pageType === "article",
);
const commercialCrawled = blogHeavy.siteData.pages.filter((page) =>
  ["home", "service", "services-index", "contact", "about"].includes(
    page.pageType,
  ),
);

assert(blogCrawled.length <= 2, "blog cap keeps article pages at 2");
assert(commercialCrawled.length >= 5, "commercial pages dominate crawl slots");

const queryLinks = [
  { href: "/services?page=1", text: "Page 1" },
  { href: "/services?page=2", text: "Page 2" },
  { href: "/services?page=3", text: "Page 3" },
  { href: "/services?sort=asc", text: "Sort asc" },
  { href: "/services?sort=desc", text: "Sort desc" },
  { href: "/services?utm_source=google&utm_medium=cpc&utm_campaign=x", text: "UTM" },
  { href: "/about?a=1&b=2&c=3&d=4", text: "Query explosion" },
];

const queryPages = {
  "/": {
    html: pageHtml({
      path: "/",
      title: "Query loop home unique title",
      description: "Home description that includes query-heavy navigation links.",
      h1: "Home",
      links: [
        { href: "/services", text: "Services" },
        { href: "/contact", text: "Contact" },
        ...queryLinks,
      ],
      cta: HEALTHY_CTA,
    }),
  },
  "/services": {
    html: pageHtml({
      path: "/services",
      title: "Services unique title query",
      description: "Services description unique amid query variants on the site.",
      h1: "Services",
      cta: HEALTHY_CTA,
    }),
  },
  "/contact": {
    html: pageHtml({
      path: "/contact",
      title: "Contact unique title query",
      description: "Contact description unique amid query variants on the site.",
      h1: "Contact",
      cta: HEALTHY_CTA,
    }),
  },
};

const queryLoop = await runSite(queryPages);
assert(queryLoop.siteData.pages.length <= 12, "query loop stays within page cap");
assert(
  queryLoop.siteData.discoveredUrls.length <= 100,
  "query loop stays within discovery cap",
);
assert(
  queryLoop.siteData.pages.every(
    (page) => !page.finalUrl.includes("sort=") && !page.finalUrl.includes("page=2"),
  ),
  "pagination and sort variants are not crawled",
);

const redirectPages = {
  "/": {
    html: pageHtml({
      path: "/",
      title: "Redirect home unique title",
      description: "Home description linking through redirected aliases.",
      h1: "Home",
      links: [
        { href: "/a", text: "Alias A" },
        { href: "/b", text: "Alias B" },
        { href: "/services", text: "Services" },
      ],
      cta: HEALTHY_CTA,
    }),
  },
  "/a": { redirectTo: "/services" },
  "/b": { redirectTo: "/services" },
  "/services": {
    html: pageHtml({
      path: "/services",
      title: "Services unique after redirect",
      description: "Final services page that both aliases should resolve to.",
      h1: "Services",
      cta: HEALTHY_CTA,
    }),
  },
};

const redirected = await runSite(redirectPages);
const servicesPages = redirected.siteData.pages.filter(
  (page) => page.path === "/services" && page.fetchStatus === "success",
);
assert(servicesPages.length === 1, "redirect aliases collapse to one final page");

const resilientPages = {
  "/": {
    html: pageHtml({
      path: "/",
      title: "Resilience home unique title",
      description: "Home description that still completes if extra pages fail.",
      h1: "Home",
      links: [
        { href: "/services", text: "Services" },
        { href: "/timeout-page", text: "Timeout" },
        { href: "/error-page", text: "Broken" },
        { href: "/contact", text: "Contact" },
      ],
      cta: HEALTHY_CTA,
    }),
  },
  "/services": {
    html: pageHtml({
      path: "/services",
      title: "Services unique resilience",
      description: "Services page that succeeds during a mixed-failure crawl.",
      h1: "Services",
      cta: HEALTHY_CTA,
    }),
  },
  "/contact": {
    html: pageHtml({
      path: "/contact",
      title: "Contact unique resilience",
      description: "Contact page that succeeds during a mixed-failure crawl.",
      h1: "Contact",
      cta: HEALTHY_CTA,
    }),
  },
  "/timeout-page": { errorCode: "TIMEOUT" },
  "/error-page": { status: 500 },
};

const resilient = await runSite(resilientPages);
assert(resilient.siteData.crawl.crawledCount >= 2, "audit still produces successes");
assert(resilient.siteData.crawl.failedCount >= 2, "timeout and 500 are recorded");
assert(
  resilient.siteData.pages.some((page) => page.errorCode === "TIMEOUT"),
  "timeout page recorded without crashing",
);

const legacyResult = {
  success: true as const,
  metadata: {
    requestedUrl: "https://legacy.example",
    finalUrl: "https://legacy.example",
    statusCode: 200,
    contentType: "text/html",
    fetchedAt: "2024-01-01T00:00:00.000Z",
  },
  pageData: healthy.seedPage,
  findings: scoreWebsiteAudit(healthy.seedPage, healthy.seedUrl).findings,
  categoryScores: [
    { category: "technical" as const, label: "Technical", score: 10, maxScore: 20 },
  ],
  overallScore: 50,
  summary: {
    passed: 1,
    warnings: 1,
    failed: 0,
    criticalIssues: 0,
    quickWins: 0,
    highImpactFindings: 0,
    estimatedFixMinutes: 0,
  },
  opportunity: {
    score: 20,
    level: "low" as const,
    trafficGainPercent: { minimum: 0, maximum: 0 },
    monthlyLeadGain: { minimum: 0, maximum: 0 },
    monthlyRevenueOpportunity: { minimum: 0, maximum: 0 },
    estimatedFixMinutes: 0,
    confidence: "low" as const,
    assumptions: [],
    insights: [],
  },
} satisfies WebsiteAuditResult;

const legacyView = buildGrowthReportViewModel(legacyResult, "public");
assert(legacyView.report.siteData === undefined, "old report has no siteData");
assert(legacyView.capabilities.showSiteInventory === false, "free hides inventory");

const proView = buildGrowthReportViewModel(
  {
    ...legacyResult,
    siteData: healthy.siteData,
    overallScore: 70,
  },
  "consultation",
);
assert(proView.capabilities.showSiteOverview, "professional can show site overview");
assert(proView.report.siteData?.pages.length, "professional view keeps pages");

console.log("multi-page site intelligence verification passed");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
