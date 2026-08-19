import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createAuditReport } from "./storage/report";
import {
  canCreateCustomerCheckout,
  canExposeAuditReportPublicly,
  isProspectingAuditSource,
} from "./report-source";
import {
  MAX_AUDIT_CONCURRENCY,
  MAX_PROSPECT_AUDITS_PER_RUN,
  PROSPECT_AUDIT_TTL_MS,
} from "@/lib/prospecting/qualification/constants";
import {
  clampQualificationBatchSize,
  isReusableProspectingAudit,
} from "@/lib/prospecting/qualification/limit";
import type { WebsiteAuditResult } from "./types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const audit = {
  success: true,
  metadata: {
    requestedUrl: "https://happyplumbing.example",
    finalUrl: "https://happyplumbing.example",
    statusCode: 200,
    contentType: "text/html",
    fetchedAt: "2026-01-01T00:00:00.000Z",
  },
  pageData: {} as WebsiteAuditResult["pageData"],
  findings: [],
  categoryScores: [],
  overallScore: 87,
  summary: {
    passed: 1,
    warnings: 1,
    failed: 0,
    criticalIssues: 0,
    quickWins: 1,
    highImpactFindings: 1,
    estimatedFixMinutes: 20,
  },
  opportunity: {
    score: 40,
    level: "medium",
    trafficGainPercent: { minimum: 0, maximum: 0 },
    monthlyLeadGain: { minimum: 0, maximum: 0 },
    monthlyRevenueOpportunity: { minimum: 0, maximum: 0 },
    estimatedFixMinutes: 20,
    confidence: "low",
    assumptions: [],
    insights: [],
  },
} as unknown as WebsiteAuditResult;

const prospectingReport = createAuditReport(audit, "consultation", {
  source: "PROSPECTING",
});
const publicReport = createAuditReport(audit, "public");

assert(prospectingReport.source === "PROSPECTING", "prospecting source is set");
assert(publicReport.source === "PUBLIC_FUNNEL", "public reports default to PUBLIC_FUNNEL");
assert(
  !canExposeAuditReportPublicly(prospectingReport.source),
  "prospecting reports are not public",
);
assert(
  canExposeAuditReportPublicly(publicReport.source),
  "public funnel reports remain customer-facing",
);
assert(
  !canCreateCustomerCheckout({
    source: "PROSPECTING",
    reportMode: "public",
  }),
  "Stripe checkout cannot be created for prospecting reports",
);
assert(
  canCreateCustomerCheckout({
    source: "PUBLIC_FUNNEL",
    reportMode: "public",
  }),
  "public reports can still start checkout",
);
assert(isProspectingAuditSource("PROSPECTING"), "prospecting source detected");

assert(
  clampQualificationBatchSize(40) === MAX_PROSPECT_AUDITS_PER_RUN,
  "qualification batch is capped at 10",
);
assert(MAX_AUDIT_CONCURRENCY === 2, "audit concurrency is 2");
assert(PROSPECT_AUDIT_TTL_MS === 7 * 24 * 60 * 60 * 1000, "audit TTL is 7 days");
assert(
  isReusableProspectingAudit({
    source: "PROSPECTING",
    createdAt: new Date(Date.now() - 60_000),
  }),
  "recent prospecting audits are reusable",
);
assert(
  !isReusableProspectingAudit({
    source: "PUBLIC_FUNNEL",
    createdAt: new Date(),
  }),
  "public customer audits are not reused for prospecting",
);
assert(
  !isReusableProspectingAudit({
    source: "PROSPECTING",
    createdAt: new Date(Date.now() - PROSPECT_AUDIT_TTL_MS - 1_000),
  }),
  "expired prospecting audits are not reused",
);

const here = dirname(fileURLToPath(import.meta.url));
const files = {
  reportPage: readFileSync(join(here, "../../app/report/[id]/page.tsx"), "utf8"),
  pdf: readFileSync(join(here, "../../app/report/[id]/pdf/route.tsx"), "utf8"),
  professional: readFileSync(
    join(here, "../../app/report/[id]/professional/route.ts"),
    "utf8",
  ),
  checkout: readFileSync(
    join(here, "../payments/professional-audit.ts"),
    "utf8",
  ),
  qualificationActions: readFileSync(
    join(here, "../../app/reports/prospecting/qualification-actions.ts"),
    "utf8",
  ),
  auditProspect: readFileSync(
    join(here, "../prospecting/qualification/audit-prospect.ts"),
    "utf8",
  ),
  repository: readFileSync(join(here, "./storage/prisma-repository.ts"), "utf8"),
};

assert(
  files.reportPage.includes("canExposeAuditReportPublicly"),
  "public report page denies prospecting reports",
);
assert(
  files.pdf.includes("canExposeAuditReportPublicly"),
  "PDF route denies prospecting reports",
);
assert(
  files.professional.includes("canExposeAuditReportPublicly"),
  "Professional API denies prospecting reports",
);
assert(
  files.checkout.includes("isProspectingAuditSource"),
  "checkout denies prospecting reports",
);
assert(
  files.repository.includes('source: "PUBLIC_FUNNEL"'),
  "inbound report list stays on PUBLIC_FUNNEL",
);
assert(
  !files.qualificationActions.includes("openai"),
  "qualification does not call OpenAI",
);
assert(
  !files.qualificationActions.includes("google-places"),
  "qualification does not call Google Places",
);
assert(
  !files.qualificationActions.includes("resend"),
  "qualification does not send email",
);
assert(
  !files.auditProspect.includes("prisma.lead.create"),
  "prospect audits do not create Leads",
);
assert(
  !files.auditProspect.includes("reportPurchase"),
  "prospect audits do not create Stripe purchases",
);
assert(
  files.auditProspect.includes('source: "PROSPECTING"'),
  "saved prospecting audits use PROSPECTING source",
);
assert(
  files.qualificationActions.includes("RUNNING"),
  "concurrent qualification runs are blocked",
);

const publicReportDir = join(here, "../../app/report");
const reportPage = files.reportPage;
const pdf = files.pdf;
const professional = files.professional;
assert(
  !reportPage.includes("ProspectContact") && !reportPage.includes("OutreachMessage"),
  "public report page cannot expose prospect contacts or drafts",
);
assert(
  !pdf.includes("ProspectContact") && !pdf.includes("OutreachMessage"),
  "PDF cannot expose prospect contacts or drafts",
);
assert(
  !professional.includes("ProspectContact") && !professional.includes("OutreachMessage"),
  "Professional API cannot expose prospect contacts or drafts",
);
assert(
  !readFileSync(join(publicReportDir, "[id]/page.tsx"), "utf8").includes(
    "NEXT_PUBLIC_OPENAI",
  ),
  "no public OpenAI key",
);

console.log("prospect-audit.verify.ts passed");
