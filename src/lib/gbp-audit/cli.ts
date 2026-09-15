import { runGbpAudit } from "./audit";
import {
  GBP_AUDIT_FIXTURE_IDS,
  getGbpAuditFixture,
  type GbpAuditFixtureId,
} from "./fixtures";
import { MockBusinessProfileAdapter } from "./adapters/mock-adapter";
import type { GbpAuditResult } from "./types";

function printAudit(fixtureId: string, result: GbpAuditResult): void {
  const counts = result.metadata.findingCounts;
  const { confidence, maturity } = result;
  const lines: string[] = [
    "",
    `GBP Audit Engine v${result.metadata.version} — ${fixtureId}`,
    `Business: ${result.metadata.profileName}`,
    `Overall: ${result.overallScore}  ${result.scoreLabel}`,
    `Maturity: ${maturity.level}`,
    `Confidence: ${confidence.level}  (${confidence.coveragePercent}% coverage, ${confidence.evaluatedRules} evaluated / ${confidence.applicableRules} relevant)`,
    `Location: ${result.metadata.locationType}${result.metadata.isNewBusiness ? "  (new-business review rules)" : ""}`,
    "",
    "Category scores",
  ];

  for (const category of result.categoryScores) {
    const mark = category.applicable ? String(category.score).padStart(3, " ") : "n/a";
    lines.push(
      `  ${mark}  ${category.label}  (weight ${category.weight}%)`,
    );
  }

  lines.push(
    "",
    `Findings: ${counts.pass} pass · ${counts.warning} warning · ${counts.fail} fail · ${counts.not_applicable} n/a · ${counts.insufficient_data} insufficient data`,
    "",
    "Top priorities",
  );

  const top = result.priorities.slice(0, 5);
  if (top.length === 0) {
    lines.push("  (none)");
  } else {
    for (const item of top) {
      lines.push(`  [${item.severity}] ${item.title}`);
      lines.push(`      ${item.whatToDo}`);
    }
  }

  console.log(lines.join("\n"));
}

function parseArgs(argv: string[]): GbpAuditFixtureId[] {
  const requested = argv.filter((arg) => arg !== "--" && !arg.startsWith("--"));
  if (requested.length === 0 || requested.includes("all")) {
    return [...GBP_AUDIT_FIXTURE_IDS];
  }
  return requested as GbpAuditFixtureId[];
}

const adapter = new MockBusinessProfileAdapter();
const ids = parseArgs(process.argv.slice(2));

for (const id of ids) {
  const profile = adapter.toBusinessProfileData(getGbpAuditFixture(id));
  printAudit(id, runGbpAudit(profile));
}
