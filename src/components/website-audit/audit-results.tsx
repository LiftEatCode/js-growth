import {
  FileCode2,
  Globe2,
  ImageIcon,
  Link2,
  ListTree,
  MapPin,
  SearchCheck,
} from "lucide-react";

import { AuditCategoryGrid } from "@/components/website-audit/audit-category-grid";
import { AuditConversionCta } from "@/components/website-audit/audit-conversion-cta";
import { AuditCriticalIssues } from "@/components/website-audit/audit-critical-issues";
import { AuditExecutiveDashboard } from "@/components/website-audit/audit-executive-dashboard";
import { AuditFindingsFilter } from "@/components/website-audit/audit-findings-filter";
import { AuditLeadCapture } from "@/components/website-audit/audit-lead-capture";
import { AuditOpportunityCard } from "@/components/website-audit/audit-opportunity-card";
import { AuditRecommendedRoadmap } from "@/components/website-audit/audit-recommended-roadmap";
import { SavedReportLink } from "@/components/website-audit/saved-report-link";
import {
  Card,
  SectionHeader,
} from "@/components/ui";
import { buildExecutiveSummary } from "@/lib/website-audit/executive-summary";
import type {
  ReportMode,
  WebsiteAuditResult,
} from "@/lib/website-audit/types";

interface AuditResultsProps {
  result: WebsiteAuditResult;
  mode?: ReportMode;
  reportId?: string;
}

export function AuditResults({
  result,
  mode = "public",
  reportId,
}: AuditResultsProps) {
  const executiveSummary =
    buildExecutiveSummary(
      result.findings,
      result.summary,
    );

  const hostname = getHostname(
    result.metadata.finalUrl,
  );

  return (
    <div className="space-y-10">
      <AuditExecutiveDashboard
        result={result}
        executiveSummary={executiveSummary}
        mode={mode}
      />

      {reportId ? (
        <SavedReportLink
          reportId={reportId}
        />
      ) : null}

      <section
        aria-labelledby="growth-priorities-heading"
        className="space-y-6"
      >
        <SectionHeader
          eyebrow="Growth Priorities"
          title="Start with the issues that can create the biggest impact."
          description={`We analyzed ${hostname} and organized the findings by urgency, business impact, and estimated effort so you can focus on the strongest opportunities first.`}
        />

        <AuditOpportunityCard
          opportunity={result.opportunity}
          mode={mode}
        />

        <AuditCriticalIssues
          findings={result.findings}
          mode={mode}
        />

        <AuditRecommendedRoadmap
          findings={result.findings}
          mode={mode}
        />
      </section>

      <section
        aria-labelledby="category-performance-heading"
        className="space-y-6"
      >
        <SectionHeader
          eyebrow="Category Performance"
          title="See where the website is strongest and where it needs work."
          description="These scores break the audit into major areas so you can quickly compare technical, search, local, accessibility, and content performance."
        />

        <AuditCategoryGrid
          categoryScores={result.categoryScores}
          findings={result.findings}
        />
      </section>

      <section
        aria-labelledby="page-details-heading"
        className="space-y-6"
      >
        <SectionHeader
          eyebrow="Page Analysis"
          title="Homepage details detected during the audit."
          description="These are some of the technical and structural signals collected directly from the submitted homepage."
        />

        <Card
          variant="elevated"
          padding="lg"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DetailCard
              icon={ListTree}
              label="Headings"
              value={`${result.pageData.h1Count} H1 · ${result.pageData.h2Count} H2 · ${result.pageData.h3Count} H3`}
            />

            <DetailCard
              icon={ImageIcon}
              label="Images"
              value={`${result.pageData.imageCount} total · ${result.pageData.imagesWithoutAlt} missing alt`}
            />

            <DetailCard
              icon={Link2}
              label="Links"
              value={`${result.pageData.internalLinkCount} internal · ${result.pageData.externalLinkCount} external`}
            />

            <DetailCard
              icon={FileCode2}
              label="Structured data"
              value={
                result.pageData
                  .structuredDataTypes.length > 0
                  ? result.pageData.structuredDataTypes.join(
                      ", ",
                    )
                  : result.pageData.hasStructuredData
                    ? "Detected"
                    : "Not detected"
              }
            />

            <DetailCard
              icon={Globe2}
              label="Title"
              value={
                result.pageData.title ??
                "No title detected"
              }
            />

            <DetailCard
              icon={FileCode2}
              label="Meta description"
              value={
                result.pageData.metaDescription ??
                "No meta description detected"
              }
            />

            <DetailCard
              icon={Link2}
              label="Canonical URL"
              value={
                result.pageData.canonicalUrl ??
                "No canonical URL detected"
              }
            />

            <DetailCard
              icon={MapPin}
              label="Local signals"
              value={
                result.pageData
                  .hasLocalBusinessSignals
                  ? "Detected"
                  : "Not detected"
              }
            />
          </div>
        </Card>
      </section>

      <section
        aria-labelledby="detailed-findings-heading"
        className="space-y-6"
      >
        <SectionHeader
          eyebrow="Detailed Findings"
          title="Review every issue identified in the audit."
          description="Use the filters to inspect individual findings, understand their severity, and see the recommendations associated with each issue."
        />

        <AuditFindingsFilter
          findings={result.findings}
          mode={mode}
        />
      </section>

      {reportId ? (
        <section
          aria-labelledby="professional-report-heading"
          className="space-y-6"
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-blue">
            <SearchCheck
              aria-hidden="true"
              className="size-4"
            />

            Professional Report
          </div>

          <AuditLeadCapture
            reportId={reportId}
            hostname={hostname}
          />
        </section>
      ) : null}

      <AuditConversionCta
        opportunity={result.opportunity}
        summary={result.summary}
        websiteUrl={result.metadata.finalUrl}
        mode={mode}
      />
    </div>
  );
}

interface DetailCardProps {
  icon: typeof Globe2;
  label: string;
  value: string;
}

function DetailCard({
  icon: Icon,
  label,
  value,
}: DetailCardProps) {
  return (
    <div className="rounded-xl border border-border bg-slate-50/60 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        <Icon
          aria-hidden="true"
          className="size-4 text-brand-blue"
        />

        {label}
      </div>

      <p className="mt-3 break-words text-sm font-medium leading-6 text-brand">
        {value}
      </p>
    </div>
  );
}

function getHostname(
  url: string,
): string {
  try {
    return new URL(
      url,
    ).hostname.replace(
      /^www\./,
      "",
    );
  } catch {
    return url;
  }
}