import { FindingCard } from "@/components/website-audit/finding-card";
import {
  InfoPanel,
  ReportSection,
  StatBadge,
} from "@/components/website-audit/report-ui";
import {
  formatFreeSiteScanLine,
  formatSiteScanSummary,
  SITE_SCAN_DISCLOSURE,
} from "@/lib/website-audit/site/copy";
import {
  SITE_PAGE_TYPE_LABELS,
  type AuditSitePageSnapshot,
} from "@/lib/website-audit/site/types";
import type { GrowthReportViewModel } from "@/lib/website-audit/report-view";
import { isActionableFinding } from "@/lib/website-audit/report-view";

interface ReportSiteOverviewProps {
  view: GrowthReportViewModel;
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

function pageStatus(page: AuditSitePageSnapshot): string {
  if (page.fetchStatus === "failed") {
    return page.statusCode ? `Failed (${page.statusCode})` : "Failed";
  }

  return "Scanned";
}

function truncate(value: string | null, max = 72): string {
  if (!value) {
    return "—";
  }

  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max - 1)}…`;
}

function OverviewStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl font-bold text-brand">
        {value}
      </p>
    </div>
  );
}

export function ReportSiteScanNotice({
  view,
}: ReportSiteOverviewProps) {
  const siteData = view.report.siteData;

  if (!siteData || view.capabilities.showSiteOverview) {
    return null;
  }

  return (
    <p className="rounded-2xl border border-border bg-white px-5 py-4 text-sm leading-6 text-muted">
      {formatFreeSiteScanLine(siteData)}. {SITE_SCAN_DISCLOSURE}
    </p>
  );
}

export function ReportSiteOverview({ view }: ReportSiteOverviewProps) {
  const siteData = view.report.siteData;

  if (!siteData || !view.capabilities.showSiteOverview) {
    return null;
  }

  const { crawl, local, content, links } = siteData;
  const siteFindings = view.report.findings.filter(
    (finding) => finding.id.startsWith("site-"),
  );
  const issues = siteFindings.filter(isActionableFinding);
  const strengths = siteFindings.filter((finding) => finding.status === "pass");
  const inventory = view.capabilities.showSiteInventory
    ? siteData.pages
    : [];

  return (
    <div id="report-site-overview" className="scroll-mt-24 space-y-6">
      <ReportSection
        eyebrow="Site Overview"
        title="Representative multi-page scan."
        description={formatSiteScanSummary(siteData)}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OverviewStat
            label="URLs discovered"
            value={String(crawl.discoveredCount)}
          />
          <OverviewStat
            label="Pages scanned"
            value={String(crawl.crawledCount)}
          />
          <OverviewStat
            label="Pages failed"
            value={String(crawl.failedCount)}
          />
          <OverviewStat
            label="Page cap"
            value={String(crawl.maxPages)}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <StatBadge
            label={`${content.servicePageCount} service pages`}
            tone="default"
          />
          <StatBadge
            label={`${content.locationPageCount} location pages`}
            tone="default"
          />
          <StatBadge
            label={`Contact page: ${yesNo(local.contactPageFound)}`}
            tone={local.contactPageFound ? "success" : "default"}
          />
          <StatBadge
            label={`About page: ${yesNo(local.aboutPageFound)}`}
            tone={local.aboutPageFound ? "success" : "default"}
          />
          <StatBadge
            label={`${links.verifiedBrokenCount} verified broken links`}
            tone={links.verifiedBrokenCount > 0 ? "warning" : "success"}
          />
          {crawl.truncated ? (
            <StatBadge
              label={`Scan capped at ${crawl.maxPages} pages`}
              tone="default"
            />
          ) : null}
        </div>

        <p className="mt-5 text-sm leading-6 text-muted">
          {SITE_SCAN_DISCLOSURE}
        </p>
      </ReportSection>

      {issues.length > 0 ? (
        <ReportSection
          eyebrow="Site-wide issues"
          title="Patterns across the scanned pages."
          description="These findings compare multiple pages. They are not a complete crawl of every URL."
        >
          <div className="space-y-4">
            {issues.map((finding) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                tier={view.tier}
              />
            ))}
          </div>
        </ReportSection>
      ) : null}

      {strengths.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {strengths.map((finding) => (
            <InfoPanel
              key={finding.id}
              tone="success"
              title={finding.title}
              description={finding.description}
            />
          ))}
        </div>
      ) : null}

      {inventory.length > 0 ? (
        <ReportSection
          eyebrow="Page inventory"
          title="Pages included in this scan."
          description="Only URLs that were fetched during this representative scan are listed."
        >
          <div className="grid gap-4">
            {inventory.map((page) => (
              <article
                key={page.identity}
                className="rounded-2xl border border-border bg-slate-50/70 p-4 print:break-inside-avoid"
              >
                <p className="break-all text-sm font-semibold text-brand">
                  {page.path}
                </p>
                <p className="mt-1 break-all text-xs text-muted">
                  {page.finalUrl}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatBadge
                    label={SITE_PAGE_TYPE_LABELS[page.pageType]}
                    tone="default"
                  />
                  <StatBadge
                    label={pageStatus(page)}
                    tone={
                      page.fetchStatus === "failed" ? "warning" : "success"
                    }
                  />
                  <StatBadge
                    label={
                      page.indexable === false ? "Noindex" : "Indexable"
                    }
                    tone={page.indexable === false ? "warning" : "success"}
                  />
                  <StatBadge
                    label={
                      page.hasConversionPath
                        ? "Conversion path"
                        : "No conversion path"
                    }
                    tone={page.hasConversionPath ? "success" : "warning"}
                  />
                </div>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                      Title
                    </dt>
                    <dd className="mt-1 text-brand">
                      {truncate(page.title)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                      Words
                    </dt>
                    <dd className="mt-1 text-brand">
                      {page.fetchStatus === "success"
                        ? String(page.wordCount)
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </ReportSection>
      ) : null}
    </div>
  );
}
