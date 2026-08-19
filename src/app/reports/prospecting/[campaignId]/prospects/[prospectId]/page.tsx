import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ProspectAuditActions } from "@/components/prospecting/prospect-audit-actions";
import { ProspectContactsPanel } from "@/components/prospecting/prospect-contacts-panel";
import { OutreachDraftEditor } from "@/components/prospecting/outreach-draft-editor";
import { ProspectEditor } from "@/components/prospecting/prospect-editor";
import { Button, Card, Container } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { parseStoredQualification } from "@/lib/prospecting/qualification/parse";
import {
  outreachStatusLabel,
  qualificationLabelText,
  qualificationStatusLabel,
  sourceTypeLabel,
} from "@/lib/prospecting/labels";
import { isCategoryScoreApplicable } from "@/lib/website-audit/scoring";
import { getScoreBand } from "@/lib/website-audit/score-bands";
import type { WebsiteAuditResult } from "@/lib/website-audit/types";

interface ProspectDetailPageProps {
  params: Promise<{
    campaignId: string;
    prospectId: string;
  }>;
}

export const maxDuration = 300;

export const metadata: Metadata = {
  title: "Prospect",
  description: "Internal prospecting business detail.",
  robots: {
    index: false,
    follow: false,
  },
};

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function CampaignProspectDetailPage({
  params,
}: ProspectDetailPageProps) {
  const { campaignId, prospectId } = await params;

  const membership = await prisma.campaignProspect.findUnique({
    where: {
      campaignId_prospectId: {
        campaignId,
        prospectId,
      },
    },
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
        },
      },
      prospect: {
        include: {
          auditReport: true,
          contacts: {
            orderBy: [{ isPrimary: "desc" }, { discoveredAt: "asc" }],
          },
          outreachMessages: {
            where: { campaignId },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
    },
  });

  if (!membership) {
    notFound();
  }

  const prospect = membership.prospect;
  const audit = prospect.auditReport?.audit as WebsiteAuditResult | undefined;
  const qualification = parseStoredQualification(membership.qualificationJson);
  const highFindings =
    audit?.findings.filter(
      (finding) =>
        finding.status !== "pass" &&
        (finding.priority === "high" || finding.priority === "critical"),
    ).length ?? 0;
  const mediumFindings =
    audit?.findings.filter(
      (finding) => finding.status !== "pass" && finding.priority === "medium",
    ).length ?? 0;
  const lowFindings =
    audit?.findings.filter(
      (finding) => finding.status !== "pass" && finding.priority === "low",
    ).length ?? 0;
  const currentDraft = prospect.outreachMessages.find(
    (message) =>
      message.status === "DRAFT" ||
      message.status === "NEEDS_REVIEW" ||
      message.status === "APPROVED",
  );

  return (
    <main className="min-h-screen bg-slate-50/60">
      <Container className="space-y-8 py-8 sm:py-10 lg:py-12">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <Link href={`/reports/prospecting/${membership.campaign.id}`} />
          }
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {membership.campaign.name}
        </Button>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
            {sourceTypeLabel(prospect.sourceType)} source
            {membership.isSelectedTopN ? " · Selected top N" : ""}
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold text-brand">
            {prospect.businessName}
          </h1>
        </div>

        <Card variant="elevated" padding="lg">
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Qualification
              </dt>
              <dd className="mt-1 text-sm text-brand">
                {qualificationStatusLabel(prospect.qualificationStatus)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Outreach
              </dt>
              <dd className="mt-1 text-sm text-brand">
                {outreachStatusLabel(prospect.outreachStatus)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Source
              </dt>
              <dd className="mt-1 text-sm text-brand">
                {sourceTypeLabel(prospect.sourceType)}
                {prospect.sourceRef ? ` · ${prospect.sourceRef}` : ""}
              </dd>
            </div>
          </dl>
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Website Growth Audit Summary
          </h2>
          {audit && prospect.auditReport ? (
            <div className="mt-4 space-y-4">
              <dl className="grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    Overall score
                  </dt>
                  <dd className="mt-1 text-sm text-brand">
                    {audit.overallScore} · {getScoreBand(audit.overallScore).label}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    Findings
                  </dt>
                  <dd className="mt-1 text-sm text-brand">
                    {highFindings} high · {mediumFindings} medium · {lowFindings}{" "}
                    low
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    Audit date
                  </dt>
                  <dd className="mt-1 text-sm text-brand">
                    {formatDate(prospect.auditReport.createdAt)}
                  </dd>
                </div>
              </dl>
              <div>
                <h3 className="text-sm font-semibold text-brand">
                  Category scores
                </h3>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {audit.categoryScores
                    .filter(isCategoryScoreApplicable)
                    .map((category) => (
                      <li key={category.category} className="text-sm text-muted">
                        {category.label}: {category.score}/{category.maxScore}
                      </li>
                    ))}
                </ul>
              </div>
              <p className="text-sm text-muted">
                Quick wins: {audit.summary.quickWins}. This scan is internal and
                is not a customer report.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted">
              No prospecting audit is linked yet.
            </p>
          )}
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Qualification
          </h2>
          {qualification ? (
            <div className="mt-4 space-y-4">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    Score
                  </dt>
                  <dd className="mt-1 text-sm text-brand">
                    {qualification.score} ·{" "}
                    {qualificationLabelText(qualification.label)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    Primary outreach finding
                  </dt>
                  <dd className="mt-1 text-sm text-brand">
                    {qualification.primaryFindingTitle || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    Secondary finding
                  </dt>
                  <dd className="mt-1 text-sm text-brand">
                    {qualification.secondaryFindingTitle || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    Skip reason
                  </dt>
                  <dd className="mt-1 text-sm text-brand">
                    {qualification.skipReason || prospect.skipReason || "—"}
                  </dd>
                </div>
              </dl>
              <div>
                <h3 className="text-sm font-semibold text-brand">Factors</h3>
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  {qualification.factors.map((factor) => (
                    <li key={factor.id}>
                      {factor.delta > 0 ? "+" : ""}
                      {factor.delta} {factor.label}: {factor.detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted">
              Qualification has not been calculated yet.
            </p>
          )}
        </Card>

        <Card variant="elevated" padding="lg">
          <ProspectContactsPanel
            campaignId={membership.campaign.id}
            prospectId={prospect.id}
            contacts={prospect.contacts.map((contact) => ({
              id: contact.id,
              email: contact.email,
              name: contact.name,
              role: contact.role,
              confidence: contact.confidence,
              sourceType: contact.sourceType,
              sourceUrl: contact.sourceUrl,
              status: contact.status,
              isPrimary: contact.isPrimary,
              discoveredAt: formatDate(contact.discoveredAt),
            }))}
          />
        </Card>

        <Card variant="elevated" padding="lg">
          <OutreachDraftEditor
            key={currentDraft?.id ?? "no-draft"}
            campaignId={membership.campaign.id}
            prospectId={prospect.id}
            canGenerate={
              membership.isSelectedTopN &&
              prospect.qualificationStatus === "QUALIFIED" &&
              prospect.contacts.some(
                (contact) =>
                  contact.isPrimary &&
                  (contact.status === "SELECTED" ||
                    contact.status === "DISCOVERED"),
              )
            }
            draft={
              currentDraft
                ? {
                    id: currentDraft.id,
                    toEmail: currentDraft.toEmail,
                    subject: currentDraft.subject,
                    bodyText: currentDraft.bodyText,
                    status: currentDraft.status,
                    model: currentDraft.generationModel,
                  }
                : null
            }
          />
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Actions
          </h2>
          <p className="mt-2 text-sm text-muted">
            Sending is not available in Sprint 4. Approval does not send email.
          </p>
          <div className="mt-4">
            <ProspectAuditActions
              campaignId={membership.campaign.id}
              prospectId={prospect.id}
              hasAudit={Boolean(prospect.auditReportId)}
            />
          </div>
        </Card>

        <ProspectEditor
          campaignId={membership.campaign.id}
          prospectId={prospect.id}
          businessName={prospect.businessName}
          website={prospect.website}
          hostname={prospect.hostname}
          industry={prospect.industry}
          city={prospect.city}
          state={prospect.state}
          address={prospect.address}
          phone={prospect.phone}
          notes={prospect.notes}
          skipReason={prospect.skipReason}
        />
      </Container>
    </main>
  );
}
