import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  COMMERCIAL_EVENTS,
  isForbiddenAnalyticsParamKey,
  isForbiddenAnalyticsParamValue,
  sanitizeCommercialEventParams,
} from "./commercial-events";
import {
  analyticsPayloadExposesToken,
  buildAnalyticsPageViewParams,
  containsCapabilityTokenShape,
  containsReportUuid,
  sanitizeAnalyticsPagePath,
} from "./page-path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const REPORT_ID = "3ad43538-a0b0-4f39-937b-b119be11f62f";
const ORIGIN = "https://example.com";

assert(
  COMMERCIAL_EVENTS.auditCompleted === "audit_completed",
  "audit_completed event name is unchanged",
);
assert(
  COMMERCIAL_EVENTS.multiPageAuditCompleted === "multi_page_audit_completed",
  "multi_page_audit_completed event name is unchanged",
);
assert(
  COMMERCIAL_EVENTS.professionalCheckoutStarted ===
    "professional_checkout_started",
  "professional_checkout_started event name is unchanged",
);
assert(
  isForbiddenAnalyticsParamKey("competitor_id"),
  "competitor ids are stripped from analytics",
);
assert(
  isForbiddenAnalyticsParamKey("latitude"),
  "latitude is stripped from analytics",
);
assert(
  isForbiddenAnalyticsParamKey("longitude"),
  "longitude is stripped from analytics",
);
assert(
  isForbiddenAnalyticsParamKey("coordinates"),
  "coordinates are stripped from analytics",
);

const auditCompleted = sanitizeCommercialEventParams({
  pages_scanned: 4,
  site_scan_truncated: true,
});
assert(auditCompleted?.pages_scanned === 4, "audit_completed keeps pages_scanned");
assert(
  auditCompleted?.site_scan_truncated === true,
  "audit_completed keeps site_scan_truncated",
);
assert(
  !Object.keys(auditCompleted ?? {}).includes("report_id"),
  "audit_completed contains no report_id",
);

const multiPage = sanitizeCommercialEventParams({
  pages_discovered: 12,
  pages_scanned: 8,
  truncated: false,
});
assert(multiPage?.pages_discovered === 12, "multi_page keeps pages_discovered");
assert(multiPage?.pages_scanned === 8, "multi_page keeps pages_scanned");
assert(
  !Object.keys(multiPage ?? {}).includes("report_id"),
  "multi_page_audit_completed contains no report_id",
);

const leaked = sanitizeCommercialEventParams({
  report_id: REPORT_ID,
  reportId: REPORT_ID,
  pages_scanned: 2,
} as Record<string, string | number | boolean>);
assert(leaked?.pages_scanned === 2, "sanitizer keeps non-sensitive params");
assert(
  leaked && !("report_id" in leaked) && !("reportId" in leaked),
  "sanitizer strips report UUID keys",
);

