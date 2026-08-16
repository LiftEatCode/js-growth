import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Globe2,
  Mail,
  Phone,
  SearchCheck,
  Target,
  TrendingUp,
  UserRound,
  UserRoundCheck,
  Zap,
} from "lucide-react";

import {
  LeadActivityTimeline,
  type LeadActivityItem,
} from "@/components/website-audit/lead-activity-timeline";
import { LeadDetailsEditor } from "@/components/website-audit/lead-details-editor";
import { LeadManualActivityPanel } from "@/components/website-audit/lead-manual-activity-panel";
import { LeadPipelinePanel } from "@/components/website-audit/lead-pipeline-panel";
import { ProspectToLeadPanel } from "@/components/website-audit/prospect-to-lead-panel";
import { StatBadge } from "@/components/website-audit/report-ui";
import {
  Button,
  Card,
  Container,
  GridPattern,
} from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { buildExecutiveSummary } from "@/lib/website-audit/executive-summary";
import { getAuditGrade } from "@/lib/website-audit/grading";
import { auditReportRepository } from "@/lib/website-audit/storage";
import type { AuditFinding } from "@/lib/website-audit/types";

interface InternalReportPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: "Internal Audit Workspace",

  description:
    "Internal JS Solutions website audit prospect and lead workspace.",

  robots: {
    index: false,
    follow: false,
  },
};

