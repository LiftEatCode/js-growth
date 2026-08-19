import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { analyzeHtml } from "./analyze-html";
import { buildAuditRobotsData } from "./robots";
import { runDeterministicWebsiteAuditFromFetchedPage } from "./run-deterministic-audit";
import { scoreWebsiteAudit } from "./scoring";
import type { FetchedWebsitePage } from "./audit-url";
import type { AuditSiteDiscoveryData } from "./types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const fixtureHtml = `
<!doctype html>
<html>
  <head>
    <title>House Painting in Magnolia, TX</title>
    <meta name="description" content="Interior and exterior house painting for homes in Magnolia, TX. Licensed painters, free estimates, and a clear project timeline.">
    <link rel="canonical" href="https://example.com/paint">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <header>
      <nav>
        <a href="/">Home</a>
        <a href="/services">Services</a>
        <a href="/contact">Contact</a>
      </nav>
    </header>
    <main>
      <h1>House Painting in Magnolia, TX</h1>
      <p>${Array.from({ length: 280 }, (_, index) => `detail${index + 1}`).join(" ")}</p>
      <p>Call <a href="tel:+19365551212">936-555-1212</a> or <a href="/contact">request a quote</a>.</p>
      <p>Visit us at 123 Main Street, Magnolia, TX 77354.</p>
    </main>
  </body>
</html>
`;

const fetchedPage: FetchedWebsitePage = {
  requestedUrl: "https://example.com/paint",
  finalUrl: "https://example.com/paint",
  statusCode: 200,
  contentType: "text/html",
  xRobotsTag: null,
  html: fixtureHtml,
  fetchedAt: "2024-01-01T00:00:00.000Z",
  contentEncoding: null,
  cacheControl: null,
  expires: null,
  etag: null,
  lastModified: null,
  advertisedContentLength: null,
  documentFetchDurationMs: 12,
};

const emptyDiscovery: AuditSiteDiscoveryData = {
  robotsTxt: {
    url: "https://example.com/robots.txt",
    found: false,
    accessible: false,
    statusCode: null,
    contentType: null,
    sitemapUrls: [],
    blocksAuditedPage: false,
    wildcardRules: [],
    fetchError: null,
  },
  sitemaps: [],
  hasSitemap: false,
  hasAccessibleSitemap: false,
};

async function runFixture() {
  return runDeterministicWebsiteAuditFromFetchedPage(fetchedPage, {
    discoverSite: async () => emptyDiscovery,
    crawl: {
      fetchPage: async (url) => ({
        ok: false,
        requestedUrl: url,
        finalUrl: null,
        statusCode: null,
        contentType: null,
        errorCode: "FETCH_FAILED",
        nonHtml: false,
      }),
    },
  });
}

async function main(): Promise<void> {
const first = await runFixture();
const second = await runFixture();

assert(!("competitiveData" in first) || first.competitiveData === undefined, "deterministic audit has no competitive data");
assert(first.overallScore === second.overallScore, "same fixture produces the same overall score");
assert(
  first.findings.map((finding) => finding.id).join(",") ===
    second.findings.map((finding) => finding.id).join(","),
  "same fixture produces the same finding IDs",
);
assert(
  !first.findings.some((finding) => finding.id === "missing-h1"),
  "fixture with an H1 does not emit missing-h1",
);

const { robotsMetaRaw, ...htmlPageData } = analyzeHtml(
  fixtureHtml,
  "https://example.com/paint",
);
const pageData = {
  ...htmlPageData,
  robots: buildAuditRobotsData(robotsMetaRaw, null),
};
const scored = scoreWebsiteAudit(
  pageData,
  "https://example.com/paint",
  first.siteDiscovery,
  first.siteData,
);
assert(
  scored.overallScore === first.overallScore,
  "public scoring of the same page data matches the extracted deterministic audit",
);

const here = dirname(fileURLToPath(import.meta.url));
const publicActions = readFileSync(
  join(here, "../../app/website-audit/actions.ts"),
  "utf8",
);
const deterministicSource = readFileSync(
  join(here, "./run-deterministic-audit.ts"),
  "utf8",
);

assert(
  publicActions.includes("runDeterministicWebsiteAudit"),
  "public auditWebsite reuses the deterministic entry point",
);
assert(
  publicActions.includes("parseCompetitorInputs"),
  "public audit still runs competitive analysis",
);
assert(
  publicActions.includes("createAuditReport"),
  "public audit still saves a customer report",
);
assert(
  !publicActions.includes("PROSPECTING"),
  "public auditWebsite does not mark reports as prospecting",
);
assert(
  !deterministicSource.includes("openai"),
  "deterministic audit does not call OpenAI",
);
assert(
  !deterministicSource.includes("stripe"),
  "deterministic audit does not touch Stripe",
);
assert(
  !deterministicSource.includes("buildCompetitiveIntelligence"),
  "deterministic audit does not run competitive intelligence",
);
assert(
  !deterministicSource.includes("resend"),
  "deterministic audit does not send email",
);
assert(
  !deterministicSource.includes("trackCommercialEvent"),
  "deterministic audit does not fire analytics",
);

console.log("run-deterministic-audit.verify.ts passed");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