assert(isForbiddenAnalyticsParamKey("report_id"), "report_id key is forbidden");
assert(isForbiddenAnalyticsParamKey("reportId"), "reportId key is forbidden");
assert(isForbiddenAnalyticsParamKey("contact_email"), "contact_email is forbidden");
assert(isForbiddenAnalyticsParamKey("prospect_email"), "prospect_email is forbidden");
assert(isForbiddenAnalyticsParamKey("outreach_status"), "outreach_status is forbidden");
assert(isForbiddenAnalyticsParamKey("outcome_notes"), "outcome_notes is forbidden");
assert(isForbiddenAnalyticsParamKey("contact_form_url"), "contact_form_url is forbidden");
assert(isForbiddenAnalyticsParamKey("contact_form_id"), "contact_form_id is forbidden");
assert(isForbiddenAnalyticsParamKey("outreach_channel"), "outreach_channel is forbidden");
assert(isForbiddenAnalyticsParamKey("submitted_by_email"), "submitted_by_email is forbidden");
assert(isForbiddenAnalyticsParamKey("provider_message_id"), "provider_message_id is forbidden");
assert(isForbiddenAnalyticsParamKey("delivery_status"), "delivery_status is forbidden");
assert(isForbiddenAnalyticsParamKey("bounce_reason"), "bounce_reason is forbidden");
assert(isForbiddenAnalyticsParamKey("webhook_id"), "webhook_id is forbidden");
assert(isForbiddenAnalyticsParamKey("competitive_interpretation_id"), "competitive_interpretation_id key is forbidden");
assert(isForbiddenAnalyticsParamKey("interpretation_json"), "interpretation_json key is forbidden");
assert(isForbiddenAnalyticsParamKey("input_fingerprint"), "input_fingerprint key is forbidden");
assert(isForbiddenAnalyticsParamKey("comparison_snapshot_id"), "comparison_snapshot_id key is forbidden");
assert(isForbiddenAnalyticsParamKey("internal_talking_points"), "internal_talking_points key is forbidden");
assert(isForbiddenAnalyticsParamKey("competitive_ai_summary"), "competitive_ai_summary key is forbidden");
assert(isForbiddenAnalyticsParamKey("competitive_report"), "competitive_report key is forbidden");
assert(isForbiddenAnalyticsParamKey("competitive_growth_analysis"), "competitive_growth_analysis key is forbidden");
assert(isForbiddenAnalyticsParamKey("source_key"), "source_key key is forbidden");
assert(isForbiddenAnalyticsParamKey("implementation_plan_id"), "implementation_plan_id key is forbidden");
assert(isForbiddenAnalyticsParamKey("implementation_interpretation_id"), "implementation_interpretation_id key is forbidden");
assert(isForbiddenAnalyticsParamKey("implementation_strategy_json"), "implementation_strategy_json key is forbidden");
assert(isForbiddenAnalyticsParamKey("opportunity_id"), "opportunity_id key is forbidden");
assert(isForbiddenAnalyticsParamKey("opportunity_stage"), "opportunity_stage key is forbidden");
assert(isForbiddenAnalyticsParamKey("opportunity_owner"), "opportunity_owner key is forbidden");
assert(isForbiddenAnalyticsParamKey("next_action"), "next_action key is forbidden");
assert(isForbiddenAnalyticsParamKey("lost_reason"), "lost_reason key is forbidden");
assert(isForbiddenAnalyticsParamKey("commercial_notes"), "commercial_notes key is forbidden");
assert(isForbiddenAnalyticsParamKey("scope_id"), "scope_id key is forbidden");
assert(isForbiddenAnalyticsParamKey("scope_status"), "scope_status key is forbidden");
assert(isForbiddenAnalyticsParamKey("scope_summary"), "scope_summary key is forbidden");
assert(isForbiddenAnalyticsParamKey("scope_deliverables"), "scope_deliverables key is forbidden");
assert(isForbiddenAnalyticsParamKey("scope_assumptions"), "scope_assumptions key is forbidden");
assert(isForbiddenAnalyticsParamKey("scope_exclusions"), "scope_exclusions key is forbidden");
assert(isForbiddenAnalyticsParamKey("commercial_scope"), "commercial_scope key is forbidden");
assert(isForbiddenAnalyticsParamKey("pricing_id"), "pricing_id key is forbidden");
assert(isForbiddenAnalyticsParamKey("pricing_status"), "pricing_status key is forbidden");
assert(isForbiddenAnalyticsParamKey("pricing_total"), "pricing_total key is forbidden");
assert(isForbiddenAnalyticsParamKey("commercial_pricing"), "commercial_pricing key is forbidden");
assert(isForbiddenAnalyticsParamKey("proposal_id"), "proposal_id key is forbidden");
assert(isForbiddenAnalyticsParamKey("proposal_status"), "proposal_status key is forbidden");
assert(isForbiddenAnalyticsParamKey("proposal_revision"), "proposal_revision key is forbidden");
assert(isForbiddenAnalyticsParamKey("proposal_total"), "proposal_total key is forbidden");
assert(isForbiddenAnalyticsParamKey("proposal_scope"), "proposal_scope key is forbidden");
assert(isForbiddenAnalyticsParamKey("proposal_pricing"), "proposal_pricing key is forbidden");
assert(isForbiddenAnalyticsParamKey("proposal_summary"), "proposal_summary key is forbidden");
assert(isForbiddenAnalyticsParamKey("commercial_proposal"), "commercial_proposal key is forbidden");
assert(isForbiddenAnalyticsParamKey("override_reason"), "override_reason key is forbidden");
assert(isForbiddenAnalyticsParamKey("workstream_id"), "workstream_id key is forbidden");
assert(isForbiddenAnalyticsParamKey("evidence_json"), "evidence_json key is forbidden");
assert(isForbiddenAnalyticsParamKey("email"), "email key is forbidden");
assert(isForbiddenAnalyticsParamValue(REPORT_ID), "UUID values are forbidden");
assert(
  isForbiddenAnalyticsParamValue("cs_test_example"),
  "Stripe session IDs are forbidden",
);
assert(!isForbiddenAnalyticsParamValue("gpt-4.1-mini"), "model names remain allowed");

