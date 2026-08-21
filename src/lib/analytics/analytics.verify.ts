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
  buildAnalyticsPageViewParams,
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
