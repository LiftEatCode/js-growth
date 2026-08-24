"use client";

import Link from "next/link";

import {
  JS_SOLUTIONS_FACEBOOK_PAGE_URL,
} from "@/lib/growth/acquisition-capture";
import {
  GROWTH_EVENTS,
  trackGrowthEvent,
  type GrowthCtaLocation,
} from "@/lib/growth";

/**
 * Experiment 018 — soft Website→Facebook follow CTA.
 * Click ≠ follower acquired.
 */
export function SoftFacebookFollowCta({
  surface,
}: {
  surface: "audit_complete" | "contact_success";
}) {
  const ctaLocation: GrowthCtaLocation =
    surface === "audit_complete" ? "audit_complete" : "contact_success";

  return (
    <div className="rounded-xl border border-border bg-slate-50 p-4 text-sm text-muted">
      <p className="font-medium text-brand">
        Optional: follow JS Solutions on Facebook
      </p>
      <p className="mt-1 text-xs leading-5">
        Soft follow link for weekly tips. Clicking does not mean a follower was
        acquired.
      </p>
      <Link
        href={JS_SOLUTIONS_FACEBOOK_PAGE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex text-sm font-semibold text-brand-blue underline"
        onClick={() => {
          trackGrowthEvent(GROWTH_EVENTS.facebookFollowCtaClicked, {
            placement: surface === "audit_complete" ? "report" : "contact",
            cta_location: ctaLocation,
            surface,
            experiment_id: "2026-018",
          });
        }}
      >
        Follow JS Solutions on Facebook
      </Link>
    </div>
  );
}
