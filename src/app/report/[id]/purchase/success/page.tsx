import { PurchaseStatusScreen } from "@/components/website-audit/purchase-status-screen";
import { PROFESSIONAL_AUDIT_PRODUCT_NAME } from "@/lib/payments/product";
import {
  isReportId,
  reportHasProfessionalEntitlement,
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
        showContact
        title="We could not find this report"
        description="This purchase confirmation does not match a saved website audit report."
      />
    );
  }

  const alreadyUnlocked = await reportHasProfessionalEntitlement(id);

  if (alreadyUnlocked) {
    return <UnlockedScreen reportId={id} />;
  }

  if (!sessionId) {
    return (
      <PurchaseStatusScreen
        reportId={id}
        showContact
        title="We couldn't verify your purchase yet"
        description="If you completed payment, refresh this page in a moment. If the issue continues, contact JS Solutions — don't pay again until we confirm the unlock."
      />
    );
  }

  const verification = await verifyPurchase(sessionId, id);

  if (verification.state === "granted") {
    return <UnlockedScreen reportId={id} />;
  }

  if (verification.state === "pending") {
    return (
      <PurchaseStatusScreen
        reportId={id}
        tone="pending"
        showContact
        title="Payment is still processing"
        description="This can take a moment. Refresh the page shortly. If payment was completed, your Professional report will unlock automatically — don't start a new checkout yet."
      />
    );
  }

  return (
    <PurchaseStatusScreen
      reportId={id}
      showContact
      title="We couldn't verify your purchase yet"
      description="If you completed payment, refresh this page in a moment. If the issue continues, contact JS Solutions — don't pay again until we confirm the unlock."
    />
  );
}

function UnlockedScreen({ reportId }: { reportId: string }) {
  return (
    <PurchaseStatusScreen
      reportId={reportId}
      tone="success"
      title={`Your ${PROFESSIONAL_AUDIT_PRODUCT_NAME} is unlocked.`}
      description="Your full recommendations and action plan are ready."
      primaryLabel="View Professional Report"
      primaryHref={`/report/${reportId}`}
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
