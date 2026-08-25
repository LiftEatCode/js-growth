import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CreateLeadFromContactForm } from "@/components/follow-up/create-lead-from-contact-form";
import { MarkLeadQualifiedForm } from "@/components/follow-up/mark-qualified-form";
import { NurtureScheduleForm } from "@/components/follow-up/nurture-schedule-form";
import { RecordFollowUpActivityForm } from "@/components/follow-up/record-activity-form";
import { Button, Card, Container } from "@/components/ui";
import {
  channelFromAcquisition,
  parseAcquisitionContextFromUnknown,
  strengthFromAcquisition,
} from "@/lib/growth/acquisition-capture";
import {
  classifyLeadAgeBand,
  dueStateForAuthority,
  FOLLOW_UP_TEMPLATES,
  fillFollowUpTemplate,
  listFollowUpActivities,
  LEAD_FOLLOWUP_VERSION,
} from "@/lib/follow-up";
import { requireInternalSession } from "@/lib/internal-auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Lead detail",
  description: "Internal inbound lead follow-up detail.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ leadId: string }>;
};

export default async function LeadDetailPage({ params }: Props) {
  await requireInternalSession();
  const { leadId } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      reports: {
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          overallScore: true,
          grade: true,
          criticalIssues: true,
          createdAt: true,
          attributionJson: true,
          website: true,
        },
      },
      opportunities: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, stage: true },
      },
      contactSubmissions: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          createdAt: true,
          service: true,
          message: true,
          attributionJson: true,
        },
      },
    },
  });

  if (!lead) {
    notFound();
  }

  const activities = await listFollowUpActivities({
    subjectKind: "LEAD",
    subjectId: lead.id,
    limit: 50,
  });

  const report = lead.reports[0];
  const acquisition = report?.attributionJson
    ? parseAcquisitionContextFromUnknown(report.attributionJson)
    : lead.contactSubmissions[0]?.attributionJson
      ? parseAcquisitionContextFromUnknown(
          lead.contactSubmissions[0].attributionJson,
        )
      : null;
  const channel = channelFromAcquisition(acquisition);
  const strength = strengthFromAcquisition(acquisition);
  const contentSlug = acquisition?.content ?? null;

  const ageBand = classifyLeadAgeBand(lead.createdAt);
  const dueState = dueStateForAuthority(lead.followUpAt);

  const templatePreview = fillFollowUpTemplate(FOLLOW_UP_TEMPLATES[0]!, {
    firstName: lead.firstName,
    businessName: lead.company || lead.website,
    operatorName: "JS Solutions",
  });

  return (
    <main className="min-h-screen bg-slate-50/70">
      <Container className="space-y-6 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-blue">
              Inbound Lead · Follow-up V{LEAD_FOLLOWUP_VERSION}
            </p>
            <h1
              className="mt-2 font-heading text-3xl font-semibold text-brand"
              data-testid="lead-detail-heading"
            >
              {lead.firstName} {lead.lastName}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {lead.company || lead.website} · {lead.status} · Age {ageBand} ·
              Follow-up {dueState}
            </p>
          </div>
          <Button
            nativeButton={false}
            render={<Link href="/reports/growth/follow-up" />}
          >
            Follow-Up Queue
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-2 p-5" data-testid="lead-identity">
            <h2 className="text-sm font-semibold text-brand">Contact</h2>
            <p className="text-sm">{lead.email}</p>
            {lead.phone ? <p className="text-sm">{lead.phone}</p> : null}
            <p className="text-sm text-muted">{lead.website}</p>
          </Card>

          <Card className="space-y-2 p-5" data-testid="lead-acquisition">
            <h2 className="text-sm font-semibold text-brand">
              Acquisition (not activity channel)
            </h2>
            <p className="text-sm">
              Channel: <strong>{channel}</strong>
            </p>
            <p className="text-sm">Strength: {strength}</p>
            {contentSlug ? (
              <p className="text-sm">
                Acquired through content: <code>{contentSlug}</code>
              </p>
            ) : null}
            {acquisition?.landingPath ? (
              <p className="text-sm text-muted">
                Landing: {acquisition.landingPath}
              </p>
            ) : null}
          </Card>
        </div>

        {report ? (
          <Card className="space-y-2 p-5" data-testid="lead-audit-context">
            <h2 className="text-sm font-semibold text-brand">Audit context</h2>
            <p className="text-sm">
              Score {report.overallScore} ({report.grade}) · High-priority / critical:{" "}
              {report.criticalIssues}
            </p>
            <p className="text-xs text-muted">
              {report.createdAt.toISOString().slice(0, 10)}
            </p>
            <Button
              nativeButton={false}
              render={<Link href={`/reports/${report.id}`} />}
            >
              Open audit report
            </Button>
          </Card>
        ) : null}

        {lead.contactSubmissions.length > 0 ? (
          <Card className="space-y-2 p-5">
            <h2 className="text-sm font-semibold text-brand">Contact context</h2>
            {lead.contactSubmissions.map((c) => (
              <div key={c.id} className="border-t border-border pt-2 text-sm">
                <p className="text-xs text-muted">
                  {c.createdAt.toISOString()} · {c.service}
                </p>
                <p className="whitespace-pre-wrap">{c.message}</p>
              </div>
            ))}
          </Card>
        ) : null}

        <Card className="space-y-3 p-5" data-testid="lead-follow-up-meta">
          <h2 className="text-sm font-semibold text-brand">Follow-up schedule</h2>
          <p className="text-sm">
            Next follow-up:{" "}
            {lead.followUpAt
              ? lead.followUpAt.toISOString()
              : "No follow-up scheduled"}
          </p>
          <p className="text-sm text-muted">Due state: {dueState}</p>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <RecordFollowUpActivityForm subjectKind="LEAD" subjectId={lead.id} />
          <div className="space-y-4">
            <NurtureScheduleForm subjectKind="LEAD" subjectId={lead.id} />
            {lead.status !== "QUALIFIED" &&
            lead.status !== "WON" &&
            lead.status !== "LOST" ? (
              <Card className="p-4">
                <MarkLeadQualifiedForm leadId={lead.id} />
              </Card>
            ) : null}
          </div>
        </div>

        <Card className="space-y-3 p-5" data-testid="activity-timeline">
          <h2 className="text-sm font-semibold text-brand">Activity timeline</h2>
          {activities.length === 0 ? (
            <p className="text-sm text-muted" data-testid="no-recorded-activity">
              NO_RECORDED_ACTIVITY — existing followUpAt is not synthesized into
              history.
            </p>
          ) : (
            <ul className="space-y-3">
              {activities.map((a) => (
                <li
                  key={a.id}
                  className="border-t border-border pt-3 text-sm"
                  data-testid="activity-row"
                  data-activity-type={a.activityType}
                  data-activity-channel={a.activityType}
                >
                  <p className="font-medium text-brand">
                    {a.activityType} · {a.direction} · {a.outcome}
                  </p>
                  <p className="text-xs text-muted">
                    {a.occurredAt.toISOString()}
                    {a.nextFollowUpAt
                      ? ` · next ${a.nextFollowUpAt.toISOString()}`
                      : ""}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{a.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="space-y-2 p-5">
          <h2 className="text-sm font-semibold text-brand">
            Message template (draft only — never auto-sent)
          </h2>
          <p className="text-xs text-muted">
            Customer-facing draft starting point. Distinct from internal notes.
          </p>
          <p className="text-sm font-medium">{templatePreview.subject}</p>
          <pre className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs">
            {templatePreview.body}
          </pre>
        </Card>

        {lead.opportunities.length > 0 ? (
          <Card className="space-y-2 p-5">
            <h2 className="text-sm font-semibold text-brand">Opportunities</h2>
            <ul className="space-y-1 text-sm">
              {lead.opportunities.map((o) => (
                <li key={o.id}>
                  <Link
                    className="underline"
                    href={`/reports/opportunities/${o.id}`}
                  >
                    {o.name}
                  </Link>{" "}
                  · {o.stage}
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Card className="space-y-2 p-5 text-sm text-muted">
            No Opportunity yet. Mark QUALIFIED when ready, then use the commercial
            / prospecting workflow to create an Opportunity (requires campaign
            context). Status alone does not create commercial records.
          </Card>
        )}
      </Container>
    </main>
  );
}
