export function trackCommercialEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const gtag = (
    window as Window & {
      gtag?: (
        command: "event",
        eventName: string,
        eventParams?: Record<string, string | number | boolean>,
      ) => void;
    }
  ).gtag;

  if (typeof gtag !== "function") {
    return;
  }

  gtag("event", name, params);
}

export const COMMERCIAL_EVENTS = {
  auditCompleted: "audit_completed",
  professionalCheckoutStarted: "professional_checkout_started",
  multiPageAuditCompleted: "multi_page_audit_completed",
  competitiveAuditCompleted: "competitive_audit_completed",
  aiInterpretationCompleted: "ai_interpretation_completed",
  aiInterpretationFailed: "ai_interpretation_failed",
} as const;
