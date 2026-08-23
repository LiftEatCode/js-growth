"use client";

import { useEffect, useRef } from "react";

import {
  captureCampaignAttributionInBrowser,
  GROWTH_EVENTS,
  trackGrowthEvent,
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
}: {
  event: GrowthEventName;
  params?: GrowthEventParams;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) {
      return;
    }
    fired.current = true;
    captureCampaignAttributionInBrowser();
    trackGrowthEvent(event, params);
  }, [event, params]);

  return null;
}

export function AuditLandingBeacon() {
  return (
    <GrowthPageBeacon
      event={GROWTH_EVENTS.auditLandingView}
      params={{ placement: "audit_landing" }}
    />
  );
}

export function AuditReportViewBeacon() {
  return (
    <GrowthPageBeacon
      event={GROWTH_EVENTS.auditReportViewed}
      params={{ placement: "report" }}
    />
  );
}
