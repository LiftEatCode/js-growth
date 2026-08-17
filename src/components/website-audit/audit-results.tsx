import {
  FileCode2,
  Globe2,
  ImageIcon,
  Link2,
  ListTree,
  MapPin,
} from "lucide-react";

import { AuditExecutiveDashboard } from "@/components/website-audit/audit-executive-dashboard";
import { AuditFindingsFilter } from "@/components/website-audit/audit-findings-filter";
import { AuditLeadCapture } from "@/components/website-audit/audit-lead-capture";
import { ReportActionPlan } from "@/components/website-audit/report-action-plan";
import { ReportAiInterpretation } from "@/components/website-audit/report-ai-interpretation";
import { ReportCategoryDives } from "@/components/website-audit/report-category-dives";
import { ReportCategoryScorecard } from "@/components/website-audit/report-category-scorecard";
import {
  ReportImplementationCta,
  ReportUpgradeCta,
} from "@/components/website-audit/report-ctas";
import { ReportMethodology } from "@/components/website-audit/report-methodology";
import { ReportNav } from "@/components/website-audit/report-nav";
import { ReportQuickWins } from "@/components/website-audit/report-quick-wins";
import { ReportCompetitive } from "@/components/website-audit/report-competitive";
import {
  ReportSiteOverview,
  ReportSiteScanNotice,
} from "@/components/website-audit/report-site-overview";
import { ReportTopPriorities } from "@/components/website-audit/report-top-priorities";
import { SavedReportLink } from "@/components/website-audit/saved-report-link";
import { Card, SectionHeader } from "@/components/ui";
import {
  getAuditCanonicalUrl,
  getAuditMetaDescriptionText,
  getAuditTitleText,
} from "@/lib/website-audit/page-metadata";
import { buildGrowthReportViewModel } from "@/lib/website-audit/report-view";
import type { ReportMode, WebsiteAuditResult } from "@/lib/website-audit/types";
import type { AiInterpretationView } from "@/lib/website-audit/ai-interpretation/types";

interface AuditResultsProps {
  result: WebsiteAuditResult;
  mode?: ReportMode;
  reportId?: string;
  professionallyUnlocked?: boolean;
  interpretation?: AiInterpretationView | null;
}

