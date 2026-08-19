import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { parseCampaignInput, parseDesiredQualifiedCount } from "./campaign";
import { DEFAULT_DESIRED_QUALIFIED_COUNT, DUPLICATE_WARNING_NOTICE } from "./constants";
import {
  buildDuplicateWarning,
  summarizeDuplicateWarning,
} from "./duplicates";
import { normalizeProspectWebsite, tryNormalizeProspectHostname } from "./hostname";
import {
  isProspectAttachedToCampaign,
  parseProspectInput,
  parseSkipReason,
} from "./prospect";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertHostname(
  input: string,
  expected: string,
  message: string,
): void {
  const result = normalizeProspectWebsite(input);
  assert(result.success, `${message}: expected success`);
  if (result.success) {
    assert(result.hostname === expected, `${message}: got ${result.hostname}`);
  }
}

function assertRejected(input: string, needle: string, message: string): void {
  const result = normalizeProspectWebsite(input);
  assert(!result.success, `${message}: expected rejection`);
  if (!result.success) {
    assert(
      result.error.toLowerCase().includes(needle),
      `${message}: expected "${needle}" in "${result.error}"`,
    );
  }
}

assertHostname(
  "https://www.example.com/",
  "example.com",
  "www and trailing slash strip",
);
assertHostname("https://example.com", "example.com", "https host");
assertHostname(
  "http://example.com/about",
  "example.com",
  "path is removed from hostname",
);
assertHostname(
  "https://www.example.com/services/plumbing",
  "example.com",
  "deep path still yields host",
);
assertHostname("EXAMPLE.COM", "example.com", "bare domain lowercases");
assertHostname(
  "https://WWW.Example.COM/about?utm=1",
  "example.com",
  "equivalent URLs share a hostname",
);

const left = normalizeProspectWebsite("https://www.example.com/");
const right = normalizeProspectWebsite("http://example.com/about");
assert(left.success && right.success, "pair succeeds");
if (left.success && right.success) {
  assert(left.hostname === right.hostname, "equivalent URLs produce same hostname");
}

assertRejected("localhost", "private and local", "localhost hostname");
assertRejected("http://localhost", "private and local", "localhost URL");
assertRejected("127.0.0.1", "private and local", "loopback");
assertRejected("https://192.168.1.10", "private and local", "private IPv4");
assertRejected("10.0.0.5", "private and local", "RFC1918");
assertRejected("ftp://example.com", "http and https", "non-http scheme");
assertRejected("javascript:alert(1)", "http and https", "javascript");

assert(
  tryNormalizeProspectHostname("") === null,
  "empty website has no hostname",
);
assert(
  tryNormalizeProspectHostname("https://www.acme.test/contact") === "acme.test",
  "tryNormalize returns host",
);

assert(
  parseDesiredQualifiedCount("") === DEFAULT_DESIRED_QUALIFIED_COUNT,
  "empty desired count defaults to 5",
);
assert(
  parseDesiredQualifiedCount("   ") === DEFAULT_DESIRED_QUALIFIED_COUNT,
  "whitespace desired count defaults to 5",
);

const campaign = parseCampaignInput({
  name: "Magnolia Home Services Outreach",
  locationLabel: "",
  city: "Magnolia",
  state: "TX",
  radiusMiles: "25",
  industries: ["HVAC", "Plumbing", "Roofing"],
  desiredQualifiedCount: "",
  notes: "",
});
assert(campaign.success, "valid campaign parses");
if (campaign.success) {
  assert(campaign.data.desiredQualifiedCount === 5, "campaign default desired count is 5");
  assert(campaign.data.locationLabel === "Magnolia, TX", "city/state become location label");
  assert(campaign.data.radiusMiles === 25, "radius parsed");
  assert(campaign.data.industries.length === 3, "industries kept");
}

const missingName = parseCampaignInput({
  name: "",
  locationLabel: "Magnolia, TX",
  city: "",
  state: "",
  radiusMiles: "",
  industries: ["HVAC"],
  desiredQualifiedCount: "5",
  notes: "",
});
assert(!missingName.success, "campaign name required");

const prospect = parseProspectInput({
  businessName: "ABC Plumbing",
  website: "https://www.abcplumbing.com/about",
  industry: "Plumbing",
  city: "Magnolia",
  state: "TX",
  address: "",
  phone: "",
  notes: "",
});
assert(prospect.success, "manual prospect parses");
if (prospect.success) {
  assert(prospect.data.hostname === "abcplumbing.com", "normalized hostname stored");
  assert(prospect.data.website?.startsWith("https://") === true, "website kept as public URL");
}

const skipped = parseSkipReason("");
assert(!skipped.success, "skip requires a reason");

const skipOk = parseSkipReason("Already a JS Solutions customer.");
assert(skipOk.success && skipOk.reason.includes("customer"), "skip persists trimmed reason");

