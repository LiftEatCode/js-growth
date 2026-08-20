import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ProspectAuditActions } from "@/components/prospecting/prospect-audit-actions";
import { ProspectContactsPanel } from "@/components/prospecting/prospect-contacts-panel";
import { OutreachDraftEditor } from "@/components/prospecting/outreach-draft-editor";
import { EmailDeliveryTimeline } from "@/components/prospecting/email-delivery-timeline";
import { OutreachOutcomePanel } from "@/components/prospecting/outreach-outcome-panel";
import { ProspectLeadConversionPanel } from "@/components/prospecting/prospect-lead-conversion-panel";
import { ProspectOutreachSelectionControl } from "@/components/prospecting/prospect-outreach-selection-control";
import { ProspectEditor } from "@/components/prospecting/prospect-editor";
import { Button, Card, Container } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { findExistingLeadByHostname } from "@/lib/prospecting/leads/find-existing";
import { selectProspectOutreachChannel } from "@/lib/prospecting/contacts/select-channel";
import type { DetectedContactFormFields } from "@/lib/prospecting/contacts/form-types";
import { loadProspectSuppressionState } from "@/lib/prospecting/metrics/load-campaign-funnel";
import { loadContactSuppressionContext } from "@/lib/prospecting/suppression/load";
import { canConvertProspect } from "@/lib/prospecting/outreach/lifecycle";
import {
  buildEmailDeliveryTimeline,
  getOutreachDeliveryState,
  providerDeliveryStatusLabel,
} from "@/lib/prospecting/outreach/delivery/state";
import { outreachOutcomeLabel } from "@/lib/prospecting/outreach/outcome-types";
import { parseStoredQualification } from "@/lib/prospecting/qualification/parse";
import { isProspectSelectedForOutreach } from "@/lib/prospecting/selection/outreach-selection";
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
          contactForms: {
            orderBy: [{ isPrimary: "desc" }, { discoveredAt: "asc" }],
          },
          outreachMessages: {
            where: { campaignId },
            orderBy: { createdAt: "desc" },
            take: 20,
            include: {
              contactForm: {
                select: { url: true },
              },
            },
          },
          outreachOutcomes: {
            where: {
              outreachMessage: { campaignId },
            },
            orderBy: { occurredAt: "desc" },
            include: {
              outreachMessage: {
                select: {
                  toEmail: true,
                  subject: true,
                },
              },
            },
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
      message.status === "APPROVED" ||
      message.status === "FAILED" ||
      message.status === "SUPPRESSED" ||
      message.status === "SENDING" ||
      message.status === "SENT" ||
      message.status === "SUBMITTED",
  );
  const completedMessages = prospect.outreachMessages.filter((message) => {
    if (message.channel === "EMAIL") {
      return message.status === "SENT" && message.sentAt;
    }

    return message.status === "SUBMITTED" && message.submittedAt;
  });
  const primaryContact =
    prospect.contacts.find((contact) => contact.isPrimary) ??
    prospect.contacts[0] ??
    null;
  const emailDeliveryMessage =
    prospect.outreachMessages.find(
      (message) =>
        message.channel === "EMAIL" &&
        (message.status === "SENT" || message.providerDeliveryStatus),
    ) ?? null;
  const emailDeliveryTimeline = emailDeliveryMessage
    ? buildEmailDeliveryTimeline({
        channel: emailDeliveryMessage.channel,
        status: emailDeliveryMessage.status,
        approvedAt: emailDeliveryMessage.approvedAt,
        sentAt: emailDeliveryMessage.sentAt,
        submittedAt: emailDeliveryMessage.submittedAt,
        providerDeliveryStatus: emailDeliveryMessage.providerDeliveryStatus,
        deliveredAt: emailDeliveryMessage.deliveredAt,
        deliveryDelayedAt: emailDeliveryMessage.deliveryDelayedAt,
        failedAt: emailDeliveryMessage.failedAt,
        bouncedAt: emailDeliveryMessage.bouncedAt,
        complainedAt: emailDeliveryMessage.complainedAt,
        providerSuppressedAt: emailDeliveryMessage.providerSuppressedAt,
      })
    : [];
  const emailDeliveryStatusLabel = emailDeliveryMessage
    ? providerDeliveryStatusLabel(
        getOutreachDeliveryState({
          channel: emailDeliveryMessage.channel,
          status: emailDeliveryMessage.status,
          approvedAt: emailDeliveryMessage.approvedAt,
          sentAt: emailDeliveryMessage.sentAt,
          submittedAt: emailDeliveryMessage.submittedAt,
          providerDeliveryStatus: emailDeliveryMessage.providerDeliveryStatus,
          deliveredAt: emailDeliveryMessage.deliveredAt,
          deliveryDelayedAt: emailDeliveryMessage.deliveryDelayedAt,
          failedAt: emailDeliveryMessage.failedAt,
          bouncedAt: emailDeliveryMessage.bouncedAt,
          complainedAt: emailDeliveryMessage.complainedAt,
          providerSuppressedAt: emailDeliveryMessage.providerSuppressedAt,
        }),
      )
    : null;
  const latestOutcome = prospect.outreachOutcomes[0]?.outcome ?? null;
  const [existingLead, suppression, contactSuppression] = await Promise.all([
    findExistingLeadByHostname(prospect.hostname),
    loadProspectSuppressionState({
      hostname: prospect.hostname,
      emails: prospect.contacts.map((contact) => contact.normalizedEmail),
    }),
    loadContactSuppressionContext({
      hostname: prospect.hostname,
      emails: prospect.contacts.map((contact) => contact.normalizedEmail),
    }),
  ]);
  const outreachChannel = selectProspectOutreachChannel({
    hostname: prospect.hostname,
    leadId: prospect.leadId,
    outreachStatus: prospect.outreachStatus,
    contacts: prospect.contacts,
    contactForms: prospect.contactForms,
    suppressedHostnames: contactSuppression.suppressedHostnames,
    suppressedEmails: contactSuppression.suppressedEmails,
    customerHostnames: contactSuppression.customerHostnames,
    existingLead: Boolean(existingLead),
  });
  const canConvert = canConvertProspect({
    outreachStatus: prospect.outreachStatus,
    leadId: prospect.leadId,
    hasCompletedOutreach: completedMessages.length > 0,
    latestOutcome,
  });
  const contactName = primaryContact?.name?.trim() ?? "";
  const defaultFirstName = contactName.split(/\s+/)[0] ?? "";
  const defaultLastName =
    contactName.split(/\s+/).slice(1).join(" ") || "Contact";

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
            contactForms={prospect.contactForms.map((form) => ({
              id: form.id,
              url: form.url,
              sourcePageUrl: form.sourcePageUrl,
              confidence: form.confidence,
              detectedFields: form.detectedFieldsJson as unknown as DetectedContactFormFields,
              status: form.status,
              isPrimary: form.isPrimary,
              discoveredAt: formatDate(form.discoveredAt),
            }))}
          />
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Outreach selection
          </h2>
          <div className="mt-4">
            <ProspectOutreachSelectionControl
              campaignId={membership.campaign.id}
              prospectId={prospect.id}
              qualificationStatus={prospect.qualificationStatus}
              isSelectedTopN={membership.isSelectedTopN}
              isSelectedForOutreach={membership.isSelectedForOutreach}
              variant="detail"
            />
          </div>
        </Card>

        <Card variant="elevated" padding="lg">
          <OutreachDraftEditor
            key={currentDraft?.id ?? "no-draft"}
            campaignId={membership.campaign.id}
            prospectId={prospect.id}
            businessName={prospect.businessName}
            canGenerate={
              isProspectSelectedForOutreach(membership) &&
              prospect.qualificationStatus === "QUALIFIED" &&
              !prospect.leadId &&
              prospect.outreachStatus !== "CONVERTED" &&
              prospect.outreachStatus !== "NOT_INTERESTED" &&
              outreachChannel.type !== "NONE"
            }
            draft={
              currentDraft
                ? {
                    id: currentDraft.id,
                    channel: currentDraft.channel,
                    toEmail: currentDraft.toEmail,
                    contactFormUrl: currentDraft.contactForm?.url ?? null,
                    subject: currentDraft.subject,
                    bodyText: currentDraft.bodyText,
                    status: currentDraft.status,
                    model: currentDraft.generationModel,
                    approvedAt: currentDraft.approvedAt,
                    approvedByEmail: currentDraft.approvedByEmail,
                    sentAt: currentDraft.sentAt,
                    submittedAt: currentDraft.submittedAt,
                    submittedByEmail: currentDraft.submittedByEmail,
                    providerMessageId: currentDraft.providerMessageId,
                    error: currentDraft.error,
                  }
                : null
            }
          />
        </Card>

        {emailDeliveryMessage && emailDeliveryTimeline.length > 0 ? (
          <Card variant="elevated" padding="lg">
            <EmailDeliveryTimeline
              steps={emailDeliveryTimeline}
              providerDeliveryStatus={emailDeliveryStatusLabel}
            />
          </Card>
        ) : null}

        {completedMessages.length > 0 ? (
          <Card variant="elevated" padding="lg">
            <OutreachOutcomePanel
              campaignId={membership.campaign.id}
              prospectId={prospect.id}
              completedMessages={completedMessages.map((message) => ({
                id: message.id,
                channel: message.channel,
                label:
                  message.channel === "CONTACT_FORM"
                    ? `Contact form · ${message.contactForm?.url ?? "form"}`
                    : `${message.toEmail ?? "email"} · ${message.subject}`,
                completedAt: formatDate(
                  message.channel === "CONTACT_FORM"
                    ? message.submittedAt!
                    : message.sentAt!,
                ),
              }))}
            />
          </Card>
        ) : null}

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Outcome history
          </h2>
          {prospect.outreachOutcomes.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-muted">
              No outreach outcomes recorded yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
              {prospect.outreachOutcomes.map((row) => (
                <li key={row.id} className="space-y-2 px-4 py-3">
                  <p className="text-sm font-semibold text-brand">
                    {outreachOutcomeLabel(row.outcome)}
                  </p>
                  <p className="text-xs text-muted">
                    {formatDate(row.occurredAt)}
                    {row.outreachMessage
                      ? ` · ${row.outreachMessage.toEmail}`
                      : ""}
                  </p>
                  {row.notes ? (
                    <p className="text-sm text-muted">{row.notes}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Outreach history
          </h2>
          {prospect.outreachMessages.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-muted">
              No outreach draft has been generated for this prospect yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
              {prospect.outreachMessages.map((message) => (
                <li key={message.id} className="space-y-2 px-4 py-3">
                  <p className="text-sm font-semibold text-brand">
                    {message.status.toLowerCase().replaceAll("_", " ")} ·{" "}
                    {message.channel === "CONTACT_FORM"
                      ? "Contact form"
                      : message.toEmail ?? "Email"}
                  </p>
                  <p className="text-sm text-muted">
                    {message.channel === "CONTACT_FORM"
                      ? message.contactForm?.url ?? "Contact form outreach"
                      : message.subject}
                  </p>
                  <p className="text-xs text-muted">
                    Created {formatDate(message.createdAt)}
                    {message.approvedAt
                      ? ` · Approved ${formatDate(message.approvedAt)}`
                      : ""}
                    {message.sentAt ? ` · Sent ${formatDate(message.sentAt)}` : ""}
                    {message.submittedAt
                      ? ` · Submitted ${formatDate(message.submittedAt)}`
                      : ""}
                    {message.providerMessageId
                      ? ` · Provider ID ${message.providerMessageId}`
                      : ""}
                  </p>
                  {message.error ? (
                    <p className="text-xs text-red-700">{message.error}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card variant="elevated" padding="lg">
          <ProspectLeadConversionPanel
            campaignId={membership.campaign.id}
            prospectId={prospect.id}
            businessName={prospect.businessName}
            canConvert={canConvert}
            convertedLeadId={prospect.leadId}
            leadReportId={prospect.auditReportId}
            defaultFirstName={defaultFirstName}
            defaultLastName={defaultLastName}
            defaultEmail={primaryContact?.email ?? ""}
            defaultPhone={prospect.phone ?? ""}
            existingLead={
              existingLead && !prospect.leadId ? existingLead : null
            }
          />
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Suppression / do not contact
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {prospect.leadId || prospect.outreachStatus === "CONVERTED" ? (
              <li>Converted to lead — future prospecting outreach is blocked.</li>
            ) : null}
            {suppression.customerHostname ? (
              <li>This hostname is marked as a customer.</li>
            ) : null}
            {suppression.hostnameSuppressed ? (
              <li>This hostname is on the suppression list.</li>
            ) : null}
            {suppression.emailSuppressed.length > 0 ? (
              <li>
                Suppressed email addresses: {suppression.emailSuppressed.join(", ")}
              </li>
            ) : null}
            {!prospect.leadId &&
            !suppression.hostnameSuppressed &&
            suppression.emailSuppressed.length === 0 &&
            !suppression.customerHostname ? (
              <li>No active suppression entries for this prospect.</li>
            ) : null}
          </ul>
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Actions
          </h2>
          <p className="mt-2 text-sm text-muted">
            Sending requires explicit operator action after you mark the draft
            as APPROVED. Approval does not send email.
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