export function AuditResults({
  result,
  mode = "public",
  reportId,
  professionallyUnlocked = false,
  interpretation = null,
}: AuditResultsProps) {
  const view = buildGrowthReportViewModel(result, mode, {
    professionallyUnlocked,
  });
  const hostname = getHostname(result.metadata.finalUrl);

  return (
    <div className="space-y-10">
      <AuditExecutiveDashboard view={view} reportId={reportId} />

      <ReportNav view={view} showAiInterpretation={Boolean(interpretation && interpretation.status !== "hidden")} />

      <ReportSiteScanNotice view={view} />

      <ReportAiInterpretation
        interpretation={interpretation}
        showAiInterpretation={view.capabilities.showAiInterpretation}
        reportId={reportId}
      />

      <ReportSiteOverview view={view} />

      <ReportCompetitive view={view} />

      {reportId ? (
        <div className="print:hidden">
          <SavedReportLink reportId={reportId} />
        </div>
      ) : null}

      <section
        aria-labelledby="category-scorecard-heading"
        className="space-y-6"
      >
        <SectionHeader
          eyebrow="Category Scorecard"
          title="Where the website is strongest and weakest."
          description="Each score is based on the checks in that area. It is a prioritization tool, not a ranking prediction."
        />
        <div id="category-scorecard-heading" className="sr-only">
          Category scorecard
        </div>
        <ReportCategoryScorecard items={view.scorecard} />
      </section>

      <div id="report-priorities" className="scroll-mt-24">
        <ReportTopPriorities view={view} />
      </div>

      <ReportQuickWins view={view} />

      {view.capabilities.showEstimatedEffort ? (
        <p className="rounded-2xl border border-border bg-white px-5 py-4 text-sm leading-6 text-muted">
          Estimated implementation effort:{" "}
          <span className="font-semibold text-brand">
            {view.estimatedEffortLabel}
          </span>
          . Actual implementation time depends on the website platform, codebase,
          and complexity.
        </p>
      ) : null}

      {view.capabilities.showUpgradeCta ? (
        <ReportUpgradeCta
          showUpgradeCta={view.capabilities.showUpgradeCta}
          reportId={reportId}
        />
      ) : null}

      <ReportActionPlan view={view} />

      <ReportCategoryDives view={view} mode={mode} />

      {view.capabilities.showTechnicalEvidence ? (
        <section
          aria-labelledby="page-details-heading"
          className="space-y-6"
        >
          <SectionHeader
            eyebrow="Technical evidence"
            title="Signals collected from the audited page."
            description="These details support the findings above. They are observations from the submitted page. Cross-page patterns, when available, appear in Site Overview."
          />
          <Card variant="elevated" padding="lg">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <DetailCard
                icon={ListTree}
                label="Headings"
                value={`${view.report.pageData.h1Count} H1 · ${view.report.pageData.h2Count} H2 · ${view.report.pageData.h3Count} H3`}
              />
              <DetailCard
                icon={ImageIcon}
                label="Images"
                value={`${view.report.pageData.images?.total ?? view.report.pageData.imageCount} total · ${view.report.pageData.images?.missingAltAttribute ?? view.report.pageData.imagesWithoutAlt} missing alt`}
              />
              <DetailCard
                icon={Link2}
                label="Links"
                value={`${view.report.pageData.internalLinkCount} internal · ${view.report.pageData.externalLinkCount} external`}
              />
              <DetailCard
                icon={FileCode2}
                label="Structured data"
                value={
                  view.report.pageData.structuredDataTypes.length > 0
                    ? view.report.pageData.structuredDataTypes.join(", ")
                    : view.report.pageData.hasStructuredData
                      ? "Detected"
                      : "Not detected"
                }
              />
              <DetailCard
                icon={Globe2}
                label="Title"
                value={
                  getAuditTitleText(view.report.pageData.title) ??
                  "No title detected"
                }
              />
              <DetailCard
                icon={FileCode2}
                label="Meta description"
                value={
                  getAuditMetaDescriptionText(view.report.pageData.metaDescription) ??
                  "No meta description detected"
                }
              />
              <DetailCard
                icon={Link2}
                label="Canonical URL"
                value={
                  getAuditCanonicalUrl(view.report.pageData) ??
                  "No canonical URL detected"
                }
              />
              <DetailCard
                icon={MapPin}
                label="Local signals"
                value={
                  view.report.pageData.hasLocalBusinessSignals
                    ? "Detected"
                    : "Not detected"
                }
              />
            </div>
          </Card>
        </section>
      ) : null}

      {view.capabilities.showFullFindings ? (
        <section
          aria-labelledby="detailed-findings-heading"
          className="space-y-6"
        >
          <SectionHeader
            eyebrow="All Findings"
            title="Every check from this scan."
            description="Use the filters if you want to inspect a category in more detail. The priorities above are the best place to start."
          />
          <AuditFindingsFilter
            findings={view.report.findings}
            mode={mode}
            tier={view.tier}
          />
        </section>
      ) : null}

      <ReportMethodology view={view} />

      {reportId ? (
        <div className="print:hidden">
        <AuditLeadCapture
          reportId={reportId}
          hostname={hostname}
          canDownloadPdf={view.capabilities.showPdfExport}
        />
        </div>
      ) : null}

      <ReportImplementationCta
        showImplementationCta={view.capabilities.showImplementationCta}
      />
    </div>
  );
}

interface DetailCardProps {
  icon: typeof Globe2;
  label: string;
  value: string;
}

function DetailCard({ icon: Icon, label, value }: DetailCardProps) {
  return (
    <div className="rounded-xl border border-border bg-slate-50/60 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        <Icon aria-hidden="true" className="size-4 text-brand-blue" />
        {label}
      </div>
      <p className="mt-3 break-words text-sm font-medium leading-6 text-brand">
        {value}
      </p>
    </div>
  );
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