assert(
  isProspectAttachedToCampaign(
    [{ campaignId: "c1", prospectId: "p1" }],
    "c1",
    "p1",
  ),
  "same prospect cannot attach twice to the same campaign",
);
assert(
  !isProspectAttachedToCampaign(
    [{ campaignId: "c1", prospectId: "p1" }],
    "c1",
    "p2",
  ),
  "different prospect can attach",
);

const warning = buildDuplicateWarning("abcplumbing.com", [
  {
    kind: "prospect",
    id: "p1",
    label: "ABC Plumbing",
    detail: "Existing prospect",
  },
  {
    kind: "lead",
    id: "l1",
    label: "ABC Plumbing",
    detail: "Inbound lead",
  },
]);
assert(warning !== null, "duplicate hostname detected");
if (warning) {
  assert(
    summarizeDuplicateWarning(warning).includes("abcplumbing.com"),
    "warning names hostname",
  );
  assert(
    summarizeDuplicateWarning(warning).includes("inbound lead"),
    "warning mentions inbound lead",
  );
}

assert(
  DUPLICATE_WARNING_NOTICE.toLowerCase().includes("hard block"),
  "later suppression hard-block is documented",
);

const here = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(
  join(here, "../../../prisma/schema.prisma"),
  "utf8",
);
assert(
  schema.includes('source AuditReportSource @default(PUBLIC_FUNNEL)'),
  "existing reports default to PUBLIC_FUNNEL",
);
assert(
  !schema.includes("reportMode") || schema.includes('reportMode String'),
  "reportMode remains a presentation field",
);
assert(
  schema.includes("model CampaignProspect"),
  "CampaignProspect join model exists",
);
assert(
  schema.includes("@@unique([campaignId, prospectId])"),
  "campaign/prospect pair is unique",
);
assert(
  !/hostname\s+String\s+@unique/.test(schema),
  "Prospect.hostname is indexed, not globally unique",
);

const reportSource = readFileSync(
  join(here, "../website-audit/storage/report.ts"),
  "utf8",
);
assert(
  reportSource.includes('options?.source ?? "PUBLIC_FUNNEL"'),
  "createAuditReport defaults to PUBLIC_FUNNEL",
);

const publicAuditActions = readFileSync(
  join(here, "../../app/website-audit/actions.ts"),
  "utf8",
);
assert(
  !publicAuditActions.includes("PROSPECTING"),
  "public auditWebsite does not mark reports as prospecting",
);

const repositorySource = readFileSync(
  join(here, "../website-audit/storage/prisma-repository.ts"),
  "utf8",
);
assert(
  repositorySource.includes('source: "PUBLIC_FUNNEL"'),
  "inbound report list does not mix in prospecting scans",
);

const pipelineSource = readFileSync(
  join(here, "../../components/website-audit/pipeline-board.tsx"),
  "utf8",
);
assert(
  pipelineSource.includes("report.lead ==="),
  "inbound board still treats lead-less AuditReports as prospects",
);
assert(
  !pipelineSource.includes("@/lib/prospecting"),
  "inbound pipeline board does not import prospecting entities",
);

const reportsPage = readFileSync(
  join(here, "../../app/reports/page.tsx"),
  "utf8",
);
assert(
  !reportsPage.includes("prisma.prospect"),
  "inbound reports dashboard does not list Prospect rows",
);

const layoutSource = readFileSync(
  join(here, "../../app/reports/layout.tsx"),
  "utf8",
);
assert(
  layoutSource.includes("InternalWorkspaceNav"),
  "internal workspace layout includes prospecting navigation",
);

const navSource = readFileSync(
  join(here, "../../components/internal/workspace-nav.tsx"),
  "utf8",
);
assert(
  navSource.includes("/reports/prospecting"),
  "internal workspace navigation links to prospecting",
);

const actionsSource = readFileSync(
  join(here, "../../app/reports/prospecting/actions.ts"),
  "utf8",
);
assert(
  !actionsSource.includes("openai"),
  "prospecting actions do not import OpenAI",
);
assert(
  !actionsSource.includes("stripe"),
  "prospecting actions do not import Stripe",
);
assert(
  !actionsSource.includes("resend"),
  "prospecting actions do not import Resend",
);
assert(
  !actionsSource.includes("auditWebsite"),
  "prospecting actions do not run the public audit",
);
assert(
  !actionsSource.includes("prisma.lead.create"),
  "prospecting actions do not create Leads",
);
assert(
  actionsSource.includes('qualificationStatus: "DISCOVERED"'),
  "manual prospects start as DISCOVERED",
);
assert(
  actionsSource.includes('outreachStatus: "NOT_READY"'),
  "manual prospects start as NOT_READY",
);
assert(
  actionsSource.includes("getInternalSession"),
  "prospecting mutations verify the internal session",
);

console.log("prospecting.verify.ts passed");