const checkoutStarted = sanitizeCommercialEventParams(undefined);
assert(
  checkoutStarted === undefined,
  "professional_checkout_started has no identifier payload",
);

const aiCompleted = sanitizeCommercialEventParams({
  status: "completed",
  model: "gpt-4.1-mini",
});
assert(aiCompleted?.status === "completed", "AI completed keeps status");
assert(aiCompleted?.model === "gpt-4.1-mini", "AI completed keeps model");
assert(
  JSON.stringify(aiCompleted).includes(REPORT_ID) === false,
  "AI events remain identifier-free",
);

const aiFailed = sanitizeCommercialEventParams({
  status: "unavailable",
  report_id: REPORT_ID,
} as Record<string, string | number | boolean>);
assert(aiFailed?.status === "unavailable", "AI failed keeps status");
assert(
  aiFailed && !("report_id" in aiFailed),
  "AI failed does not keep a report UUID",
);

assert(
  sanitizeAnalyticsPagePath(`/report/${REPORT_ID}`) === "/report/[id]",
  "report page_path is redacted",
);
assert(
  sanitizeAnalyticsPagePath(`/report/${REPORT_ID}/purchase/success`) ===
    "/report/[id]/purchase/success",
  "purchase success page_path is redacted",
);
assert(
  sanitizeAnalyticsPagePath(`/report/${REPORT_ID}/purchase/cancelled`) ===
    "/report/[id]/purchase/cancelled",
  "purchase cancelled page_path is redacted",
);
assert(
  sanitizeAnalyticsPagePath(`/report/${REPORT_ID}/purchase/unavailable`) ===
    "/report/[id]/purchase/unavailable",
  "purchase unavailable page_path is redacted",
);
assert(
  sanitizeAnalyticsPagePath("/website-audit") === "/website-audit",
  "public audit landing path is unchanged",
);
assert(
  sanitizeAnalyticsPagePath("/contact") === "/contact",
  "public contact path is unchanged",
);

// Capability-bearing commercial share tokens (base64url-shaped, not UUIDs).
const PROPOSAL_SHARE_TOKEN =
  "xK9mN2pQ7rS4tU8vW1yZ0aBcDeFgHiJkLmNoPqRsTuVwXyZ";
const AGREEMENT_SHARE_TOKEN =
  "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abcde";

assert(
  sanitizeAnalyticsPagePath(`/proposal/${PROPOSAL_SHARE_TOKEN}`) ===
    "/proposal/[secure]",
  "proposal page_path is redacted to /proposal/[secure]",
);
assert(
  sanitizeAnalyticsPagePath(`/agreement/${AGREEMENT_SHARE_TOKEN}`) ===
    "/agreement/[secure]",
  "agreement page_path is redacted to /agreement/[secure]",
);
assert(
  sanitizeAnalyticsPagePath(`/proposal/${PROPOSAL_SHARE_TOKEN}/`) ===
    "/proposal/[secure]/",
  "proposal trailing slash still redacts token segment",
);
assert(
  sanitizeAnalyticsPagePath("/proposal") === "/proposal",
  "proposal index path unchanged when no token",
);
assert(
  sanitizeAnalyticsPagePath("/agreement") === "/agreement",
  "agreement index path unchanged when no token",
);

