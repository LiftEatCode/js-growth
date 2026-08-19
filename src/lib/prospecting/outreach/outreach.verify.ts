import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { WebsiteAuditResult } from "@/lib/website-audit/types";
import type { StoredQualification } from "@/lib/prospecting/qualification/types";

import { MAX_AI_DRAFT_CONCURRENCY, MAX_AI_DRAFTS_PER_RUN } from "./constants";
import { buildOutreachDraftContext, compactOutreachContextJson } from "./context";
import { clampOutreachDraftBatchSize, isUsableOutreachDraft } from "./limit";
import { validateOutreachDraftOutput } from "./validate";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const audit = {
  success: true,
  overallScore: 73,
  grade: "B",
  findings: [
    {
      id: "site-duplicate-titles",
      title: "Duplicate page titles",
      description: "Multiple pages share the same title tag.",
      recommendation: "Give important pages unique titles.",
      status: "warning",
      category: "seo",
      scoreImpact: 6,
      priority: "high",
      businessImpact: "high",
      difficulty: "easy",
      estimatedFixMinutes: 30,
      quickWin: true,
    },
  ],
  categoryScores: [
    {
      category: "seo",
      label: "Search",
      score: 18,
      maxScore: 25,
      applicable: true,
    },
    {
      category: "content",
      label: "Content",
      score: 12,
      maxScore: 20,
      applicable: true,
    },
  ],
} as unknown as WebsiteAuditResult;

const qualification: StoredQualification = {
  version: 1,
  score: 76,
  label: "GOOD",
  factors: [],
  primaryFindingId: "site-duplicate-titles",
  primaryFindingTitle: "Duplicate page titles",
  secondaryFindingId: null,
  secondaryFindingTitle: null,
  skipReason: null,
  overallScore: 73,
  scoreBandId: "good",
  weakestRelevantCategory: "content",
  auditedAt: "2026-08-18T00:00:00.000Z",
  reusedAudit: false,
};

const built = buildOutreachDraftContext({
  businessName: "High Point A/C & Heating",
  website: "https://highpoint.example",
  city: "Magnolia",
  state: "TX",
  industry: "HVAC",
  audit,
  qualification,
});

assert(!("error" in built), "context builds from a credible finding");
if ("error" in built) {
  throw new Error("context builds from a credible finding");
}

const context = built;

const json = compactOutreachContextJson(context);
assert(json.includes("Duplicate page titles"), "primary finding is in compact context");
assert(!json.includes("<html"), "raw HTML is not sent");
assert(!json.includes("stripe"), "stripe data is not sent");
assert(!json.includes("cs_test_"), "Stripe IDs are not sent");
const parsed = JSON.parse(json) as Record<string, unknown>;
assert(!("auditReportId" in parsed), "report UUID is not in compact context");
assert(!("googlePlaceId" in parsed), "Google Place ID is not in compact context");

const valid = validateOutreachDraftOutput(
  {
    subject: "Quick website note for High Point A/C & Heating",
    body: `Hi High Point A/C & Heating,\n\nI was taking a look at your public website and noticed duplicate page titles on more than one page.\n\nThat can make it harder for people and search engines to tell pages apart.\n\nI run JS Solutions and we built a Website Growth Audit that reviews search, content, conversion, local visibility, technical health, and performance. I already ran the initial analysis and would be happy to send over what it found if you would like to see it.\n\nBest,\nJosh\nJS Solutions\njs-growth.com`,
  },
  context,
);
assert(valid.ok, "grounded draft passes validation");

assert(
  !validateOutreachDraftOutput(
    {
      subject: "You're losing customers",
      body: valid.ok ? valid.content.body : "x".repeat(200),
    },
    context,
  ).ok,
  "aggressive unsupported claims fail",
);

assert(
  !validateOutreachDraftOutput(
    {
      subject: "Quick note",
      body: `${"I noticed duplicate titles. ".repeat(20)} Your score is 73 and our prospecting engine selected you.`,
    },
    context,
  ).ok,
  "score and internal language fail",
);

assert(
  !validateOutreachDraftOutput(
    {
      subject: "Quick note for [Business]",
      body: valid.ok ? valid.content.body : "x".repeat(200),
    },
    context,
  ).ok,
  "placeholder tokens fail",
);

assert(isUsableOutreachDraft("DRAFT"), "drafts are reusable");
assert(isUsableOutreachDraft("NEEDS_REVIEW"), "needs-review drafts are reusable");
assert(!isUsableOutreachDraft("REJECTED"), "rejected drafts are not reused");
assert(clampOutreachDraftBatchSize(40) === MAX_AI_DRAFTS_PER_RUN, "draft cap is 5");
const here = dirname(fileURLToPath(import.meta.url));
const actions = readFileSync(
  join(here, "../../../app/reports/prospecting/outreach-actions.ts"),
  "utf8",
);
const createDraft = readFileSync(join(here, "./create-draft.ts"), "utf8");
const prompt = readFileSync(join(here, "./prompt.ts"), "utf8");
const generateSource = readFileSync(join(here, "./generate.ts"), "utf8");

assert(MAX_AI_DRAFT_CONCURRENCY === 1, "draft concurrency is 1");
assert(
  generateSource.includes("getOpenAiAuditModel"),
  "outreach uses OPENAI_AUDIT_MODEL",
);

assert(actions.includes("getInternalSession"), "draft actions require session");
assert(
  actions.includes("sendOutreachMessage"),
  "Sprint 5 adds a send action",
);
assert(
  actions.includes("resend.emails.send"),
  "sending uses Resend",
);
assert(!createDraft.includes("resend.emails.send"), "draft generation does not send email");
assert(createDraft.includes("isSelectedTopN"), "only selected prospects get drafts");
assert(createDraft.includes("canContactProspect"), "suppression blocks generation");
assert(createDraft.includes("primaryFindingId"), "credible finding required");
assert(prompt.includes("Never mention that you are an AI"), "prompt forbids AI language");
assert(prompt.includes("losing customers"), "prompt forbids unsupported claims");
assert(!createDraft.includes("runDeterministicWebsiteAudit"), "drafts do not recrawl audits");
assert(!createDraft.includes("google-places"), "drafts do not call Google Places");

console.log("outreach.verify.ts passed");
