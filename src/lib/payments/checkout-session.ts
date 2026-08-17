import {
  PROFESSIONAL_AUDIT_PRODUCT_KEY,
  PROFESSIONAL_AUDIT_PRODUCT_NAME,
} from "@/lib/payments/product";

export const FULFILLABLE_STRIPE_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
] as const;

export type FulfillableStripeEvent =
  (typeof FULFILLABLE_STRIPE_EVENTS)[number];

const REPORT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isReportId(value: string): boolean {
  return REPORT_ID_PATTERN.test(value);
}

export function shouldFulfillStripeEvent(type: string): boolean {
  return (FULFILLABLE_STRIPE_EVENTS as readonly string[]).includes(type);
}

export interface InspectableCheckoutSession {
  id: string;
  mode?: string | null;
  payment_status?: string | null;
  metadata?: Record<string, string> | null;
  client_reference_id?: string | null;
  payment_intent?: string | { id?: string | null } | null;
  customer?: string | { id?: string | null } | null;
  customer_details?: { email?: string | null } | null;
  customer_email?: string | null;
  amount_total?: number | null;
  currency?: string | null;
}

export type CheckoutInspectResult =
  | { ok: true; reportId: string }
  | {
      ok: false;
      reason:
        | "unpaid"
        | "missing-report-id"
        | "report-mismatch"
        | "invalid-mode";
    };

export function inspectProfessionalAuditSession(
  session: InspectableCheckoutSession,
  expectedReportId?: string,
): CheckoutInspectResult {
  if (session.mode && session.mode !== "payment") {
    return { ok: false, reason: "invalid-mode" };
  }

  if (session.payment_status !== "paid") {
    return { ok: false, reason: "unpaid" };
  }

  const reportId =
    session.metadata?.reportId?.trim() ||
    session.client_reference_id?.trim() ||
    "";

  if (!isReportId(reportId)) {
    return { ok: false, reason: "missing-report-id" };
  }

  if (expectedReportId && reportId !== expectedReportId) {
    return { ok: false, reason: "report-mismatch" };
  }

  return { ok: true, reportId };
}

export function canReuseOpenCheckoutSession(session: {
  status?: string | null;
  url?: string | null;
}): boolean {
  return session.status === "open" && Boolean(session.url);
}

export function getStripeObjectId(
  value: string | { id?: string | null } | null | undefined,
): string | null {
  if (typeof value === "string" && value) {
    return value;
  }

  if (value && typeof value === "object" && value.id) {
    return value.id;
  }

  return null;
}

export function buildProfessionalCheckoutSessionParams(options: {
  reportId: string;
  priceId: string;
  baseUrl: string;
}): {
  mode: "payment";
  line_items: Array<{ price: string; quantity: number }>;
  success_url: string;
  cancel_url: string;
  client_reference_id: string;
  metadata: Record<string, string>;
} {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");

  return {
    mode: "payment",
    line_items: [
      {
        price: options.priceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/report/${options.reportId}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/report/${options.reportId}/purchase/cancelled`,
    client_reference_id: options.reportId,
    metadata: {
      reportId: options.reportId,
      product: PROFESSIONAL_AUDIT_PRODUCT_KEY,
    },
  };
}

export { PROFESSIONAL_AUDIT_PRODUCT_NAME };