const proposalView = buildAnalyticsPageViewParams({
  origin: ORIGIN,
  pathname: `/proposal/${PROPOSAL_SHARE_TOKEN}`,
  search: `?utm_source=email&token=${PROPOSAL_SHARE_TOKEN}`,
  title: "Website Growth Implementation Proposal",
  referrer: `${ORIGIN}/proposal/${PROPOSAL_SHARE_TOKEN}`,
});
assert(
  proposalView.page_path === "/proposal/[secure]",
  "proposal page_view uses /proposal/[secure]",
);
assert(
  proposalView.page_location === `${ORIGIN}/proposal/[secure]`,
  "proposal page_location has no raw token or query leak",
);
assert(
  proposalView.page_referrer === `${ORIGIN}/proposal/[secure]`,
  "proposal page_referrer redacts share token",
);
assert(
  analyticsPayloadExposesToken(proposalView, PROPOSAL_SHARE_TOKEN) === false,
  "serialized proposal analytics payload never contains raw share token",
);
assert(
  containsCapabilityTokenShape(proposalView.page_path) === false,
  "sanitized proposal path has no token-shaped segment",
);
assert(
  containsCapabilityTokenShape(proposalView.page_location) === false,
  "sanitized proposal location has no token-shaped segment",
);

const agreementView = buildAnalyticsPageViewParams({
  origin: ORIGIN,
  pathname: `/agreement/${AGREEMENT_SHARE_TOKEN}`,
  search: `?ref=${AGREEMENT_SHARE_TOKEN}`,
  title: "Website Growth Implementation Agreement",
  referrer: `${ORIGIN}/agreement/${AGREEMENT_SHARE_TOKEN}`,
});
assert(
  agreementView.page_path === "/agreement/[secure]",
  "agreement page_view uses /agreement/[secure]",
);
assert(
  agreementView.page_location === `${ORIGIN}/agreement/[secure]`,
  "agreement page_location has no raw token or query leak",
);
assert(
  analyticsPayloadExposesToken(agreementView, AGREEMENT_SHARE_TOKEN) === false,
  "serialized agreement analytics payload never contains raw share token",
);
assert(
  containsCapabilityTokenShape(agreementView.page_path) === false,
  "sanitized agreement path has no token-shaped segment",
);
assert(
  containsCapabilityTokenShape(JSON.stringify(agreementView)) === false,
  "serialized agreement analytics has no token-shaped values",
);

// /payment/return may carry Stripe checkout session_id — strip from analytics.
const STRIPE_SESSION = "cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6";
const paymentReturn = buildAnalyticsPageViewParams({
  origin: ORIGIN,
  pathname: "/payment/return",
  search: `?status=success&session_id=${STRIPE_SESSION}`,
  title: "Payment confirmation",
});
assert(
  paymentReturn.page_path === "/payment/return",
  "payment return path identity preserved",
);
assert(
  paymentReturn.page_location === `${ORIGIN}/payment/return`,
  "payment return page_location omits session_id query",
);
assert(
  analyticsPayloadExposesToken(paymentReturn, STRIPE_SESSION) === false,
  "serialized payment return analytics never contains Stripe session id",
);
assert(
  paymentReturn.page_location.includes("session_id") === false,
  "payment return location has no session_id key",
);

const STRIPE_PAYMENT_INTENT = "pi_test_1a2b3c4d5e6f7g8h9i0j";
const paymentIntentReturn = buildAnalyticsPageViewParams({
  origin: ORIGIN,
  pathname: "/payment/return",
  search: `?payment_intent=${STRIPE_PAYMENT_INTENT}`,
  title: "Payment confirmation",
});
assert(
  analyticsPayloadExposesToken(paymentIntentReturn, STRIPE_PAYMENT_INTENT) ===
    false,
  "serialized payment return analytics never contains PaymentIntent id",
);

// ---------------------------------------------------------------------------
// Internal /reports commercial route families — record IDs → [id]
// Realistic Prisma cuid-shaped identifiers from production Realtime.
// ---------------------------------------------------------------------------
const CLIENT_ID = "cmt62pv7h008rblydpexsym3o";
const PROJECT_ID = "cmt62pv8o008sblydyv0udbzz";
const OPPORTUNITY_ID = "cmt4smahs0003xkyd8zeb21q4";
const SCOPE_ID = "cmt5scope0001xkydabcdef01";
const PRICING_ID = "cmt5price0002xkydabcdef02";
const PROPOSAL_ID = "cmt5prop00003xkydabcdef03";
const AGREEMENT_ID = "cmt5agree0004xkydabcdef04";
const CAMPAIGN_ID = "cmt6camp00005xkydabcdef05";
const PROSPECT_ID = "cmt6pros00006xkydabcdef06";
const COMPETITOR_ID = "cmt6comp00007xkydabcdef07";
const AUDIT_ID = "cmt6audit0008xkydabcdef08";
const RUN_ID = "cmt6run000009xkydabcdef09";
const INTERNAL_REPORT_UUID = REPORT_ID;

