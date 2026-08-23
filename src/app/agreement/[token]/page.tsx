import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AgreementAcceptanceForm } from "@/components/opportunities/agreement-acceptance-form";
import { AgreementDocument } from "@/components/opportunities/agreement-document";
import { Container } from "@/components/ui";
import {
  loadPublicAgreementByShareToken,
  recordAgreementLinkView,
} from "@/lib/commercialization/agreement-delivery";
import {
  derivePaymentState,
  loadPaymentsForAgreement,
  loadAcceptedAgreementPaymentAuthority,
} from "@/lib/commercialization/payments";

export const dynamic = "force-dynamic";

interface PublicAgreementPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Website Growth Implementation Agreement",
    description: "Private agreement access.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

function formatWhen(value: Date | null): string | null {
  if (!value) {
    return null;
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function PublicAgreementPage({
  params,
}: PublicAgreementPageProps) {
  const { token } = await params;
  const decoded = decodeURIComponent(token);

  const agreement = await loadPublicAgreementByShareToken({
    shareToken: decoded,
  });

  if (!agreement) {
    notFound();
  }

  await recordAgreementLinkView({ shareToken: decoded });

  // No Stripe API calls on page load — only show operator-created checkout URL from DB.
  let activeCheckoutUrl: string | null = null;
  let activeCheckoutLabel: string | null = null;
  let paymentOverallLabel: string | null = null;

  if (agreement.alreadyAccepted) {
    const authority = await loadAcceptedAgreementPaymentAuthority({
      agreementId: agreement.agreementId,
    });
    const payments = await loadPaymentsForAgreement({
      agreementId: agreement.agreementId,
    });
    const state = derivePaymentState({ agreement: authority, payments });
    paymentOverallLabel =
      state.derivedState === "PAID_IN_FULL"
        ? "Paid in full"
        : state.derivedState === "DEPOSIT_PAID_BALANCE_PENDING" ||
            state.derivedState === "BALANCE_DUE" ||
            state.derivedState === "BALANCE_CHECKOUT_CREATED"
          ? "Deposit paid — balance pending"
          : "Pending";
    activeCheckoutUrl = state.activeCheckoutUrl;
    if (state.activePaymentType === "DEPOSIT") {
      activeCheckoutLabel = "Pay Deposit Securely";
    } else if (state.activePaymentType === "BALANCE") {
      activeCheckoutLabel = "Pay Balance Securely";
    } else if (state.activePaymentType === "FULL") {
      activeCheckoutLabel = "Complete Payment";
    }
  }

  return (
    <main className="min-h-screen bg-white py-10 print:py-0">
      <Container className="print:max-w-none print:px-0">
        <AgreementDocument
          snapshot={agreement.snapshot}
          showAcceptanceSection
          acceptanceSlot={
            <AgreementAcceptanceForm
              shareToken={decoded}
              acceptanceLanguage={agreement.acceptanceLanguage}
              alreadyAccepted={agreement.alreadyAccepted}
              acceptedAtLabel={formatWhen(agreement.acceptedAt)}
              signerName={agreement.signerName}
              activeCheckoutUrl={activeCheckoutUrl}
              activeCheckoutLabel={activeCheckoutLabel}
              paymentOverallLabel={paymentOverallLabel}
            />
          }
        />
      </Container>
    </main>
  );
}
