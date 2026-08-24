/**
 * Growth Sprint 1 — public analytics event taxonomy (v1).
 *
 * Public browser events only. Commercial/private IDs must never appear here.
 * Revenue/payment authority remains Stripe + database, not GA4.
 */

import {
  sanitizeCommercialEventParams,
  trackCommercialEvent,
} from "@/lib/analytics/commercial-events";

export const GROWTH_EVENT_VERSION = "growth-events-v1";

/** Public GA4 custom events that map to real product UI. */
export const GROWTH_EVENTS = {
  auditLandingView: "audit_landing_view",
  auditStarted: "audit_started",
  auditSubmitted: "audit_submitted",
  auditCompleted: "audit_completed",
  auditReportViewed: "audit_report_viewed",
  professionalAuditCtaClicked: "professional_audit_cta_clicked",
  contactCtaClicked: "contact_cta_clicked",
  contactFormStarted: "contact_form_started",
  contactFormSubmitted: "contact_form_submitted",
  blogCtaClicked: "blog_cta_clicked",
  serviceCtaClicked: "service_cta_clicked",
  /** Experiment 018 — website→Facebook follow CTA click (not follower acquired). */
  facebookFollowCtaClicked: "facebook_follow_cta_clicked",
  /** Existing checkout intent — marketing observation only; Stripe is payment authority. */
  professionalCheckoutStarted: "professional_checkout_started",
} as const;

export type GrowthEventName =
  (typeof GROWTH_EVENTS)[keyof typeof GROWTH_EVENTS];

export const GROWTH_EVENT_NAMES = Object.values(GROWTH_EVENTS);

/** Events recommended as GA4 key events (configure in GA Admin — not in app code). */
export const GROWTH_KEY_EVENT_CANDIDATES = [
  GROWTH_EVENTS.auditSubmitted,
  GROWTH_EVENTS.contactFormSubmitted,
  /**
   * Purchase completion is authoritative in Stripe/`ReportPurchase`.
   * Do not invent a competing browser revenue event in Growth Sprint 1.
   * Mark `professional_checkout_started` only as a funnel intent signal if desired.
   */
] as const;

export const GROWTH_CTA_PLACEMENTS = [
  "audit_landing",
  "report",
  "blog",
  "service",
  "nav",
  "footer",
  "home",
  "contact",
] as const;

export type GrowthCtaPlacement = (typeof GROWTH_CTA_PLACEMENTS)[number];

export const GROWTH_CTA_KINDS = [
  "professional_audit",
  "contact",
  "audit",
  "consultation",
] as const;

export type GrowthCtaKind = (typeof GROWTH_CTA_KINDS)[number];

export const GROWTH_REPORT_CONTEXTS = [
  "inline_landing",
  "dedicated_report",
] as const;

export type GrowthReportContext = (typeof GROWTH_REPORT_CONTEXTS)[number];

export const GROWTH_CTA_LOCATIONS = [
  "audit_landing",
  "report_upgrade",
  "report_implementation",
  "report_nav",
  "landing_footer",
  "contact_page",
  "audit_complete",
  "contact_success",
] as const;

export type GrowthCtaLocation = (typeof GROWTH_CTA_LOCATIONS)[number];

export type GrowthEventParams = {
  placement?: GrowthCtaPlacement;
  cta_kind?: GrowthCtaKind;
  cta_location?: GrowthCtaLocation;
  cta_type?: GrowthCtaKind;
  report_context?: GrowthReportContext;
  pages_scanned?: number;
  pages_discovered?: number;
  site_scan_truncated?: boolean;
  truncated?: boolean;
  competitor_count?: number;
  successful_competitor_count?: number;
  form_name?: string;
  surface?: string;
  experiment_id?: string;
};

export function isGrowthEventName(name: string): name is GrowthEventName {
  return (GROWTH_EVENT_NAMES as string[]).includes(name);
}

export function isAllowedGrowthEventParamKey(key: string): boolean {
  return (
    key === "placement" ||
    key === "cta_kind" ||
    key === "cta_location" ||
    key === "cta_type" ||
    key === "report_context" ||
    key === "pages_scanned" ||
    key === "pages_discovered" ||
    key === "site_scan_truncated" ||
    key === "truncated" ||
    key === "competitor_count" ||
    key === "successful_competitor_count" ||
    key === "form_name" ||
    key === "surface" ||
    key === "experiment_id"
  );
}

export function sanitizeGrowthEventParams(
  params?: GrowthEventParams | Record<string, string | number | boolean>,
): GrowthEventParams | undefined {
  const sanitized = sanitizeCommercialEventParams(params);
  if (!sanitized) {
    return undefined;
  }

  const allowed: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(sanitized)) {
    if (!isAllowedGrowthEventParamKey(key)) {
      continue;
    }
    allowed[key] = value;
  }

  return Object.keys(allowed).length > 0
    ? (allowed as GrowthEventParams)
    : undefined;
}

export function trackGrowthEvent(
  name: GrowthEventName,
  params?: GrowthEventParams,
): void {
  trackCommercialEvent(name, sanitizeGrowthEventParams(params));
}