const internalRouteMatrix: Array<{
  input: string;
  expected: string;
  ids: string[];
  label: string;
}> = [
  {
    input: `/reports/${INTERNAL_REPORT_UUID}`,
    expected: "/reports/[id]",
    ids: [INTERNAL_REPORT_UUID],
    label: "internal audit report",
  },
  {
    input: `/reports/clients/${CLIENT_ID}`,
    expected: "/reports/clients/[id]",
    ids: [CLIENT_ID],
    label: "client detail",
  },
  {
    input: `/reports/clients/${CLIENT_ID}/projects/${PROJECT_ID}`,
    expected: "/reports/clients/[id]/projects/[id]",
    ids: [CLIENT_ID, PROJECT_ID],
    label: "client project",
  },
  {
    input: `/reports/opportunities/${OPPORTUNITY_ID}`,
    expected: "/reports/opportunities/[id]",
    ids: [OPPORTUNITY_ID],
    label: "opportunity detail",
  },
  {
    input: `/reports/opportunities/${OPPORTUNITY_ID}/scope/${SCOPE_ID}`,
    expected: "/reports/opportunities/[id]/scope/[id]",
    ids: [OPPORTUNITY_ID, SCOPE_ID],
    label: "opportunity scope",
  },
  {
    input: `/reports/opportunities/${OPPORTUNITY_ID}/pricing/${PRICING_ID}`,
    expected: "/reports/opportunities/[id]/pricing/[id]",
    ids: [OPPORTUNITY_ID, PRICING_ID],
    label: "opportunity pricing",
  },
  {
    input: `/reports/opportunities/${OPPORTUNITY_ID}/proposal/${PROPOSAL_ID}`,
    expected: "/reports/opportunities/[id]/proposal/[id]",
    ids: [OPPORTUNITY_ID, PROPOSAL_ID],
    label: "opportunity proposal",
  },
  {
    input: `/reports/opportunities/${OPPORTUNITY_ID}/agreement/${AGREEMENT_ID}`,
    expected: "/reports/opportunities/[id]/agreement/[id]",
    ids: [OPPORTUNITY_ID, AGREEMENT_ID],
    label: "opportunity agreement",
  },
  {
    input: `/reports/prospecting/${CAMPAIGN_ID}`,
    expected: "/reports/prospecting/[id]",
    ids: [CAMPAIGN_ID],
    label: "prospecting campaign",
  },
  {
    input: `/reports/prospecting/${CAMPAIGN_ID}/prospects/${PROSPECT_ID}`,
    expected: "/reports/prospecting/[id]/prospects/[id]",
    ids: [CAMPAIGN_ID, PROSPECT_ID],
    label: "campaign prospect",
  },
  {
    input: `/reports/leads/${CLIENT_ID}`,
    expected: "/reports/leads/[id]",
    ids: [CLIENT_ID],
    label: "lead detail",
  },
  {
    input: `/reports/prospecting/${CAMPAIGN_ID}/prospects/new`,
    expected: "/reports/prospecting/[id]/prospects/new",
    ids: [CAMPAIGN_ID],
    label: "campaign prospect new (static new)",
  },
  {
    input: `/reports/prospecting/${CAMPAIGN_ID}/discovery/${RUN_ID}`,
    expected: "/reports/prospecting/[id]/discovery/[id]",
    ids: [CAMPAIGN_ID, RUN_ID],
    label: "campaign discovery run",
  },
  {
    input: `/reports/prospecting/${CAMPAIGN_ID}/prospects/${PROSPECT_ID}/competitive-report`,
    expected: "/reports/prospecting/[id]/prospects/[id]/competitive-report",
    ids: [CAMPAIGN_ID, PROSPECT_ID],
    label: "competitive report",
  },
  {
    input: `/reports/prospecting/${CAMPAIGN_ID}/prospects/${PROSPECT_ID}/competitors/${COMPETITOR_ID}/audits/${AUDIT_ID}`,
    expected:
      "/reports/prospecting/[id]/prospects/[id]/competitors/[id]/audits/[id]",
    ids: [CAMPAIGN_ID, PROSPECT_ID, COMPETITOR_ID, AUDIT_ID],
    label: "competitor audit",
  },
];

