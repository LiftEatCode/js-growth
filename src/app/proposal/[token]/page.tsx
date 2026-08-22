import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProposalDocument } from "@/components/opportunities/proposal-document";
import { Container } from "@/components/ui";
import {
  loadPublicProposalByShareToken,
  recordProposalLinkView,
} from "@/lib/commercialization/proposal-delivery";

export const dynamic = "force-dynamic";

interface PublicProposalPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Website Growth Implementation Proposal",
    description: "Private proposal access.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PublicProposalPage({
  params,
}: PublicProposalPageProps) {
  const { token } = await params;
  const decoded = decodeURIComponent(token);

  const proposal = await loadPublicProposalByShareToken({
    shareToken: decoded,
  });

  if (!proposal) {
    notFound();
  }

  await recordProposalLinkView({ shareToken: decoded });

  return (
    <main className="min-h-screen bg-white py-10 print:py-0">
      <Container className="print:max-w-none print:px-0">
        <ProposalDocument
          title={proposal.title}
          executiveSummary={proposal.executiveSummary}
          businessContext={proposal.businessContext}
          approachIntro={proposal.approachIntro}
          timelineNote={proposal.timelineNote}
          nextStepText={proposal.nextStepText}
          snapshot={proposal.snapshot}
          createdAtLabel={proposal.createdAtLabel}
        />
      </Container>
    </main>
  );
}
