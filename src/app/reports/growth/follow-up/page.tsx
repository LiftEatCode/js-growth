import Link from "next/link";
import type { Metadata } from "next";

import { Button, Card, Container } from "@/components/ui";
import {
  buildFollowUpAttentionQueue,
  getFollowUpMetrics,
  LEAD_FOLLOWUP_VERSION,
  FOLLOW_UP_OPERATOR_TIMEZONE,
  previewContactSubmissionLead,
  type FollowUpAttentionItem,
} from "@/lib/follow-up";
import { CreateLeadFromContactForm } from "@/components/follow-up/create-lead-from-contact-form";
import { requireInternalSession } from "@/lib/internal-auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Follow-Up Queue",
  description: "Operator follow-up and nurture attention queue.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function QueueSection({
  title,
  items,
  testId,
}: {
  title: string;
  items: FollowUpAttentionItem[];
  testId: string;
}) {
  return (
    <section className="space-y-3" data-testid={testId}>
      <h2 className="font-heading text-xl font-semibold text-brand">
        {title}{" "}
        <span className="text-sm font-normal text-muted">({items.length})</span>
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">None right now.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={`${item.subjectKind}-${item.subjectId}`}
              data-testid={`queue-item-${item.subjectKind.toLowerCase()}-${item.subjectId}`}
            >
              <Card className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-brand">{item.title}</p>
                  <p className="text-xs text-muted">
                    {item.subjectKind} · {item.reason}
                    {item.dueState !== "NONE" ? ` · ${item.dueState}` : ""}
                    {item.acquisitionChannel
                      ? ` · Acquired: ${item.acquisitionChannel}`
                      : ""}
                  </p>
                </div>
                <Button
                  nativeButton={false}
                  render={
                    <Link
                      href={item.href}
                      data-testid={`queue-open-${item.subjectKind.toLowerCase()}-${item.subjectId}`}
                    />
                  }
                >
                  Open
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function FollowUpQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireInternalSession();
  const params = await searchParams;
  const filter = params.filter?.toUpperCase() ?? "ALL";

  const [queue, metrics, unlinkedContacts] = await Promise.all([
    buildFollowUpAttentionQueue(),
    getFollowUpMetrics(28),
    prisma.contactSubmission.findMany({
      where: { leadId: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        service: true,
        createdAt: true,
      },
    }),
  ]);

  const filterItem = (item: FollowUpAttentionItem) => {
    if (filter === "INBOUND") return item.subjectKind === "LEAD";
    if (filter === "OUTBOUND") return item.subjectKind === "PROSPECT";
    if (filter === "OPPORTUNITY") return item.subjectKind === "OPPORTUNITY";
    if (filter === "OVERDUE") return item.dueState === "OVERDUE";
    if (filter === "TODAY") return item.dueState === "DUE_TODAY";
    if (filter === "UPCOMING") return item.dueState === "UPCOMING";
    if (filter === "NURTURE") return item.reason.toLowerCase().includes("nurture");
    return true;
  };

  const now = queue.now.filter(filterItem);
  const next = queue.next.filter(filterItem);
  const watch = queue.watch.filter(filterItem);

  const contactPreviews = (
    await Promise.all(
      unlinkedContacts.map(async (c) => {
        const preview = await previewContactSubmissionLead(c.id);
        if (!preview.ok) return null;
        return { contact: c, preview };
      }),
    )
  ).filter(Boolean) as Array<{
    contact: (typeof unlinkedContacts)[number];
    preview: Extract<
      Awaited<ReturnType<typeof previewContactSubmissionLead>>,
      { ok: true }
    >;
  }>;

  const filters = [
    "ALL",
    "INBOUND",
    "OUTBOUND",
    "OPPORTUNITY",
    "OVERDUE",
    "TODAY",
    "UPCOMING",
    "NURTURE",
  ] as const;

  return (
    <main className="min-h-screen bg-slate-50/70">
      <Container className="space-y-8 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-blue">
              Lead Follow-up V{LEAD_FOLLOWUP_VERSION}
            </p>
            <h1
              className="mt-2 font-heading text-3xl font-semibold text-brand"
              data-testid="follow-up-queue-heading"
            >
              Follow-Up Queue
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Who needs attention today? Due dates use {FOLLOW_UP_OPERATOR_TIMEZONE}.
              Inbound leads and outbound prospects stay separate. No autonomous
              outreach.
            </p>
          </div>
          <Button
            nativeButton={false}
            render={<Link href="/reports/growth" />}
          >
            Growth dashboard
          </Button>
        </div>

        <Card className="grid gap-3 p-5 sm:grid-cols-4" data-testid="follow-up-counts">
          <div>
            <p className="text-xs text-muted">Overdue</p>
            <p className="text-2xl font-semibold text-brand">{queue.counts.overdue}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Due today</p>
            <p className="text-2xl font-semibold text-brand">{queue.counts.dueToday}</p>
          </div>
          <div>
            <p className="text-xs text-muted">New inbound</p>
            <p className="text-2xl font-semibold text-brand">{queue.counts.newInbound}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Nurture</p>
            <p className="text-2xl font-semibold text-brand">{queue.counts.nurture}</p>
          </div>
        </Card>

        <Card className="space-y-2 p-5 text-sm text-muted">
          <p className="font-semibold text-brand">28d metrics (safe)</p>
          <p>
            Activities: {metrics.counts.activitiesRecorded} · First response median:{" "}
            {String(metrics.firstResponseMedianHours)} · Response rate:{" "}
            {metrics.responseRate}
          </p>
        </Card>

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Button
              key={f}
              nativeButton={false}
              render={
                <Link
                  href={
                    f === "ALL"
                      ? "/reports/growth/follow-up"
                      : `/reports/growth/follow-up?filter=${f.toLowerCase()}`
                  }
                />
              }
              variant={filter === f ? "default" : "outline"}
            >
              {f}
            </Button>
          ))}
        </div>

        <QueueSection title="NOW" items={now} testId="queue-now" />
        <QueueSection title="NEXT" items={next} testId="queue-next" />
        <QueueSection title="WATCH" items={watch} testId="queue-watch" />

        {contactPreviews.length > 0 ? (
          <section className="space-y-3" data-testid="unlinked-contacts">
            <h2 className="font-heading text-xl font-semibold text-brand">
              Unlinked contact submissions
            </h2>
            <p className="text-sm text-muted">
              Contact submissions do not auto-create Leads. Create or link
              explicitly.
            </p>
            <ul className="space-y-4">
              {contactPreviews.map(({ contact: c, preview }) => (
                <li key={c.id}>
                  <Card className="space-y-3 p-4">
                    <p className="text-sm font-semibold text-brand">
                      {c.name} · {c.service}
                    </p>
                    <p className="text-xs text-muted">
                      {c.createdAt.toISOString()}
                    </p>
                    <CreateLeadFromContactForm
                      submissionId={c.id}
                      decisionHint={preview.decisionHint}
                      existingLeads={preview.existingLeads}
                      linkedLeadId={preview.submission.leadId}
                    />
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Container>
    </main>
  );
}
