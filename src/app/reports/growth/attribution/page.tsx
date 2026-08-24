import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { Button, Card, Container } from "@/components/ui";
import {
  ACQUISITION_CAPTURE_VERSION,
  channelFromAcquisition,
  parseAcquisitionContextFromUnknown,
  strengthFromAcquisition,
} from "@/lib/growth/acquisition-capture";
import { listRecentContactSubmissions } from "@/lib/growth/contact-submission-store";
import { prisma } from "@/lib/prisma";
import { requireInternalSession } from "@/lib/internal-auth";

export const metadata: Metadata = {
  title: "Acquisition Attribution",
  description: "Privacy-safe acquisition observations for new inbound conversions.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function GrowthAttributionPage() {
  await requireInternalSession();

  const [audits, contacts] = await Promise.all([
    prisma.auditReport.findMany({
      where: { source: "PUBLIC_FUNNEL" },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        createdAt: true,
        attributionJson: true,
      },
    }),
    listRecentContactSubmissions(40),
  ]);

  const rows = [
    ...audits.map((row) => {
      const ctx = parseAcquisitionContextFromUnknown(row.attributionJson);
      return {
        key: `audit-${row.id}`,
        at: row.createdAt.toISOString(),
        conversion: "AUDIT" as const,
        channel: channelFromAcquisition(ctx),
        strength: strengthFromAcquisition(ctx),
        source: ctx?.source ?? null,
        medium: ctx?.medium ?? null,
        campaign: ctx?.campaign ?? null,
        content: ctx?.content ?? null,
        landingPath: ctx?.landingPath ?? null,
        entryType: ctx?.entryType ?? null,
        href: `/reports/${row.id}`,
      };
    }),
    ...contacts.map((row) => {
      const ctx = parseAcquisitionContextFromUnknown(row.attributionJson);
      return {
        key: `contact-${row.id}`,
        at: row.createdAt.toISOString(),
        conversion: "CONTACT" as const,
        channel: channelFromAcquisition(ctx),
        strength: strengthFromAcquisition(ctx),
        source: ctx?.source ?? null,
        medium: ctx?.medium ?? null,
        campaign: ctx?.campaign ?? null,
        content: ctx?.content ?? null,
        landingPath: ctx?.landingPath ?? null,
        entryType: ctx?.entryType ?? null,
        href: null as string | null,
      };
    }),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 50);

  return (
    <Container className="py-10">
      <Button nativeButton={false} render={<Link href="/reports/growth" />}>
        <ArrowLeft aria-hidden="true" className="size-4" />
        Growth dashboard
      </Button>
      <h1 className="mt-6 font-heading text-3xl font-semibold text-brand">
        Acquisition Attribution
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
        acquisition-capture-v{ACQUISITION_CAPTURE_VERSION}. Privacy-safe
        observations only — no PII, emails, or commercial IDs in this table.
        Historical UNKNOWN audits are not rewritten.
      </p>

      <Card className="mt-8 overflow-x-auto p-0">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-border bg-slate-50 text-muted">
            <tr>
              <th className="px-3 py-2 font-semibold">When</th>
              <th className="px-3 py-2 font-semibold">Type</th>
              <th className="px-3 py-2 font-semibold">Channel</th>
              <th className="px-3 py-2 font-semibold">Entry</th>
              <th className="px-3 py-2 font-semibold">Source/Medium</th>
              <th className="px-3 py-2 font-semibold">Campaign/Content</th>
              <th className="px-3 py-2 font-semibold">Landing</th>
              <th className="px-3 py-2 font-semibold">Strength</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-muted" colSpan={8}>
                  No recent conversions.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.key} className="border-b border-border/70">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {row.at.slice(0, 19).replace("T", " ")}
                  </td>
                  <td className="px-3 py-2">
                    {row.href ? (
                      <Link className="underline" href={row.href}>
                        {row.conversion}
                      </Link>
                    ) : (
                      row.conversion
                    )}
                  </td>
                  <td className="px-3 py-2">{row.channel}</td>
                  <td className="px-3 py-2">{row.entryType ?? "—"}</td>
                  <td className="px-3 py-2">
                    {row.source ?? "—"} / {row.medium ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {row.campaign ?? "—"} / {row.content ?? "—"}
                  </td>
                  <td className="px-3 py-2">{row.landingPath ?? "—"}</td>
                  <td className="px-3 py-2">{row.strength}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </Container>
  );
}
