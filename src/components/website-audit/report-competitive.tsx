import { Lock } from "lucide-react";

import {
  InfoPanel,
  ReportSection,
} from "@/components/website-audit/report-ui";
import {
  comparisonTableRows,
  coverageLabel,
  depthLabel,
  formatBenchmarkLabel,
  getCompetitiveVisibility,
} from "@/lib/website-audit/competitive";
import { COMPETITIVE_DISCLOSURE } from "@/lib/website-audit/competitive/constants";
import type { CompetitiveData } from "@/lib/website-audit/competitive/types";
import type { GrowthReportViewModel } from "@/lib/website-audit/report-view";

interface ReportCompetitiveProps {
  view: GrowthReportViewModel;
}

function OverviewStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="break-inside-avoid rounded-2xl border border-border bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl font-bold text-brand">{value}</p>
    </div>
  );
}

function comparisonStatusCopy(data: CompetitiveData): string {
  if (data.status === "partial") {
    return `${data.analyzedCount} of ${data.suppliedCount} competitor sites were successfully analyzed.`;
  }

  return `${data.analyzedCount} of ${data.suppliedCount} competitor sites were successfully analyzed.`;
}

export function ReportCompetitive({ view }: ReportCompetitiveProps) {
  const data = view.report.competitiveData;
  const visibility = getCompetitiveVisibility(data, view.capabilities);

  if (visibility === "hidden" || !data) {
    return null;
  }

  if (visibility === "teaser") {
    const strongerCount = data.findings.length;

    return (
      <div id="report-competitive" className="scroll-mt-24">
        <ReportSection
          eyebrow="Competitive Intelligence"
          title="How this website compares with the competitor sites you supplied."
          description="A bounded comparison ran during this audit. Detailed competitor metrics stay in the Professional report."
        >
          <InfoPanel
            icon={Lock}
            tone="primary"
            title={
              strongerCount > 0
                ? `Competitive analysis found ${strongerCount} meaningful area${strongerCount === 1 ? "" : "s"} where competitor sites are stronger.`
                : "Competitor websites were compared during this audit."
            }
            description="Unlock Professional to see where competitors are ahead, where your site is stronger, and the highest-priority competitive opportunities. Comparisons are a public-page sample, not rankings, traffic, or revenue."
          />
        </ReportSection>
      </div>
    );
  }

  if (visibility === "unavailable") {
    return (
      <div id="report-competitive" className="scroll-mt-24">
        <ReportSection
          eyebrow="Competitive Intelligence"
          title="Competitor comparison could not be completed."
          description="Your website audit completed successfully. The supplied competitor sites could not be analyzed, so no competitive findings were created."
        >
          {data.skipped.length > 0 ? (
            <ul className="space-y-2 text-sm leading-6 text-muted">
              {data.skipped.map((item) => (
                <li key={`${item.reason}-${item.submittedUrl}`}>
                  {item.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-6 text-muted">
              Competitor comparison could not be completed for the supplied
              sites.
            </p>
          )}
          <p className="mt-4 text-sm leading-6 text-muted">
            {COMPETITIVE_DISCLOSURE}
          </p>
        </ReportSection>
      </div>
    );
  }

  const rows = comparisonTableRows(data);
  const benchmarkLabel = formatBenchmarkLabel(data.analyzedCount);
  const failed = data.competitors.filter(
    (competitor) => competitor.status !== "analyzed",
  );

  return (
    <div id="report-competitive" className="scroll-mt-24 space-y-6 print:break-inside-avoid">
      <ReportSection
        eyebrow="Competitive Intelligence"
        title="Your site compared with the competitor websites you supplied."
        description={comparisonStatusCopy(data)}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OverviewStat
            label="Competitors supplied"
            value={String(data.suppliedCount)}
          />
          <OverviewStat
            label="Competitors analyzed"
            value={String(data.analyzedCount)}
          />
          <OverviewStat
            label="Areas behind"
            value={String(data.findings.length)}
          />
          <OverviewStat
            label="Areas stronger"
            value={String(data.strengths.length)}
          />
        </div>

        {failed.length > 0 ? (
          <p className="mt-4 text-sm leading-6 text-muted">
            Your audit completed successfully.{" "}
            {failed.length === 1
              ? "One competitor website could not be analyzed."
              : `${failed.length} competitor websites could not be analyzed.`}
          </p>
        ) : null}

        {rows.length > 0 ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-3 gap-2 border-b border-border bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              <span>Metric</span>
              <span>Your site</span>
              <span className="min-w-0 break-words">{benchmarkLabel}</span>
            </div>
            {rows.map((row) => (
              <div
                key={row.metric}
                className="grid grid-cols-1 gap-1 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-3 sm:gap-2"
              >
                <p className="text-sm font-semibold text-brand">{row.metric}</p>
                <p className="text-sm text-brand">
                  <span className="mr-2 text-xs uppercase tracking-[0.12em] text-muted sm:hidden">
                    Your site
                  </span>
                  {row.customer}
                </p>
                <p className="text-sm text-brand">
                  <span className="mr-2 text-xs uppercase tracking-[0.12em] text-muted sm:hidden">
                    {benchmarkLabel}
                  </span>
                  {row.benchmark}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {data.findings.length > 0 ? (
          <div className="mt-8 space-y-3">
            <h3 className="font-heading text-lg font-semibold text-brand">
              Where you&apos;re behind
            </h3>
            {data.findings.map((finding) => (
              <InfoPanel
                key={`${finding.id}-${finding.metric}`}
                tone="warning"
                title={finding.title}
                description={`${finding.description} ${finding.recommendation}`}
              />
            ))}
          </div>
        ) : null}

        {data.strengths.length > 0 ? (
          <div className="mt-8 space-y-3">
            <h3 className="font-heading text-lg font-semibold text-brand">
              Where you&apos;re stronger
            </h3>
            {data.strengths.map((finding) => (
              <InfoPanel
                key={`${finding.id}-${finding.metric}`}
                tone="success"
                title={finding.title}
                description={finding.description}
              />
            ))}
          </div>
        ) : null}

        {data.opportunities.length > 0 ? (
          <div className="mt-8 space-y-3">
            <h3 className="font-heading text-lg font-semibold text-brand">
              Top competitive opportunities
            </h3>
            <ol className="space-y-3">
              {data.opportunities.map((item, index) => (
                <li
                  key={item.id}
                  className="break-inside-avoid rounded-2xl border border-border bg-slate-50/70 px-4 py-4"
                >
                  <p className="text-sm font-semibold text-brand">
                    {index + 1}. {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {item.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {data.competitors.filter((item) => item.status === "analyzed").length >
        0 ? (
          <div className="mt-8 space-y-3">
            <h3 className="font-heading text-lg font-semibold text-brand">
              Competitor profiles
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {data.competitors
                .filter((item) => item.status === "analyzed")
                .map((competitor) => (
                  <article
                    key={competitor.submittedUrl}
                    className="break-inside-avoid rounded-2xl border border-border px-4 py-4"
                  >
                    <p className="break-all font-heading text-lg font-semibold text-brand">
                      {competitor.displayName}
                    </p>
                    <p className="break-all text-sm text-muted">
                      {competitor.hostname}
                    </p>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-xs uppercase tracking-[0.12em] text-muted">
                          Pages scanned
                        </dt>
                        <dd className="font-semibold text-brand">
                          {competitor.crawl.scannedCount}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.12em] text-muted">
                          Service pages
                        </dt>
                        <dd className="font-semibold text-brand">
                          {competitor.pages.service}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.12em] text-muted">
                          Location pages
                        </dt>
                        <dd className="font-semibold text-brand">
                          {competitor.local.substantiveLocationPages}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.12em] text-muted">
                          CTA coverage
                        </dt>
                        <dd className="font-semibold text-brand">
                          {coverageLabel(
                            competitor.conversion.ctaCoveragePercent,
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.12em] text-muted">
                          Content depth
                        </dt>
                        <dd className="font-semibold text-brand">
                          {depthLabel(
                            competitor.content.medianServiceWordCount,
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.12em] text-muted">
                          Trust coverage
                        </dt>
                        <dd className="font-semibold text-brand">
                          {coverageLabel(competitor.trust.keyPageTrustPercent)}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
            </div>
          </div>
        ) : null}

        <p className="mt-6 text-sm leading-6 text-muted">
          {data.disclosure || COMPETITIVE_DISCLOSURE}
        </p>
      </ReportSection>
    </div>
  );
}
