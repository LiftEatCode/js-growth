import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AgreementAcceptanceForm } from "@/components/opportunities/agreement-acceptance-form";
import { AgreementDocument } from "@/components/opportunities/agreement-document";
import { Container } from "@/components/ui";
import {
  loadPublicAgreementByShareToken,
  recordAgreementLinkView,
} from "@/lib/commercialization/agreement-delivery";

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
            />
          }
        />
      </Container>
    </main>
  );
}
