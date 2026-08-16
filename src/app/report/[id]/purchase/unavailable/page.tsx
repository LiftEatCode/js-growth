import { PurchaseStatusScreen } from "@/components/website-audit/purchase-status-screen";
import { reportHasProfessionalEntitlement } from "@/lib/payments/professional-audit";
import { PROFESSIONAL_AUDIT_PRODUCT_NAME } from "@/lib/payments/product";

interface PurchaseUnavailablePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PurchaseUnavailablePage({
  params,
}: PurchaseUnavailablePageProps) {
  const { id } = await params;
  const alreadyUnlocked = await reportHasProfessionalEntitlement(id);

  if (alreadyUnlocked) {
    return (
      <PurchaseStatusScreen
        reportId={id}
        tone="success"
        title={`Your ${PROFESSIONAL_AUDIT_PRODUCT_NAME} is already unlocked.`}
        description="No extra payment is needed. Your Professional report is ready."
        primaryLabel="View Professional Report"
        primaryHref={`/report/${id}`}
      />
    );
  }

  return (
    <PurchaseStatusScreen
      reportId={id}
      retryCheckout
      showContact
      title="Checkout is temporarily unavailable"
      description="Your free report is still available. Try again in a moment, or contact JS Solutions if the problem continues. Don't pay twice if you already completed checkout."
      primaryLabel="Return to Free Report"
      retryLabel="Try Checkout Again"
    />
  );
}