for (const row of internalRouteMatrix) {
  assert(
    sanitizeAnalyticsPagePath(row.input) === row.expected,
    `${row.label}: path sanitizes to ${row.expected}`,
  );

  const payload = buildAnalyticsPageViewParams({
    origin: ORIGIN,
    pathname: row.input,
    search: `?client_id=${CLIENT_ID}&opportunity_id=${OPPORTUNITY_ID}&utm_source=test`,
    title: `Internal ${row.label}`,
    referrer: `${ORIGIN}${row.input}`,
  });

  assert(
    payload.page_path === row.expected,
    `${row.label}: page_view path is ${row.expected}`,
  );
  assert(
    payload.page_location === `${ORIGIN}${row.expected}`,
    `${row.label}: page_location omits IDs and commercial query params`,
  );
  assert(
    payload.page_path.includes("[id]"),
    `${row.label}: redacted path includes [id]`,
  );

  const serialized = JSON.stringify(payload);
  for (const id of row.ids) {
    assert(
      analyticsPayloadExposesToken(payload, id) === false,
      `${row.label}: serialized payload must not contain ${id}`,
    );
  }
  assert(
    serialized.includes(CLIENT_ID) === false,
    `${row.label}: client id must not appear in analytics payload`,
  );
  assert(
    serialized.includes(OPPORTUNITY_ID) === false,
    `${row.label}: opportunity id must not appear in analytics payload`,
  );
  assert(
    payload.page_location.includes("client_id") === false,
    `${row.label}: client_id query key absent from page_location`,
  );
  assert(
    payload.page_location.includes("opportunity_id") === false,
    `${row.label}: opportunity_id query key absent from page_location`,
  );
}

for (const staticPath of [
  "/reports",
  "/reports/growth",
  "/reports/growth/utm-builder",
  "/reports/growth/conversion",
  "/reports/growth/attribution",
  "/reports/growth/content",
  "/reports/growth/follow-up",
  "/reports/growth/local",
  "/reports/opportunities",
  "/reports/clients",
  "/reports/prospecting",
  "/reports/prospecting/new",
]) {
  assert(
    sanitizeAnalyticsPagePath(staticPath) === staticPath,
    `static path preserved: ${staticPath}`,
  );
  const payload = buildAnalyticsPageViewParams({
    origin: ORIGIN,
    pathname: staticPath,
    search: "?utm_source=newsletter",
    title: "Internal",
  });
  assert(
    payload.page_path === staticPath,
    `static page_view path preserved: ${staticPath}`,
  );
  assert(
    payload.page_location === `${ORIGIN}${staticPath}?utm_source=newsletter`,
    `static path keeps safe UTM query: ${staticPath}`,
  );
}

const reportsQueryLeak = buildAnalyticsPageViewParams({
  origin: ORIGIN,
  pathname: "/reports/growth",
  search: `?campaign_id=${CAMPAIGN_ID}&prospect_id=${PROSPECT_ID}`,
  title: "Growth",
});
assert(
  reportsQueryLeak.page_location === `${ORIGIN}/reports/growth`,
  "static /reports/growth strips commercial ID query params",
);
assert(
  analyticsPayloadExposesToken(reportsQueryLeak, CAMPAIGN_ID) === false,
  "campaign_id absent from growth analytics payload",
);
assert(
  analyticsPayloadExposesToken(reportsQueryLeak, PROSPECT_ID) === false,
  "prospect_id absent from growth analytics payload",
);

assert(
  isForbiddenAnalyticsParamKey("campaign_id"),
  "campaign_id key is forbidden in event params",
);
assert(
  isForbiddenAnalyticsParamKey("client_id"),
  "client_id key is forbidden in event params",
);
assert(
  isForbiddenAnalyticsParamKey("project_id"),
  "project_id key is forbidden in event params",
);
assert(
  isForbiddenAnalyticsParamKey("run_id"),
  "run_id key is forbidden in event params",
);
assert(
  isForbiddenAnalyticsParamKey("competitor_id"),
  "competitor_id key is forbidden in event params",
);