function formatDate(
  value: string | Date,
): string {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function getOpportunityLabel(
  level: string,
): string {
  return level
    .split("-")
    .map(
      (part) =>
        part
          .charAt(0)
          .toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function getPipelineStatusLabel(
  status:
    | "NEW"
    | "CONTACTED"
    | "QUALIFIED"
    | "PROPOSAL"
    | "WON"
    | "LOST",
): string {
  if (status === "NEW") {
    return "New";
  }

  if (
    status ===
    "CONTACTED"
  ) {
    return "Contacted";
  }

  if (
    status ===
    "QUALIFIED"
  ) {
    return "Qualified";
  }

  if (
    status ===
    "PROPOSAL"
  ) {
    return "Proposal";
  }

  if (status === "WON") {
    return "Won";
  }

  return "Lost";
}

function getPipelineStatusTone(
  status:
    | "NEW"
    | "CONTACTED"
    | "QUALIFIED"
    | "PROPOSAL"
    | "WON"
    | "LOST",
):
  | "default"
  | "primary"
  | "warning"
  | "success"
  | "danger" {
  if (status === "NEW") {
    return "warning";
  }

  if (
    status ===
      "CONTACTED" ||
    status ===
      "QUALIFIED"
  ) {
    return "primary";
  }

  if (
    status ===
    "PROPOSAL"
  ) {
    return "warning";
  }

  if (status === "WON") {
    return "success";
  }

  return "danger";
}

function getPriorityWeight(
  finding: AuditFinding,
): number {
  const priorityWeight = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  }[finding.priority];

  const impactWeight = {
    high: 3,
    medium: 2,
    low: 1,
  }[finding.businessImpact];

  return (
    priorityWeight * 100 +
    impactWeight * 10 +
    finding.scoreImpact
  );
}

function getFindingTone(
  finding: AuditFinding,
):
  | "danger"
  | "warning"
  | "primary"
  | "default" {
  if (
    finding.priority ===
      "critical" ||
    finding.status === "fail"
  ) {
    return "danger";
  }

  if (
    finding.priority ===
      "high" ||
    finding.businessImpact ===
      "high"
  ) {
    return "warning";
  }

  if (finding.quickWin) {
    return "primary";
  }

  return "default";
}

export default async function InternalReportPage({
  params,
}: InternalReportPageProps) {
  const { id } =
    await params;

  const [
    report,
    storedReport,
  ] =
    await Promise.all([
      auditReportRepository.findById(
        id,
      ),

      prisma.auditReport.findUnique({
        where: {
          id,
        },

        select: {
          lead: {
            select: {
              id: true,
              createdAt: true,
              updatedAt: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              company: true,
              contacted: true,
              status: true,
              followUpAt: true,
              notes: true,

              activities: {
                orderBy: {
                  createdAt: "desc",
                },

                take: 50,

                select: {
                  id: true,
                  createdAt: true,
                  type: true,
                  description: true,
                  fromValue: true,
                  toValue: true,
                },
              },
            },
          },
        },
      }),
    ]);

  if (!report) {
    notFound();
  }

  const lead =
    storedReport?.lead ??
    null;

  const audit =
    report.audit;

  const grade =
    getAuditGrade(
      audit.overallScore,
    );

  const executiveSummary =
    buildExecutiveSummary(
      audit.findings,
      audit.summary,
      {
        overallScore: audit.overallScore,
        categoryScores: audit.categoryScores,
      },
    );

  const priorityFindings =
    audit.findings
      .filter(
        (finding) =>
          finding.status !==
          "pass",
      )
      .sort(
        (a, b) =>
          getPriorityWeight(b) -
          getPriorityWeight(a),
      )
      .slice(0, 5);

  const activities:
    LeadActivityItem[] =
    lead
      ? lead.activities.map(
          (activity) => ({
            id:
              activity.id,

            createdAt:
              activity.createdAt.toISOString(),

            type:
              activity.type,

            description:
              activity.description,

            fromValue:
              activity.fromValue,

            toValue:
              activity.toValue,
          }),
        )
      : [];

  return (
    <main className="min-h-screen bg-slate-50/60">
      <section className="relative isolate overflow-hidden bg-brand text-white">
        <GridPattern className="opacity-35" />

        <div
          aria-hidden="true"
          className="absolute -right-40 -top-32 -z-10 size-[34rem] rounded-full bg-brand-blue/25 blur-3xl"
        />

        <Container className="relative py-8 sm:py-10">
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link href="/reports" />
            }
            className="border-white/15 bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-4"
            />

            Reports Dashboard
          </Button>

          <div className="mt-8 flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                <SearchCheck
                  aria-hidden="true"
                  className="size-3.5"
                />

                Internal Audit Workspace
              </div>

              <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">
                <Globe2
                  aria-hidden="true"
                  className="size-4"
                />

                {report.hostname}
              </div>

              <h1 className="mt-2 break-words font-heading text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
                {lead
                  ? `${lead.firstName} ${lead.lastName}`
                  : report.hostname}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                {lead
                  ? `Review the audit intelligence, lead information, pipeline history, and strongest sales opportunities associated with ${report.hostname}.`
                  : `Review the audit intelligence and decide whether ${report.hostname} should enter the JS Solutions sales pipeline.`}
              </p>

              {lead ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  <StatBadge
                    label={getPipelineStatusLabel(
                      lead.status,
                    )}
                    tone={getPipelineStatusTone(
                      lead.status,
                    )}
                  />

                  {lead.followUpAt ? (
                    <StatBadge
                      label={`Follow up ${formatDate(
                        lead.followUpAt,
                      )}`}
                      tone="primary"
                    />
                  ) : null}
                </div>
              ) : (
                <div className="mt-5">
                  <StatBadge
                    label="Prospect"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                nativeButton={false}
                render={
                  <a
                    href={
                      report.website
                    }
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                Visit Website

                <ExternalLink
                  aria-hidden="true"
                  className="ml-1 size-4"
                />
              </Button>

              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={
                  <Link
                    href={`/report/${report.id}`}
                  />
                }
                className="border-white/15 bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
              >
                Customer Report

                <ArrowRight
                  aria-hidden="true"
                  className="ml-1 size-4"
                />
              </Button>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <HeroMetric
              icon={BarChart3}
              label="Website Score"
              value={`${audit.overallScore}/100`}
              detail={`Grade ${grade.letter}`}
            />

            <HeroMetric
              icon={TrendingUp}
              label="Opportunity"
              value={`${audit.opportunity.score}/100`}
              detail={`${getOpportunityLabel(
                audit.opportunity.level,
              )} opportunity`}
            />

            <HeroMetric
              icon={AlertTriangle}
              label="Critical Issues"
              value={String(
                audit.summary
                  .criticalIssues,
              )}
              detail={`${audit.summary.highImpactFindings} high-impact findings`}
            />

            <HeroMetric
              icon={Zap}
              label="Quick Wins"
              value={String(
                audit.summary
                  .quickWins,
              )}
              detail="Lower-effort improvements"
            />
          </div>
        </Container>
      </section>

      <Container className="space-y-8 py-8 sm:py-10 lg:py-12">
        <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <Card
              variant="elevated"
              padding="lg"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
                Executive Intelligence
              </p>

              <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand sm:text-3xl">
                {
                  executiveSummary.heading
                }
              </h2>

              <p className="mt-4 leading-7 text-muted">
                {
                  executiveSummary.summary
                }
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <StatBadge
                  label={`${audit.summary.criticalIssues} critical`}
                  tone={
                    audit.summary
                      .criticalIssues >
                    0
                      ? "danger"
                      : "success"
                  }
                />

                <StatBadge
                  label={`${audit.summary.highImpactFindings} high impact`}
                  tone="warning"
                />

                <StatBadge
                  label={`${audit.summary.quickWins} quick wins`}
                  tone="primary"
                />

                <StatBadge
                  label={`${getOpportunityLabel(
                    audit.opportunity.level,
                  )} opportunity`}
                  tone="primary"
                />
              </div>
            </Card>

            <Card
              variant="elevated"
              padding="lg"
            >
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
                  <Target
                    aria-hidden="true"
                    className="size-5"
                  />
                </span>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
                    Sales Intelligence
                  </p>

                  <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-brand">
                    Why this site may be worth pursuing.
                  </h2>
                </div>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <SalesSignal
                  icon={TrendingUp}
                  title="Growth opportunity"
                  value={`${audit.opportunity.score}/100`}
                  description={`${getOpportunityLabel(
                    audit.opportunity.level,
                  )} modeled opportunity based on the gaps identified in the audit.`}
                />

                <SalesSignal
                  icon={AlertTriangle}
                  title="Pain signals"
                  value={`${audit.summary.criticalIssues} critical`}
                  description={`${audit.summary.highImpactFindings} findings were classified as having stronger business impact.`}
                />

                <SalesSignal
                  icon={Zap}
                  title="Quick wins"
                  value={String(
                    audit.summary
                      .quickWins,
                  )}
                  description="Lower-effort issues may provide an easier starting point for the conversation."
                />

                <SalesSignal
                  icon={BarChart3}
                  title="Current health"
                  value={`${audit.overallScore}/100`}
                  description={`The current audit produced a ${grade.letter} website grade.`}
                />
              </div>
            </Card>

            <Card
              variant="elevated"
              padding="lg"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
                Priority Findings
              </p>

              <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand">
                Strongest conversation starters.
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
                These are the highest-priority issues detected in the audit and are likely the best places to begin when reviewing the site with a prospect.
              </p>

              {priorityFindings.length >
              0 ? (
                <div className="mt-6 space-y-4">
                  {priorityFindings.map(
                    (
                      finding,
                      index,
                    ) => (
                      <div
                        key={
                          finding.id
                        }
                        className="rounded-2xl border border-border bg-slate-50/60 p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 gap-4">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-brand-blue/10 bg-white font-heading text-sm font-semibold text-brand-blue shadow-sm">
                              {String(
                                index +
                                  1,
                              ).padStart(
                                2,
                                "0",
                              )}
                            </span>

                            <div>
                              <h3 className="font-heading text-lg font-semibold text-brand">
                                {
                                  finding.title
                                }
                              </h3>

                              <p className="mt-2 text-sm leading-6 text-muted">
                                {
                                  finding.description
                                }
                              </p>
                            </div>
                          </div>

                          <StatBadge
                            label={
                              finding.quickWin
                                ? "Quick win"
                                : `${finding.priority} priority`
                            }
                            tone={getFindingTone(
                              finding,
                            )}
                          />
                        </div>

                        {finding.recommendation ? (
                          <div className="mt-4 border-t border-border pt-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                              Recommended direction
                            </p>

                            <p className="mt-2 text-sm leading-6 text-brand">
                              {
                                finding.recommendation
                              }
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      aria-hidden="true"
                      className="size-5 text-emerald-600"
                    />

                    <p className="font-medium text-emerald-800">
                      No major actionable findings were identified.
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {lead ? (
              <LeadActivityTimeline
                leadCreatedAt={
                  lead.createdAt.toISOString()
                }
                activities={
                  activities
                }
              />
            ) : null}
          </div>

          <aside className="space-y-6">
            {lead ? (
              <>
                <LeadDetailsEditor
                  leadId={
                    lead.id
                  }
                  reportId={
                    report.id
                  }
                  firstName={
                    lead.firstName
                  }
                  lastName={
                    lead.lastName
                  }
                  email={
                    lead.email
                  }
                  phone={
                    lead.phone
                  }
                  company={
                    lead.company
                  }
                />

                <Card
                  variant="elevated"
                  padding="lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex size-11 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
                      <UserRoundCheck
                        aria-hidden="true"
                        className="size-5"
                      />
                    </span>

                    <StatBadge
                      label={getPipelineStatusLabel(
                        lead.status,
                      )}
                      tone={getPipelineStatusTone(
                        lead.status,
                      )}
                    />
                  </div>

                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
                    Lead Status
                  </p>

                  <h2 className="mt-2 font-heading text-2xl font-semibold text-brand">
                    {
                      lead.firstName
                    }{" "}
                    {
                      lead.lastName
                    }
                  </h2>

                  <div className="mt-6 space-y-4">
                    <ContactRow
                      icon={CalendarDays}
                      label="Captured"
                      value={formatDate(
                        lead.createdAt,
                      )}
                    />

                    <ContactRow
                      icon={CalendarDays}
                      label="Last updated"
                      value={formatDate(
                        lead.updatedAt,
                      )}
                    />

                    {lead.followUpAt ? (
                      <ContactRow
                        icon={CalendarDays}
                        label="Follow up"
                        value={formatDate(
                          lead.followUpAt,
                        )}
                      />
                    ) : null}
                  </div>

                  <div className="mt-6 grid gap-3">
                    <Button
                      nativeButton={false}
                      render={
                        <a
                          href={`mailto:${lead.email}`}
                        />
                      }
                    >
                      <Mail
                        aria-hidden="true"
                        className="size-4"
                      />

                      Email Lead
                    </Button>

                    {lead.phone ? (
                      <Button
                        variant="outline"
                        nativeButton={false}
                        render={
                          <a
                            href={`tel:${lead.phone}`}
                          />
                        }
                      >
                        <Phone
                          aria-hidden="true"
                          className="size-4"
                        />

                        Call Lead
                      </Button>
                    ) : null}
                  </div>
                </Card>

                <LeadPipelinePanel
                  leadId={
                    lead.id
                  }
                  reportId={
                    report.id
                  }
                  status={
                    lead.status
                  }
                  followUpAt={
                    lead.followUpAt?.toISOString() ??
                    null
                  }
                  notes={
                    lead.notes
                  }
                />

                <LeadManualActivityPanel
                  leadId={
                    lead.id
                  }
                  reportId={
                    report.id
                  }
                />
              </>
            ) : (
              <>
                <Card
                  variant="elevated"
                  padding="lg"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl border border-border bg-slate-50 text-muted">
                    <UserRound
                      aria-hidden="true"
                      className="size-5"
                    />
                  </span>

                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    Prospect
                  </p>

                  <h2 className="mt-2 font-heading text-xl font-semibold text-brand">
                    No lead captured.
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-muted">
                    This website has been audited, but no lead is attached yet.
                  </p>

                  <div className="mt-5 rounded-xl border border-brand-blue/10 bg-brand-blue/[0.04] p-4">
                    <p className="text-sm leading-6 text-muted">
                      If this looks like a business worth pursuing, convert it into a lead below and begin tracking outreach.
                    </p>
                  </div>
                </Card>

                <ProspectToLeadPanel
                  reportId={
                    report.id
                  }
                  hostname={
                    report.hostname
                  }
                />
              </>
            )}

            <Card
              variant="elevated"
              padding="lg"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
                Report Actions
              </p>

              <h2 className="mt-2 font-heading text-xl font-semibold text-brand">
                Share and review.
              </h2>

              <div className="mt-5 grid gap-3">
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={
                    <Link
                      href={`/report/${report.id}`}
                    />
                  }
                >
                  <FileText
                    aria-hidden="true"
                    className="size-4"
                  />

                  Customer Report
                </Button>

                <Button
                  variant="outline"
                  nativeButton={false}
                  render={
                    <a
                      href={`/report/${report.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                    />
                  }
                >
                  <Download
                    aria-hidden="true"
                    className="size-4"
                  />

                  Professional PDF
                </Button>

                <Button
                  variant="outline"
                  nativeButton={false}
                  render={
                    <a
                      href={
                        report.website
                      }
                      target="_blank"
                      rel="noreferrer"
                    />
                  }
                >
                  <ExternalLink
                    aria-hidden="true"
                    className="size-4"
                  />

                  Visit Website
                </Button>
              </div>
            </Card>

            <Card
              variant="brand"
              padding="lg"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
                Audit Record
              </p>

              <div className="mt-5 space-y-4">
                <DataRow
                  label="Report ID"
                  value={
                    report.id
                  }
                />

                <DataRow
                  label="Created"
                  value={formatDate(
                    report.createdAt,
                  )}
                />

                <DataRow
                  label="Report mode"
                  value={
                    report.reportMode
                  }
                />

                <DataRow
                  label="Website grade"
                  value={
                    grade.letter
                  }
                />

                {lead ? (
                  <DataRow
                    label="Pipeline status"
                    value={getPipelineStatusLabel(
                      lead.status,
                    )}
                  />
                ) : (
                  <DataRow
                    label="CRM status"
                    value="Prospect"
                  />
                )}
              </div>
            </Card>
          </aside>
        </div>
      </Container>
    </main>
  );
}

interface HeroMetricProps {
  icon:
    typeof BarChart3;

  label: string;

  value: string;

  detail: string;
}

function HeroMetric({
  icon: Icon,
  label,
  value,
  detail,
}: HeroMetricProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
      <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-cyan-300">
        <Icon
          aria-hidden="true"
          className="size-5"
        />
      </span>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 font-heading text-3xl font-bold text-white">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-400">
        {detail}
      </p>
    </article>
  );
}

interface SalesSignalProps {
  icon:
    typeof TrendingUp;

  title: string;

  value: string;

  description:
    string;
}

function SalesSignal({
  icon: Icon,
  title,
  value,
  description,
}: SalesSignalProps) {
  return (
    <div className="rounded-2xl border border-border bg-slate-50/60 p-5">
      <span className="flex size-10 items-center justify-center rounded-xl border border-brand-blue/10 bg-white text-brand-blue shadow-sm">
        <Icon
          aria-hidden="true"
          className="size-4"
        />
      </span>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        {title}
      </p>

      <p className="mt-2 font-heading text-xl font-semibold text-brand">
        {value}
      </p>

      <p className="mt-2 text-sm leading-6 text-muted">
        {description}
      </p>
    </div>
  );
}

interface ContactRowProps {
  icon:
    typeof Mail;

  label: string;

  value: string;

  href?: string;
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: ContactRowProps) {
  const content = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-slate-50 text-brand-blue">
        <Icon
          aria-hidden="true"
          className="size-4"
        />
      </span>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-brand">
          {value}
        </p>
      </div>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="flex items-start gap-3 transition hover:opacity-75"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="flex items-start gap-3">
      {content}
    </div>
  );
}

function DataRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-border pb-3 last:border-0 last:pb-0">
      <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
        {label}
      </p>

      <p className="mt-1 break-all text-sm font-medium capitalize text-brand">
        {value}
      </p>
    </div>
  );
}