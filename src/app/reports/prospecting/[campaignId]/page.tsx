import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";

import { Button, Card, Container } from "@/components/ui";
import { AuditQualifyButton } from "@/components/prospecting/audit-qualify-button";
import { CampaignFunnelPanel } from "@/components/prospecting/campaign-funnel-panel";
import { CampaignDeliveryHealthPanel } from "@/components/prospecting/campaign-delivery-health-panel";
import { DiscoverBusinessesButton } from "@/components/prospecting/discover-businesses-button";
import { FindContactsButton } from "@/components/prospecting/find-contacts-button";
import { GenerateDraftsButton } from "@/components/prospecting/generate-drafts-button";
import { ProspectOutreachSelectionControl } from "@/components/prospecting/prospect-outreach-selection-control";
import { prisma } from "@/lib/prisma";
import { isProspectSelectedForOutreach } from "@/lib/prospecting/selection/outreach-selection";
import { loadCampaignFunnelMetrics } from "@/lib/prospecting/metrics/load-campaign-funnel";
import { loadCampaignDeliveryHealth } from "@/lib/prospecting/metrics/load-campaign-delivery";
import { parseStoredQualification } from "@/lib/prospecting/qualification/parse";
import {
  campaignStatusLabel,
  draftStatusLabel,
  formatProspectLocation,
  qualificationLabelText,
  qualificationStatusLabel,
  outreachStatusLabel,
} from "@/lib/prospecting/labels";

export const maxDuration = 300;

interface CampaignPageProps {
  params: Promise<{
    campaignId: string;
  }>;
}

