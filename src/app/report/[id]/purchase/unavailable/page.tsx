import { PurchaseStatusScreen } from "@/components/website-audit/purchase-status-screen";

interface PurchaseUnavailablePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PurchaseUnavailablePage({
  params,
}: PurchaseUnavailablePageProps) {
  const { id } = await params;

  return (
    <PurchaseStatusScreen
      reportId={id}
      retryCheckout
      title="Checkout is temporarily unavailable."
      description="Your free report is still available. Try again in a moment, or contact JS Growth if the problem continues."
    />
  );
}
