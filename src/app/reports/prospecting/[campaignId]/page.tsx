import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";

import { Button, Card, Container } from "@/components/ui";
import { AuditQualifyButton } from "@/components/prospecting/audit-qualify-button";
import { DiscoverBusinessesButton } from "@/components/prospecting/discover-businesses-button";
import { prisma } from "@/lib/prisma";
import { getScoreBand } from "@/lib/website-audit/score-bands";
import { getReportCategoryLabel } from "@/lib/website-audit/report-categories";
import { parseStoredQualification } from "@/lib/prospecting/qualification/parse";
import {
  campaignStatusLabel,
  formatProspectLocation,
  qualificationLabelText,
  qualificationStatusLabel,
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

function formatAuditAge(value: Date | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(value);
}

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
  const remainingUnaudited = prospects.filter((row) =>
    ["DISCOVERED", "AUDITING", "AUDIT_FAILED", "WEBSITE_INVALID"].includes(
      row.prospect.qualificationStatus,
    ),
  ).length;
  const latestQualification = campaign.qualificationRuns[0] ?? null;

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
              Audits stay internal. No emails are sent from this screen.
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
              Discover or add businesses first, then audit and qualify. Contact
              finding and outreach drafts are not part of this sprint.
            </p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            <table className="w-full min-w-[72rem] text-left text-sm">
              <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Business</th>
                  <th className="px-4 py-3 font-semibold">Website</th>
                  <th className="px-4 py-3 font-semibold">Industry</th>
                  <th className="px-4 py-3 font-semibold">Audit</th>
                  <th className="px-4 py-3 font-semibold">Weakest category</th>
                  <th className="px-4 py-3 font-semibold">Qual score</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Top N</th>
                  <th className="px-4 py-3 font-semibold">Primary finding</th>
                  <th className="px-4 py-3 font-semibold">Audit age</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((row) => {
                  const prospect = row.prospect;
                  const qualification = parseStoredQualification(
                    row.qualificationJson,
                  );
                  const audit = prospect.auditReport;

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
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {prospect.website ? (
                          <a
                            href={prospect.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-blue hover:underline"
                          >
                            {prospect.hostname ?? prospect.website}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {prospect.industry || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {audit
                          ? `${audit.overallScore} · ${getScoreBand(audit.overallScore).label}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {qualification?.weakestRelevantCategory
                          ? getReportCategoryLabel(
                              qualification.weakestRelevantCategory,
                            )
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {qualification
                          ? `${qualification.score} · ${qualificationLabelText(qualification.label)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {qualificationStatusLabel(
                          prospect.qualificationStatus,
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.isSelectedTopN ? "Selected" : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {qualification?.primaryFindingTitle || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {formatAuditAge(audit?.createdAt ?? null)}
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
