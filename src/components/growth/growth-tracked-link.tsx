"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import {
  GROWTH_EVENTS,
  trackAuditFunnelEvent,
  type GrowthCtaKind,
  type GrowthCtaPlacement,
} from "@/lib/growth";

type GrowthTrackedLinkProps = ComponentProps<typeof Link> & {
  growthEvent:
    | "contact_cta_clicked"
    | "blog_cta_clicked"
    | "service_cta_clicked"
    | "professional_audit_cta_clicked";
  placement: GrowthCtaPlacement;
  ctaKind?: GrowthCtaKind;
};

const EVENT_MAP = {
  contact_cta_clicked: GROWTH_EVENTS.contactCtaClicked,
  blog_cta_clicked: GROWTH_EVENTS.blogCtaClicked,
  service_cta_clicked: GROWTH_EVENTS.serviceCtaClicked,
  professional_audit_cta_clicked: GROWTH_EVENTS.professionalAuditCtaClicked,
} as const;

/**
 * Internal navigation link that records a bounded growth CTA event.
 * Does not append UTMs to internal links.
 */
export function GrowthTrackedLink({
  growthEvent,
  placement,
  ctaKind,
  onClick,
  children,
  ...props
}: GrowthTrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackAuditFunnelEvent(EVENT_MAP[growthEvent], {
          placement,
          cta_kind: ctaKind,
          cta_type: ctaKind,
          cta_location:
            placement === "report"
              ? "report_implementation"
              : placement === "audit_landing"
                ? "audit_landing"
                : "landing_footer",
        }, {
          dedupeKey: `${growthEvent}-${placement}`,
        });
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}
