import { analyzeHtml } from "./analyze-html";
import { buildAuditRobotsData } from "./robots";
import { isCategoryScoreApplicable, scoreWebsiteAudit } from "./scoring";
import type { AuditPageData } from "./types";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function pageFromHtml(
  html: string,
  url = "https://example.com/paint",
): AuditPageData {
  const { robotsMetaRaw, ...htmlPageData } = analyzeHtml(html, url);

  return {
    ...htmlPageData,
    robots: buildAuditRobotsData(robotsMetaRaw, null),
  };
}

function words(count: number): string {
  return Array.from({ length: count }, (_, index) => `detail${index + 1}`).join(
    " ",
  );
}

const noImageHtml = `
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
      <p>${words(280)}</p>
      <p>Call <a href="tel:+19365551212">936-555-1212</a> or <a href="/contact">request a quote</a>.</p>
      <p>Visit us at 123 Main Street, Magnolia, TX 77354.</p>
    </main>
  </body>
</html>
`;

const noImagePage = pageFromHtml(noImageHtml);
const scored = scoreWebsiteAudit(noImagePage, "https://example.com/paint");
const accessibility = scored.categoryScores.find(
  (item) => item.category === "accessibility",
);

assert(
  !scored.findings.some((finding) => finding.category === "accessibility"),
  "no-image page has no accessibility findings",
);
assert(accessibility?.applicable === false, "empty accessibility is not applicable");
assert(accessibility?.maxScore === 0, "empty accessibility is excluded from max");
assert(accessibility?.score === 0, "empty accessibility does not invent a pass");

const applicable = scored.categoryScores.filter(isCategoryScoreApplicable);
const earned = applicable.reduce((total, item) => total + item.score, 0);
const maximum = applicable.reduce((total, item) => total + item.maxScore, 0);

assert(maximum < 100, "not-applicable categories leave the overall denominator");
assert(
  !applicable.some((item) => item.category === "accessibility"),
  "accessibility is omitted from applicable totals",
);
assert(
  scored.overallScore === Math.round((earned / maximum) * 100),
  "overall score uses applicable categories only",
);

const penalizedAsZeroOfTen = Math.round((earned / (maximum + 10)) * 100);
assert(
  scored.overallScore > penalizedAsZeroOfTen,
  "empty accessibility must not count as a 0/10 failure",
);

const withImageHtml = noImageHtml.replace(
  "</main>",
  '<p><img src="/crew.jpg" alt="Painting crew at a Magnolia home"></p></main>',
);
const withImagePage = pageFromHtml(withImageHtml);
const withImageScored = scoreWebsiteAudit(
  withImagePage,
  "https://example.com/paint",
);
const withImageAccessibility = withImageScored.categoryScores.find(
  (item) => item.category === "accessibility",
);

assert(
  withImageAccessibility?.applicable === true,
  "image evidence keeps accessibility applicable",
);
assert(
  (withImageAccessibility?.maxScore ?? 0) === 10,
  "applicable accessibility still uses the 10-point weight",
);

console.log("scoring verification passed");
