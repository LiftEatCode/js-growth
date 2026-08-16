import { PurchaseStatusScreen } from "@/components/website-audit/purchase-status-screen";
import { PROFESSIONAL_AUDIT_PRODUCT_NAME } from "@/lib/payments/product";
import {
  isReportId,
  retrieveAndFulfillCheckoutSession,
} from "@/lib/payments/professional-audit";
import { auditReportRepository } from "@/lib/website-audit/storage";

interface PurchaseSuccessPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    session_id?: string | string[];
  }>;
}

export default async function PurchaseSuccessPage({
  params,
  searchParams,
}: PurchaseSuccessPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const sessionId = firstValue(query.session_id);

  if (!isReportId(id) || !(await auditReportRepository.findById(id))) {
    return (
      <PurchaseStatusScreen
        reportId={id}
        title="We could not find this report"
        description="This purchase confirmation does not match a saved website audit report."
      />
    );
  }

  if (!sessionId) {
    return (
      <PurchaseStatusScreen
        reportId={id}
        retryCheckout
        title="We could not verify this purchase yet"
        description="If payment was completed, refresh this page in a moment or contact JS Growth."
      />
    );
  }

  const verification = await verifyPurchase(sessionId, id);

  if (verification.state === "granted") {
    return (
      <PurchaseStatusScreen
        reportId={id}
        tone="success"
        title={`Your ${PROFESSIONAL_AUDIT_PRODUCT_NAME} is unlocked.`}
        description="The complete findings, recommendations, and action plan are now available on this report."
        primaryLabel="View Full Report"
        primaryHref={`/report/${id}`}
      />
    );
  }

  if (verification.state === "pending") {
    return (
      <PurchaseStatusScreen
        reportId={id}
        tone="pending"
        retryCheckout
        title="Payment is still processing"
        description="This can take a moment. Refresh the page shortly. If payment was completed, your Professional report will unlock automatically."
      />
    );
  }

  return (
    <PurchaseStatusScreen
      reportId={id}
      retryCheckout
      title="We could not verify this purchase yet"
      description="If payment was completed, refresh the page in a moment or contact JS Growth."
    />
  );
}

async function verifyPurchase(
  sessionId: string,
  reportId: string,
): Promise<{ state: "granted" | "pending" | "error" }> {
  try {
    const result = await retrieveAndFulfillCheckoutSession(sessionId, reportId);

    if (result.granted) {
      return { state: "granted" };
    }

    if (result.reason === "unpaid") {
      return { state: "pending" };
    }

    return { state: "error" };
  } catch (error) {
    console.error("[payments] purchase success verification failed", {
      reportId,
      sessionId,
      error: error instanceof Error ? error.message : "unknown",
    });

    return { state: "error" };
  }
}

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}
