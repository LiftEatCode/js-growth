import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Card, Container } from "@/components/ui";
import { competitorWebsiteAuditStatusLabel } from "@/lib/competitive-intelligence/audits/labels";
import { prisma } from "@/lib/prisma";
import { isCategoryScoreApplicable } from "@/lib/website-audit/scoring";
import { getScoreBand } from "@/lib/website-audit/score-bands";
import type { WebsiteAuditResult } from "@/lib/website-audit/types";

interface CompetitorAuditDetailPageProps {
  params: Promise<{
    campaignId: string;
    prospectId: string;
    competitorId: string;
    auditId: string;
  }>;
}

export const metadata: Metadata = {
  title: "Competitor Website Audit",
  description: "Internal competitor Website Growth Audit snapshot.",
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

export default async function CompetitorAuditDetailPage({
  params,
}: CompetitorAuditDetailPageProps) {
  const { campaignId, prospectId, competitorId, auditId } = await params;

  const membership = await prisma.campaignProspect.findUnique({
    where: {
      campaignId_prospectId: { campaignId, prospectId },
    },
    select: { campaignId: true },
  });

  if (!membership) {
    notFound();
  }

  const audit = await prisma.competitorAudit.findFirst({
    where: {
      id: auditId,
      prospectCompetitorId: competitorId,
      targetProspectId: prospectId,
    },
    include: {
      prospectCompetitor: {
        select: {
          id: true,
          businessName: true,
          website: true,
          city: true,
          state: true,
          validationScore: true,
          validationLabel: true,
          status: true,
        },
      },
    },
  });

  if (!audit) {
    notFound();
  }

  const result = audit.auditResultJson as WebsiteAuditResult | null;
  const categoryScores = result?.categoryScores ?? [];
  const findings =
    result?.findings.filter(
      (finding) => finding.status === "fail" || finding.status === "warning",
    ) ?? [];

  return (
    <main className="py-10">
      <Container className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/reports/prospecting/${campaignId}/prospects/${prospectId}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-brand transition hover:bg-slate-50"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to prospect
          </Link>
        </div>

        <Card variant="elevated" padding="lg" className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-muted">
              Internal competitor Website Growth Audit
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-brand">
              {audit.prospectCompetitor.businessName}
            </h1>
            <p className="mt-2 break-all text-sm text-muted">{audit.websiteUrl}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-muted">
                Website Growth Score
              </p>
              <p className="mt-1 text-2xl font-semibold text-brand">
                {typeof audit.overallScore === "number"
                  ? `${audit.overallScore} · ${getScoreBand(audit.overallScore).label}`
                  : competitorWebsiteAuditStatusLabel(audit.status)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-muted">
                Grade
              </p>
              <p className="mt-1 text-2xl font-semibold text-brand">
                {audit.grade ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-muted">
                Competitive relevance
              </p>
              <p className="mt-1 text-lg font-semibold text-brand">
                {audit.prospectCompetitor.validationScore} ·{" "}
                {audit.prospectCompetitor.validationLabel}
              </p>
              <p className="mt-1 text-xs text-muted">
                Places match score — not the Website Growth Score
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-muted">
                Audit status
              </p>
              <p className="mt-1 text-lg font-semibold text-brand">
                {competitorWebsiteAuditStatusLabel(audit.status)}
              </p>
              <p className="mt-1 text-xs text-muted">
                Engine v{audit.auditEngineVersion}
                {audit.completedAt
                  ? ` · ${formatDate(audit.completedAt)}`
                  : audit.failedAt
                    ? ` · ${formatDate(audit.failedAt)}`
                    : ""}
              </p>
            </div>
          </div>

          {audit.status === "FAILED" ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {audit.failureReason ?? "Website could not be analyzed."}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <p className="text-sm text-muted">
              Pages scanned: {audit.pagesScanned ?? "—"}
            </p>
            <p className="text-sm text-muted">
              Critical issues: {audit.criticalIssues ?? "—"}
            </p>
            <p className="text-sm text-muted">
              Quick wins: {audit.quickWins ?? "—"}
            </p>
          </div>
        </Card>

        {categoryScores.length > 0 ? (
          <Card variant="elevated" padding="lg">
            <h2 className="font-heading text-xl font-semibold text-brand">
              Category scores
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categoryScores.map((category) => (
                <div
                  key={category.category}
                  className="rounded-xl border border-border px-4 py-3"
                >
                  <p className="text-sm font-semibold text-brand">
                    {category.label}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {isCategoryScoreApplicable(category)
                      ? `${category.score} / ${category.maxScore}`
                      : "Not applicable"}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {findings.length > 0 ? (
          <Card variant="elevated" padding="lg">
            <h2 className="font-heading text-xl font-semibold text-brand">
              Top findings
            </h2>
            <ul className="mt-4 space-y-3">
              {findings.slice(0, 20).map((finding) => (
                <li
                  key={finding.id}
                  className="rounded-xl border border-border px-4 py-3"
                >
                  <p className="text-sm font-semibold text-brand">
                    {finding.title}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.08em] text-muted">
                    {finding.category} · {finding.priority} · {finding.status}
                  </p>
                  <p className="mt-2 text-sm text-muted">{finding.description}</p>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <p className="text-xs text-muted">
          This is an internal competitive intelligence snapshot. It is not a
          public Website Growth Audit report, does not support purchase/PDF/AI
          Interpretation, and does not create outreach.
        </p>
      </Container>
    </main>
  );
}