const reportView = buildAnalyticsPageViewParams({
  origin: ORIGIN,
  pathname: `/report/${REPORT_ID}`,
  search: `?session_id=cs_test_example`,
  title: `Website Audit Report - ${REPORT_ID}`,
  referrer: `${ORIGIN}/report/${REPORT_ID}`,
});
assert(reportView.page_path === "/report/[id]", "report page_view uses redacted path");
assert(
  reportView.page_location === `${ORIGIN}/report/[id]`,
  "report page_location has no UUID or session id",
);
assert(
  containsReportUuid(reportView.page_path) === false,
  "report page_path cannot expose UUID",
);
assert(
  containsReportUuid(reportView.page_location) === false,
  "report page_location cannot expose UUID",
);
assert(
  containsReportUuid(reportView.page_title) === false,
  "report page_title cannot expose UUID",
);
assert(
  containsReportUuid(reportView.page_referrer) === false,
  "report page_referrer cannot expose UUID",
);
assert(
  reportView.page_location.includes("session_id") === false,
  "report page_view omits Stripe session query",
);

const purchaseSuccess = buildAnalyticsPageViewParams({
  origin: ORIGIN,
  pathname: `/report/${REPORT_ID}/purchase/success`,
  search: "?session_id=cs_test_example",
  title: "Purchase success",
});
assert(
  purchaseSuccess.page_path === "/report/[id]/purchase/success",
  "purchase status path is normalized",
);
assert(
  containsReportUuid(JSON.stringify(purchaseSuccess)) === false,
  "purchase status routes cannot expose UUID",
);

const publicPage = buildAnalyticsPageViewParams({
  origin: ORIGIN,
  pathname: "/website-audit",
  search: "?utm_source=newsletter",
  title: "Website Growth Audit",
});
assert(publicPage.page_path === "/website-audit", "public page_path is unchanged");
assert(
  publicPage.page_location === `${ORIGIN}/website-audit?utm_source=newsletter`,
  "public page analytics keep safe query params",
);

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(here, "../..");

function walkTsFiles(directory: string, files: string[] = []): string[] {
  for (const entry of readdirSync(directory)) {
    if (entry === "generated" || entry === "node_modules") {
      continue;
    }

    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walkTsFiles(fullPath, files);
      continue;
    }

    if (extname(entry) === ".ts" || extname(entry) === ".tsx") {
      files.push(fullPath);
    }
  }

  return files;
}

const analyticsSources = walkTsFiles(srcRoot).filter(
  (file) => !file.endsWith(".verify.ts"),
);

for (const file of analyticsSources) {
  const source = readFileSync(file, "utf8");
  if (!source.includes("trackCommercialEvent") && !source.includes("gtag(")) {
    continue;
  }

  assert(
    !/trackCommercialEvent\([\s\S]*?report_id\s*:/.test(source),
    `${file} must not send report_id to trackCommercialEvent`,
  );
  assert(
    !/trackCommercialEvent\([\s\S]*?reportId\s*:/.test(source),
    `${file} must not send reportId to trackCommercialEvent`,
  );
}

const commercialEventsSource = readFileSync(
  join(here, "commercial-events.ts"),
  "utf8",
);
assert(
  !commercialEventsSource.includes("report_id"),
  "analytics types do not mention report_id",
);
assert(
  commercialEventsSource.includes("pages_scanned"),
  "analytics types keep pages_scanned",
);

const gaSource = readFileSync(
  join(here, "../../components/analytics/google-analytics.tsx"),
  "utf8",
);
assert(
  gaSource.includes("send_page_view: false"),
  "automatic GA page_view is disabled",
);
assert(
  gaSource.includes("buildAnalyticsPageViewParams"),
  "GA page_view uses sanitized page params",
);

const layoutSource = readFileSync(join(here, "../../app/layout.tsx"), "utf8");
assert(
  layoutSource.includes("@/components/analytics/google-analytics"),
  "root layout uses sanitized Google Analytics",
);
assert(
  !layoutSource.includes("@next/third-parties/google"),
  "root layout does not use unsanitized third-party GA page_view",
);

console.log("analytics privacy verification passed");
process.exit(0);
