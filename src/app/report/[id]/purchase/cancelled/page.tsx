import { PurchaseStatusScreen } from "@/components/website-audit/purchase-status-screen";

interface PurchaseCancelledPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PurchaseCancelledPage({
  params,
}: PurchaseCancelledPageProps) {
  const { id } = await params;

  return (
    <PurchaseStatusScreen
      reportId={id}
      retryCheckout
      title="Your payment was not completed."
      description="Your free report is still available. You can return to it now or try unlocking the professional report again."
    />
  );
}
