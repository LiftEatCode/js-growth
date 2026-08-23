"use client";

import { useEffect, useRef } from "react";

import {
  captureCampaignAttributionInBrowser,
  GROWTH_EVENTS,
  trackAuditFunnelEvent,
  type GrowthEventName,
  type GrowthEventParams,
} from "@/lib/growth";

/**
 * Fires a one-shot growth event on mount (e.g. landing / report view).
 * Also captures first-party UTM context when present.
 */
export function GrowthPageBeacon({
  event,
  params,
  dedupeKey,
  recordMilestone,
}: {
  event: GrowthEventName;
  params?: GrowthEventParams;
  dedupeKey?: string;
  recordMilestone?: "landingViewAt" | "startedAt" | "submittedAt";
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) {
      return;
    }
    fired.current = true;
    captureCampaignAttributionInBrowser();
    trackAuditFunnelEvent(event, params, {
      dedupeKey,
      recordMilestone,
    });
  }, [dedupeKey, event, params, recordMilestone]);

  return null;
}

export function AuditLandingBeacon() {
  return (
    <GrowthPageBeacon
      event={GROWTH_EVENTS.auditLandingView}
      params={{
        placement: "audit_landing",
        cta_location: "audit_landing",
      }}
      dedupeKey="audit_landing_view"
      recordMilestone="landingViewAt"
    />
  );
}

export function AuditReportViewBeacon({
  reportContext = "dedicated_report",
}: {
  reportContext?: "inline_landing" | "dedicated_report";
}) {
  return (
    <GrowthPageBeacon
      event={GROWTH_EVENTS.auditReportViewed}
      params={{
        placement: "report",
        report_context: reportContext,
        cta_location: "report_nav",
      }}
      dedupeKey={`audit_report_viewed-${reportContext}`}
    />
  );
}
