import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PricingEditor } from "@/components/opportunities/pricing-editor";
import { Button, Card, Container } from "@/components/ui";
import {
  effortBandLabel,
  formatUsdCents,
} from "@/lib/commercialization/pricing/constants";
import { loadCommercialPricingDetail } from "@/lib/commercialization/pricing/load";

interface PricingDetailPageProps {
  params: Promise<{ opportunityId: string; pricingId: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export const metadata: Metadata = {
  title: "Commercial Pricing",
  description: "Internal commercial pricing workspace.",
  robots: { index: false, follow: false },
};

function formatDateTime(value: Date | null): string {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function PricingDetailPage({
  params,
  searchParams,
}: PricingDetailPageProps) {
  const { opportunityId, pricingId } = await params;
  const { preview } = await searchParams;
  const detail = await loadCommercialPricingDetail({ pricingId });

  if (!detail || detail.pricing.opportunityId !== opportunityId) {
    notFound();
  }

  const { pricing, lineItems, staleness } = detail;
  const isPreview = preview === "1";

  const included = lineItems.filter((l) => l.isIncluded && !l.isOptional);
  const optional = lineItems.filter((l) => l.isIncluded && l.isOptional);

  return (
    <main className="min-h-screen bg-slate-50/60">
      <Container className="space-y-6 py-8 sm:py-10">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={pricing.opportunityHref} />}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Opportunity
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={pricing.scopeHref} />}
          >
            Scope
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <Link
                href={
                  isPreview
                    ? `/reports/opportunities/${opportunityId}/pricing/${pricingId}`
                    : `/reports/opportunities/${opportunityId}/pricing/${pricingId}?preview=1`
                }
              />
            }
          >
            {isPreview ? "Exit preview" : "Preview Pricing"}
          </Button>
        </div>

        <Card variant="elevated" padding="lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Commercial Pricing · {pricing.statusLabel} · Revision{" "}
            {pricing.revision}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold text-brand">
            {pricing.businessName} — Pricing
          </h1>
          {!isPreview ? (
            <p className="mt-2 text-sm text-muted">
              Created {formatDateTime(pricing.createdAt)}
              {pricing.approvedAt
                ? ` · Approved ${formatDateTime(pricing.approvedAt)}${
                    pricing.approvedByEmail
                      ? ` by ${pricing.approvedByEmail}`
                      : ""
                  }`
                : ""}
            </p>
          ) : null}
        </Card>

        {!isPreview && staleness.stale ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">Source Scope indicator: STALE</p>
            <ul className="mt-1 list-disc pl-5">
              {staleness.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p className="mt-2">
              Pricing is not auto-updated. Revise from the Opportunity after the
              Scope is current and approved.
            </p>
          </div>
        ) : null}

        {isPreview ? (
          <Card variant="elevated" padding="lg">
            <h2 className="font-heading text-xl font-semibold text-brand">
              Investment summary
            </h2>
            <p className="mt-2 text-sm text-muted">
              Internal client-readable preview only — not a proposal or public
              link.
            </p>

            {!pricing.isComplete ? (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-medium">Pricing is not complete.</p>
                <p className="mt-1">
                  Investment pending final scope pricing. A complete investment
                  total is not available yet.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-6 space-y-4">
                  <h3 className="font-heading text-base font-semibold text-brand">
                    Included work
                  </h3>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-ink/90">
                    {included.map((line) => (
                      <li key={line.id}>
                        {line.title}
                        {line.finalLineTotalCents != null
                          ? ` — ${formatUsdCents(line.finalLineTotalCents)}`
                          : ""}
                      </li>
                    ))}
                  </ul>
                </div>

                {optional.length > 0 ? (
                  <div className="mt-6 space-y-4">
                    <h3 className="font-heading text-base font-semibold text-brand">
                      Optional work
                    </h3>
                    <ul className="list-disc space-y-2 pl-5 text-sm text-ink/90">
                      {optional.map((line) => (
                        <li key={line.id}>
                          {line.title}
                          {line.finalLineTotalCents != null
                            ? ` — ${formatUsdCents(line.finalLineTotalCents)}`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-8 border-t border-border pt-4">
                  <p className="text-sm text-muted">Recommended investment</p>
                  <p className="mt-1 font-heading text-2xl font-semibold text-brand">
                    {formatUsdCents(pricing.finalTotalCents)}
                  </p>
                  {pricing.minimumApplied && !pricing.assessmentOnly ? (
                    <p className="mt-1 text-xs text-muted">
                      Includes minimum engagement of{" "}
                      {formatUsdCents(pricing.minimumEngagementCents)}.
                    </p>
                  ) : null}
                  {pricing.finalOptionalCents > 0 ? (
                    <p className="mt-1 text-xs text-muted">
                      Optional add-ons:{" "}
                      {formatUsdCents(pricing.finalOptionalCents)} (not in base
                      total)
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </Card>
        ) : (
          <Card variant="elevated" padding="lg">
            <PricingEditor
              pricingId={pricing.id}
              editable={pricing.editable}
              status={pricing.status}
              initialNotes={pricing.notes ?? ""}
              recommendedIncludedCents={pricing.recommendedIncludedCents}
              recommendedOptionalCents={pricing.recommendedOptionalCents}
              recommendedTotalCents={pricing.recommendedTotalCents}
              finalIncludedCents={pricing.finalIncludedCents}
              finalOptionalCents={pricing.finalOptionalCents}
              finalTotalCents={pricing.finalTotalCents}
              minimumEngagementCents={pricing.minimumEngagementCents}
              minimumApplied={pricing.minimumApplied}
              assessmentOnly={pricing.assessmentOnly}
              lineItems={lineItems.map((line) => ({
                id: line.id,
                title: line.title,
                workType: line.workType,
                effortBand: line.effortBand,
                quantity: line.quantity,
                recommendedUnitPriceCents: line.recommendedUnitPriceCents,
                recommendedLineTotalCents: line.recommendedLineTotalCents,
                finalUnitPriceCents: line.finalUnitPriceCents,
                finalLineTotalCents: line.finalLineTotalCents,
                isOptional: line.isOptional,
                isIncluded: line.isIncluded,
                isCustom: line.isCustom,
                isOverridden: line.isOverridden,
                overrideReason: line.overrideReason,
                sourceSectionTitles: line.sourceSectionTitles,
              }))}
            />
            {!pricing.editable ? (
              <ul className="mt-6 list-disc space-y-1 pl-5 text-sm text-ink/90">
                {lineItems.map((line) => (
                  <li key={line.id}>
                    {line.title} · {effortBandLabel(line.effortBand)} ·{" "}
                    {line.finalLineTotalCents != null
                      ? formatUsdCents(line.finalLineTotalCents)
                      : "—"}
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>
        )}
      </Container>
    </main>
  );
}