export const metadata: Metadata = {
  title: "Prospecting Campaign",
  description: "Internal prospecting campaign detail.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProspectingCampaignPage({
  params,
}: CampaignPageProps) {
  const { campaignId } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      campaignProspects: {
        orderBy: [
          { isSelectedTopN: "desc" },
          { qualificationRank: { sort: "asc", nulls: "last" } },
          { addedAt: "desc" },
        ],
        include: {
          prospect: {
            include: {
              auditReport: {
                select: {
                  id: true,
                  overallScore: true,
                  grade: true,
                  createdAt: true,
                },
              },
              contacts: {
                select: {
                  email: true,
                  isPrimary: true,
                  confidence: true,
                  sourceType: true,
                  status: true,
                },
              },
              contactForms: {
                select: {
                  url: true,
                  isPrimary: true,
                  status: true,
                  confidence: true,
                },
              },
              outreachMessages: {
                where: { campaignId },
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                  status: true,
                  channel: true,
                },
              },
            },
          },
        },
      },
      discoveryRuns: {
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          status: true,
          provider: true,
          returnedCount: true,
          eligibleCount: true,
          importedCount: true,
          errorMessage: true,
        },
      },
      qualificationRuns: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      contactDiscoveryRuns: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      outreachDraftRuns: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
  });

  if (!campaign) {
    notFound();
  }

  const prospects = campaign.campaignProspects;
  const audited = prospects.filter((row) => row.prospect.auditReportId).length;
  const qualified = prospects.filter(
    (row) => row.prospect.qualificationStatus === "QUALIFIED",
  ).length;
  const skipped = prospects.filter(
    (row) => row.prospect.qualificationStatus === "SKIPPED",
  ).length;
  const auditFailed = prospects.filter(
    (row) => row.prospect.qualificationStatus === "AUDIT_FAILED",
  ).length;
  const selectedTopN = prospects.filter((row) => row.isSelectedTopN).length;
  const selectedForOutreach = prospects.filter((row) =>
    isProspectSelectedForOutreach(row),
  ).length;
  const remainingUnaudited = prospects.filter((row) =>
    ["DISCOVERED", "AUDITING", "AUDIT_FAILED", "WEBSITE_INVALID"].includes(
      row.prospect.qualificationStatus,
    ),
  ).length;
  const latestQualification = campaign.qualificationRuns[0] ?? null;
  const latestContactRun = campaign.contactDiscoveryRuns[0] ?? null;
  const latestDraftRun = campaign.outreachDraftRuns[0] ?? null;
  const funnelMetrics = await loadCampaignFunnelMetrics(campaignId);
  const deliveryHealth = await loadCampaignDeliveryHealth(campaignId);

  const selectedRows = prospects.filter((row) =>
    isProspectSelectedForOutreach(row),
  );
  const emailContacts = selectedRows.filter((row) =>
    row.prospect.contacts.some(
      (contact) =>
        contact.isPrimary &&
        (contact.status === "DISCOVERED" || contact.status === "SELECTED"),
    ),
  ).length;
  const contactFormsFound = selectedRows.filter((row) =>
    row.prospect.contactForms.some(
      (form) =>
        form.isPrimary &&
        (form.status === "DISCOVERED" || form.status === "SELECTED"),
    ),
  ).length;
  const contactable = selectedRows.filter((row) => {
    const hasEmail = row.prospect.contacts.some(
      (contact) =>
        contact.isPrimary &&
        (contact.status === "DISCOVERED" || contact.status === "SELECTED"),
    );
    const hasForm = row.prospect.contactForms.some(
      (form) =>
        form.isPrimary &&
        (form.status === "DISCOVERED" || form.status === "SELECTED"),
    );

    return hasEmail || hasForm;
  }).length;
  const noPublicEmail = selectedRows.filter(
    (row) => row.prospect.outreachStatus === "NO_CONTACT",
  ).length;
  const suppressed = selectedRows.filter(
    (row) => row.prospect.outreachStatus === "SUPPRESSED",
  ).length;
  const contactPending = selectedRows.filter(
    (row) =>
      row.prospect.qualificationStatus === "QUALIFIED" &&
      !row.prospect.lastContactDiscoveryAt &&
      row.prospect.outreachStatus === "NOT_READY",
  ).length;
  const contactFailed = selectedRows.filter(
    (row) => row.prospect.outreachStatus === "CONTACT_DISCOVERY_FAILED",
  ).length;
  const draftReady = selectedRows.filter((row) => {
    const status = row.prospect.outreachMessages[0]?.status;
    return (
      status === "DRAFT" || status === "NEEDS_REVIEW" || status === "APPROVED"
    );
  }).length;
  const draftMissing = selectedRows.filter((row) => {
    const hasEmail = row.prospect.contacts.some(
      (contact) =>
        contact.isPrimary &&
        (contact.status === "DISCOVERED" || contact.status === "SELECTED"),
    );
    const hasForm = row.prospect.contactForms.some(
      (form) =>
        form.isPrimary &&
        (form.status === "DISCOVERED" || form.status === "SELECTED"),
    );
    const hasChannel = hasEmail || hasForm;
    const status = row.prospect.outreachMessages[0]?.status;
    const hasDraft =
      status === "DRAFT" || status === "NEEDS_REVIEW" || status === "APPROVED";
    return hasChannel && !hasDraft;
  }).length;

  function prospectContactChannelLabel(prospect: (typeof prospects)[0]["prospect"]) {
    const hasEmail = prospect.contacts.some(
      (contact) =>
        contact.isPrimary &&
        (contact.status === "DISCOVERED" || contact.status === "SELECTED"),
    );
    const hasForm = prospect.contactForms.some(
      (form) =>
        form.isPrimary &&
        (form.status === "DISCOVERED" || form.status === "SELECTED"),
    );

    if (hasEmail) return "Email";
    if (hasForm) return "Form";
    if (prospect.outreachStatus === "NO_CONTACT") return "None";
    if (prospect.outreachStatus === "SUPPRESSED") return "Suppressed";
    return "—";
  }

  function prospectOutreachProgressLabel(prospect: (typeof prospects)[0]["prospect"]) {
    const message = prospect.outreachMessages[0];

    if (!message) {
      return outreachStatusLabel(prospect.outreachStatus);
    }

    if (message.channel === "CONTACT_FORM" && message.status === "SUBMITTED") {
      return "Submitted";
    }

    if (message.channel === "EMAIL" && message.status === "SENT") {
      return "Sent";
    }

    return draftStatusLabel(message.status);
  }

  return (
    <main className="min-h-screen bg-slate-50/60">
      <Container className="space-y-8 py-8 sm:py-10 lg:py-12">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/reports/prospecting" />}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          All campaigns
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
              {campaignStatusLabel(campaign.status)}
            </p>
            <h1 className="mt-3 font-heading text-3xl font-semibold text-brand">
              {campaign.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Target {campaign.desiredQualifiedCount} credible qualified
              prospects in {campaign.locationLabel}
              {campaign.radiusMiles ? ` (${campaign.radiusMiles} miles)` : ""}.
              Audits stay internal. Sending and outcome tracking require explicit
              operator action on each prospect.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <DiscoverBusinessesButton
              campaignId={campaign.id}
              disabled={
                !campaign.locationLabel.trim() ||
                campaign.industries.length === 0
              }
              disabledReason={
                !campaign.locationLabel.trim()
                  ? "Add a campaign location before discovering businesses."
                  : campaign.industries.length === 0
                    ? "Add at least one industry before discovering businesses."
                    : undefined
              }
            />
            <AuditQualifyButton
              campaignId={campaign.id}
              remainingUnaudited={remainingUnaudited}
            />
            <FindContactsButton
              campaignId={campaign.id}
              pendingCount={contactPending + contactFailed}
            />
            <GenerateDraftsButton
              campaignId={campaign.id}
              missingCount={draftMissing}
            />
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <Link
                  href={`/reports/prospecting/${campaign.id}/prospects/new`}
                />
              }
            >
              <Plus aria-hidden="true" className="size-4" />
              Add Prospect
            </Button>
          </div>
        </div>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Workflow
          </h2>
          <ol className="mt-4 flex flex-wrap gap-2 text-sm text-brand">
            <li className="rounded-full border border-border bg-white px-3 py-1">
              Discovery
            </li>
            <li aria-hidden="true" className="self-center text-muted">
              →
            </li>
            <li className="rounded-full border border-border bg-white px-3 py-1">
              Qualification
            </li>
            <li aria-hidden="true" className="self-center text-muted">
              →
            </li>
            <li className="rounded-full border border-border bg-white px-3 py-1">
              Contacts
            </li>
            <li aria-hidden="true" className="self-center text-muted">
              →
            </li>
            <li className="rounded-full border border-border bg-white px-3 py-1">
              Drafts
            </li>
            <li aria-hidden="true" className="self-center text-muted">
              →
            </li>
            <li className="rounded-full border border-border bg-white px-3 py-1">
              Sending
            </li>
            <li aria-hidden="true" className="self-center text-muted">
              →
            </li>
            <li className="rounded-full border border-border bg-white px-3 py-1">
              Outcomes & conversion
            </li>
          </ol>
          <p className="mt-3 text-sm text-muted">
            Human review is required at every step. No automatic sending or reply
            detection.
          </p>
        </Card>

        <Card variant="elevated" padding="lg">
          <CampaignFunnelPanel metrics={funnelMetrics} />
        </Card>

        <Card variant="elevated" padding="lg">
          <CampaignDeliveryHealthPanel counts={deliveryHealth} />
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Campaign stats
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Total prospects
              </dt>
              <dd className="mt-1 text-sm text-brand">{prospects.length}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Audited
              </dt>
              <dd className="mt-1 text-sm text-brand">{audited}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Qualified
              </dt>
              <dd className="mt-1 text-sm text-brand">{qualified}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Skipped
              </dt>
              <dd className="mt-1 text-sm text-brand">{skipped}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Audit failed
              </dt>
              <dd className="mt-1 text-sm text-brand">{auditFailed}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Selected top {campaign.desiredQualifiedCount}
              </dt>
              <dd className="mt-1 text-sm text-brand">{selectedTopN}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Selected for outreach
              </dt>
              <dd className="mt-1 text-sm text-brand">{selectedForOutreach}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Contactable
              </dt>
              <dd className="mt-1 text-sm text-brand">{contactable}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Email contacts
              </dt>
              <dd className="mt-1 text-sm text-brand">{emailContacts}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Contact forms
              </dt>
              <dd className="mt-1 text-sm text-brand">{contactFormsFound}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                No public email
              </dt>
              <dd className="mt-1 text-sm text-brand">{noPublicEmail}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Suppressed
              </dt>
              <dd className="mt-1 text-sm text-brand">{suppressed}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Contact discovery pending
              </dt>
              <dd className="mt-1 text-sm text-brand">{contactPending}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Contact discovery failed
              </dt>
              <dd className="mt-1 text-sm text-brand">{contactFailed}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Draft ready
              </dt>
              <dd className="mt-1 text-sm text-brand">{draftReady}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Draft missing
              </dt>
              <dd className="mt-1 text-sm text-brand">{draftMissing}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Remaining unaudited
              </dt>
              <dd className="mt-1 text-sm text-brand">{remainingUnaudited}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Location
              </dt>
              <dd className="mt-1 text-sm text-brand">
                {campaign.locationLabel}
              </dd>
            </div>
          </dl>
          {latestQualification ? (
            <p className="mt-4 text-xs text-muted">
              Last qualification run: {latestQualification.status.toLowerCase()}{" "}
              · {latestQualification.auditsCompleted} completed ·{" "}
              {latestQualification.auditsReused} reused ·{" "}
              {latestQualification.auditsFailed} failed ·{" "}
              {Math.round(latestQualification.durationMs / 1000)}s
              {latestQualification.errorMessage
                ? ` · ${latestQualification.errorMessage}`
                : ""}
            </p>
          ) : null}
          {latestContactRun ? (
            <p className="mt-2 text-xs text-muted">
              Last contact run: {latestContactRun.status.toLowerCase()} ·{" "}
              {latestContactRun.found} found · {latestContactRun.noContact} none
              · {latestContactRun.failed} failed · {latestContactRun.reused}{" "}
              reused
              {latestContactRun.errorMessage
                ? ` · ${latestContactRun.errorMessage}`
                : ""}
            </p>
          ) : null}
          {latestDraftRun ? (
            <p className="mt-2 text-xs text-muted">
              Last draft run: {latestDraftRun.status.toLowerCase()} ·{" "}
              {latestDraftRun.generated} generated · {latestDraftRun.reused}{" "}
              reused · {latestDraftRun.failed} failed
              {latestDraftRun.errorMessage
                ? ` · ${latestDraftRun.errorMessage}`
                : ""}
            </p>
          ) : null}
        </Card>

        {campaign.discoveryRuns.length > 0 ? (
          <Card variant="elevated" padding="lg">
            <h2 className="font-heading text-xl font-semibold text-brand">
              Discovery runs
            </h2>
            <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
              {campaign.discoveryRuns.map((run) => (
                <li key={run.id} className="px-4 py-3 text-sm">
                  <Link
                    href={`/reports/prospecting/${campaign.id}/discovery/${run.id}`}
                    className="font-semibold text-brand-blue hover:underline"
                  >
                    {run.status === "RUNNING"
                      ? "Discovery in progress"
                      : run.status === "FAILED"
                        ? "Discovery failed"
                        : "Review candidates"}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    {run.provider} · {run.returnedCount} returned ·{" "}
                    {run.eligibleCount} eligible · {run.importedCount} imported
                    {run.errorMessage ? ` · ${run.errorMessage}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {prospects.length === 0 ? (
          <Card variant="elevated" padding="lg">
            <h2 className="font-heading text-xl font-semibold text-brand">
              No prospects yet
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Discover or add businesses first, then audit, find contacts, and
              draft outreach. No emails are sent from this screen.
            </p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            <table className="w-full min-w-[64rem] text-left text-sm">
              <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Business</th>
                  <th className="px-4 py-3 font-semibold">Qualification</th>
                  <th className="px-4 py-3 font-semibold">Primary finding</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Draft status</th>
                  <th className="px-4 py-3 font-semibold">Outreach</th>
                  <th className="px-4 py-3 font-semibold">Progress</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((row) => {
                  const prospect = row.prospect;
                  const qualification = parseStoredQualification(
                    row.qualificationJson,
                  );
                  const primaryContact =
                    prospect.contacts.find((contact) => contact.isPrimary) ??
                    prospect.contacts[0] ??
                    null;
                  const draftStatus = prospect.outreachMessages[0]?.status ?? null;

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/reports/prospecting/${campaign.id}/prospects/${prospect.id}`}
                          className="font-semibold text-brand-blue hover:underline"
                        >
                          {prospect.businessName}
                        </Link>
                        <p className="mt-1 text-xs text-muted">
                          {formatProspectLocation(prospect)}
                          {row.isSelectedTopN ? " · Top N" : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {qualificationStatusLabel(prospect.qualificationStatus)}
                        {qualification
                          ? ` · ${qualification.score} ${qualificationLabelText(qualification.label)}`
                          : ""}
                      </td>
                      <td className="px-4 py-3">
                        {qualification?.primaryFindingTitle || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {prospectContactChannelLabel(prospect)}
                        {primaryContact &&
                        (primaryContact.status === "DISCOVERED" ||
                          primaryContact.status === "SELECTED") ? (
                          <p className="mt-1 text-xs text-muted">
                            {primaryContact.email}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {draftStatusLabel(draftStatus)}
                      </td>
                      <td className="px-4 py-3">
                        <ProspectOutreachSelectionControl
                          campaignId={campaign.id}
                          prospectId={prospect.id}
                          qualificationStatus={prospect.qualificationStatus}
                          isSelectedTopN={row.isSelectedTopN}
                          isSelectedForOutreach={row.isSelectedForOutreach}
                          variant="table"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {prospectOutreachProgressLabel(prospect)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </main>
  );
}
