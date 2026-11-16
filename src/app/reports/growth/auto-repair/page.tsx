import type { Metadata } from "next";
import Link from "next/link";

import { Card, Container } from "@/components/ui";
import { AUTO_REPAIR_WEBSITE_PATH } from "@/content/auto-repair-websites";
import { FREE_CHECK_SERVICE } from "@/content/free-check";
import { requireInternalSession } from "@/lib/internal-auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Auto Repair Website Funnel",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AutoRepairFunnelPage() {
  await requireInternalSession();

  const requests = await prisma.contactSubmission.findMany({
    where: {
      service: FREE_CHECK_SERVICE,
      createdAt: { gte: new Date(new Date().getTime() - 28 * 24 * 60 * 60 * 1000) },
      attributionJson: { path: ["landingPath"], equals: AUTO_REPAIR_WEBSITE_PATH },
    },
    select: { leadId: true },
  });
  const leadIds = [...new Set(requests.flatMap(({ leadId }) => leadId ? [leadId] : []))];
  const leads = await prisma.lead.findMany({
    where: { id: { in: leadIds } },
    select: {
      status: true,
      activities: {
        where: { type: "STATUS_CHANGED", toValue: "QUALIFIED" },
        select: { id: true },
        take: 1,
      },
      opportunities: {
        select: {
          proposalDeliveries: { where: { sentAt: { not: null } }, select: { id: true }, take: 1 },
          commercialPayments: { where: { type: "DEPOSIT", status: "PAID" }, select: { id: true }, take: 1 },
        },
      },
    },
  });

  const qualified = leads.filter((lead) =>
    ["QUALIFIED", "PROPOSAL", "WON"].includes(lead.status) || lead.activities.length > 0,
  );
  const quoted = qualified.filter((lead) => lead.opportunities.some((opportunity) => opportunity.proposalDeliveries.length > 0));
  const deposited = quoted.filter((lead) => lead.opportunities.some((opportunity) =>
    opportunity.proposalDeliveries.length > 0 && opportunity.commercialPayments.length > 0,
  ));
  const metrics = [
    ["Free-check requests", requests.length],
    ["Qualified leads", qualified.length],
    ["Quotes sent", quoted.length],
    ["Deposits paid", deposited.length],
  ] as const;

  return (
    <Container className="space-y-6 py-10">
      <Link href="/reports/growth" className="underline underline-offset-4">Growth dashboard</Link>
      <h1 className="font-heading text-3xl font-semibold text-brand">Auto repair website funnel</h1>
      <p className="max-w-3xl text-muted">
        Free checks from the last 28 days whose recorded landing page was {AUTO_REPAIR_WEBSITE_PATH}.
        Downstream stages count each linked lead once. Quotes count sent proposals and deposits count
        paid deposits recorded on the same opportunity.
      </p>
      <Card className="p-5">
        <h2 className="font-semibold text-brand">Visits in Google Analytics</h2>
        <p className="mt-2 text-sm text-muted">
          Open GA4’s Landing page report, filter for {AUTO_REPAIR_WEBSITE_PATH}, and compare Sessions
          over the same 28 days. Include query-string variants to capture tagged campaigns.
        </p>
        <a className="mt-3 inline-block underline underline-offset-4" href="https://analytics.google.com/">Open Google Analytics</a>
      </Card>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, count]) => (
          <Card key={label} className="p-5">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="mt-1 text-3xl font-bold text-brand">{count}</dd>
          </Card>
        ))}
      </dl>
      <Link href="/reports/growth/follow-up" className="underline underline-offset-4">Link and qualify submissions in the follow-up queue</Link>
    </Container>
  );
}
