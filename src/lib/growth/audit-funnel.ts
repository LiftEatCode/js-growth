/**
 * Growth Sprint 2 — deterministic website audit funnel contract (v1).
 *
 * Browser events fire at most once per tab session unless a dedupe key
 * explicitly scopes a repeatable step (e.g. report view per context).
 */

import {
  sanitizeGrowthEventParams,
  trackGrowthEvent,
  type GrowthEventName,
  type GrowthEventParams,
} from "@/lib/growth/events";

export const AUDIT_FUNNEL_VERSION = 1 as const;

export const AUDIT_FUNNEL_STEPS = [
  "audit_landing_view",
  "audit_started",
  "audit_submitted",
  "audit_completed",
  "audit_report_viewed",
  "professional_audit_cta_clicked",
  "contact_form_submitted",
] as const;

export type AuditFunnelStep = (typeof AUDIT_FUNNEL_STEPS)[number];

export const FUNNEL_STORAGE_KEY = "jsg-audit-funnel-v1";
const FUNNEL_FIRED_PREFIX = "jsg-audit-funnel-fired-v1-";

export const REPORT_CONTEXTS = [
  "inline_landing",
  "dedicated_report",
] as const;

export type ReportContext = (typeof REPORT_CONTEXTS)[number];

export const CTA_LOCATIONS = [
  "audit_landing",
  "report_upgrade",
  "report_implementation",
  "report_nav",
  "landing_footer",
  "contact_page",
] as const;

export type CtaLocation = (typeof CTA_LOCATIONS)[number];

export const CTA_TYPES = [
  "professional_audit",
  "contact",
  "audit",
  "consultation",
] as const;

export type CtaType = (typeof CTA_TYPES)[number];

export type AuditFunnelMilestone = {
  version: typeof AUDIT_FUNNEL_VERSION;
  landingViewAt?: string;
  startedAt?: string;
  submittedAt?: string;
};

export type AuditFunnelMilestoneKey = Exclude<
  keyof AuditFunnelMilestone,
  "version"
>;

export type TrackAuditFunnelOptions = {
  /** Session-scoped dedupe key. Never include PII or commercial UUIDs. */
  dedupeKey?: string;
  recordMilestone?: AuditFunnelMilestoneKey;
};

function funnelStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function readFunnelMilestones(): AuditFunnelMilestone {
  if (!funnelStorageAvailable()) {
    return { version: AUDIT_FUNNEL_VERSION };
  }

  try {
    const raw = window.sessionStorage.getItem(FUNNEL_STORAGE_KEY);
    if (!raw) {
      return { version: AUDIT_FUNNEL_VERSION };
    }
    const parsed = JSON.parse(raw) as AuditFunnelMilestone;
    if (parsed?.version !== AUDIT_FUNNEL_VERSION) {
      return { version: AUDIT_FUNNEL_VERSION };
    }
    return parsed;
  } catch {
    return { version: AUDIT_FUNNEL_VERSION };
  }
}

function writeFunnelMilestones(milestones: AuditFunnelMilestone): void {
  if (!funnelStorageAvailable()) {
    return;
  }

  try {
    window.sessionStorage.setItem(FUNNEL_STORAGE_KEY, JSON.stringify(milestones));
  } catch {
    // sessionStorage may be unavailable.
  }
}

export function recordFunnelMilestone(milestone: AuditFunnelMilestoneKey): void {
  const current = readFunnelMilestones();
  if (current[milestone]) {
    return;
  }

  writeFunnelMilestones({
    ...current,
    [milestone]: new Date().toISOString(),
  });
}

export function readAuditFunnelContext(): AuditFunnelMilestone {
  return readFunnelMilestones();
}

export function serializeAuditFunnelContextForForm(): string {
  return JSON.stringify(readFunnelMilestones());
}

export function parseAuditFunnelContextFromUnknown(
  value: unknown,
): AuditFunnelMilestone | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (record.version !== AUDIT_FUNNEL_VERSION) {
    return null;
  }

  const milestone: AuditFunnelMilestone = { version: AUDIT_FUNNEL_VERSION };

  for (const key of ["landingViewAt", "startedAt", "submittedAt"] as const) {
    if (typeof record[key] === "string" && record[key]) {
      milestone[key] = String(record[key]).slice(0, 40);
    }
  }

  return milestone;
}

export function parseAuditFunnelContextFromFormData(
  formData: FormData,
): AuditFunnelMilestone | null {
  const raw = formData.get("growth_funnel");
  if (typeof raw !== "string" || !raw.trim()) {
    return null;
  }

  try {
    return parseAuditFunnelContextFromUnknown(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function mergeAttributionWithFunnelContext<
  T extends Record<string, unknown> | null,
>(
  attribution: T,
  funnel: AuditFunnelMilestone | null,
): T | (NonNullable<T> & { funnel: AuditFunnelMilestone }) | null {
  if (!attribution && !funnel) {
    return null;
  }

  if (!attribution) {
    return { funnel } as T | (NonNullable<T> & { funnel: AuditFunnelMilestone });
  }

  return {
    ...attribution,
    ...(funnel ? { funnel } : {}),
  } as T | (NonNullable<T> & { funnel: AuditFunnelMilestone });
}

export function hasFunnelEventFired(dedupeKey: string): boolean {
  if (!funnelStorageAvailable()) {
    return false;
  }

  try {
    return Boolean(
      window.sessionStorage.getItem(`${FUNNEL_FIRED_PREFIX}${dedupeKey}`),
    );
  } catch {
    return false;
  }
}

/**
 * Fires a growth funnel event once per dedupe key in this tab session.
 * Returns false when deduped (no GA4 call made).
 */
export function trackAuditFunnelEvent(
  name: GrowthEventName,
  params?: GrowthEventParams,
  options?: TrackAuditFunnelOptions,
): boolean {
  const dedupeKey = options?.dedupeKey ?? name;

  if (funnelStorageAvailable()) {
    try {
      const storageKey = `${FUNNEL_FIRED_PREFIX}${dedupeKey}`;
      if (window.sessionStorage.getItem(storageKey)) {
        return false;
      }
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // Still attempt a single fire when storage is unavailable.
    }
  }

  if (options?.recordMilestone) {
    recordFunnelMilestone(options.recordMilestone);
  }

  trackGrowthEvent(name, params);
  return true;
}

/** GA4 recommended lead event — secondary to our first-party taxonomy. Not a key event. */
export function trackGa4GenerateLead(params?: {
  form_name?: string;
}): void {
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

  const sanitized = sanitizeGrowthEventParams(
    params as Record<string, string | number | boolean> | undefined,
  );

  gtag("event", "generate_lead", {
    form_name: "contact",
    ...(sanitized ?? {}),
  });
}

export function isAuditFunnelStep(name: string): name is AuditFunnelStep {
  return (AUDIT_FUNNEL_STEPS as readonly string[]).includes(name);
}
