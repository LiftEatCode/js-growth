import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildExecutiveSummary,
  isUsableOverallScore,
} from "./executive-summary";
import { getScoreBand } from "./score-bands";
import type { AuditFinding, WebsiteAuditResult } from "./types";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const here = dirname(fileURLToPath(import.meta.url));
const pdfSource = readFileSync(
  join(here, "../../components/website-audit/pdf/audit-report-pdf.tsx"),
  "utf8",
);

const pdfCallStart = pdfSource.indexOf("buildExecutiveSummary(");
assert(pdfCallStart >= 0, "Professional PDF builds an executive summary");
const pdfExecutiveCall = pdfSource.slice(pdfCallStart, pdfCallStart + 280);
assert(
  pdfExecutiveCall.includes("overallScore:") &&
    pdfExecutiveCall.includes("audit.overallScore"),
  "Professional PDF passes the stored audit overallScore into the Executive Overview",
);

const emptySummary: WebsiteAuditResult["summary"] = {
  passed: 0,
  warnings: 0,
  failed: 0,
  criticalIssues: 0,
  quickWins: 0,
  highImpactFindings: 0,
  estimatedFixMinutes: 45,
};

const findings: AuditFinding[] = [];

const score92 = buildExecutiveSummary(findings, emptySummary, {
  overallScore: 92,
});
assert(score92.summary.includes("92/100"), "score 92 renders 92");
assert(
  score92.summary.includes(`(${getScoreBand(92).label})`),
  "score 92 uses centralized band label",
);
assert(
  !score92.summary.includes("0/100"),
  "score 92 does not fall back to 0/100",
);

const score78 = buildExecutiveSummary(findings, emptySummary, {
  overallScore: 78,
});
assert(score78.summary.includes("78/100"), "score 78 renders 78");
assert(
  score78.summary.includes("Good foundation"),
  'score 78 renders "Good foundation"',
);
assert(
  getScoreBand(78).label === "Good foundation",
  "78 label comes from centralized score bands",
);

const missingScore = buildExecutiveSummary(findings, emptySummary, {
  overallScore: null,
});
assert(
  !missingScore.summary.includes("0/100"),
  "missing score does not fabricate 0/100",
);
assert(
  !missingScore.summary.includes("Website Growth Score:"),
  "missing score omits the fabricated score line",
);
assert(
  !missingScore.summary.includes("High priority"),
  "missing score does not use the High priority band from a fabricated 0",
);

assert(!isUsableOverallScore(undefined), "undefined is not a usable score");
assert(!isUsableOverallScore(Number.NaN), "NaN is not a usable score");
assert(isUsableOverallScore(0), "a real stored 0 remains usable");

const storedZero = buildExecutiveSummary(findings, emptySummary, {
  overallScore: 0,
});
assert(
  storedZero.summary.includes("0/100"),
  "a real stored 0 still renders 0/100",
);

console.log("executive-summary.verify.ts passed");
