import {
  FileCode2,
  Globe2,
  ImageIcon,
  Link2,
  ListTree,
  MapPin,
} from "lucide-react";

import { AuditCategoryGrid } from "@/components/website-audit/audit-category-grid";
import { AuditConversionCta } from "@/components/website-audit/audit-conversion-cta";
import { AuditCriticalIssues } from "@/components/website-audit/audit-critical-issues";
import { AuditExecutiveDashboard } from "@/components/website-audit/audit-executive-dashboard";
import { AuditFindingsFilter } from "@/components/website-audit/audit-findings-filter";
import { AuditOpportunityCard } from "@/components/website-audit/audit-opportunity-card";
import { AuditRecommendedRoadmap } from "@/components/website-audit/audit-recommended-roadmap";
import { SavedReportLink } from "./saved-report-link";
import { buildExecutiveSummary } from "@/lib/website-audit/executive-summary";
import { AuditLeadCapture } from "@/components/website-audit/audit-lead-capture";
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

  return (
    <div className="space-y-8">
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

      <AuditCategoryGrid
        categoryScores={result.categoryScores}
        findings={result.findings}
      />

      <section
        aria-labelledby="page-details-heading"
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div>
          <p className="text-sm font-medium text-primary">
            Page analysis
          </p>

          <h2
            id="page-details-heading"
            className="mt-1 text-2xl font-semibold tracking-tight text-foreground"
          >
            Homepage details
          </h2>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
              result.pageData.hasLocalBusinessSignals
                ? "Detected"
                : "Not detected"
            }
          />
        </div>
      </section>

      <AuditFindingsFilter
        findings={result.findings}
        mode={mode}
      />
      
      {reportId ? (
        <AuditLeadCapture
          reportId={reportId}
          hostname={
            new URL(
              result.metadata.finalUrl,
            ).hostname.replace(/^www\./, "")
          }
        />
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
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon
          aria-hidden="true"
          className="size-4"
        />

        {label}
      </div>

      <p className="mt-2 break-words text-sm font-medium leading-6 text-foreground">
        {value}
      </p>
    </div>
  );
}