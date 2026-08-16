import { PurchaseStatusScreen } from "@/components/website-audit/purchase-status-screen";
import { reportHasProfessionalEntitlement } from "@/lib/payments/professional-audit";
import { PROFESSIONAL_AUDIT_PRODUCT_NAME } from "@/lib/payments/product";

interface PurchaseCancelledPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PurchaseCancelledPage({
  params,
}: PurchaseCancelledPageProps) {
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
      title="Checkout canceled"
      description="No payment was completed. Your free report is still available."
      primaryLabel="Return to Free Report"
      retryLabel="Unlock Professional Report"
    />
  );
}
