/**
 * Growth Sprint 1 — qualified traffic definition.
 *
 * Do not optimize raw sessions alone. Future sprints optimize qualified
 * traffic per channel.
 */

export const QUALIFIED_TRAFFIC_VERSION = "qualified-traffic-v1";

/**
 * A session (or visitor journey) shows meaningful intent when at least one
 * of these indicators occurs. Indicators are documented product behaviors —
 * not an opaque engagement score.
 */
export const QUALIFIED_TRAFFIC_INDICATORS = [
  {
    id: "audit_started",
    description: "Visitor started a Website Growth Audit",
    event: "audit_started",
  },
  {
    id: "audit_completed",
    description: "Visitor completed a Website Growth Audit",
    event: "audit_completed",
  },
  {
    id: "service_page_viewed",
    description: "Visitor viewed a service page (GA4 page_path)",
    event: "page_view",
  },
  {
    id: "professional_audit_cta",
    description: "Visitor clicked Professional Audit CTA",
    event: "professional_audit_cta_clicked",
  },
  {
    id: "contact_action",
    description: "Visitor started or submitted contact",
    event: "contact_form_started | contact_form_submitted | contact_cta_clicked",
  },
  {
    id: "multi_page_intent",
    description:
      "Visitor viewed multiple meaningful marketing pages in a session (GA4-native)",
    event: "page_view",
  },
] as const;

export function describeQualifiedTraffic(): string {
  return (
    "Qualified traffic is website traffic that shows meaningful intent: " +
    "audit start/completion, service-page engagement, professional audit CTA, " +
    "contact action, or multiple meaningful page views — not raw session volume alone."
  );
}
