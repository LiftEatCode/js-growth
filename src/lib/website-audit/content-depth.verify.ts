import { analyzeHtml } from "./analyze-html";
import { buildAuditRobotsData } from "./robots";
import {
  isMainContentExtractionUnreliable,
  contentDepthRule,
} from "./rules/content-depth-rule";
import type { AuditFinding, AuditPageData } from "./types";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function pageFromHtml(
  html: string,
  url = "https://example.com/",
): AuditPageData {
  const { robotsMetaRaw, ...htmlPageData } = analyzeHtml(html, url);

  return {
    ...htmlPageData,
    robots: buildAuditRobotsData(robotsMetaRaw, null),
  };
}

function evaluate(pageData: AuditPageData): AuditFinding[] {
  const result = contentDepthRule.evaluate({
    pageData,
    finalUrl: "https://example.com/",
  });

  return Array.isArray(result) ? result : [result];
}

const thinStatic = pageFromHtml(`
<!doctype html>
<html>
  <head><title>Shop</title></head>
  <body>
    <h1>Closed today</h1>
    <p>Please call for hours.</p>
  </body>
</html>
`);

const thinFindings = evaluate(thinStatic);
assert(
  !isMainContentExtractionUnreliable(thinStatic),
  "small static page extraction is reliable",
);
assert(
  thinFindings.some((finding) => finding.id === "thin-content-strong"),
  "genuinely small static page still receives thin-content",
);
assert(
  thinFindings.some(
    (finding) => finding.id === "thin-content-strong" && finding.priority === "high",
  ),
  "genuine thin page keeps a high-severity thin-content claim",
);

const builderScripts = Array.from(
  { length: 18 },
  (_, index) => `<script src="https://static.parastorage.com/app-${index}.js"></script>`,
).join("");
const builderHtml = `
<!doctype html>
<html>
  <head>
    <title>Home</title>
    ${builderScripts}
  </head>
  <body>
    <main>
      <h1>Home</h1>
      <p>Welcome.</p>
    </main>
  </body>
</html>
`;
const analyzedBuilder = pageFromHtml(builderHtml);
const builderPage: AuditPageData = {
  ...analyzedBuilder,
  performance: analyzedBuilder.performance
    ? {
        ...analyzedBuilder.performance,
        htmlBytes: 90_000,
      }
    : analyzedBuilder.performance,
};
const builderFindings = evaluate(builderPage);

assert(
  isMainContentExtractionUnreliable(builderPage),
  "large builder-like document is treated as unreliable extraction",
);
assert(
  (builderPage.content?.mainContentWordCount ?? 200) < 100,
  "builder fixture still has a low extracted word count",
);
assert(
  (builderPage.performance?.htmlBytes ?? 0) >= 80_000,
  "builder fixture has a large HTML payload",
);
assert(
  !builderFindings.some((finding) => finding.id === "thin-content-strong"),
  "unreliable extraction does not emit thin-content-strong",
);
assert(
  !builderFindings.some(
    (finding) =>
      finding.id.startsWith("thin-content") && finding.priority === "high",
  ),
  "unreliable extraction does not emit a high-severity thin-content claim",
);

console.log("content-depth verification passed");
